type Observation = [year: number, count: number, rank: number];
type Summary = {
  first: number;
  last: number;
  peakYear: number;
  peakCount: number;
  peakRank: number;
  latestCount: number | null;
  latestRank: number | null;
};
type NameSeries = { id: string; n: string; c: 'male' | 'female'; o: Observation[]; s: Summary };
type NameData = {
  v: number;
  years: [number, number];
  coverage: [number, number, 'full' | 'top100'][];
  threshold: number;
  default: string;
  curated: string[];
  series: NameSeries[];
};

const root = document.querySelector<HTMLElement>('[data-name-curve]');

if (root) {
  const select = <T extends Element>(selector: string) => root.querySelector<T>(selector)!;
  const controls = select<HTMLElement>('[data-controls]');
  const loading = select<HTMLElement>('[data-loading]');
  const error = select<HTMLElement>('[data-error]');
  const figure = select<HTMLElement>('[data-figure]');
  const chart = select<SVGSVGElement>('[data-chart]');
  const search = select<HTMLInputElement>('[data-search]');
  const results = select<HTMLUListElement>('[data-results]');
  const selection = select<HTMLElement>('[data-selection]');
  const summaries = select<HTMLElement>('[data-summaries]');
  const status = select<HTMLElement>('[data-status]');
  const srSummary = select<HTMLElement>('[data-sr-summary]');
  const yearInput = select<HTMLInputElement>('[data-year]');
  const yearOutput = select<HTMLOutputElement>('[data-year-output]');
  const yearCard = select<HTMLElement>('[data-year-card]');
  const yearDetails = select<HTMLElement>('[data-year-details]');
  const scrubberWrap = select<HTMLElement>('[data-scrubber-wrap]');
  const colours = ['#ff668f', '#69d8ff', '#f2c84b'];
  const dashPatterns = ['', '10 6', '2 6'];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let data: NameData;
  let byId = new Map<string, NameSeries>();
  let selectedIds: string[] = [];
  let mode: 'count' | 'rank' = 'count';
  let activeResult = -1;
  let visibleResults: NameSeries[] = [];
  let focusYear = 1963;
  let resizeFrame = 0;

  const svgNs = 'http://www.w3.org/2000/svg';
  const svg = <K extends keyof SVGElementTagNameMap>(name: K, attributes: Record<string, string | number> = {}) => {
    const node = document.createElementNS(svgNs, name);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  };

  const addText = (parent: SVGElement, value: string, x: number, y: number, className: string, anchor = 'start') => {
    const node = svg('text', { x, y, class: className, 'text-anchor': anchor });
    node.textContent = value;
    parent.append(node);
    return node;
  };

  const observationAt = (series: NameSeries, year: number) => series.o.find((item) => item[0] === year);
  const publicationAt = (year: number) => year <= 2017 ? 'full' : 'top100';
  const categoryLabel = (category: NameSeries['c']) => `${category} registrations`;
  const formatNumber = (value: number) => new Intl.NumberFormat('en-AU').format(value);

  function readUrlSelection() {
    const raw = new URLSearchParams(window.location.search).get('names');
    if (!raw) return [data.default];
    const valid = raw.split(',').map((value) => value.trim().toLocaleLowerCase()).filter((id) => byId.has(id));
    return [...new Set(valid)].slice(0, 3).length ? [...new Set(valid)].slice(0, 3) : [data.default];
  }

  function writeUrlSelection() {
    const url = new URL(window.location.href);
    url.searchParams.set('names', selectedIds.join(','));
    window.history.replaceState({}, '', url);
  }

  function setStatus(message: string) {
    status.textContent = message;
  }

  function missingLabel(year: number) {
    return publicationAt(year) === 'top100'
      ? 'outside the published top 100'
      : `fewer than ${data.threshold} registrations or not registered`;
  }

  function addSeries(id: string) {
    if (!byId.has(id)) return;
    if (selectedIds.includes(id)) {
      setStatus(`${byId.get(id)!.n} is already in the comparison.`);
      return;
    }
    if (selectedIds.length >= 3) {
      search.value = '';
      closeResults();
      setStatus('Three names are already shown. Remove one before adding another.');
      return;
    }
    selectedIds.push(id);
    focusYear = byId.get(id)!.s.peakYear;
    search.value = '';
    closeResults();
    writeUrlSelection();
    render();
    setStatus(`${byId.get(id)!.n} added.`);
  }

  function removeSeries(id: string) {
    if (selectedIds.length === 1) {
      setStatus('Keep at least one name in the field.');
      return;
    }
    selectedIds = selectedIds.filter((selected) => selected !== id);
    focusYear = byId.get(selectedIds[0])!.s.peakYear;
    writeUrlSelection();
    render();
  }

  function closeResults() {
    activeResult = -1;
    visibleResults = [];
    results.hidden = true;
    results.replaceChildren();
    search.setAttribute('aria-expanded', 'false');
    search.setAttribute('aria-activedescendant', '');
  }

  function showResults() {
    const query = search.value.trim().toLocaleLowerCase();
    if (!query) {
      closeResults();
      return;
    }
    visibleResults = data.series
      .filter((series) => series.n.toLocaleLowerCase().includes(query))
      .sort((a, b) => {
        const aStarts = a.n.toLocaleLowerCase().startsWith(query) ? 0 : 1;
        const bStarts = b.n.toLocaleLowerCase().startsWith(query) ? 0 : 1;
        return aStarts - bStarts || b.s.peakCount - a.s.peakCount || a.n.localeCompare(b.n);
      })
      .slice(0, 8);
    results.replaceChildren();
    activeResult = -1;
    if (!visibleResults.length) {
      const item = document.createElement('li');
      item.textContent = 'No displayed name found — check spelling or try an example.';
      item.setAttribute('aria-disabled', 'true');
      results.append(item);
    } else {
      visibleResults.forEach((series, index) => {
        const item = document.createElement('li');
        item.id = `name-result-${index}`;
        item.dataset.id = series.id;
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', index === activeResult ? 'true' : 'false');
        const name = document.createElement('span');
        name.textContent = series.n;
        const meta = document.createElement('small');
        meta.textContent = `${series.c} · peak ${series.s.peakYear}`;
        item.append(name, meta);
        results.append(item);
      });
    }
    results.hidden = false;
    search.setAttribute('aria-expanded', 'true');
    updateActiveResult();
  }

  function updateActiveResult() {
    [...results.querySelectorAll<HTMLElement>('[role="option"]')].forEach((item, index) => {
      item.setAttribute('aria-selected', index === activeResult ? 'true' : 'false');
    });
    const id = activeResult >= 0 ? `name-result-${activeResult}` : '';
    search.setAttribute('aria-activedescendant', id);
    document.getElementById(id)?.scrollIntoView({ block: 'nearest' });
  }

  function contextSeries(selected: NameSeries[], mobile: boolean) {
    const primary = selected[0];
    const limit = mobile ? 6 : 16;
    const candidates = data.series.filter((series) => {
      const ratio = series.s.peakCount / primary.s.peakCount;
      return !selectedIds.includes(series.id) && series.o.length >= 8 && Math.abs(series.s.peakYear - primary.s.peakYear) <= 7 && ratio >= .35 && ratio <= 1.7;
    });
    return candidates.sort((a, b) => {
      const aScore = Math.abs(a.s.peakYear - primary.s.peakYear) * 3 + Math.abs(Math.log(a.s.peakCount / primary.s.peakCount)) * 10;
      const bScore = Math.abs(b.s.peakYear - primary.s.peakYear) * 3 + Math.abs(Math.log(b.s.peakCount / primary.s.peakCount)) * 10;
      return aScore - bScore || b.s.peakCount - a.s.peakCount;
    }).slice(0, limit);
  }

  function linePath(observations: Observation[], x: (year: number) => number, y: (value: number) => number, valueIndex: 1 | 2) {
    let path = '';
    let previous: Observation | undefined;
    for (const point of observations) {
      const px = x(point[0]);
      const py = y(point[valueIndex]);
      if (!previous || point[0] - previous[0] > 1) {
        path += `M${px.toFixed(2)},${py.toFixed(2)}`;
      } else {
        const previousX = x(previous[0]);
        const previousY = y(previous[valueIndex]);
        const middle = (previousX + px) / 2;
        path += `C${middle.toFixed(2)},${previousY.toFixed(2)} ${middle.toFixed(2)},${py.toFixed(2)} ${px.toFixed(2)},${py.toFixed(2)}`;
      }
      previous = point;
    }
    return path;
  }

  function drawMarker(parent: SVGElement, x: number, y: number, index: number, colour: string) {
    if (index === 1) {
      parent.append(svg('rect', { x: x - 5, y: y - 5, width: 10, height: 10, fill: colour, class: 'focus-marker' }));
    } else if (index === 2) {
      parent.append(svg('path', { d: `M${x},${y - 7}L${x + 7},${y}L${x},${y + 7}L${x - 7},${y}Z`, fill: colour, class: 'focus-marker' }));
    } else {
      parent.append(svg('circle', { cx: x, cy: y, r: 6, fill: colour, class: 'focus-marker' }));
    }
  }

  function renderChart(animateLines = false) {
    const rect = chart.getBoundingClientRect();
    const width = Math.max(320, Math.round(rect.width));
    const height = Math.max(420, Math.round(rect.height));
    const mobile = width < 620;
    const margin = mobile ? { top: 88, right: 20, bottom: 48, left: 43 } : { top: 74, right: 56, bottom: 52, left: 62 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const selected = selectedIds.map((id) => byId.get(id)!).filter(Boolean);
    const context = contextSeries(selected, mobile);
    const visible = [...context, ...selected];
    const valueIndex: 1 | 2 = mode === 'count' ? 1 : 2;
    const allValues = visible.flatMap((series) => series.o.map((point) => point[valueIndex]));
    const maxValue = mode === 'count'
      ? Math.max(10, Math.ceil(Math.max(...allValues) * 1.1 / 50) * 50)
      : Math.max(10, Math.ceil(Math.max(...allValues) / 25) * 25);
    const [firstYear, lastYear] = data.years;
    const x = (year: number) => margin.left + (year - firstYear) / (lastYear - firstYear) * plotWidth;
    const y = mode === 'count'
      ? (value: number) => margin.top + plotHeight - value / maxValue * plotHeight
      : (value: number) => margin.top + Math.log(Math.max(1, value)) / Math.log(maxValue) * plotHeight;

    chart.setAttribute('viewBox', `0 0 ${width} ${height}`);
    chart.replaceChildren();

    const eraStart = x(2018);
    chart.append(svg('rect', { x: eraStart, y: margin.top, width: x(lastYear) - eraStart, height: plotHeight, class: 'chart-era' }));
    chart.append(svg('line', { x1: eraStart, x2: eraStart, y1: margin.top, y2: margin.top + plotHeight, class: 'chart-era-edge' }));
    addText(chart, 'TOP 100 ONLY', eraStart + 8, margin.top + plotHeight - 10, 'chart-era-label');

    const yTicks = mode === 'count'
      ? [0, Math.round(maxValue / 2 / 10) * 10, maxValue]
      : [...new Set([1, 10, 100, maxValue])];
    yTicks.forEach((tick, index) => {
      const yPos = y(tick);
      chart.append(svg('line', { x1: margin.left, x2: width - margin.right, y1: yPos, y2: yPos, class: index === 0 ? 'chart-grid chart-grid--major' : 'chart-grid' }));
      addText(chart, mode === 'count' ? formatNumber(tick) : `#${tick}`, margin.left - 9, yPos + 3, 'chart-axis-label', 'end');
    });
    addText(chart, mode === 'count' ? 'REGISTRATIONS' : 'RANK · LOWER IS MORE POPULAR', margin.left, margin.top - 18, 'chart-axis-label');

    for (let year = 1950; year <= 2020; year += 10) {
      const xPos = x(year);
      chart.append(svg('line', { x1: xPos, x2: xPos, y1: margin.top, y2: margin.top + plotHeight, class: 'chart-grid' }));
      if (!mobile || year === 1970 || year === 2000) {
        addText(chart, String(year), xPos, height - 19, 'chart-axis-label', 'middle');
      }
    }
    addText(chart, String(firstYear), margin.left, height - 19, 'chart-axis-label', 'middle');
    addText(chart, String(lastYear), width - margin.right, height - 19, 'chart-axis-label', 'middle');

    context.forEach((series, index) => {
      const path = svg('path', { d: linePath(series.o, x, y, valueIndex), class: 'context-line' });
      chart.append(path);
      if (mode === 'count' && index < (mobile ? 2 : 5)) {
        const peak = mode === 'count'
          ? series.o.find((point) => point[0] === series.s.peakYear)!
          : series.o.reduce((best, point) => point[2] < best[2] ? point : best);
        addText(chart, series.n, x(peak[0]) + 5, y(peak[valueIndex]) - 5 - (index % 2) * 8, 'context-label');
      }
    });

    selected.forEach((series, index) => {
      const colour = colours[index];
      const path = svg('path', {
        d: linePath(series.o, x, y, valueIndex),
        class: 'series-line',
        stroke: colour,
        'data-series-index': index,
      });
      if (dashPatterns[index]) path.setAttribute('stroke-dasharray', dashPatterns[index]);
      chart.append(path);
      const peak = mode === 'count'
        ? series.o.find((point) => point[0] === series.s.peakYear)!
        : series.o.reduce((best, point) => point[2] < best[2] ? point : best);
      const peakX = x(peak[0]);
      const peakY = y(peak[valueIndex]);
      const labelY = mobile
        ? margin.top + 17 + index * 15
        : Math.max(margin.top + 14, peakY - 43 - index * 8);
      chart.append(svg('line', { x1: peakX, x2: peakX, y1: peakY - 7, y2: labelY + 4, class: 'peak-guide', stroke: colour }));
      chart.append(svg('circle', { cx: peakX, cy: peakY, r: 4.5, class: 'peak-marker', stroke: colour }));
      const labelAnchor = mobile
        ? 'start'
        : selected.length > 1
        ? (index % 2 === 0 ? 'end' : 'start')
        : (peakX > width - 150 ? 'end' : 'start');
      const labelX = mobile ? margin.left + 4 : peakX + (labelAnchor === 'end' ? -7 : 7);
      const label = mobile
        ? series.n
        : mode === 'count'
        ? `${series.n} · ${peak[0]} · ${formatNumber(peak[1])}`
        : `${series.n} · best #${peak[2]} · ${peak[0]}`;
      const text = addText(chart, label, labelX, labelY, 'peak-label', labelAnchor);
      text.setAttribute('fill', colour);

      if (animateLines && !reducedMotion.matches && path.getTotalLength() > 0) {
        const length = path.getTotalLength();
        path.animate([
          { strokeDasharray: `${length} ${length}`, strokeDashoffset: String(length), opacity: .15 },
          { strokeDasharray: `${length} ${length}`, strokeDashoffset: '0', opacity: 1 },
        ], { duration: 620 + index * 130, easing: 'cubic-bezier(.3,.7,.2,1)' });
      }
    });

    const focusX = x(focusYear);
    chart.append(svg('line', { x1: focusX, x2: focusX, y1: margin.top, y2: margin.top + plotHeight, class: 'focus-line' }));
    selected.forEach((series, index) => {
      const point = observationAt(series, focusYear);
      if (point) drawMarker(chart, focusX, y(point[valueIndex]), index, colours[index]);
    });
    updateYearReadout();
  }

  function updateYearReadout() {
    yearInput.value = String(focusYear);
    yearOutput.value = String(focusYear);
    yearCard.replaceChildren();
    yearDetails.replaceChildren();
    const heading = document.createElement('strong');
    heading.textContent = String(focusYear);
    yearCard.append(heading);
    selectedIds.forEach((id, index) => {
      const series = byId.get(id)!;
      const point = observationAt(series, focusYear);
      const value = point
        ? `${series.n}: ${formatNumber(point[1])} · rank ${point[2]}`
        : `${series.n}: ${missingLabel(focusYear)}`;
      const compact = document.createElement('span');
      compact.style.color = colours[index];
      compact.textContent = value;
      yearCard.append(compact);
      const detail = compact.cloneNode(true) as HTMLElement;
      yearDetails.append(detail);
    });
  }

  function renderSelection() {
    selection.replaceChildren();
    selectedIds.forEach((id, index) => {
      const series = byId.get(id)!;
      const chip = document.createElement('span');
      chip.className = 'name-curve__chip';
      chip.dataset.seriesIndex = String(index);
      chip.style.setProperty('--series-colour', colours[index]);
      chip.append(document.createTextNode(`${series.n} · ${series.c}`));
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.dataset.remove = id;
      remove.setAttribute('aria-label', `Remove ${series.n}, ${categoryLabel(series.c)}`);
      remove.textContent = '×';
      chip.append(remove);
      selection.append(chip);
    });
  }

  function renderSummaries() {
    summaries.replaceChildren();
    const spoken: string[] = [];
    selectedIds.forEach((id, index) => {
      const series = byId.get(id)!;
      const item = document.createElement('section');
      item.className = 'name-curve__summary';
      item.style.setProperty('--series-colour', colours[index]);
      const heading = document.createElement('h3');
      heading.textContent = series.n;
      const category = document.createElement('small');
      category.textContent = series.c;
      heading.append(category);
      const latest = series.s.latestCount == null
        ? 'Outside 2025 top 100'
        : `${formatNumber(series.s.latestCount)} · rank ${series.s.latestRank}`;
      spoken.push(`${series.n}, ${categoryLabel(series.c)}: peak ${formatNumber(series.s.peakCount)} in ${series.s.peakYear}, rank ${series.s.peakRank}; first displayed ${series.s.first}; last displayed ${series.s.last}; ${latest}.`);
      const values = [
        ['Peak', `${series.s.peakYear} · ${formatNumber(series.s.peakCount)}`],
        ['Peak rank', `#${series.s.peakRank}`],
        ['First displayed', String(series.s.first)],
        ['Last displayed', String(series.s.last)],
        ['2025 list', latest],
        ['Publication', series.s.last <= 2017 ? 'Complete-list era' : 'Mixed coverage'],
      ];
      const list = document.createElement('dl');
      values.forEach(([term, value]) => {
        const group = document.createElement('div');
        const dt = document.createElement('dt');
        dt.textContent = term;
        const dd = document.createElement('dd');
        dd.textContent = value;
        group.append(dt, dd);
        list.append(group);
      });
      item.append(heading, list);
      summaries.append(item);
    });
    srSummary.textContent = `Selected name summary. ${spoken.join(' ')}`;
  }

  function render() {
    renderSelection();
    renderSummaries();
    renderChart(true);
  }

  function setFocusYear(year: number) {
    focusYear = Math.max(data.years[0], Math.min(data.years[1], Math.round(year)));
    renderChart();
  }

  async function load() {
    loading.hidden = false;
    error.hidden = true;
    try {
      const response = await fetch('/data/south-australian-name-curve/names.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const next = await response.json() as NameData;
      if (next.v !== 1 || !Array.isArray(next.series) || !next.series.length) throw new Error('Unexpected schema');
      data = next;
      byId = new Map(data.series.map((series) => [series.id, series]));
      selectedIds = readUrlSelection();
      focusYear = byId.get(selectedIds[0])!.s.peakYear;
      yearInput.min = String(data.years[0]);
      yearInput.max = String(data.years[1]);
      root.classList.add('is-ready');
      controls.hidden = false;
      figure.hidden = false;
      scrubberWrap.hidden = false;
      loading.hidden = true;
      writeUrlSelection();
      requestAnimationFrame(render);
    } catch (reason) {
      console.error('South Australian Name Curve:', reason);
      loading.hidden = true;
      error.hidden = false;
    }
  }

  search.addEventListener('input', showResults);
  search.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' && visibleResults.length) {
      event.preventDefault();
      activeResult = (activeResult + 1) % visibleResults.length;
      updateActiveResult();
    } else if (event.key === 'ArrowUp' && visibleResults.length) {
      event.preventDefault();
      activeResult = (activeResult - 1 + visibleResults.length) % visibleResults.length;
      updateActiveResult();
    } else if (event.key === 'Enter' && visibleResults.length) {
      event.preventDefault();
      addSeries(visibleResults[Math.max(0, activeResult)].id);
    } else if (event.key === 'Escape') {
      closeResults();
    }
  });
  search.addEventListener('blur', () => window.setTimeout(closeResults, 120));
  results.addEventListener('pointerdown', (event) => {
    const item = (event.target as HTMLElement).closest<HTMLElement>('[data-id]');
    if (item?.dataset.id) addSeries(item.dataset.id);
  });
  selection.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-remove]');
    if (button?.dataset.remove) removeSeries(button.dataset.remove);
  });
  root.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      mode = button.dataset.mode as 'count' | 'rank';
      root.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      renderChart(true);
    });
  });
  select<HTMLButtonElement>('[data-surprise]').addEventListener('click', () => {
    const pool = data.curated.filter((id) => id !== selectedIds[0]);
    const id = pool[Math.floor(Math.random() * pool.length)] || data.default;
    selectedIds = [id];
    focusYear = byId.get(id)!.s.peakYear;
    writeUrlSelection();
    render();
    setStatus(`A curve from the archive: ${byId.get(id)!.n}.`);
  });
  yearInput.addEventListener('input', () => setFocusYear(Number(yearInput.value)));
  chart.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') return;
    const rect = chart.getBoundingClientRect();
    const mobile = rect.width < 620;
    const left = mobile ? 43 : 62;
    const right = mobile ? 20 : 56;
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left - left) / (rect.width - left - right)));
    setFocusYear(data.years[0] + ratio * (data.years[1] - data.years[0]));
  });
  chart.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch') return;
    const rect = chart.getBoundingClientRect();
    const left = rect.width < 620 ? 43 : 62;
    const right = rect.width < 620 ? 20 : 56;
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left - left) / (rect.width - left - right)));
    setFocusYear(data.years[0] + ratio * (data.years[1] - data.years[0]));
  });
  select<HTMLButtonElement>('[data-retry]').addEventListener('click', load);
  window.addEventListener('resize', () => {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(() => data && renderChart());
  });
  reducedMotion.addEventListener('change', () => data && renderChart());

  load();
}
