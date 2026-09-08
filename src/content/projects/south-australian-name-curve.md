---
title: South Australian Name Curve
slug: south-australian-name-curve
category: lab
status: published
featured: true
publishedDate: 2026-09-08
updatedDate: 2026-09-08
summary: Find the year a name peaked in South Australia and trace the names that travelled beside it.
question: When did your name peak in South Australia, and what other names rose and fell around it?
tags:
  - names
  - history
  - time series
  - South Australia
sortOrder: 0
previewImage: ../../assets/south-australian-name-curve-preview.svg
previewAlt: Mark's pink registration curve rising through a field of South Australian baby-name histories to a labelled 1963 peak.
sources:
  - name: Popular Baby Names — Data.SA
    url: https://data.sa.gov.au/data/dataset/popular-baby-names
---

## Read the field

Each bright line is one name within one of the source’s registration categories. Search, add comparisons, or scrub across time for the exact published count and rank. The quieter lines are names whose peaks sit near the first selected name—they provide a sense of its historical neighbourhood rather than a universal benchmark.

The vertical scale starts with annual registrations. Switch to rank to compare relative standing as the number of births and the variety of published names change. Broken lines are deliberate: no missing record has been turned into a zero.

## Three curves worth finding

- **Mark formed a high, broad 1960s wave.** It reached 499 registrations in 1963—rank 2—and last met this project’s display threshold in 2014.
- **Jason moved faster.** It rose from 35 registrations in 1966 to 493 in 1972, then held rank 1 for three consecutive years.
- **Oliver became unusually durable at the top.** After first reaching rank 1 in 2011, it held rank 1 in every published year from 2013 through 2025; its count peaked at 195 in 2021.

## Coverage changes what a gap means

The official files contain full published distributions from 1944 to 2017. From 2018 onward the government publishes only the top 100 in each category. Before 2018, an absent point here means fewer than five registrations or no registration; from 2018 onward it means only that the name is outside the published top 100. It is not evidence of zero.

## Data and method

The snapshot covers South Australian registrations from 1944 to 2025 in the source’s **male** and **female** registration categories. Those categories are preserved as published and should not be read as broader claims about identity. Counts are registrations, not the current population, and are not national figures.

The historical source sometimes splits an exact name across multiple rows in the same category and year. Those rows are summed, competition ranks are recalculated within the published annual list, and then annual values below five are removed before browser export. Spelling variants remain separate. No smoothing, interpolation, or percentage of births is calculated.

The prepared browser snapshot contains 40,762 annual observations across 2,425 category-qualified name series. It is an explicit static snapshot, not a live API. See the [public metadata](/data/south-australian-name-curve/metadata.json) and [processing provenance](https://github.com/marklee-au/marklee-au/blob/main/data/sources/south-australian-name-curve.md) for validation details and reproduction notes.

Data: Attorney-General’s Department, Government of South Australia, [Popular Baby Names](https://data.sa.gov.au/data/dataset/popular-baby-names), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Retrieved 8 September 2026. The catalogue summary still ends at 2024, but its official resources add 2025 files published 2 January 2026.
