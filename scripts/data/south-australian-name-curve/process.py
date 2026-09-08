#!/usr/bin/env python3
"""Validate and compact the South Australian Popular Baby Names snapshot."""

from __future__ import annotations

import csv
import gzip
import hashlib
import json
import re
import unicodedata
import zipfile
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[3]
RAW = ROOT / "data" / "raw" / "south-australian-name-curve"
PROCESSED = ROOT / "data" / "processed" / "south-australian-name-curve"
PUBLIC = ROOT / "public" / "data" / "south-australian-name-curve"
MANIFEST = Path(__file__).with_name("source-manifest.json")
MIN_DISPLAY_COUNT = 5
PLACEHOLDER_KEYS = {"unnamed"}
FIRST_YEAR = 1944
LAST_YEAR = 2025
FULL_LIST_LAST_YEAR = 2017


def normalise_key(value: str) -> str:
    return unicodedata.normalize("NFKC", value).strip().casefold()


def display_name(value: str) -> str:
    return unicodedata.normalize("NFKC", value).strip().title()


def integer(value: object, field: str, source: Path) -> int:
    text = str(value or "").strip().lstrip("=")
    if not re.fullmatch(r"\d+", text):
        raise ValueError(f"Invalid {field} {value!r} in {source}")
    return int(text)


def csv_rows(path: Path) -> list[dict[str, object]]:
    raw = path.read_bytes()
    for encoding in ("utf-8-sig", "cp1252"):
        try:
            text = raw.decode(encoding)
            return list(csv.DictReader(text.splitlines()))
        except UnicodeDecodeError:
            continue
    raise ValueError(f"Could not decode {path}")


def xlsx_rows(path: Path) -> list[dict[str, object]]:
    ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    with zipfile.ZipFile(path) as archive:
        shared: list[str] = []
        if "xl/sharedStrings.xml" in archive.namelist():
            root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            for item in root.findall("m:si", ns):
                shared.append("".join(node.text or "" for node in item.findall(".//m:t", ns)))
        sheet = ET.fromstring(archive.read("xl/worksheets/sheet1.xml"))
        table: list[list[object]] = []
        for row in sheet.findall(".//m:sheetData/m:row", ns):
            values: list[object] = []
            for cell in row.findall("m:c", ns):
                ref = cell.attrib.get("r", "A1")
                column = 0
                for char in re.match(r"[A-Z]+", ref).group(0):
                    column = column * 26 + ord(char) - 64
                while len(values) < column - 1:
                    values.append("")
                cell_type = cell.attrib.get("t")
                value_node = cell.find("m:v", ns)
                if cell_type == "inlineStr":
                    value = "".join(node.text or "" for node in cell.findall(".//m:t", ns))
                elif value_node is None:
                    value = ""
                elif cell_type == "s":
                    value = shared[int(value_node.text or 0)]
                else:
                    value = value_node.text or ""
                values.append(value)
            table.append(values)
    headers = [str(value).strip() for value in table[0]]
    return [dict(zip(headers, row)) for row in table[1:]]


def read_source(path: Path, year: int, category: str) -> tuple[list[dict], dict]:
    source_rows = xlsx_rows(path) if path.suffix.lower() == ".xlsx" else csv_rows(path)
    accepted: list[dict] = []
    footer_rows = 0
    for source_row in source_rows:
        raw_name = source_row.get("Given Name") or source_row.get("First Name") or ""
        raw_name = str(raw_name).strip()
        if not raw_name or raw_name.upper() == "TOTAL":
            footer_rows += 1
            continue
        count_value = source_row.get("Amount")
        if count_value in (None, ""):
            count_value = source_row.get("Number")
        count = integer(count_value, "count", path)
        rank = integer(source_row.get("Position"), "rank", path)
        if count < 1 or rank < 1:
            raise ValueError(f"Non-positive count/rank in {path}: {source_row}")
        accepted.append({
            "year": year,
            "category": category,
            "key": normalise_key(raw_name),
            "name": display_name(raw_name),
            "count": count,
            "rank": rank,
            "source": path.name,
        })
    if not accepted:
        raise ValueError(f"No valid rows in {path}")
    return accepted, {"sourceRows": len(source_rows), "acceptedRows": len(accepted), "footerRows": footer_rows}


