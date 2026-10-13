import argparse
import json
from audit.io import read_rows
from audit.report import audit


def main():
    parser = argparse.ArgumentParser(description="Audit grid telemetry CSV exports")
    parser.add_argument("csv")
    parser.add_argument("--column", required=True)
    parser.add_argument("--min", type=float, default=None)
    parser.add_argument("--max", type=float, default=None)
    args = parser.parse_args()
    if args.min is not None and args.max is not None and args.min > args.max:
        parser.error("--min must not exceed --max")
    try:
        headers, rows = read_rows(args.csv)
        report = audit(headers, rows, args.column, args.min, args.max)
    except (OSError, ValueError) as exc:
        parser.exit(2, f"grid-audit: {exc}\n")
    print(json.dumps(report, indent=2))
    return 1 if report["errors"] or report.get("out_of_range", 0) else 0


if __name__ == "__main__":
    raise SystemExit(main())
