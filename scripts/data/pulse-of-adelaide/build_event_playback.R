suppressPackageStartupMessages({
  library(arrow)
  library(dplyr)
  library(jsonlite)
})

args <- commandArgs(trailingOnly = TRUE)
value <- function(flag, fallback = NULL) {
  at <- match(flag, args)
  if (!is.na(at) && at < length(args)) args[at + 1L] else fallback
}

model_file <- value('--model')
parquet_file <- value('--parquet')
stations_file <- value('--stations')
output <- value('--output', 'public/data/pulse-of-adelaide/events')
selected_month <- value('--month', '2024-02')
selected_fuel <- value('--fuel', 'ULP')
all_months <- '--all' %in% args

if (!is.null(model_file)) {
  model <- readRDS(model_file)
  station_rows <- model$stations %>%
    transmute(id = as.character(station_id), name, brand, suburb,
              region = 'Adelaide', status = NA_character_, latitude, longitude)
  source_rows <- model$raw %>%
    transmute(station_id = as.character(station_id), fuel_code, price_cpl,
              observed_at_utc, source)
  selected_month <- format(model$period_start_utc, '%Y-%m', tz = 'UTC')
  selected_fuel <- model$fuel_code
  months <- selected_month
} else {
  lookup <- read.csv(stations_file, check.names = FALSE, colClasses = 'character')
  station_rows <- lookup %>%
    transmute(id = trimws(`Site.Id`), name = `Site.Name`, brand = Brand,
              suburb = `Region.1`, region = trimws(`Region.2`), status = Status,
              latitude = as.numeric(Latitude), longitude = as.numeric(Longitude))
  history <- open_dataset(parquet_file)
  if (all_months) {
    bounds <- history %>% summarise(first = min(observed_at_utc), last = max(observed_at_utc)) %>% collect()
    months <- format(seq(as.Date(paste0(substr(bounds$first, 1, 7), '-01')),
                         as.Date(paste0(substr(bounds$last, 1, 7), '-01')), by = 'month'), '%Y-%m')
  } else {
    months <- selected_month
  }
}

station_rows <- station_rows %>%
  filter(tolower(region) == 'adelaide', is.finite(latitude), is.finite(longitude),
         latitude > -35.6, latitude < -34.3, longitude > 138, longitude < 139.2) %>%
  distinct(id, .keep_all = TRUE) %>% arrange(id)

station_json <- lapply(seq_len(nrow(station_rows)), function(i) {
  s <- station_rows[i, ]
  list(id = s$id, name = s$name, brand = s$brand, suburb = s$suburb,
       latitude = s$latitude, longitude = s$longitude)
})

write_data <- function(path, data) {
  dir.create(dirname(path), showWarnings = FALSE, recursive = TRUE)
  writeLines(toJSON(data, auto_unbox = TRUE, digits = NA, na = 'null', null = 'null',
                    force = TRUE), path, useBytes = TRUE)
}

index_path <- file.path(output, 'index.json')
existing <- if (file.exists(index_path)) fromJSON(index_path, simplifyVector = FALSE) else NULL
catalogue <- if (!is.null(existing) && identical(existing$schemaVersion, 3L)) existing$partitions else list()

for (month in months) {
  start <- as.POSIXct(paste0(month, '-01 00:00:00'), tz = 'UTC')
  next_month <- seq(as.Date(paste0(month, '-01')), by = 'month', length.out = 2L)[2]
  end <- as.POSIXct(next_month, tz = 'UTC')
  warmup <- start - 48 * 3600
  lower <- format(warmup, '%Y-%m-%dT%H:%M:%SZ', tz = 'UTC')
  upper <- format(end, '%Y-%m-%dT%H:%M:%SZ', tz = 'UTC')
  if (is.null(model_file)) {
    block <- history %>%
      filter(station_id %in% station_rows$id, observed_at_utc >= lower,
             observed_at_utc < upper) %>%
      select(station_id, fuel_code, price_cpl, observed_at_utc, source) %>% collect()
  } else {
    block <- source_rows %>% filter(station_id %in% station_rows$id,
                                     observed_at_utc >= lower, observed_at_utc < upper)
  }
  fuels <- if (all_months) sort(unique(block$fuel_code)) else selected_fuel
  for (fuel in fuels) {
    rows <- block %>%
      filter(fuel_code == fuel, !is.na(station_id), !is.na(observed_at_utc),
             is.finite(price_cpl), price_cpl > 0, price_cpl < 1000,
             !is.na(source), source != '') %>%
      arrange(station_id, observed_at_utc)
    if (!nrow(rows) || !any(rows$observed_at_utc >= paste0(month, '-01T'))) next
    conflicted <- rows %>% count(station_id, observed_at_utc, price_cpl) %>%
      count(station_id, observed_at_utc) %>% filter(n > 1)
    if (nrow(conflicted)) stop(paste('Conflicting prices at', month, fuel))
    rows <- rows %>% group_by(station_id, observed_at_utc) %>%
      summarise(price_cpl = first(price_cpl), source = first(source),
                source_rows = n(), .groups = 'drop') %>%
      arrange(observed_at_utc, station_id)
    seed_rows <- rows %>% filter(observed_at_utc < format(start, '%Y-%m-%dT%H:%M:%SZ', tz = 'UTC')) %>%
      group_by(station_id) %>% slice_tail(n = 1L) %>% ungroup()
    month_rows <- rows %>% filter(observed_at_utc >= format(start, '%Y-%m-%dT%H:%M:%SZ', tz = 'UTC'))
    if (!nrow(month_rows)) next
    ends <- as.POSIXct(month_rows$observed_at_utc, format = '%Y-%m-%dT%H:%M:%SZ', tz = 'UTC')
    last_hour <- as.POSIXct(ceiling(as.numeric(max(ends) + 1) / 3600) * 3600,
                            origin = '1970-01-01', tz = 'UTC')
    end_use <- min(end, last_hour)
    as_entry <- function(df) lapply(seq_len(nrow(df)), function(i) {
      list(id = df$station_id[i], priceCpl = df$price_cpl[i],
           observedAt = df$observed_at_utc[i], source = df$source[i],
           sourceRows = df$source_rows[i])
    })
    relative <- paste0(month, '/', fuel, '.json')
    part <- list(schemaVersion = 3L, kind = 'pulse-events', month = month, fuelCode = fuel,
                 start = format(start, '%Y-%m-%dT%H:%M:%SZ', tz = 'UTC'),
                 end = format(end_use, '%Y-%m-%dT%H:%M:%SZ', tz = 'UTC'),
                 seeds = as_entry(seed_rows), events = as_entry(month_rows))
    write_data(file.path(output, relative), part)
    catalogue <- Filter(function(p) !identical(p$file, relative), catalogue)
    catalogue[[length(catalogue) + 1L]] <- list(month = month, fuelCode = fuel, file = relative,
                                               events = nrow(month_rows), stations = n_distinct(month_rows$station_id))
    cat(month, fuel, nrow(month_rows), 'observations;', length(part$seeds), 'warmup states\n')
  }
}

catalogue <- catalogue[order(vapply(catalogue, function(p) paste(p$month, p$fuelCode), ''))]
write_data(index_path, list(schemaVersion = 3L, kind = 'pulse-event-index',
                            timestampNote = 'Original SQL TRANSACTIONDATE with Z appended; timezone unverified',
                            stations = station_json, partitions = catalogue))
cat('Local-only event files:', normalizePath(output), '\n')
