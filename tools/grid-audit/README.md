# Grid Audit

Zero-dependency Python CLI for validating CSV exports of grid sensor measurements. Works offline.

Run: `python3 tools/grid-audit/cli.py examples/measurements.csv --column load_mw --min 0 --max 1000` from this directory, or provide an absolute CSV path. The example is under this project's `examples/` folder.

Checks: required columns, empty cells, duplicate records, numeric parse failures, bounds and descriptive statistics. Exits nonzero when errors exist. No network access or model calls.
