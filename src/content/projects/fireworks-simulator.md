---
title: Fireworks Simulator
slug: fireworks-simulator
category: lab
status: prototype
featured: false
fullscreen: true
summary: A data-led fireworks physics prototype that turns researched shell scale and effect behaviour into a fullscreen browser simulation.
question: Can real firework scale and motion make a browser fireworks simulator feel physically believable?
tags:
  - data visualisation
  - simulation
  - canvas
  - interaction design
sortOrder: 12
sources:
  - name: Natural Resources Canada Display Fireworks Manual 2010
    url: https://natural-resources.canada.ca/minerals-mining/explosives-fireworks-ammunition/explosives/display-fireworks-manual-2010
  - name: Fireworks on Weather Radar and Camera, Bulletin of the American Meteorological Society
    url: https://journals.ametsoc.org/view/journals/bams/101/2/bams-d-18-0248.1.xml
  - name: American Pyrotechnics Association Display Fireworks Glossary
    url: https://www.americanpyro.com/display-fireworks-glossary
  - name: Finale 3D Visual Descriptive Language glossary
    url: https://finale3d.com/documentation/vdl-effect-glossary/
  - name: Overture Maps Buildings
    url: https://docs.overturemaps.org/guides/buildings/
  - name: NSW Road Segment Data from Data.NSW
    url: https://opendata.transport.nsw.gov.au/data/dataset/road-segment-data-from-datansw
  - name: Overture Maps Transportation
    url: https://docs.overturemaps.org/guides/transportation/segments-and-connectors/
  - name: OpenStreetMap transport tags and data
    url: https://www.openstreetmap.org/copyright
---

## Sydney interactive skyline prototype

Four shell families share the same local metre coordinate system as the Sydney Harbour scene. Change calibre, colour, burst height and spread, then launch a repeatable effect while moving your viewpoint. Left-drag or one-finger drag pans. Right-drag rotates around the map pivot, with Ctrl + left-drag as an equivalent shortcut. Holding both mouse buttons and dragging combines pan and rotation. Mouse wheel with no button moves in or out toward the pointer. Left button + wheel changes camera height directly. Right button + wheel moves the highlighted height target on the right-side indicator, then releasing the right button eases the camera to that height. Shift + left-drag retains the pointer-centred forward/back shortcut, while pinch and +/- retain their existing movement controls. WASD pan, arrow keys rotate and tilt, Q/E change height, and Reset View restores the initial view.

**City data status:** Real Overture Buildings/building parts and a sourced Sydney street layer are supported by the preparation pipeline. The checked-in browser asset remains an explicitly labelled calibration fixture with zero sourced streets until the network acquisition command is run locally. NSW RoadSegment contributes street geometry/name and only a categorical lane field. Exact numeric lanes are used only when explicitly available from OpenStreetMap. Signals and pedestrian/street crossings are also retained when OSM supplies explicit tagged nodes. Street labels are not drawn yet.

All Sydney layers are transformed through EPSG:7856 into the same local metre coordinate system before overlap checks. Ground-level road corridors are audited against building footprints. Procedural calibration massing may be clipped because it is invented geometry; real Overture buildings are never silently reshaped and are withheld from rendering when a material ground-road conflict needs review.

Overture and OpenStreetMap data are ODbL. The TfNSW catalogue lists NSW Road Segment under Creative Commons Attribution. See the Method panel and the project source note for provenance and processing details.
