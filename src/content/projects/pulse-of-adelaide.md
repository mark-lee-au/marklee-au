---
title: The Pulse of Adelaide
slug: pulse-of-adelaide
summary: Follow Adelaide's historical fuel price movements as luminous waves across the city.
question: How did fuel price changes spread across Adelaide?
category: lab
status: prototype
featured: true
fullscreen: true
sortOrder: 1
tags:
  - mapping
  - fuel prices
  - Adelaide
  - history
---

## What you are seeing

Red clouds mark reported price increases and green clouds mark decreases. Their size and brightness reflect the size of the change. A station can reverse its change within hours. The chart shows the unweighted mean of the latest recorded price among stations with an available price, not a measured price at every station or a spatial estimate between stations. Its gold line marks past playback time; grey shows subsequent observations.

## Data and method

This local-only prototype loads one month and fuel at a time from a private R export that retains every distinct intraday observation. The visual uses the latest recorded price between observations and leaves stations without a prior record unknown. It does not infer causation or a precise effective change time. The historical SQL conversion appended `Z` to the original timestamp without confirming its timezone; the current archive time labels are provisional. Source identity and redistribution rights are not yet verified, so the price exports must not be deployed publicly.