def source_files() -> list[tuple[Path, int, str]]:
    historical_root = RAW / "historical" / "Baby Names 1944-2013"
    files: list[tuple[Path, int, str]] = []
    for year in range(1944, 2014):
        for category in ("male", "female"):
            files.append((historical_root / f"{category}_cy{year}_top.csv", year, category))
    annual = {
        2014: ("24-malecy2014top.csv", "25-femalecy2014top.csv"),
        2015: ("22-malecy2015top.csv", "23-femalecy2015top.csv"),
        2016: ("18-malecy2016top.csv", "19-femalecy2016top.csv"),
        2017: ("16-cusersjacksm01desktopmalecy2017top.csv", "17-cusersjacksm01desktopfemalecy2017top.csv"),
        2018: ("14-male_cy2018_top100.csv", "15-female_cy2018_top100.csv"),
        2019: ("12-male_cy2019_top100.csv", "13-female_cy2019_top100.csv"),
        2020: ("10-male_cy2020_top100.csv", "11-female_cy2020_top100.csv"),
        2021: ("08-male_cy2021_top100.csv", "09-female_cy2021_top100.csv"),
        2022: ("06-male_cy2022_top100.csv", "07-female_cy2022_top100.csv"),
        2023: ("04-male_cy2023_top100.csv", "05-female_cy2023_top100.csv"),
        2024: ("02-top100names_male_2024.csv", "03-top100names_female_2024.csv"),
        2025: ("00-male-top-100-2025.xlsx", "01-female-top-100-2025.xlsx"),
    }
    for year, (male, female) in annual.items():
        files.extend(((RAW / male, year, "male"), (RAW / female, year, "female")))
    missing = [str(path) for path, _, _ in files if not path.exists()]
    if missing:
        raise FileNotFoundError("Missing source files. Run acquire.ps1 first:\n" + "\n".join(missing))
    return files


def compact_json(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"), sort_keys=False).encode("utf-8")


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_preview(series_by_id: dict[str, dict]) -> None:
    """Build the project-card art from the same processed curves."""
    width, height = 1200, 800
    left, right, top, bottom = 70, 55, 92, 66
    plot_width, plot_height = width - left - right, height - top - bottom
    x = lambda year: left + (year - FIRST_YEAR) / (LAST_YEAR - FIRST_YEAR) * plot_width
    y = lambda count: top + plot_height - count / 750 * plot_height

    def path_for(series_id: str) -> str:
        path = []
        previous_year = None
        for year, count, _ in series_by_id[series_id]["o"]:
            command = "M" if previous_year is None or year - previous_year > 1 else "L"
            path.append(f"{command}{x(year):.1f},{y(count):.1f}")
            previous_year = year
        return "".join(path)

    context_ids = ["male:david", "male:michael", "male:paul", "male:stephen", "male:richard"]
    grid = []
    for value in (0, 250, 500, 750):
        grid.append(f'<line x1="{left}" x2="{width-right}" y1="{y(value):.1f}" y2="{y(value):.1f}"/>')
    for year in range(1950, 2030, 10):
        if year <= LAST_YEAR:
            grid.append(f'<line x1="{x(year):.1f}" x2="{x(year):.1f}" y1="{top}" y2="{height-bottom}"/>')
    context = "".join(f'<path d="{path_for(series_id)}"/>' for series_id in context_ids if series_id in series_by_id)
    mark_path = path_for("male:mark")
    peak_x, peak_y = x(1963), y(499)
    svg_text = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}">
  <rect width="{width}" height="{height}" fill="#090b0b"/>
  <rect x="{x(2018):.1f}" y="{top}" width="{width-right-x(2018):.1f}" height="{plot_height}" fill="#111513"/>
  <g stroke="#252a27" stroke-width="1">{''.join(grid)}</g>
  <g fill="none" stroke="#a9b0aa" stroke-width="2" opacity=".2">{context}</g>
  <path d="{mark_path}" fill="none" stroke="#ff668f" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"/>
  <line x1="{peak_x:.1f}" x2="{peak_x:.1f}" y1="{peak_y:.1f}" y2="{top+15}" stroke="#ff668f" stroke-width="2" opacity=".65"/>
  <circle cx="{peak_x:.1f}" cy="{peak_y:.1f}" r="10" fill="#090b0b" stroke="#ff668f" stroke-width="5"/>
  <text x="{width/2:.1f}" y="52" text-anchor="middle" fill="#f4f1e8" font-family="Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="4">SOUTH AUSTRALIAN NAME CURVE</text>
  <text x="{peak_x+18:.1f}" y="{top+29}" fill="#ff668f" font-family="Arial, sans-serif" font-size="25" font-weight="700">MARK · 1963 · 499</text>
  <text x="{width-right}" y="{height-25}" text-anchor="end" fill="#858c86" font-family="monospace" font-size="16">1944 — 2025</text>
