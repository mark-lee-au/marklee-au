import places from './adelaide-places.json';

type Site = { id: string; name: string; brand: string; suburb: string; latitude: number; longitude: number };
type RecordRow = { id: string; priceCpl: number; observedAt: string; source: string; sourceRows: number };
type Part = { month: string; fuelCode: string; file: string; events: number; stations: number };
type Index = { schemaVersion: 3; kind: 'pulse-event-index'; stations: Site[]; partitions: Part[] };
type Month = { schemaVersion: 3; kind: 'pulse-events'; month: string; fuelCode: string; start: string; end: string; seeds: RecordRow[]; events: RecordRow[] };
type ArchivePart = { month: string; file: string; start: string; end: string; events: number; checkpoint: Record<string, [number, number, number | null, number]> };
type Archive = { schemaVersion: 1; kind: 'pulse-archive-summary'; fuelCode: string; start: string; end: string; months: ArchivePart[]; points: [number, number | null, number][] };
type State = { price: number; observedAt: number; changedAt: number; delta: number };
type PulseEvent = RecordRow & { time: number };
type Pulse = { id: string; delta: number; born: number };
type ChartScene = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  min: number;
  max: number;
  x: (time: number) => number;
  y: (value: number) => number;
};
type DragMode = 'range' | 'start' | 'end' | 'scrub' | null;
type PickStage = 'idle' | 'choosing-end' | 'locked';
type Point = [number, number];
type RoadTile = { file: string; bbox: [number, number, number, number]; count: number };
type RoadIndex = { schemaVersion: 1; kind: 'pulse-static-roads'; sourceRecords: number; overviewFile: string; tiles: RoadTile[] };
type GeoFeature = { properties: { kind?: string; name?: string }; geometry: { type: string; coordinates: unknown } };
type GeoFeatures = { type: 'FeatureCollection'; features: GeoFeature[] };

