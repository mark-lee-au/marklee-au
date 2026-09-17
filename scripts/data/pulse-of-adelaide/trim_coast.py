"""Trim neighbouring coast to short WA/VIC peeks, retaining all SA shoreline lines."""
from __future__ import annotations
import json
from pathlib import Path
from shapely.geometry import LineString, box

BASE = Path(__file__).resolve().parents[3] / 'public/data/pulse-of-adelaide/geography'


def segments(shape):
    if shape.is_empty:
        return []
    if shape.geom_type == 'LineString':
        return [shape] if shape.length else []
    return [line for part in getattr(shape, 'geoms', ()) for line in segments(part)]


def transform(data: dict) -> dict:
    bands = (
        ('coast-west', box(128.45, -39.3, 129.0, -30.2)),
        ('coast', box(129.0, -39.3, 141.0, -30.2)),
        ('coast-east', box(141.0, -39.3, 141.65, -30.2)),
    )
    features = []
    for feature in data['features']:
        kind = feature['properties'].get('kind')
        if kind == 'border':
            points = feature['geometry']['coordinates']
            longitude, latitude = points[0]
            features.append({'type': 'Feature', 'properties': feature['properties'], 'geometry': {
                'type': 'LineString', 'coordinates': [[longitude, latitude], [longitude, round(latitude + .085, 6)]]}})
            continue
        if kind not in ('coast', 'coast-west', 'coast-east'):
            continue
        geom = LineString(feature['geometry']['coordinates'])
        for title, boundary in bands:
            for part in segments(geom.intersection(boundary)):
                coords = [[round(x, 6), round(y, 6)] for x, y in part.coords]
                if len(coords) >= 2:
                    features.append({'type': 'Feature', 'properties': {'kind': title}, 'geometry': {'type': 'LineString', 'coordinates': coords}})
    result = {'type': 'FeatureCollection', 'features': features}
    assert sum(f['properties']['kind'] == 'border' for f in features) == 2
    assert all(128.45 <= x <= 141.65 for f in features if f['properties']['kind'] != 'border' for x, _ in f['geometry']['coordinates'])
    return result


def main():
    source = BASE / 'coast.geojson'
    data = transform(json.loads(source.read_text()))
    source.write_text(json.dumps(data, separators=(',', ':')) + '\n')
    metadata = BASE / 'metadata.json'
    manifest = json.loads(metadata.read_text())
    for item in manifest['files']:
        if item['path'] == 'coast.geojson':
            item['bytes'] = source.stat().st_size
            item['count'] = len(data['features'])
    manifest['sources'][1]['geometry'] = 'SA shoreline (129..141 E) and short 0.55° WA / 0.65° VIC extensions, feathered in view; short approximate coastal border cues.'
    manifest['limitations'] += ' Neighbouring shorelines are deliberately trimmed for visual context.'
    metadata.write_text(json.dumps(manifest, separators=(',', ':')) + '\n')
    from collections import Counter
    print('coast kinds', dict(Counter(f['properties']['kind'] for f in data['features'])))


if __name__ == '__main__':
    main()