</svg>'''
    assets = ROOT / "src" / "assets"
    assets.mkdir(parents=True, exist_ok=True)
    (assets / "south-australian-name-curve-preview.svg").write_text(svg_text, encoding="utf-8")


def main() -> None:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    for filename, _, expected_hash in manifest["resources"]:
        path = RAW / filename
        if not path.exists() or sha256(path) != expected_hash:
            raise ValueError(f"Missing or changed pinned source: {filename}. Run acquire.ps1 and review upstream changes.")

    observations: list[dict] = []
    file_report: list[dict] = []
    for path, year, category in source_files():
        rows, report = read_source(path, year, category)
        observations.extend(rows)
        file_report.append({"file": path.name, "year": year, "category": category, **report})

    source_grouped: dict[tuple[str, str, int], list[dict]] = defaultdict(list)
    for row in observations:
        source_grouped[(row["category"], row["key"], row["year"])].append(row)

    duplicate_groups = sum(1 for rows in source_grouped.values() if len(rows) > 1)
    duplicate_rows_collapsed = sum(len(rows) - 1 for rows in source_grouped.values())
    merged: list[dict] = []
    for rows in source_grouped.values():
        exemplar = rows[0]
        merged.append({**exemplar, "count": sum(row["count"] for row in rows)})

    # Recompute competition ranks after exact-key aggregation. For unique top-100
    # rows this reproduces the supplied ranks; in the full files it resolves
    # split duplicate records without discarding registrations.
    annual_groups: dict[tuple[int, str], list[dict]] = defaultdict(list)
    for row in merged:
        annual_groups[(row["year"], row["category"])].append(row)
    for rows in annual_groups.values():
        rows.sort(key=lambda item: (-item["count"], item["key"]))
        last_count = None
        rank = 0
        for index, row in enumerate(rows, start=1):
            if row["count"] != last_count:
                rank = index
                last_count = row["count"]
            row["rank"] = rank

    non_name_records = [row for row in merged if row["key"] in PLACEHOLDER_KEYS]
    name_records = [row for row in merged if row["key"] not in PLACEHOLDER_KEYS]
    eligible = [row for row in name_records if row["count"] >= MIN_DISPLAY_COUNT]
    suppressed = len(name_records) - len(eligible)
    grouped: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for row in eligible:
        grouped[(row["category"], row["key"])].append(row)

    series: list[dict] = []
    for (category, key), rows in sorted(grouped.items()):
        rows.sort(key=lambda item: item["year"])
        peak_count = max(item["count"] for item in rows)
        peak = next(item for item in rows if item["count"] == peak_count)
        latest = next((item for item in rows if item["year"] == LAST_YEAR), None)
        series.append({
            "id": f"{category}:{key}",
            "n": rows[0]["name"],
            "c": category,
            "o": [[item["year"], item["count"], item["rank"]] for item in rows],
            "s": {
                "first": rows[0]["year"],
                "last": rows[-1]["year"],
                "peakYear": peak["year"],
                "peakCount": peak_count,
                "peakRank": peak["rank"],
                "latestCount": latest["count"] if latest else None,
                "latestRank": latest["rank"] if latest else None,
            },
        })

    series_by_id = {item["id"]: item for item in series}
    required_examples = [
        "male:mark", "female:jennifer", "female:sharon", "male:jason",
        "male:oliver", "female:charlotte", "female:matilda", "male:leo",
    ]
    curated = [item for item in required_examples if item in series_by_id]
    if "male:mark" not in series_by_id:
        raise ValueError("Expected default series male:mark is missing")
    write_preview(series_by_id)

    browser = {
        "v": 1,
        "years": [FIRST_YEAR, LAST_YEAR],
        "coverage": [[FIRST_YEAR, FULL_LIST_LAST_YEAR, "full"], [FULL_LIST_LAST_YEAR + 1, LAST_YEAR, "top100"]],
        "threshold": MIN_DISPLAY_COUNT,
        "default": "male:mark",
        "curated": curated,
        "series": series,
    }

    PUBLIC.mkdir(parents=True, exist_ok=True)
    PROCESSED.mkdir(parents=True, exist_ok=True)
    names_path = PUBLIC / "names.json"
    names_path.write_bytes(compact_json(browser))
    compressed_bytes = len(gzip.compress(names_path.read_bytes(), compresslevel=9, mtime=0))

    annual_summary = []
    for year in range(FIRST_YEAR, LAST_YEAR + 1):
        for category in ("male", "female"):
            source_subset = [row for row in merged if row["year"] == year and row["category"] == category]
            eligible_subset = [row for row in source_subset if row["count"] >= MIN_DISPLAY_COUNT]
            annual_summary.append({
                "year": year,
                "category": category,
                "publication": "full" if year <= FULL_LIST_LAST_YEAR else "top100",
                "sourceRows": len(source_subset),
                "eligibleRows": len(eligible_subset),
                "minSourceCount": min(row["count"] for row in source_subset),
                "maxSourceCount": max(row["count"] for row in source_subset),
            })

    generated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    metadata = {
        "schemaVersion": 1,
        "datasetVersion": "2026-09-08",
        "generatedAt": generated_at,
        "retrievedAt": "2026-09-08",
        "title": "South Australian Popular Baby Names — privacy-filtered browser snapshot",
        "source": {
            "datasetId": manifest["datasetId"],
            "publisher": "Attorney-General's Department, Government of South Australia",
            "datasetAuthor": "Consumer and Business Services",
            "url": "https://data.sa.gov.au/data/dataset/popular-baby-names",
            "licence": "Creative Commons Attribution 4.0",
            "licenceUrl": "https://creativecommons.org/licenses/by/4.0/",
            "catalogueModifiedAt": "2026-01-02T03:50:03.485782",
            "resources": [
                {"filename": filename, "url": url, "sha256": expected_hash}
                for filename, url, expected_hash in manifest["resources"]
            ],
        },
        "coverage": {
            "geography": "South Australia",
            "fromYear": FIRST_YEAR,
            "toYear": LAST_YEAR,
            "categories": ["male", "female"],
            "fullPublishedDistributions": [FIRST_YEAR, FULL_LIST_LAST_YEAR],
            "top100Only": [FULL_LIST_LAST_YEAR + 1, LAST_YEAR],
        },
        "privacy": {
            "minimumAnnualDisplayCount": MIN_DISPLAY_COUNT,
            "suppressedSourceRows": suppressed,
            "excludedPlaceholderRecords": len(non_name_records),
            "reason": "Avoid republication of single-person and unusually rare annual records.",
        },
        "processing": {
            "script": "scripts/data/south-australian-name-curve/process.py",
            "command": "python scripts/data/south-australian-name-curve/process.py",
            "duplicatePolicy": "Sum exact category/name/year duplicates, then recompute competition ranks; amended 2016 resources replace earlier uploads.",
            "missingPolicy": "No zero filling or interpolation. Missing full-era points mean fewer than 5 registrations or not registered; missing top-100-era points mean outside the published list.",
            "rankPolicy": "Preserve source-supplied competition ranks, including ties; do not recompute after privacy filtering.",
            "namePolicy": "Unicode NFKC normalisation and case-insensitive lookup; spelling variants remain separate.",
        },
        "validation": {
            "sourceFiles": len(file_report),
            "sourceRows": len(observations),
            "mergedAnnualRecords": len(merged),
            "eligibleObservations": len(eligible),
            "series": len(series),
            "duplicateGroupsMerged": duplicate_groups,
            "duplicateRowsCollapsed": duplicate_rows_collapsed,
            "yearsValidated": LAST_YEAR - FIRST_YEAR + 1,
        },
        "files": [
            {
                "name": "names.json",
                "recordCount": len(series),
                "observationCount": len(eligible),
                "bytes": names_path.stat().st_size,
                "gzipBytes": compressed_bytes,
                "sha256": sha256(names_path),
            }
        ],
        "limitations": [
            "The catalogue summary still says coverage ends in 2024, while official resources add 2025.",
            "Publication depth changes after 2017; missing recent names are not zero.",
            "Counts are not normalised for population or annual births.",
            "The male and female values are source registration categories and do not describe identity more broadly.",
            "Annual rows below five registrations are intentionally excluded from the browser export.",
        ],
    }
    metadata_path = PUBLIC / "metadata.json"
    metadata_path.write_bytes(json.dumps(metadata, ensure_ascii=False, indent=2).encode("utf-8") + b"\n")

    mark = series_by_id["male:mark"]
    spot_checks = {
        "male:mark": mark["s"],
        "female:jennifer": series_by_id.get("female:jennifer", {}).get("s"),
        "male:oliver": series_by_id.get("male:oliver", {}).get("s"),
        "female:charlotte": series_by_id.get("female:charlotte", {}).get("s"),
    }
    report = {
        "generatedAt": generated_at,
        "files": file_report,
        "annual": annual_summary,
        "totals": metadata["validation"],
        "suppressedRows": suppressed,
        "excludedPlaceholderRecords": len(non_name_records),
        "duplicateGroupsMerged": duplicate_groups,
        "duplicateRowsCollapsed": duplicate_rows_collapsed,
        "browserBytes": names_path.stat().st_size,
        "browserGzipBytes": compressed_bytes,
        "spotChecks": spot_checks,
    }
    (PROCESSED / "validation-report.json").write_bytes(
        json.dumps(report, ensure_ascii=False, indent=2).encode("utf-8") + b"\n"
    )
    print(json.dumps({"output": str(names_path), **metadata["validation"], "suppressedRows": suppressed,
                      "bytes": names_path.stat().st_size, "gzipBytes": compressed_bytes,
                      "spotChecks": spot_checks}, indent=2))


if __name__ == "__main__":
    main()
