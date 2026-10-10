"""Build Sydney's coastal land from Overture land minus mapped water areas.

This is an offline transform. The caller acquires all source files with the same
bounded footprint and verified release, then builds a complete city JSON before
replacing the previous file. The Pacific remains unpainted/black.
"""
from __future__ import annotations

from datetime import datetime, timezone

from shapely import constrained_delaunay_triangles
from shapely.affinity import translate
from shapely.geometry import GeometryCollection, MultiPolygon, Point, Polygon, box, shape
from shapely.ops import transform as shapely_transform, unary_union
from shapely.validation import make_valid

from prepare_sydney_city import ORIGIN_E, ORIGIN_N, WGS84_TO_MGA56, local_xy

COAST_BUFFER_M = 300.0
SOURCE = 'https://docs.overturemaps.org/schema/reference/base/land/'
WATER_SOURCE = 'https://docs.overturemaps.org/schema/reference/base/water/'


def feature_bounds(bundle: dict) -> dict[str, float]:
    xs, ys = [], []
    for building in bundle.get('buildings', []):
        for x, y in building.get('footprint', []):
            xs.append(x)
            ys.append(y)
    for road in bundle.get('roads', []):
        for x, y in road.get('points', []):
            xs.append(x)
            ys.append(y)
    if not xs or not ys:
        raise ValueError('Cannot calculate coastal scene limits without building and road coordinates')
    return dict(minX=min(xs), maxX=max(xs), minY=min(ys), maxY=max(ys))


def _polygon_parts(geometry):
    if isinstance(geometry, Polygon):
        yield geometry
    elif isinstance(geometry, (GeometryCollection, MultiPolygon)):
        for part in geometry.geoms:
            yield from _polygon_parts(part)


def is_mapped_water(properties: dict) -> bool:
    """Only surface-water polygons; exclude pools, drains, labels and lines.

    Overture uses subtype=physical for named bays, while harbour channels are
    generally subtype=water/class=water. These features are *not* land holes.
    """
    subtype, kind = properties.get('subtype'), properties.get('class')
    return (subtype == 'ocean' or (subtype == 'physical' and kind == 'bay')
            or (subtype == 'water' and kind == 'water')
            or (subtype == 'river' and kind == 'river')
            or (subtype == 'reservoir' and kind in ('reservoir', 'basin'))
            or (subtype == 'pond' and kind in ('pond', 'fishpond'))
            or (subtype == 'canal' and kind == 'canal'))


def _projected_polygons(raw: dict, frame, *, water: bool):
    if not isinstance(raw, dict) or raw.get('type') != 'FeatureCollection':
        raise ValueError(f'Expected Overture {"water" if water else "land"} FeatureCollection')
    polygons = []
    count = 0
    for feature in raw.get('features', []):
        props = feature.get('properties') or {}
        matches = is_mapped_water(props) if water else (props.get('subtype') == 'land' and props.get('class') == 'land')
        if not matches or not feature.get('geometry'):
            continue
        source_shape = shape(feature['geometry'])
        if not isinstance(source_shape, (Polygon, MultiPolygon)):
            continue
        projected = shapely_transform(WGS84_TO_MGA56.transform, source_shape)
        projected = translate(projected, xoff=-ORIGIN_E, yoff=-ORIGIN_N)
        if not projected.is_valid:
            projected = make_valid(projected)
        clipped = projected.intersection(frame)
        polygons.extend(part for part in _polygon_parts(clipped) if part.area >= 1)
        count += 1
    return polygons, count


