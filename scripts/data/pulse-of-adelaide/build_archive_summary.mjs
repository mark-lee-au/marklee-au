#!/usr/bin/env node
// Build compact all-history chart data and exact station checkpoints from the
// already exported event JSON. Never reads the private source Parquet.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const directory = resolve(process.argv[2] ?? 'public/data/pulse-of-adelaide/events');
const hours = 3_600_000;
const read = async (file) => JSON.parse(await readFile(join(directory, file), 'utf8'));
const index = await read('index.json');
if (index.schemaVersion !== 3 || index.kind !== 'pulse-event-index' || !Array.isArray(index.partitions)) {
  throw new Error('Expected a version 3 Pulse event index.');
}
const fuels = [...new Set(index.partitions.map((p) => p.fuelCode))].sort();
await mkdir(join(directory, 'summary'), { recursive: true });
const firstHour = (time) => Math.ceil((time - 30 * 60_000) / hours) * hours + 30 * 60_000;
const lastHour = (time) => Math.floor((time - 30 * 60_000) / hours) * hours + 30 * 60_000;

for (const fuelCode of fuels) {
  const specs = index.partitions.filter((p) => p.fuelCode === fuelCode).sort((a, b) => a.month.localeCompare(b.month));
  const state = new Map(); // station -> [price, observedAt, changedAt|null, lastDelta]
  let total = 0;
  const points = [];
  const months = [];
  let nextSample = null;
  let priorEnd = null;
  let priorMonth = null;
  for (const spec of specs) {
    const raw = await read(spec.file);
    if (raw.schemaVersion !== 3 || raw.kind !== 'pulse-events' || raw.month !== spec.month || raw.fuelCode !== fuelCode || !Array.isArray(raw.events) || raw.events.length !== spec.events) {
      throw new Error(`Index and partition disagree: ${spec.file}`);
    }
    const start = Date.parse(raw.start);
    const end = Date.parse(raw.end);
    if (!(end > start) || (priorEnd !== null && start < priorEnd)) throw new Error(`Overlapping or invalid month: ${spec.file}`);
    if (nextSample === null) {
      for (const row of raw.seeds) {
        if (!state.has(row.id)) total += row.priceCpl;
        else total += row.priceCpl - state.get(row.id)[0];
        state.set(row.id, [row.priceCpl, Date.parse(row.observedAt), null, 0]);
      }
      nextSample = firstHour(start);
    }
    // Carry latest reports through an ordinary month boundary. A missing whole
    // month is different: display a real chart gap rather than inventing data.
    const contiguous = priorMonth !== null && (() => {
      const next = new Date(`${priorMonth}-01T00:00:00Z`);
      next.setUTCMonth(next.getUTCMonth() + 1);
      return next.toISOString().slice(0, 7) === spec.month;
    })();
    while (nextSample < start) {
      points.push([nextSample, priorMonth === null || contiguous ? (state.size ? total / state.size : null) : null, priorMonth === null || contiguous ? state.size : 0]);
      nextSample += hours;
    }
    const checkpoint = Object.fromEntries([...state].sort(([a], [b]) => a.localeCompare(b)));
    months.push({ month: spec.month, file: spec.file, start: raw.start, end: raw.end, events: spec.events, checkpoint });
    let at = 0;
    const events = raw.events;
    function advance(to) {
      while (at < events.length && Date.parse(events[at].observedAt) <= to) {
        const row = events[at++];
        const observedAt = Date.parse(row.observedAt);
        const before = state.get(row.id);
        const delta = before ? Math.round((row.priceCpl - before[0]) * 10) / 10 : 0;
        total += row.priceCpl - (before ? before[0] : 0);
        state.set(row.id, [row.priceCpl, observedAt, delta ? observedAt : before?.[2] ?? null, delta || before?.[3] || 0]);
      }
    }
    while (nextSample <= lastHour(end)) {
      advance(nextSample);
      points.push([nextSample, state.size ? total / state.size : null, state.size]);
      nextSample += hours;
    }
    advance(end); // Include records after the last sampled whole hour in next month's checkpoint.
    priorEnd = end;
    priorMonth = spec.month;
  }
  if (!months.length || !points.length) continue;
  const output = { schemaVersion: 1, kind: 'pulse-archive-summary', fuelCode, start: months[0].start,
    end: months.at(-1).end, months, points };
  await writeFile(join(directory, 'summary', `${fuelCode}.json`), JSON.stringify(output));
  console.log(`${fuelCode}: ${months.length} monthly partitions, ${points.length} hourly samples, ${state.size} known stations`);
}
console.log('Archive summaries written to', join(directory, 'summary'));