const root = document.querySelector<HTMLElement>('[data-pulse]');
if (root) {
  const one = <T extends Element>(selector: string) => root.querySelector<T>(selector)!;
  const chartFrame = one<HTMLElement>('[data-chart-frame]');
  const chart = one<SVGSVGElement>('[data-chart]');
  const chartGuides = one<HTMLElement>('[data-chart-guides]');
  const mapElement = one<HTMLElement>('[data-map]');
  const mapWrap = one<HTMLElement>('.pulse__map-wrap');
  const coast = one<SVGSVGElement>('[data-coast]');
  const brandOverlay = one<HTMLElement>('[data-brand-overlay]');
  const roadStatus = one<HTMLElement>('[data-road-status]');
  const roadToggle = one<HTMLButtonElement>('[data-road-toggle]');
  const canvas = one<HTMLCanvasElement>('[data-clouds]');
  const placesLayer = one<HTMLElement>('[data-places]');
  const averageBox = one<HTMLElement>('[data-average-box]');
  const averageNumber = one<HTMLElement>('[data-average-number]');
  const averageWhole = one<HTMLElement>('[data-average-whole]');
  const averageTenth = one<HTMLElement>('[data-average-tenth]');
  const rangeStartLabel = one<HTMLElement>('[data-range-start]');
  const rangeEndLabel = one<HTMLElement>('[data-range-end]');
  const rangeStartText = one<HTMLElement>('[data-range-start-text]');
  const rangeEndText = one<HTMLElement>('[data-range-end-text]');
  const resetStart = one<HTMLButtonElement>('[data-reset-start]');
  const resetEnd = one<HTMLButtonElement>('[data-reset-end]');
  const hoverTime = one<HTMLElement>('[data-hover-time]');
  const rangeStatus = one<HTMLElement>('[data-range-status]');
  const scrubWrap = one<HTMLElement>('[data-scrub-wrap]');
  const scrubKnob = one<HTMLElement>('[data-scrub-knob]');
  const scrubTime = one<HTMLElement>('[data-scrub-time]');
  const ctx = canvas.getContext('2d');
  const notice = one<HTMLElement>('[data-notice]');
  const noticeTitle = one<HTMLElement>('[data-notice-title]');
  const noticeText = one<HTMLElement>('[data-notice-text]');
  const retry = one<HTMLButtonElement>('[data-retry]');
  const filters = one<HTMLElement>('[data-filters]');
  const transport = one<HTMLElement>('[data-transport]');
  const fuelSelect = one<HTMLSelectElement>('[data-fuel]');
  const archiveControl = one<HTMLElement>('[data-archive-control]');
  const archiveToggle = one<HTMLButtonElement>('[data-archive-toggle]');
  const archiveCaption = one<HTMLElement>('[data-archive-caption]');
  const archivePanel = one<HTMLElement>('[data-archive-panel]');
  const archiveFrom = one<HTMLSelectElement>('[data-archive-from]');
  const archiveTo = one<HTMLSelectElement>('[data-archive-to]');
  const archiveStartSlider = one<HTMLInputElement>('[data-archive-start-slider]');
  const archiveEndSlider = one<HTMLInputElement>('[data-archive-end-slider]');
  const archiveBand = one<HTMLElement>('[data-archive-band]');
  const archiveDescription = one<HTMLElement>('[data-archive-description]');
  const archiveApply = one<HTMLButtonElement>('[data-archive-apply]');
  const archiveAll = one<HTMLButtonElement>('[data-archive-all]');
  const speedButton = one<HTMLButtonElement>('[data-speed]');
  const slider = one<HTMLInputElement>('[data-hour]');
  const play = one<HTMLButtonElement>('[data-play]');
  const rewind = one<HTMLButtonElement>('[data-rewind]');
  const playIcon = one<HTMLElement>('[data-play-icon]');
  const playText = one<HTMLElement>('[data-play-text]');
  const currentDate = one<HTMLElement>('[data-current-date]');
  const currentTime = one<HTMLElement>('[data-current-time]');
  const stationInfo = one<HTMLElement>('[data-station]');
  const detailFormatter = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Adelaide', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
  const dateFormatter = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Adelaide', day: '2-digit', month: 'short', year: 'numeric' });
  const axisMonthFormatter = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Adelaide', month: 'short', year: 'numeric' });
  const timeFormatter = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Adelaide', hour: '2-digit', minute: '2-digit', hour12: false });
  const monthFormatter = new Intl.DateTimeFormat('en-AU', { timeZone: 'UTC', month: 'short', year: 'numeric' });
  const rangeFormatter = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Adelaide', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
  const minuteFormatter = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Adelaide', minute: '2-digit' });
  const hour = 3_600_000;
  // Historical hours per real second. Higher speeds have a restrained range so the city remains readable.
  const speedModes = [
    { label: '1×', hoursPerSecond: 3.55 },
    { label: '2×', hoursPerSecond: 4.8 },
    { label: '5×', hoursPerSecond: 6.1 },
    { label: '10×', hoursPerSecond: 7.5 },
  ] as const;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const endpoint = '/data/pulse-of-adelaide/events/';
  const geographyBase = '/data/pulse-of-adelaide/geography/';
  const svgNS = 'http://www.w3.org/2000/svg';
  let index: Index | null = null;
  let month: Month | null = null;
  let archive: Archive | null = null;
  let activePart: ArchivePart | null = null;
  const cachedMonths = new Map<string, Month>();
  let activation = 0;
  let firstMonthIndex = 0;
  let lastMonthIndex = 0;
  let map: any = null;
  let maplibre: any = null;
  let loading = 0;
  let archiveStart = 0;
  let archiveFinish = 0;
  let rangeStart = 0;
  let rangeFinish = 0;
  let cursor = 0;
  let nextEvent = 0;
  let playing = false;
  let lastFrame = 0;
  let frame = 0;
  let previousStep = -1;
  let previousClockMinute = -1;
  let reducedCarry = 0;
  let pickStage: PickStage = 'idle';
  let hoveredTime: number | null = null;
  let pressX = 0;
  let dragHasPreview = false;
  let dragOriginalStart = 0;
  let dragOriginalFinish = 0;
  let dragOriginalCursor = 0;
  let dragOriginalStage: PickStage = 'idle';
  let roadIndex: RoadIndex | null = null;
  let coastBorders: Point[][] = [];
  let coastWest: Point[][] = [];
  let coastEast: Point[][] = [];
  const activeRoadTiles = new Set<string>();
  const roadLayerIds = new Set<string>();
  const roadModes = ['show', 'dim', 'off'] as const;
  let roadModeIndex = 0;
  try {
    const stored = localStorage.getItem('pulse-roads-mode-v1');
    const found = roadModes.findIndex((mode) => mode === stored);
    if (found !== -1) roadModeIndex = found;
  } catch { /* Treat unavailable storage as a session-only preference. */ }
  let events: PulseEvent[] = [];
  let siteLookup = new Map<string, Site>();
  let states = new Map<string, State>();
  let pulses: Pulse[] = [];
  let hours: { at: number; mean: number | null; n: number }[] = [];
  let chartScene: ChartScene | null = null;
  let chartMarker: SVGLineElement | null = null;
  let bracketProgress: SVGLineElement | null = null;
  let chartClip: SVGRectElement | null = null;
  let chartSelection: SVGLineElement | null = null;
  let chartHandleStart: SVGLineElement | null = null;
  let chartHandleEnd: SVGLineElement | null = null;
  let dragMode: DragMode = null;
  let dragAnchor = 0;
  let activePointer: number | null = null;
  let playbackModeIndex = 0;
  let coastLines: Point[][] = [];
  let harbourWaterLines: Point[][] = [];
  let titleMaskInitialized = false;
  let titleFullyCrossed = false;
  let titleGlyphsWidth = 0;
  let titleGlyphsHeight = 0;
  const titleGlyphCanvas = document.createElement('canvas');
  const titleGlyphCtx = titleGlyphCanvas.getContext('2d');
  let landRings: Point[][][] = [];
  let titleWasDragged = false;
  let lastTitleMask = 0;
  const titleMaskCanvas = document.createElement('canvas');
  const titleMaskCtx = titleMaskCanvas.getContext('2d');
  let pulseReferenceMean: number | null = null;
  let lastAveragePulse = -Infinity;
  let selectedPlace: HTMLButtonElement | null = null;
  let chartHighlight: SVGPathElement | null = null;
  let chartHighlightClip: SVGRectElement | null = null;
  const placeButtons: HTMLButtonElement[] = [];
  const landmarkSlugs = new Set(['adelaide-cbd', 'elizabeth', 'seaford']);
  const sprites = new Map<string, HTMLCanvasElement>();

  function showNotice(title: string, detail: string): void {
    notice.hidden = false;
    noticeTitle.textContent = title;
    noticeText.textContent = detail;
    retry.hidden = false;
  }

  function checkRecord(row: RecordRow): boolean {
    return !!row && typeof row.id === 'string' && Number.isFinite(row.priceCpl) && row.priceCpl > 0 && row.priceCpl < 1000 && typeof row.observedAt === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(row.observedAt) && Number.isFinite(Date.parse(row.observedAt)) && typeof row.source === 'string';
  }

  function validIndex(data: any): data is Index {
    return data?.schemaVersion === 3 && data.kind === 'pulse-event-index' && Array.isArray(data.stations) && data.stations.length > 0 && data.stations.every((site: Site) => typeof site.id === 'string' && typeof site.name === 'string' && Number.isFinite(site.latitude) && Number.isFinite(site.longitude)) && Array.isArray(data.partitions) && data.partitions.every((part: Part) => /^\d{4}-\d\d$/.test(part.month) && /^[A-Z0-9]{2,8}$/.test(part.fuelCode) && part.file === `${part.month}/${part.fuelCode}.json`);
  }

  function validMonth(data: any, part: Part): data is Month {
    return data?.schemaVersion === 3 && data.kind === 'pulse-events' && data.month === part.month && data.fuelCode === part.fuelCode && Number.isFinite(Date.parse(data.start)) && Number.isFinite(Date.parse(data.end)) && Date.parse(data.start) < Date.parse(data.end) && Array.isArray(data.seeds) && Array.isArray(data.events) && data.events.length === part.events && data.seeds.every(checkRecord) && data.events.every(checkRecord);
  }

  function textTime(t: number): string { return detailFormatter.format(new Date(t)); }
  function rangeTime(t: number): string { return rangeFormatter.format(new Date(t)).toUpperCase().replace(',', ''); }
  function snap(t: number): number { return Math.max(archiveStart, Math.min(archiveFinish, archiveStart + Math.round((t - archiveStart) / hour) * hour)); }
  function adelaideMinute(t: number): number { return Number(minuteFormatter.format(new Date(t))); }
  function firstWholeHour(t: number): number { return t + ((60 - adelaideMinute(t)) % 60) * 60_000; }
  function lastWholeHour(t: number): number { return t - adelaideMinute(t) * 60_000; }
  function displayDate(t: number): string { return dateFormatter.format(new Date(t)).toUpperCase(); }
  function axisDate(t: number): string { return (archiveFinish - archiveStart > 90 * 24 * hour ? axisMonthFormatter : dateFormatter).format(new Date(t)).toUpperCase(); }
  function displayTime(t: number): string { return timeFormatter.format(new Date(t)); }

  function validArchive(data: any, fuel: string): data is Archive {
    if (data?.schemaVersion !== 1 || data.kind !== 'pulse-archive-summary' || data.fuelCode !== fuel || !Array.isArray(data.months) || !data.months.length || !Array.isArray(data.points) || !data.points.length || !index) return false;
    const expected = index.partitions.filter((p) => p.fuelCode === fuel).sort((a, b) => a.month.localeCompare(b.month));
    return data.months.length === expected.length && data.months.every((part: ArchivePart, i: number) => part.file === expected[i].file && part.events === expected[i].events && Number.isFinite(Date.parse(part.start)) && Number.isFinite(Date.parse(part.end)) && part.checkpoint && typeof part.checkpoint === 'object') && data.points.every((point: unknown) => Array.isArray(point) && point.length === 3 && Number.isFinite(point[0]) && (point[1] === null || Number.isFinite(point[1])) && Number.isFinite(point[2]));
  }

  function monthName(value: string): string { return monthFormatter.format(new Date(`${value}-01T00:00:00Z`)); }

  function openArchive(open: boolean): void {
    archivePanel.hidden = !open;
    archiveToggle.setAttribute('aria-expanded', String(open));
  }

  function syncArchivePicker(source: 'from' | 'to' | 'start' | 'end' = 'from'): void {
    if (!archive) return;
    const max = archive.months.length - 1;
    let first = source === 'start' ? Number(archiveStartSlider.value) : archive.months.findIndex((p) => p.month === archiveFrom.value);
    let last = source === 'end' ? Number(archiveEndSlider.value) : archive.months.findIndex((p) => p.month === archiveTo.value);
    first = Math.max(0, Math.min(max, first));
    last = Math.max(0, Math.min(max, last));
    if (first > last) {
      if (source === 'from' || source === 'start') last = first;
      else first = last;
    }
    archiveFrom.value = archive.months[first].month;
    archiveTo.value = archive.months[last].month;
    archiveStartSlider.value = String(first);
    archiveEndSlider.value = String(last);
    archiveBand.style.left = `${first / Math.max(1, max) * 100}%`;
    archiveBand.style.right = `${(max - last) / Math.max(1, max) * 100}%`;
    archiveDescription.textContent = `${monthName(archive.months[first].month)} to ${monthName(archive.months[last].month)} · ${last - first + 1} reporting months`;
    archiveApply.disabled = first === firstMonthIndex && last === lastMonthIndex;
  }

  function initialiseArchivePicker(): void {
    if (!archive) return;
    const choices = archive.months.map((p) => new Option(monthName(p.month), p.month));
    archiveFrom.replaceChildren(...choices.map((p) => p.cloneNode(true) as HTMLOptionElement));
    archiveTo.replaceChildren(...choices);
    archiveStartSlider.max = archiveEndSlider.max = String(archive.months.length - 1);
    firstMonthIndex = 0;
    lastMonthIndex = archive.months.length - 1;
    archiveFrom.value = archive.months[firstMonthIndex].month;
    archiveTo.value = archive.months[lastMonthIndex].month;
    syncArchivePicker();
    archiveCaption.textContent = 'ALL HISTORY';
    openArchive(false);
  }

  function selectArchiveRange(first: number, last: number): Promise<void> {
    if (!archive || !archive.months[first] || !archive.months[last]) return Promise.resolve();
    stop();
    ++activation;
    firstMonthIndex = first;
    lastMonthIndex = last;
    archiveStart = firstWholeHour(Date.parse(archive.months[first].start));
    // The first archive month may start before the first report exists.
    if (first === 0) {
      const firstObserved = archive.points.find((point) => point[1] !== null);
      if (firstObserved) archiveStart = Math.max(archiveStart, firstObserved[0]);
    }
    archiveFinish = lastWholeHour(Date.parse(archive.months[last].end));
    if (archiveFinish - archiveStart < 2 * hour) { showNotice('Not enough observations', 'Choose a wider period for playback.'); return Promise.resolve(); }
    rangeStart = archiveStart;
    rangeFinish = archiveFinish;
    cursor = rangeStart;
    pickStage = 'idle';
    hoveredTime = null;
    previousStep = -1;
    previousClockMinute = -1;
    pulseReferenceMean = null;
    lastAveragePulse = -Infinity;
    hours = archive.points.filter((p) => p[0] >= archiveStart && p[0] <= archiveFinish).map(([at, mean, n]) => ({ at, mean, n }));
    drawChart();
    updateScrubber();
    updateRangeLabels();
    archiveCaption.textContent = first === 0 && last === archive.months.length - 1 ? 'ALL HISTORY' : `${monthName(archive.months[first].month)}  ·  ${monthName(archive.months[last].month)}`;
    openArchive(false);
    rangeStatus.textContent = `History ${monthName(archive.months[first].month)} to ${monthName(archive.months[last].month)}.`;
    return activatePart(partForTime(rangeStart)!, rangeStart);
  }

  function partForTime(t: number): ArchivePart | null {
    if (!archive) return null;
    let found = archive.months[0];
    for (const part of archive.months) {
      if (Date.parse(part.start) > t) break;
      found = part;
    }
    return found;
  }

  async function activatePart(part: ArchivePart, target: number, effects = false): Promise<void> {
    const token = ++activation;
    const resume = playing;
    stop();
    notice.hidden = false;
    noticeTitle.textContent = 'Loading monthly observations';
    noticeText.textContent = `${monthName(part.month)} · ${fuelSelect.value}`;
    retry.hidden = true;
    try {
      let raw = cachedMonths.get(part.file);
      if (!raw) {
        const spec = index?.partitions.find((p) => p.file === part.file);
        if (!spec) throw new Error(`Missing index entry for ${part.file}`);
        const response = await fetch(`${endpoint}${part.file}`);
        if (!response.ok) throw new Error(`Missing event file: ${part.file}`);
        const data: unknown = await response.json();
        if (!validMonth(data, spec)) throw new Error(`Event file does not match its index: ${part.file}`);
        raw = data;
        cachedMonths.set(part.file, raw);
        if (cachedMonths.size > 3) cachedMonths.delete(cachedMonths.keys().next().value!);
      }
      if (token !== activation) return;
      month = raw;
      activePart = part;
      events = raw.events.map((item) => ({ ...item, time: Date.parse(item.observedAt) }));
      if (events.some((item) => !siteLookup.has(item.id)) || Object.keys(part.checkpoint).some((id) => !siteLookup.has(id))) throw new Error('An observation has no Adelaide station metadata.');
      reset();
      cursor = Date.parse(part.start);
      previousStep = -1;
      previousClockMinute = -1;
      notice.hidden = true;
      render(target, effects);
      if (resume && cursor < rangeFinish && !document.hidden) beginPlayback();
    } catch (error) {
      if (token !== activation) return;
      activePart = null;
      showNotice('History unavailable', error instanceof Error ? error.message : 'Could not load monthly observations.');
    }
  }

  function makeSprite(color: 'red' | 'green'): HTMLCanvasElement {
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 256;
    const g = sprite.getContext('2d')!;
    const gradient = g.createRadialGradient(128, 128, 0, 128, 128, 126);
    if (color === 'red') {
      gradient.addColorStop(0, 'rgba(255, 248, 241, 1)');
      gradient.addColorStop(.07, 'rgba(255, 161, 139, .98)');
      gradient.addColorStop(.18, 'rgba(255, 96, 75, .78)');
      gradient.addColorStop(.44, 'rgba(214, 38, 34, .23)');
      gradient.addColorStop(.78, 'rgba(155, 22, 20, .03)');
    } else {
      gradient.addColorStop(0, 'rgba(245, 255, 245, 1)');
      gradient.addColorStop(.07, 'rgba(186, 255, 192, .98)');
      gradient.addColorStop(.18, 'rgba(82, 255, 142, .76)');
      gradient.addColorStop(.44, 'rgba(18, 184, 92, .22)');
      gradient.addColorStop(.78, 'rgba(10, 124, 64, .03)');
    }
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    g.fillStyle = gradient;
    g.fillRect(0, 0, 256, 256);
    return sprite;
  }
  sprites.set('red', makeSprite('red'));
  sprites.set('green', makeSprite('green'));

  function fitCanvas(): void {
    if (!ctx) return;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    const bounds = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(bounds.width * ratio));
    canvas.height = Math.max(1, Math.round(bounds.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawCoastline();
    positionPlaces();
    paint(performance.now());
  }

  function drawSprite(sprite: HTMLCanvasElement, x: number, y: number, radius: number, alpha: number): void {
    if (!ctx || alpha <= 0 || radius <= 0) return;
    ctx.globalAlpha = alpha;
    ctx.drawImage(sprite, x - radius, y - radius, radius * 2, radius * 2);
  }

  function paint(now: number): void {
    if (!ctx || !map) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'screen';
    for (const [id, state] of states) {
      if (!state.delta || !Number.isFinite(state.changedAt)) continue;
      const age = Math.max(0, (cursor - state.changedAt) / hour);
      const magnitude = Math.abs(state.delta);
      const lifetime = Math.min(108, 12 + magnitude * 1.6);
      if (age >= lifetime) continue;
      const site = siteLookup.get(id);
      if (!site) continue;
      const point = map.project([site.longitude, site.latitude]);
      if (point.x < -120 || point.y < -120 || point.x > width + 120 || point.y > height + 120) continue;
      const strength = Math.min(1.85, 0.22 + magnitude / 34);
      // Ease the persistent glow in after the observed event. The stored report itself never changes.
      const appearance = Math.min(1, age / 0.75);
      const remaining = appearance * Math.pow(1 - age / lifetime, .74);
      const haloRadius = (24 + strength * 24) * (1 + Math.min(age, 8) * 0.03);
      const coreRadius = haloRadius * 0.34;
      const sprite = sprites.get(state.delta > 0 ? 'red' : 'green')!;
      drawSprite(sprite, point.x, point.y, haloRadius, remaining * Math.min(0.36, 0.13 + strength * 0.13));
      drawSprite(sprite, point.x, point.y, coreRadius, remaining * Math.min(0.96, 0.31 + strength * 0.44));
    }
    pulses = pulses.filter((pulse) => now - pulse.born < Math.min(2800, 900 + Math.abs(pulse.delta) * 34));
    if (!reduced()) {
      for (const pulse of pulses) {
        const site = siteLookup.get(pulse.id);
        if (!site) continue;
        const point = map.project([site.longitude, site.latitude]);
        const duration = Math.min(2800, 900 + Math.abs(pulse.delta) * 34);
        const elapsed = Math.max(0, now - pulse.born);
        const progress = Math.min(1, elapsed / duration);
        const appearance = Math.min(1, elapsed / 170);
        const magnitude = Math.min(2.2, 0.34 + Math.abs(pulse.delta) / 33);
        const sprite = sprites.get(pulse.delta > 0 ? 'red' : 'green')!;
        drawSprite(sprite, point.x, point.y, (24 + progress * 108) * magnitude, appearance * Math.pow(1 - progress, 1.36) * Math.min(0.8, 0.22 + magnitude * 0.24));
        drawSprite(sprite, point.x, point.y, (10 + progress * 42) * magnitude, appearance * Math.pow(1 - progress, 1.18) * Math.min(0.98, 0.38 + magnitude * 0.28));
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  // Geography ships as static WGS84 files. No ArcGIS requests or raster image fallbacks.
  async function loadStaticCoast(): Promise<void> {
    try {
      const response = await fetch(`${geographyBase}coast.geojson`);
      if (!response.ok) throw new Error(`Coast file HTTP ${response.status}`);
      const data: GeoFeatures = await response.json();
      if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) throw new Error('Invalid coastline GeoJSON');
      const shoreline: Point[][] = [];
      const borders: Point[][] = [];
      for (const feature of data.features) {
        if (feature.geometry?.type !== 'LineString' || !Array.isArray(feature.geometry.coordinates)) continue;
        const points = feature.geometry.coordinates as Point[];
        if (points.length < 2 || !points.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y))) continue;
        if (feature.properties?.kind === 'coast') shoreline.push(points);
        else if (feature.properties?.kind === 'coast-west') coastWest.push(points);
        else if (feature.properties?.kind === 'coast-east') coastEast.push(points);
        else if (feature.properties?.kind === 'border') borders.push(points);
      }
      if (!shoreline.length || borders.length !== 2) throw new Error('Incomplete static coastline or border markers');
      coastLines = shoreline.flatMap(omitCoarseHarbourSections);
      coastBorders = borders;
      drawCoastline();
    } catch (error) {
      console.warn('Pulse: static coastline unavailable', error);
      roadStatus.textContent = 'Coastline unavailable';
      roadStatus.hidden = false;
    }
  }

  // Only the harbour is substituted: both the water and roads come from the
  // identical Geofabrik extract. Preserve GSHHG for the rest of SA and borders.
  function omitCoarseHarbourSections(line: Point[]): Point[][] {
    const outside = ([lng, lat]: Point) => lng < 138.475 || lng > 138.605 || lat < -34.915 || lat > -34.655;
    const sections: Point[][] = [];
    let current: Point[] = [];
    for (const point of line) {
      if (!outside(point)) {
        if (current.length > 1) sections.push(current);
        current = [];
      } else current.push(point);
    }
    if (current.length > 1) sections.push(current);
    return sections;
  }

  function omitHarbourClipEdges(ring: Point[]): Point[][] {
    const onBoundary = ([lng, lat]: Point) => Math.abs(lng - 138.43) < 0.0000005 ||
      Math.abs(lng - 138.64) < 0.0000005 || Math.abs(lat + 34.94) < 0.0000005 ||
      Math.abs(lat + 34.65) < 0.0000005;
    const result: Point[][] = [];
    let current: Point[] = [];
    for (const point of ring) {
      if (onBoundary(point)) {
        if (current.length > 1) result.push(current);
        current = [];
      } else current.push(point);
    }
    if (current.length > 1) result.push(current);
    return result;
  }

  async function loadHarbourCoast(): Promise<void> {
    try {
      const response = await fetch(`${geographyBase}harbour-water.geojson`);
      if (!response.ok) throw new Error(`OSM harbour file HTTP ${response.status}`);
      const data = await response.json();
      if (data?.type !== 'FeatureCollection' || !Array.isArray(data.features) || data.features.length < 10)
        throw new Error('Incomplete OSM harbour reference');
      harbourWaterLines = data.features.flatMap((feature: any): Point[][] => {
        if (feature.properties?.kind !== 'harbour-water' || feature.properties?.area < 0.00002) return [];
        const geometry = feature.geometry;
        const polygons = geometry?.type === 'Polygon' ? [geometry.coordinates] :
          geometry?.type === 'MultiPolygon' ? geometry.coordinates : [];
        return polygons.flatMap((rings: Point[][]): Point[][] => Array.isArray(rings) && rings.length ? omitHarbourClipEdges(rings[0]) : []);
      });
      drawCoastline();
    } catch (error) {
      console.warn('Pulse: detailed OSM harbour shoreline unavailable', error);
      roadStatus.textContent = 'Detailed harbour geometry unavailable';
      roadStatus.hidden = false;
    }
  }

  function roadOpacity(overview: boolean): number {
    const state = roadModes[roadModeIndex];
    return state === 'off' ? 0 : (overview ? 0.13 : 0.075) * (state === 'dim' ? 0.28 : 1);
  }

  function updateRoadMode(): void {
    const mode = roadModes[roadModeIndex];
    root!.dataset.roadsMode = mode;
    const nextMode = roadModes[(roadModeIndex + 1) % roadModes.length];
    const label = mode === 'show' ? 'Roads visible' : mode === 'dim' ? 'Roads dimmed' : 'Roads hidden';
    roadToggle.setAttribute('aria-label', `${label}. Click to ${nextMode === 'show' ? 'show' : nextMode === 'dim' ? 'dim' : 'hide'} roads`);
    roadToggle.title = `${label}. Click to change`;
    for (const id of roadLayerIds) {
      if (!map?.getLayer(id)) continue;
      map.setLayoutProperty(id, 'visibility', mode === 'off' ? 'none' : 'visible');
      map.setPaintProperty(id, 'line-opacity', roadOpacity(id === 'pulse-roads-overview-line'));
    }
    if (mode !== 'off') syncRoadTiles();
  }

  function staticRoadLayer(sourceId: string, layerId: string, overview = false): void {
    map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      // Round caps made clipped segment endpoints look like dotted beads at higher zoom.
      layout: { 'line-cap': 'butt', 'line-join': 'bevel', visibility: roadModes[roadModeIndex] === 'off' ? 'none' : 'visible' },
      paint: {
        'line-color': ['match', ['get', 'tier'], 'high', '#b6cad5', 'arterial', '#a2bccb', '#91abb8'],
        'line-opacity': roadOpacity(overview),
        'line-width': ['interpolate', ['linear'], ['zoom'],
          4, ['match', ['get', 'tier'], 'high', 0.9, 'arterial', 0.55, 0.3],
          9, ['match', ['get', 'tier'], 'high', 1.45, 'arterial', 0.95, 0.7],
          13, ['match', ['get', 'tier'], 'high', 2.1, 'arterial', 1.45, 1.0]],
      },
      minzoom: overview ? 0 : 10.2,
    });
    roadLayerIds.add(layerId);
  }

  function intersects(a: [number, number, number, number], b: [number, number, number, number]): boolean {
    return a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
  }

  function updateRoadBoundaryMask(): void {
    if (!map) return;
    const projectX = (lng: number) => map.project([lng, -34.5]).x;
    // Opacity becomes zero exactly at the state meridians; no hard ends on WA/VIC roads.
    mapElement.style.webkitMaskImage = `linear-gradient(to right, transparent ${projectX(129).toFixed(1)}px, black ${projectX(129.6).toFixed(1)}px, black ${projectX(140.45).toFixed(1)}px, transparent ${projectX(141).toFixed(1)}px)`;
    mapElement.style.maskImage = mapElement.style.webkitMaskImage;
  }

  function syncRoadTiles(): void {
    if (!map || !roadIndex) return;
    updateRoadBoundaryMask();
    // The statewide overview never disappears at a zoom threshold. Detail adds to it once loaded.
    if (!map.getSource('pulse-roads-overview')) {
      map.addSource('pulse-roads-overview', { type: 'geojson', data: `${geographyBase}${roadIndex.overviewFile}` });
      staticRoadLayer('pulse-roads-overview', 'pulse-roads-overview-line', true);
    }
    if (map.getZoom() < 10.2 || roadModes[roadModeIndex] === 'off') return;
    const bounds = map.getBounds();
    const margin = 0.09;
    const visible: [number, number, number, number] = [bounds.getWest() - margin, bounds.getSouth() - margin, bounds.getEast() + margin, bounds.getNorth() + margin];
    const wanted = roadIndex.tiles.filter(({ bbox }) => intersects(bbox, visible)).map(({ file }) => file);
    for (const file of wanted) {
      if (activeRoadTiles.has(file)) continue;
      const id = `pulse-road-${file.split('/').pop()!.replace('.geojson', '')}`;
      map.addSource(id, { type: 'geojson', data: `${geographyBase}${file}` });
      staticRoadLayer(id, `${id}-line`);
      activeRoadTiles.add(file);
    }
    // Retain nearby detail on a zoom change. Only evict older, out-of-view tiles when necessary.
    if (activeRoadTiles.size > 36) {
      for (const file of [...activeRoadTiles]) {
        if (activeRoadTiles.size <= 28) break;
        const tile = roadIndex.tiles.find((candidate) => candidate.file === file);
        if (tile && intersects(tile.bbox, visible)) continue;
        const id = `pulse-road-${file.split('/').pop()!.replace('.geojson', '')}`;
        if (map.getLayer(`${id}-line`)) map.removeLayer(`${id}-line`);
        if (map.getSource(id)) map.removeSource(id);
        roadLayerIds.delete(`${id}-line`);
        activeRoadTiles.delete(file);
      }
    }
  }

  async function loadStaticRoads(): Promise<void> {
    try {
      const response = await fetch(`${geographyBase}roads/index.json`);
      if (!response.ok) throw new Error(`Road manifest HTTP ${response.status}`);
      const data: RoadIndex = await response.json();
      if (data.schemaVersion !== 1 || data.kind !== 'pulse-static-roads' || !Array.isArray(data.tiles) || !data.tiles.length || !data.overviewFile) throw new Error('Invalid static road manifest');
      roadIndex = data;
      roadStatus.hidden = true;
      syncRoadTiles();
    } catch (error) {
      console.warn('Pulse: static road files unavailable', error);
      roadStatus.textContent = 'Roads unavailable';
      roadStatus.hidden = false;
    }
  }

  function resetTitleMask(): void {
    if (!titleMaskCtx) return;
    const width = Math.max(1, Math.ceil(brandOverlay.clientWidth));
    const height = Math.max(1, Math.ceil(brandOverlay.clientHeight));
    if (titleMaskInitialized && titleMaskCanvas.width === width && titleMaskCanvas.height === height) return;
    const previous = document.createElement('canvas');
    previous.width = titleMaskCanvas.width;
    previous.height = titleMaskCanvas.height;
    if (previous.width && previous.height) previous.getContext('2d')?.drawImage(titleMaskCanvas, 0, 0);
    titleMaskCanvas.width = width;
    titleMaskCanvas.height = height;
    titleMaskCtx.globalCompositeOperation = 'source-over';
    if (titleMaskInitialized && previous.width && previous.height) titleMaskCtx.drawImage(previous, 0, 0, width, height);
    else { titleMaskCtx.fillStyle = '#fff'; titleMaskCtx.fillRect(0, 0, width, height); }
  }

  // Match the actual laid-out letter positions, including the spaced first line.
  // Empty space inside the title's box must not delay the all-or-nothing handover.
  function refreshTitleGlyphs(width: number, height: number): void {
    if (!titleGlyphCtx || (titleGlyphsWidth === width && titleGlyphsHeight === height)) return;
    titleGlyphCanvas.width = width;
    titleGlyphCanvas.height = height;
    titleGlyphsWidth = width;
    titleGlyphsHeight = height;
    const overlayRect = brandOverlay.getBoundingClientRect();
    titleGlyphCtx.fillStyle = '#fff';
    titleGlyphCtx.textBaseline = 'middle';
    for (const span of Array.from(brandOverlay.querySelectorAll<HTMLElement>('.pulse__brand-top > span, .pulse__brand-bottom'))) {
      const range = document.createRange();
      range.selectNodeContents(span);
      const rect = range.getBoundingClientRect();
      const style = getComputedStyle(span);
      titleGlyphCtx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      // Canvas letterSpacing is supported in current Chromium; fall back to the
      // browser's normal glyph spacing where it is unavailable.
      if ('letterSpacing' in titleGlyphCtx) titleGlyphCtx.letterSpacing = style.letterSpacing;
      titleGlyphCtx.fillText(span.textContent ?? '', rect.left - overlayRect.left, rect.top - overlayRect.top + rect.height / 2);
    }
  }

  function hasEveryTitleLetterCrossedWater(): boolean {
    if (!titleMaskCtx || !titleGlyphCtx) return false;
    const width = titleMaskCanvas.width;
    const height = titleMaskCanvas.height;
    refreshTitleGlyphs(width, height);
    const glyphs = titleGlyphCtx.getImageData(0, 0, width, height).data;
    const remainingLand = titleMaskCtx.getImageData(0, 0, width, height).data;
    let letterPixels = 0;
    for (let alpha = 3; alpha < glyphs.length; alpha += 4) {
      // Ignore antialiased fringes, not the interior of the lettering.
      if (glyphs[alpha] < 128) continue;
      letterPixels++;
      if (remainingLand[alpha] >= 128) return false;
    }
    return letterPixels > 0;
  }

  function updateTitleMask(force = false): void {
    if (!map || !landRings.length || !titleMaskCtx || titleFullyCrossed) return;
    if (!titleWasDragged && titleMaskInitialized) return;
    const now = performance.now();
    if (!force && now - lastTitleMask < 75) return;
    lastTitleMask = now;
    resetTitleMask();
    const titleRect = brandOverlay.getBoundingClientRect();
    const mapRect = mapElement.getBoundingClientRect();
    titleMaskCtx.globalCompositeOperation = 'destination-in';
    titleMaskCtx.beginPath();
    for (const polygon of landRings) {
      for (const ring of polygon) {
        ring.forEach(([lng, lat], index) => {
          const point = map.project([lng, lat]);
          const x = point.x + mapRect.left - titleRect.left;
          const y = point.y + mapRect.top - titleRect.top;
          if (index) titleMaskCtx!.lineTo(x, y);
          else titleMaskCtx!.moveTo(x, y);
        });
        titleMaskCtx.closePath();
      }
    }
    titleMaskCtx.fill('evenodd');
    titleMaskCtx.globalCompositeOperation = 'source-over';
    titleMaskInitialized = true;
    // Keep the entire upper copy visible until every visible letter has had
    // its turn over water. Then hand over the whole title to the lower copy.
    if (hasEveryTitleLetterCrossedWater()) {
      titleFullyCrossed = true;
      brandOverlay.style.visibility = 'hidden';
    }
  }

  async function loadStaticLand(): Promise<void> {
    try {
      const response = await fetch(`${geographyBase}land.geojson`);
      if (!response.ok) throw new Error(`Land file HTTP ${response.status}`);
      const data = await response.json();
      if (data?.type !== 'FeatureCollection' || data.features?.length !== 1) throw new Error('Invalid static mainland geometry');
      const geometry = data.features[0]?.geometry;
      if (geometry?.type !== 'Polygon' && geometry?.type !== 'MultiPolygon') throw new Error('Land must contain sourced polygons');
      const polygons: unknown[] = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
      if (!Array.isArray(polygons) || !polygons.length) throw new Error('Missing mainland rings');
      const valid = (value: unknown): value is Point[][] => Array.isArray(value) && value.length > 0 && value.every(
        (ring) => Array.isArray(ring) && ring.length > 3 && ring.every((p) => Array.isArray(p) && p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1])),
      );
      if (!polygons.every(valid)) throw new Error('Invalid mainland coordinates');
      landRings = polygons as Point[][][];
      map.addSource('pulse-mainland', { type: 'geojson', data });
      const firstRoad = [...roadLayerIds].find((id) => map.getLayer(id));
      map.addLayer({ id: 'pulse-mainland-fill', type: 'fill', source: 'pulse-mainland',
        paint: { 'fill-color': '#121512', 'fill-opacity': 1, 'fill-antialias': true } }, firstRoad);
      updateTitleMask(true);
    } catch (error) {
      console.warn('Pulse: sourced land geometry unavailable', error);
      roadStatus.textContent = 'Land geometry unavailable';
      roadStatus.hidden = false;
    }
  }

  function drawCoastline(): void {
    if (!map) return;
    if (!coastLines.length) { coast.replaceChildren(); return; }
    const bounds = coast.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    coast.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
    const pathOf = (lines: Point[][]) => lines.map((line) => line.map(([lng, lat], index) => {
      const point = map.project([lng, lat]);
      return `${index ? 'L' : 'M'}${point.x.toFixed(2)},${point.y.toFixed(2)}`;
    }).join(' ')).join(' ');
    const svg = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string>) => {
      const node = document.createElementNS(svgNS, tag);
      for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
      return node;
    };
    const defs = svg('defs', {});
    const gradients = [
      ['pulse-coast-west', 128.45, 129, false],
      ['pulse-coast-east', 141, 141.65, true],
    ] as const;
    for (const [id, fromLng, toLng, reversed] of gradients) {
      const x1 = map.project([fromLng, -34.5]).x;
      const x2 = map.project([toLng, -34.5]).x;
      const gradient = svg('linearGradient', { id, gradientUnits: 'userSpaceOnUse', x1: String(x1), y1: '0', x2: String(x2), y2: '0' });
      gradient.append(
        svg('stop', { offset: '0%', 'stop-color': '#e2e6d8', 'stop-opacity': reversed ? '.25' : '0' }),
        svg('stop', { offset: '100%', 'stop-color': '#e2e6d8', 'stop-opacity': reversed ? '0' : '.25' }),
      );
      defs.append(gradient);
    }
    coast.replaceChildren(
      defs,
      svg('path', { d: pathOf(coastLines), class: 'pulse__coast-shadow' }),
      svg('path', { d: pathOf(coastLines), class: 'pulse__coast-line' }),
      svg('path', { d: pathOf(harbourWaterLines), class: 'pulse__harbour-coast' }),
      svg('path', { d: pathOf(coastWest), class: 'pulse__neighbour-coast', stroke: 'url(#pulse-coast-west)' }),
      svg('path', { d: pathOf(coastEast), class: 'pulse__neighbour-coast', stroke: 'url(#pulse-coast-east)' }),
      ...coastBorders.map((line, index) => {
        const p = map.project(line[0]);
        const q = map.project(line[line.length - 1]);
        const markerGradient = svg('linearGradient', { id: `pulse-border-${index}`, gradientUnits: 'userSpaceOnUse', x1: String(p.x), y1: String(p.y), x2: String(q.x), y2: String(q.y) });
        markerGradient.append(svg('stop', { offset: '0%', 'stop-color': '#e2e6d8', 'stop-opacity': '.25' }), svg('stop', { offset: '100%', 'stop-color': '#e2e6d8', 'stop-opacity': '0' }));
        defs.append(markerGradient);
        return svg('path', { d: pathOf([line]), class: 'pulse__state-marker', stroke: `url(#pulse-border-${index})` });
      }),
    );
  }

  function positionPlaces(): void {
    if (!map) return;
    for (const button of placeButtons) {
      const longitude = Number(button.dataset.longitude);
      const latitude = Number(button.dataset.latitude);
      const point = map.project([longitude, latitude]);
      const landmark = button.classList.contains('is-landmark');
      button.style.left = `${point.x}px`;
      button.style.top = `${point.y}px`;
      button.hidden = landmark
        ? point.x < -10 || point.y < -10 || point.x > mapElement.clientWidth + 10 || point.y > mapElement.clientHeight + 10
        : point.x < 14 || point.y < 18 || point.x > mapElement.clientWidth - 14 || point.y > mapElement.clientHeight - 18;
    }
  }

  function createPlaces(): void {
    if (placeButtons.length) return;
    for (const place of places) {
      const button = document.createElement('button');
      button.type = 'button';
      const slug = place.name.toLowerCase().replace(/[^a-z]+/g, '-');
      button.className = `pulse__place pulse__place--${slug}`;
      button.dataset.longitude = String(place.longitude);
      button.dataset.latitude = String(place.latitude);
      button.setAttribute('aria-label', `${place.name}, geographic reference point`);
      button.setAttribute('aria-pressed', 'false');
      if (landmarkSlugs.has(slug)) button.classList.add('is-landmark');
      const square = document.createElement('span');
      square.className = 'pulse__place-square';
      square.setAttribute('aria-hidden', 'true');
      const pole = document.createElement('span');
      pole.className = 'pulse__place-pole';
      pole.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span');
      label.className = 'pulse__place-label';
      label.setAttribute('aria-hidden', 'true');
      label.textContent = place.name;
      button.append(square, pole, label);
      button.addEventListener('click', () => {
        if (button.classList.contains('is-landmark')) return;
        if (selectedPlace && selectedPlace !== button) {
          selectedPlace.classList.remove('is-selected');
          selectedPlace.setAttribute('aria-pressed', 'false');
        }
        const wasSelected = selectedPlace === button;
        selectedPlace = wasSelected ? null : button;
        button.classList.toggle('is-selected', !wasSelected);
        button.setAttribute('aria-pressed', String(!wasSelected));
      });
      placeButtons.push(button);
      placesLayer.append(button);
    }
    positionPlaces();
  }

  function updateAverage(effects: boolean, advancing: boolean): void {
    const { mean, n } = metrics();
    if (mean === null) {
      averageWhole.textContent = '—';
      averageTenth.textContent = '';
      averageNumber.setAttribute('aria-label', 'No reported station prices');
      pulseReferenceMean = null;
      return;
    }
    const [whole, tenth] = mean.toFixed(1).split('.');
    averageWhole.textContent = whole;
    averageTenth.textContent = tenth;
    averageNumber.setAttribute('aria-label', `${mean.toFixed(1)} cents per litre, mean of ${n} reporting stations`);
    averageBox.title = `Mean latest reported station price, ${n} stations`;
    const reference = pulseReferenceMean;
    const change = reference === null ? 0 : mean - reference;
    const threshold = Math.max(0.5, (reference ?? mean) * 0.0025);
    const now = performance.now();
    if (effects && advancing && !reduced() && Math.abs(change) >= threshold && now - lastAveragePulse > 1400) {
      averageBox.classList.remove('is-rising', 'is-falling');
      averageBox.style.setProperty('--average-pulse-strength', String(Math.min(0.82, 0.23 + Math.abs(change) / 16)));
      void averageBox.offsetWidth;
      averageBox.classList.add(change > 0 ? 'is-rising' : 'is-falling');
      lastAveragePulse = now;
      pulseReferenceMean = mean;
    } else if (!effects || !advancing || reference === null) {
      pulseReferenceMean = mean;
      averageBox.classList.remove('is-rising', 'is-falling');
    }
  }

  async function setupMap(): Promise<void> {
    if (map) { map.resize(); fitCanvas(); return; }
    const mapUrl = 'https://cdn.jsdelivr.net/npm/maplibre-gl@6.9.1/dist/maplibre-gl.mjs';
    maplibre = await import(/* @vite-ignore */ mapUrl);
    map = new maplibre.Map({
      container: mapElement,
      center: [138.60, -34.985],
      zoom: 9.45,
      minZoom: 4.0,
      maxZoom: 13,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      antialias: true,
      attributionControl: false,
      style: {
        version: 8,
        sources: {},
        layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#080908', 'background-opacity': 0 } }],
      },
    });
    await new Promise<void>((resolve, reject) => {
      map.once('load', resolve);
      map.once('error', (e: any) => reject(e.error ?? new Error('Map unavailable')));
    });
    createPlaces();
    void loadStaticCoast();
    void loadHarbourCoast();
    void loadStaticLand();
    void loadStaticRoads();
    map.on('dragstart', () => { titleWasDragged = true; resetTitleMask(); });
    map.on('zoomstart', () => { titleWasDragged = true; resetTitleMask(); });
    map.on('move', () => { drawCoastline(); updateRoadBoundaryMask(); positionPlaces(); updateTitleMask(); paint(performance.now()); });
    map.on('moveend', () => updateTitleMask(true));
    map.on('moveend', syncRoadTiles);
    map.on('resize', () => { fitCanvas(); syncRoadTiles(); });
    map.on('error', (event: any) => {
      const message = String(event.error?.message ?? '');
      if (message.includes('pulse-of-adelaide/geography/')) {
        roadStatus.textContent = 'A geographic file failed to load';
        roadStatus.hidden = false;
      }
    });
    map.on('click', (e: any) => {
      let best: { site: Site; state: State; distance: number } | null = null;
      for (const [id, state] of states) {
        const site = siteLookup.get(id);
        if (!site) continue;
        const point = map.project([site.longitude, site.latitude]);
        const distance = Math.hypot(point.x - e.point.x, point.y - e.point.y);
        if (distance < 26 && (!best || distance < best.distance)) best = { site, state, distance };
      }
      if (!best) { stationInfo.hidden = true; return; }
      stationInfo.textContent = `${best.site.name} · ${best.state.price.toFixed(1)} c/L · ${textTime(best.state.observedAt)}${best.state.delta ? ` · ${best.state.delta > 0 ? '+' : ''}${best.state.delta.toFixed(1)} c/L` : ''}`;
      stationInfo.hidden = false;
    });
    new ResizeObserver(() => { map?.resize(); fitCanvas(); }).observe(mapElement);
    fitCanvas();
  }

  function reset(): void {
    states = new Map();
    if (!activePart) return;
    for (const [id, [price, observedAt, changedAt, delta]] of Object.entries(activePart.checkpoint)) {
      states.set(id, { price, observedAt, changedAt: changedAt ?? -Infinity, delta });
    }
    nextEvent = 0;
    pulses = [];
  }

  function advance(to: number, effects: boolean): void {
    while (nextEvent < events.length && events[nextEvent].time <= to) {
      const record = events[nextEvent++];
      const before = states.get(record.id);
      const delta = before ? Math.round((record.priceCpl - before.price) * 10) / 10 : 0;
      states.set(record.id, {
        price: record.priceCpl,
        observedAt: record.time,
        changedAt: delta ? record.time : (before?.changedAt ?? -Infinity),
        delta: delta || before?.delta || 0,
      });
      if (delta && effects && !reduced() && record.time >= to - 2 * hour) pulses.push({ id: record.id, delta, born: performance.now() });
    }
    if (pulses.length > 500) pulses = pulses.slice(-500);
  }

  function metrics(): { mean: number | null; n: number } {
    let total = 0;
    let n = 0;
    for (const state of states.values()) {
      if (Number.isFinite(state.price)) { total += state.price; n++; }
    }
    return { mean: n ? total / n : null, n };
  }

  function updateScrubber(): void {
    const steps = Math.max(1, Math.ceil((rangeFinish - rangeStart) / hour));
    slider.min = '0';
    slider.max = String(steps);
    const value = Math.min(steps, Math.max(0, Math.round((cursor - rangeStart) / hour)));
    slider.value = String(value);
    slider.setAttribute('aria-valuetext', textTime(cursor));

  }

  function chartTimeFromClientX(clientX: number): number {
    const rect = chart.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width)));
    return snap(archiveStart + ratio * Math.max(1, archiveFinish - archiveStart));
  }

  function updateRangeLabels(): void {
    if (!chartScene) return;
    const fixedStart = pickStage === 'choosing-end' || (pickStage === 'locked' && rangeStart > archiveStart);
    const fixedEnd = pickStage === 'choosing-end' || (pickStage === 'locked' && rangeFinish < archiveFinish);
    resetStart.hidden = pickStage !== 'locked';
    resetEnd.hidden = pickStage !== 'locked';
    rangeStartLabel.hidden = !fixedStart;
    rangeEndLabel.hidden = !fixedEnd;
    rangeStartText.textContent = rangeTime(rangeStart);
    rangeEndText.textContent = rangeTime(rangeFinish);
    const startPercent = chartScene.x(rangeStart) / 1000 * 100;
    const endPercent = chartScene.x(rangeFinish) / 1000 * 100;
    rangeStartLabel.style.left = `${startPercent}%`;
    rangeEndLabel.style.left = `${endPercent}%`;
    const overlapping = endPercent - startPercent < (chartFrame.clientWidth < 650 ? 48 : 28);
    rangeEndLabel.classList.toggle('is-close', overlapping);
    // The drag-only scrub timestamp occupies the upper chart lane; do not also
    // show a competing chart hover timestamp in that lane.
    hoverTime.hidden = hoveredTime === null || pickStage === 'choosing-end' || chartFrame.classList.contains('is-scrubbing');
    chartFrame.classList.toggle('is-previewing', hoveredTime !== null || pickStage === 'choosing-end');
    if (hoveredTime !== null) {
      hoverTime.textContent = rangeTime(hoveredTime);
      hoverTime.style.left = `${chartScene.x(hoveredTime) / 1000 * 100}%`;
      hoverTime.classList.toggle('is-end-preview', pickStage === 'choosing-end');
    }
  }

  function setRange(a: number, b: number, preserveCursor = false): void {
    const minimum = Math.min(2 * hour, archiveFinish - archiveStart);
    rangeStart = snap(a);
    rangeFinish = snap(b);
    if (rangeFinish < rangeStart + minimum) {
      rangeFinish = Math.min(archiveFinish, rangeStart + minimum);
      rangeStart = Math.max(archiveStart, rangeFinish - minimum);
    }
    const nextCursor = preserveCursor ? Math.min(rangeFinish, Math.max(rangeStart, cursor)) : rangeStart;
    previousStep = -1;
    reset();
    updateScrubber();
    render(nextCursor);
    updateRangeLabels();
  }


  function drawChart(): void {
    chart.replaceChildren();
    chartGuides.replaceChildren();
    const observed = hours.filter((item) => item.mean !== null).map((item) => item.mean!);
    if (!observed.length) { showNotice('No observations in range', 'Choose another period or fuel.'); return; }
    const min = Math.floor((Math.min(...observed) - 2) / 10) * 10;
    const max = Math.ceil((Math.max(...observed) + 2) / 10) * 10;
    const left = 12;
    const right = 988;
    const top = 32;
    const bottom = 96;
    const bracket = 118;
    const x = (time: number) => left + ((time - archiveStart) / Math.max(1, archiveFinish - archiveStart)) * (right - left);
    const y = (value: number) => bottom - (value - min) / Math.max(1, max - min) * (bottom - top);
    chartScene = { left, right, top, bottom, min, max, x, y };
    const el = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string>) => {
      const node = document.createElementNS(svgNS, tag);
      for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
      chart.append(node);
      return node;
    };
    const guide = (label: string, gx: number, gy: number, extra = '') => {
      const node = document.createElement('span');
      node.className = `pulse__guide ${extra}`;
      node.textContent = label;
      node.style.left = `${gx / 1000 * 100}%`;
      node.style.top = extra.includes('pulse__guide--date') ? 'calc(100% + 2px)' : `${gy / 140 * 100}%`;
      chartGuides.append(node);
    };
    for (let j = 0; j <= 2; j++) {
      const value = min + (max - min) * j / 2;
      el('line', { x1: String(left), y1: String(y(value)), x2: String(right), y2: String(y(value)), class: 'pulse__grid' });
      guide(`${value.toFixed(0)} c/L`, left - 4, y(value) - 4, 'pulse__guide--price');
    }
    for (let j = 0; j <= 3; j++) {
      const time = archiveStart + (archiveFinish - archiveStart) * j / 3;
      const gx = x(time);
      el('line', { x1: String(gx), y1: String(top), x2: String(gx), y2: String(bottom), class: 'pulse__guide-line' });
      guide(axisDate(time), gx, 133, `pulse__guide--date pulse__guide--date-${j}`);
    }
    // Preserve the first, last, minimum and maximum point in each ~2px column.
    // Multi-year hourly series stay crisp without a 40,000-segment SVG path.
    const buckets = new Map<number, typeof hours>();
    for (const item of hours) {
      const key = Math.floor(x(item.at) / 2);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(item);
    }
    const chartPoints = [...buckets.values()].flatMap((bucket) => {
      if (bucket.length <= 4) return bucket;
      const known = bucket.filter((p) => p.mean !== null);
      if (!known.length) return [bucket[0], bucket[bucket.length - 1]];
      const low = known.reduce((a, b) => a.mean! < b.mean! ? a : b);
      const high = known.reduce((a, b) => a.mean! > b.mean! ? a : b);
      const firstGap = bucket.find((p) => p.mean === null);
      const lastGap = [...bucket].reverse().find((p) => p.mean === null);
      return [...new Set([bucket[0], low, high, firstGap, lastGap, bucket[bucket.length - 1]].filter((p): p is typeof bucket[number] => !!p))].sort((a, b) => a.at - b.at);
    });
    let line = '';
    let active = false;
    for (const item of chartPoints) {
      if (item.mean === null) { active = false; continue; }
      line += `${active ? 'L' : 'M'}${x(item.at).toFixed(2)},${y(item.mean).toFixed(2)} `;
      active = true;
    }
    el('path', { d: line.trim(), class: 'pulse__line pulse__line--underlay' });
    el('path', { d: line.trim(), class: 'pulse__line pulse__line--future' });
    const defs = el('defs', {});
    const clip = document.createElementNS(svgNS, 'clipPath');
    clip.setAttribute('id', 'pulse-past-clip');
    chartClip = document.createElementNS(svgNS, 'rect');
    chartClip.setAttribute('x', String(left));
    chartClip.setAttribute('y', '0');
    chartClip.setAttribute('height', '140');
    clip.append(chartClip);
    defs.append(clip);
    el('path', { d: line.trim(), class: 'pulse__line pulse__line--past', 'clip-path': 'url(#pulse-past-clip)' });
    const selectionClip = document.createElementNS(svgNS, 'clipPath');
    selectionClip.setAttribute('id', 'pulse-drag-clip');
    chartHighlightClip = document.createElementNS(svgNS, 'rect');
    chartHighlightClip.setAttribute('x', String(left));
    chartHighlightClip.setAttribute('y', '0');
    chartHighlightClip.setAttribute('height', '140');
    selectionClip.append(chartHighlightClip);
    defs.append(selectionClip);
    chartHighlight = el('path', { d: line.trim(), class: 'pulse__line pulse__line--selection', 'clip-path': 'url(#pulse-drag-clip)' });
    chartSelection = el('line', { x1: String(left), y1: String(bracket), x2: String(right), y2: String(bracket), class: 'pulse__selection' });
    bracketProgress = el('line', { x1: String(left), y1: String(bracket), x2: String(left), y2: String(bracket), class: 'pulse__bracket-progress' });
    chartHandleStart = el('line', { x1: String(left), y1: String(bracket - 18), x2: String(left), y2: String(bracket), class: 'pulse__handle' });
    chartHandleEnd = el('line', { x1: String(right), y1: String(bracket - 18), x2: String(right), y2: String(bracket), class: 'pulse__handle' });
    chartMarker = el('line', { x1: String(left), y1: String(top), x2: String(left), y2: String(bottom), class: 'pulse__cursor' });
    updateChartOverlay();
  }

  function updateChartOverlay(): void {
    if (!chartScene) return;
    const selectionStartX = chartScene.x(rangeStart);
    const selectionEndX = chartScene.x(rangeFinish);
    const cursorX = chartScene.x(cursor);
    chartHighlightClip?.setAttribute('x', String(selectionStartX));
    chartHighlightClip?.setAttribute('width', String(Math.max(0, selectionEndX - selectionStartX)));
    chartSelection?.setAttribute('x1', String(selectionStartX));
    chartSelection?.setAttribute('x2', String(selectionEndX));
    chartHandleStart?.setAttribute('x1', String(selectionStartX));
    chartHandleStart?.setAttribute('x2', String(selectionStartX));
    chartHandleEnd?.setAttribute('x1', String(selectionEndX));
    chartHandleEnd?.setAttribute('x2', String(selectionEndX));
    chartMarker?.setAttribute('x1', String(cursorX));
    chartMarker?.setAttribute('x2', String(cursorX));
    chartClip?.setAttribute('width', String(Math.max(0, cursorX - chartScene.left)));
    bracketProgress?.setAttribute('x1', String(selectionStartX));
    bracketProgress?.setAttribute('x2', String(cursorX));
    scrubKnob.style.left = `${(cursor - rangeStart) / Math.max(1, rangeFinish - rangeStart) * 100}%`;
    scrubTime.style.left = `${cursorX / 1000 * 100}%`;
    scrubTime.classList.toggle('is-near-start', cursorX < 70);
    scrubTime.classList.toggle('is-near-end', cursorX > 930);
    scrubKnob.style.bottom = `${chartFrame.clientHeight * (1 - 118 / 140) - 9}px`;
    scrubWrap.style.left = `${selectionStartX / 1000 * 100}%`;
    scrubWrap.style.width = `${Math.max(1, (selectionEndX - selectionStartX) / 1000 * 100)}%`;
  }

  function render(t: number, effects = false): void {
    if (!archive) return;
    const target = Math.min(rangeFinish, Math.max(rangeStart, t));
    const part = partForTime(target);
    if (!part) return;
    if (part.file !== activePart?.file || !month) { void activatePart(part, target, effects); return; }
    const old = cursor;
    cursor = target;
    if (cursor < old) reset();
    // Apply all source reports up to the continuous playhead, in original timestamp order.
    advance(cursor, effects && cursor >= old);
    const step = Math.min(Number(slider.max), Math.max(0, Math.round((cursor - rangeStart) / hour)));
    if (step !== previousStep) {
      previousStep = step;
      slider.value = String(step);
      slider.setAttribute('aria-valuetext', textTime(cursor));
    }
    // Clock glyphs only update when the displayed minute changes; the chart and pulses animate every frame.
    const clockMinute = Math.floor(cursor / 60_000);
    if (clockMinute !== previousClockMinute) {
      previousClockMinute = clockMinute;
      currentDate.textContent = displayDate(cursor);
      currentTime.textContent = displayTime(cursor);
      scrubTime.textContent = rangeTime(cursor);
    }
    updateAverage(effects, cursor > old);
    updateChartOverlay();
    paint(performance.now());
  }

  function stop(): void {
    playing = false;
    cancelAnimationFrame(frame);
    lastFrame = 0;
    playIcon.textContent = '▶';
    playText.textContent = 'Play';
    play.setAttribute('aria-label', 'Play historical prices');
  }

  function setScrubDragging(active: boolean): void {
    chartFrame.classList.toggle('is-scrubbing', active);
    scrubTime.hidden = !active;
    updateRangeLabels();
  }

  function loop(now: number): void {
    if (!playing) return;
    if (lastFrame) {
      // Continuous archive time makes the chart, clock and station glow move together.
      // Cap a stalled frame to avoid a visible jump if a tab or device briefly stalls.
      const deltaMs = Math.max(0, Math.min(now - lastFrame, 100));
      const elapsedHours = deltaMs * speedModes[playbackModeIndex].hoursPerSecond / 1000;
      if (reduced()) {
        // After an explicit Play, honour reduced motion with discrete hourly changes and no bursts.
        reducedCarry += elapsedHours;
        const wholeHours = Math.floor(reducedCarry);
        if (wholeHours) {
          reducedCarry -= wholeHours;
          render(cursor + wholeHours * hour, false);
        }
      } else {
        render(cursor + elapsedHours * hour, true);
      }
    }
    // A month switch stops playback until its next event file is ready.
    // Do not schedule a second loop while the asynchronous switch is pending.
    if (!playing) return;
    lastFrame = now;
    if (cursor >= rangeFinish) { stop(); return; }
    frame = requestAnimationFrame(loop);
  }

  // A single plot click is observational. A new A/B range is only previewed once
  // the pointer has moved deliberately and spans at least two snapped hours.
  function restoreDragRange(): void {
    if (!dragHasPreview) return;
    pickStage = dragOriginalStage;
    cursor = dragOriginalCursor;
    setRange(dragOriginalStart, dragOriginalFinish, true);
    dragHasPreview = false;
  }

  function beginDrag(event: PointerEvent): void {
    if (!chartScene || !month || archiveStart === archiveFinish || activePointer !== null) return;
    if (event.pointerType !== 'touch' && event.button !== 0) return;
    const time = chartTimeFromClientX(event.clientX);
    const x = chartScene.x(time);
    const nearStart = Math.abs(x - chartScene.x(rangeStart)) <= 9;
    const nearEnd = Math.abs(x - chartScene.x(rangeFinish)) <= 9;
    const bounds = chart.getBoundingClientRect();
    const y = (event.clientY - bounds.top) / Math.max(1, bounds.height) * 140;
    if (y >= 109) dragMode = 'scrub';
    else if (pickStage === 'locked' && nearStart) dragMode = 'start';
    else if (pickStage === 'locked' && nearEnd) dragMode = 'end';
    else if (archiveFinish - archiveStart >= 2 * hour) dragMode = 'range';
    else return; // There is no valid two-hour interval to select.
    activePointer = event.pointerId;
    pressX = event.clientX;
    dragAnchor = time;
    dragHasPreview = false;
    dragOriginalStart = rangeStart;
    dragOriginalFinish = rangeFinish;
    dragOriginalCursor = cursor;
    dragOriginalStage = pickStage;
    hoveredTime = time;
    chartFrame.classList.add('is-guides-visible');
    chart.setPointerCapture(event.pointerId);
    if (dragMode === 'scrub') {
      stop();
      setScrubDragging(true);
      render(Math.min(rangeFinish, Math.max(rangeStart, time)));
    }
    updateRangeLabels();
    stationInfo.hidden = true;
  }

  function moveDrag(event: PointerEvent): void {
    if (!month) return;
    const time = chartTimeFromClientX(event.clientX);
    if (activePointer !== event.pointerId || !dragMode) {
      if (event.pointerType !== 'touch' && activePointer === null) {
        hoveredTime = time;
        updateRangeLabels();
      }
      return;
    }
    hoveredTime = time;
    if (dragMode === 'scrub') {
      render(Math.min(rangeFinish, Math.max(rangeStart, time)));
    } else if (Math.abs(event.clientX - pressX) > 6) {
      const minimum = 2 * hour;
      const start = dragMode === 'range' ? Math.min(dragAnchor, time)
        : dragMode === 'start' ? Math.min(dragOriginalFinish - minimum, time) : dragOriginalStart;
      const finish = dragMode === 'range' ? Math.max(dragAnchor, time)
        : dragMode === 'end' ? Math.max(dragOriginalStart + minimum, time) : dragOriginalFinish;
      if (finish - start >= minimum) {
        if (!dragHasPreview) stop();
        dragHasPreview = true;
        if (dragMode === 'range') pickStage = 'choosing-end';
        chartFrame.classList.add('is-selecting');
        setRange(start, finish, true);
      } else {
        restoreDragRange();
        chartFrame.classList.remove('is-selecting');
      }
    } else {
      restoreDragRange();
      chartFrame.classList.remove('is-selecting');
    }
    updateRangeLabels();
  }

  function endDrag(event: PointerEvent): void {
    if (activePointer !== event.pointerId) return;
    // Re-evaluate the final coordinate: pointerup may arrive without a last move.
    if (event.type === 'pointerup' && dragMode !== 'scrub') moveDrag(event);
    const committed = event.type === 'pointerup' && dragHasPreview;
    if (!committed) restoreDragRange();
    if (committed) {
      pickStage = 'locked';
      hoveredTime = null;
      rangeStatus.textContent = `Playback range ${rangeTime(rangeStart)} to ${rangeTime(rangeFinish)}.`;
    }
    dragHasPreview = false;
    dragMode = null;
    activePointer = null;
    if (chart.hasPointerCapture(event.pointerId)) chart.releasePointerCapture(event.pointerId);
    chartFrame.classList.remove('is-selecting');
    setScrubDragging(false);
    if (event.pointerType === 'touch') { chartFrame.classList.remove('is-guides-visible'); hoveredTime = null; }
    updateRangeLabels();
  }

  async function loadArchive(): Promise<void> {
    if (!index) return;
    const token = ++loading;
    ++activation;
    stop();
    month = null;
    activePart = null;
    archive = null;
    openArchive(false);
    filters.hidden = true;
    transport.hidden = true;
    chart.replaceChildren();
    chartGuides.replaceChildren();
    cachedMonths.clear();
    notice.hidden = false;
    noticeTitle.textContent = 'Loading history';
    noticeText.textContent = `Preparing the full ${fuelSelect.value} timeline`;
    retry.hidden = true;
    try {
      const response = await fetch(`${endpoint}summary/${fuelSelect.value}.json`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Archive summary missing. Run node scripts/data/pulse-of-adelaide/build_archive_summary.mjs after copying the full event export.');
      const raw: unknown = await response.json();
      if (!validArchive(raw, fuelSelect.value)) throw new Error('Archive summary is out of date. Rebuild it from the current full event export.');
      if (token !== loading) return;
      archive = raw;
      initialiseArchivePicker();
      filters.hidden = false;
      transport.hidden = false;
      const ready = selectArchiveRange(0, archive.months.length - 1);
      await Promise.all([setupMap(), ready]);
      if (token !== loading) return;
      if (!reduced() && !document.hidden && activePart) beginPlayback();
    } catch (error) {
      if (token !== loading) return;
      showNotice('History unavailable', error instanceof Error ? error.message : 'Could not load the archive.');
    }
  }

  async function start(): Promise<void> {
    try {
      const response = await fetch(`${endpoint}index.json`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Run build_event_playback.R to create a local event export.');
      const raw: unknown = await response.json();
      if (!validIndex(raw)) throw new Error('Event index is incompatible. Rebuild it with the R exporter.');
      index = raw;
      siteLookup = new Map(index.stations.map((site) => [site.id, site]));
      const fuels = [...new Set(index.partitions.map((p) => p.fuelCode))].sort();
      fuelSelect.replaceChildren(...fuels.map((fuel) => new Option(fuel, fuel)));
      fuelSelect.value = fuels.includes('ULP') ? 'ULP' : fuels[0];
      await loadArchive();
    } catch (error) {
      showNotice('Local export required', error instanceof Error ? error.message : 'No history loaded.');
    }
  }

  roadToggle.addEventListener('click', () => {
    roadModeIndex = (roadModeIndex + 1) % roadModes.length;
    try { localStorage.setItem('pulse-roads-mode-v1', roadModes[roadModeIndex]); } catch { /* Session state still applies. */ }
    updateRoadMode();
  });
  updateRoadMode();
  fuelSelect.addEventListener('change', () => { void loadArchive(); });
  archiveToggle.addEventListener('click', () => {
    if (!archivePanel.hidden) { openArchive(false); return; }
    if (!archive) return;
    archiveFrom.value = archive.months[firstMonthIndex].month;
    archiveTo.value = archive.months[lastMonthIndex].month;
    syncArchivePicker();
    openArchive(true);
  });
  archiveFrom.addEventListener('change', () => syncArchivePicker('from'));
  archiveTo.addEventListener('change', () => syncArchivePicker('to'));
  archiveStartSlider.addEventListener('input', () => syncArchivePicker('start'));
  archiveEndSlider.addEventListener('input', () => syncArchivePicker('end'));
  archiveAll.addEventListener('click', () => {
    if (!archive) return;
    archiveFrom.value = archive.months[0].month;
    archiveTo.value = archive.months[archive.months.length - 1].month;
    syncArchivePicker();
  });
  archiveApply.addEventListener('click', () => {
    if (!archive) return;
    void selectArchiveRange(archive.months.findIndex((p) => p.month === archiveFrom.value), archive.months.findIndex((p) => p.month === archiveTo.value));
  });
  document.addEventListener('pointerdown', (event) => { if (!archivePanel.hidden && !archiveControl.contains(event.target as Node)) openArchive(false); });
  archiveControl.addEventListener('keydown', (event) => { if (event.key === 'Escape') { openArchive(false); archiveToggle.focus(); } });
  slider.addEventListener('input', () => {
    stop();
    render(rangeStart + Number(slider.value) * hour);
  });
  resetStart.addEventListener('click', () => {
    stop();
    pickStage = 'locked';
    setRange(archiveStart, rangeFinish, true);
    rangeStatus.textContent = `Start reset to ${rangeTime(archiveStart)}.`;
  });
  resetEnd.addEventListener('click', () => {
    stop();
    pickStage = 'locked';
    setRange(rangeStart, archiveFinish, true);
    rangeStatus.textContent = `End reset to ${rangeTime(archiveFinish)}.`;
  });
  function beginPlayback(): void {
    if (!month || playing) return;
    if (cursor >= rangeFinish) render(rangeStart);
    playing = true;
    reducedCarry = 0;
    playIcon.textContent = '❚❚';
    playText.textContent = 'Pause';
    play.setAttribute('aria-label', 'Pause historical prices');
    frame = requestAnimationFrame(loop);
  }
  rewind.addEventListener('click', () => {
    if (!month) return;
    const resume = playing;
    stop();
    render(rangeStart);
    if (resume) beginPlayback();
  });
  slider.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch' && event.button !== 0) return;
    stop();
    setScrubDragging(true);
  });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture', 'change', 'blur']) {
    slider.addEventListener(event, () => setScrubDragging(false));
  }
  play.addEventListener('click', () => {
    if (playing) { stop(); return; }
    beginPlayback();
  });
  speedButton.addEventListener('click', () => {
    playbackModeIndex = (playbackModeIndex + 1) % speedModes.length;
    const currentMode = speedModes[playbackModeIndex];
    const followingMode = speedModes[(playbackModeIndex + 1) % speedModes.length];
    speedButton.textContent = currentMode.label;
    speedButton.setAttribute('aria-label', `Playback speed ${currentMode.label}. Activate to switch to ${followingMode.label}`);
  });
  retry.addEventListener('click', () => { if (index) void loadArchive(); else void start(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { stop(); setScrubDragging(false); } });
  mapWrap.addEventListener('pointerenter', (event) => { if (event.pointerType !== 'touch') root.classList.add('is-exploring'); });
  mapWrap.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'touch') return;
    root.classList.remove('is-exploring');
    if (selectedPlace) { selectedPlace.classList.remove('is-selected'); selectedPlace.setAttribute('aria-pressed', 'false'); selectedPlace = null; }
  });
  chart.addEventListener('pointerenter', (event) => { if (event.pointerType === 'mouse' || event.pointerType === 'pen') chartFrame.classList.add('is-guides-visible'); });
  chart.addEventListener('pointerleave', () => { if (!dragMode) { chartFrame.classList.remove('is-guides-visible'); hoveredTime = null; updateRangeLabels(); } });
  chart.addEventListener('pointerdown', beginDrag);
  chart.addEventListener('pointermove', moveDrag);
  chart.addEventListener('pointerup', endDrag);
  chart.addEventListener('pointercancel', endDrag);
  chart.addEventListener('keydown', (event) => {
    if (!month || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    stop();
    const delta = event.key === 'ArrowLeft' ? -hour : hour;
    if (event.altKey) {
      pickStage = 'locked';
      setRange(Math.min(rangeFinish - 2 * hour, Math.max(archiveStart, rangeStart + delta)), rangeFinish, true);
    } else if (event.shiftKey) {
      pickStage = 'locked';
      setRange(rangeStart, Math.max(rangeStart + 2 * hour, Math.min(archiveFinish, rangeFinish + delta)), true);
    } else {
      render(cursor + delta);
    }
    updateRangeLabels();
  });
  chart.addEventListener('keydown', (event) => {
    if (!month || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    stop();
    if (pickStage === 'choosing-end') {
      setRange(rangeStart, Math.max(rangeStart + 2 * hour, cursor), true);
      pickStage = 'locked';
    } else {
      pickStage = 'choosing-end';
      setRange(cursor, cursor + 2 * hour, true);
    }
    chartFrame.classList.remove('is-selecting');
    updateRangeLabels();
  });
  void start();
}

export {};