def land_mesh_from_overture(raw: dict, water_raw: dict, bundle: dict, *, coast_buffer_m: float = COAST_BUFFER_M) -> tuple[dict, dict]:
    """Clip sourced land to urban W/N/S limits and measured coast+buffer east.

    The coastal source must end within the acquisition box, not on its east
    boundary. A missing or truncated coastline aborts rather than inventing a
    rectangular shelf. Width is in local EPSG:7856-based metres.
    """
    if not isinstance(raw, dict) or raw.get('type') != 'FeatureCollection':
        raise ValueError('Expected an Overture land FeatureCollection')
    if not (100 <= coast_buffer_m <= 1000):
        raise ValueError('Coastal buffer must be between 100 and 1000 metres')
    urban = feature_bounds(bundle)
    scene = bundle['bounds']
    west = max(scene['minX'], urban['minX'])
    south = max(scene['minY'], urban['minY'])
    north = min(scene['maxY'], urban['maxY'])
    # All coastal land is clipped to the vertical span, but leave the east
    # extent wide enough to detect whether the real shoreline was acquired.
    acquisition_bbox = bundle.get('city', {}).get('sceneBboxWgs84')
    if not acquisition_bbox or len(acquisition_bbox) != 4:
        raise ValueError('Coastal source needs a declared WGS84 acquisition box')
    east_lon = acquisition_bbox[2]
    acquisition_east = max(local_xy(east_lon, lat)[0] for lat in (acquisition_bbox[1], acquisition_bbox[3]))
    if acquisition_east <= scene['maxX']:
        raise ValueError('Acquisition box cannot reach beyond sourced city coordinates')
    source_box = box(west, south, acquisition_east, north)
    polygons, count = _projected_polygons(raw, source_box, water=False)
    if not polygons:
        raise ValueError('No Overture coastline-derived class=land polygons in coastal scene')
    # A genuine shoreline must stop before the eastern edge. Otherwise the
    # caller has not acquired the whole coast within the chosen latitude band.
    sourced = unary_union(polygons)
    if not sourced.is_valid:
        sourced = make_valid(sourced)
    coast_x = sourced.bounds[2]
    if coast_x >= acquisition_east - coast_buffer_m - 20:
        raise ValueError('Land reaches the eastern source boundary: expand the acquisition box before publishing')
    # The east shoreline must also exist near BOTH expanded latitude limits.
    # Otherwise a partial source download produces an artificial coastline cut
    # that passes the single eastmost-point check above.
    if bundle.get('city', {}).get('sceneExtent') == 'greater-sydney-test':
        band = min(650.0, (north - south) * 0.12)
        for label, y0, y1 in (('southern', south, south + band),
                              ('northern', north - band, north)):
            sample = sourced.intersection(box(west, y0, acquisition_east, y1))
            if sample.is_empty or sample.area < band * 100:
                raise ValueError(f'Missing {label} coastal land coverage in the expanded Sydney extent')
            if sample.bounds[2] >= acquisition_east - coast_buffer_m - 20:
                raise ValueError(f'Truncated {label} coastline at the eastern acquisition boundary')
    east = coast_x + coast_buffer_m
    frame_bounds = {
        'minX': round(west, 1), 'maxX': round(east, 1),
        'minY': round(south, 1), 'maxY': round(north, 1),
    }
    frame = box(west, south, east, north)
    water_polygons, water_count = _projected_polygons(water_raw, frame, water=True)
    if not water_polygons:
        raise ValueError('No Overture surface-water polygons within the coastal frame')
    if bundle.get('city', {}).get('sceneExtent') in ('east-coast', 'greater-sydney-test') and water_count < 50:
        raise ValueError(f'Only {water_count} mapped water features across the Sydney coastal scene; check that the complete water extract was acquired')
    water_union = unary_union(water_polygons)
    if not water_union.is_valid:
        water_union = make_valid(water_union)
    # Mapped harbour water must be cut out of the Overture coastline land.
    # Keep islands and land within bays; never fill the ocean with a rectangle.
    land = sourced.intersection(frame).difference(water_union)
    if not land.is_valid:
        raise ValueError('Invalid sourced land geometry after clipping')
    for label, x, y, expected_land in (
        ('CBD', -18.2, -1780.08, True),
        ('Harbour channel', 400, 150, False),
        ('North Sydney', 250, 1600, True),
    ):
        pt = Point(x, y)
        if frame.covers(pt) and land.covers(pt) != expected_land:
            raise ValueError(f'Sourced land/harbour classification failed at {label}')
    fraction = land.area / frame.area
    if not .1 < fraction < .99:
        raise ValueError(f'Implausible coastal land fraction: {fraction:.3f}')
    # Guard against partially acquired water: large coastal land polygons have
    # no embedded holes, and will otherwise silently fill Sydney Harbour.
    harbour = Point(400, 150)
    if frame.covers(harbour) and not water_union.covers(harbour):
        raise ValueError('Overture water coverage is missing the Sydney Harbour channel')
    triangles = []
    for polygon in _polygon_parts(land):
        if polygon.area < 1:
            continue
        for triangle in constrained_delaunay_triangles(polygon).geoms:
            if triangle.area < 0.05 or not polygon.covers(triangle.representative_point()):
                continue
            ring = list(triangle.exterior.coords)[:3]
            triangles.append([[round(x, 2), round(y, 2)] for x, y in ring])
    if not triangles:
        raise ValueError('No coastline land triangles produced')
    total = sum(abs(Polygon(triangle).area) for triangle in triangles)
    if abs(total - land.area) / land.area > .002:
        raise ValueError('Coastline triangulation left missing or overlapping land')
    return ({
        'sourceClass': 'overture-coastline-land-minus-water', 'triangles': triangles,
        'landAreaFraction': round(fraction, 5),
    }, {
        'bounds': frame_bounds, 'landFeatureCount': count,
        'mappedWaterFeatureCount': water_count,
        'mappedWaterAreaM2': round(sourced.intersection(frame).intersection(water_union).area),
        'coastlineEastmostLocalM': round(coast_x, 1), 'coastBufferM': coast_buffer_m,
    })


def apply_coastal_land(bundle: dict, raw: dict, water_raw: dict, acquired_at: str, release: str | None) -> dict:
    mesh, info = land_mesh_from_overture(raw, water_raw, bundle)
    bundle['land'] = mesh
    bundle['water'] = {'sourceClass': 'none-water-is-scene-background', 'polygons': []}
    bundle['bounds'].update(info['bounds'])
    bundle['profile'].update({
        'waterVertexCount': 0,
        'landTriangleCount': len(mesh['triangles']),
        'landAreaFraction': mesh['landAreaFraction'],
        'landBounds': info['bounds'],
        'coastalLandFeatureCount': info['landFeatureCount'],
        'mappedWaterFeatureCount': info['mappedWaterFeatureCount'],
        'mappedWaterAreaM2': info['mappedWaterAreaM2'],
        'coastlineEastmostLocalM': info['coastlineEastmostLocalM'],
        'coastBufferM': info['coastBufferM'],
    })
    bundle['sources'] = [src for src in bundle.get('sources', []) if src.get('id') not in ('overture-coastal-land', 'overture-coastal-water')] + [{
        'id': 'overture-coastal-land', 'sourceUrl': SOURCE, 'licence': 'ODbL-1.0',
        'release': release, 'retrievedAt': acquired_at, 'used': True,
        'role': 'coastline-derived source land polygons',
    }, {
        'id': 'overture-coastal-water', 'sourceUrl': WATER_SOURCE, 'licence': 'ODbL-1.0',
        'release': release, 'retrievedAt': acquired_at, 'used': True,
        'role': 'harbour, bay and inland water excluded from the land mesh; water remains unpainted',
    }]
    bundle['generatedAt'] = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    return bundle
