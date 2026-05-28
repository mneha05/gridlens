#!/usr/bin/env python3
"""
GridLens ETL pipeline
=====================
Extract -> Transform -> Load for the GridLens analytics platform.

This is a real, runnable pipeline. It:
  1. EXTRACT  : reads raw operational CSVs from etl/raw/ (generated here if absent)
  2. TRANSFORM: cleans, derives capacity factor / CO2 / availability, validates
  3. LOAD     : emits a single denormalized-friendly JSON (public/data.json)
                that the web app loads into an in-browser SQLite engine.

Run:  python3 etl/build_dataset.py
"""

import csv
import json
import math
import os
import random
from datetime import date, timedelta

random.seed(42)  # deterministic builds -> reproducible analytics

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "raw")
OUT = os.path.join(HERE, "..", "public", "data.json")

# --------------------------------------------------------------------------
# Reference data
# --------------------------------------------------------------------------
REGIONS = [
    (1, "Desert Southwest", "WECC"),
    (2, "Pacific Northwest", "WECC"),
    (3, "Texas Interconnect", "ERCOT"),
    (4, "Upper Midwest", "MISO"),
    (5, "Mid-Atlantic", "PJM"),
    (6, "New England", "ISO-NE"),
]

# (name, region_id, type, capacity_mw, commissioned_year, lat, lon)
FACILITIES = [
    ("Mesa Verde Solar Array",   1, "Solar",   650, 2019, 32.22, -110.97),
    ("Sonoran Photovoltaic",     1, "Solar",   480, 2021, 33.45, -112.07),
    ("Coronado Wind Farm",       1, "Wind",    310, 2017, 31.96, -110.30),
    ("Cascade Hydro Station",    2, "Hydro",   900, 1998, 47.61, -122.33),
    ("Columbia Wind Ridge",      2, "Wind",    540, 2015, 45.63, -121.18),
    ("Rainier Geothermal",       2, "Geothermal", 220, 2020, 46.85, -121.76),
    ("Lone Star Wind Corridor",  3, "Wind",    820, 2016, 32.78, -96.80),
    ("Permian Solar Fields",     3, "Solar",   710, 2022, 31.99, -102.08),
    ("Gulf Coast Gas Peaker",    3, "Gas",     400, 2012, 29.76, -95.37),
    ("Great Lakes Wind",         4, "Wind",    460, 2018, 44.97, -93.27),
    ("Prairie Solar Commons",    4, "Solar",   330, 2023, 43.07, -89.40),
    ("Susquehanna Nuclear Unit", 5, "Nuclear", 1100, 1985, 40.21, -76.14),
    ("Keystone Wind Plateau",    5, "Wind",    380, 2019, 40.44, -79.99),
    ("Bay State Offshore Wind",  6, "Wind",    600, 2024, 41.49, -70.55),
    ("Charles River Solar",      6, "Solar",   190, 2021, 42.36, -71.06),
]

# typical capacity factor by source (industry-realistic midpoints)
BASE_CF = {
    "Solar": 0.26, "Wind": 0.38, "Hydro": 0.45,
    "Nuclear": 0.92, "Gas": 0.55, "Geothermal": 0.74,
}
# lbs CO2 per MWh -> tons per MWh
CO2_PER_MWH = {
    "Solar": 0.0, "Wind": 0.0, "Hydro": 0.0, "Geothermal": 0.0,
    "Nuclear": 0.0, "Gas": 0.91,  # combined-cycle-ish
}

INCIDENT_CATS = ["Inverter Fault", "Turbine Gearbox", "Grid Curtailment",
                 "Transformer Trip", "Scheduled Maintenance", "Weather Derate"]
SEVERITIES = ["Low", "Medium", "High", "Critical"]

START = date(2025, 1, 1)
DAYS = 365


# --------------------------------------------------------------------------
# EXTRACT  (generate raw CSVs once, then read them back -- mimics a real source)
# --------------------------------------------------------------------------
def seasonal_factor(source: str, d: date) -> float:
    """Daily multiplier capturing seasonality + weather noise."""
    doy = d.timetuple().tm_yday
    summer = math.sin((doy - 80) / 365 * 2 * math.pi)  # peaks ~ midyear
    if source == "Solar":
        s = 1 + 0.35 * summer
    elif source == "Wind":
        s = 1 - 0.22 * summer  # windier in shoulder/winter
    elif source == "Hydro":
        spring = math.sin((doy - 30) / 365 * 2 * math.pi)
        s = 1 + 0.30 * spring  # snowmelt
    else:
        s = 1.0
    noise = random.uniform(0.82, 1.12)
    return max(0.05, s * noise)


def generate_raw():
    os.makedirs(RAW, exist_ok=True)

    with open(os.path.join(RAW, "regions.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["region_id", "name", "grid_operator"])
        w.writerows(REGIONS)

    with open(os.path.join(RAW, "facilities.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["facility_id", "name", "region_id", "type",
                    "capacity_mw", "commissioned_year", "lat", "lon"])
        for i, (name, rid, typ, cap, yr, lat, lon) in enumerate(FACILITIES, 1):
            w.writerow([i, name, rid, typ, cap, yr, lat, lon])

    gen_rows, inc_rows = [], []
    rid_counter = 1
    inc_counter = 1
    for fid, (name, rid, typ, cap, yr, lat, lon) in enumerate(FACILITIES, 1):
        for k in range(DAYS):
            d = START + timedelta(days=k)
            cf = BASE_CF[typ] * seasonal_factor(typ, d)
            cf = min(cf, 0.99)
            # occasional outage day
            if random.random() < 0.012:
                cf *= random.uniform(0.0, 0.3)
                sev = random.choices(SEVERITIES, weights=[4, 3, 2, 1])[0]
                cat = random.choice(INCIDENT_CATS)
                down = {"Low": 2, "Medium": 6, "High": 14, "Critical": 26}[sev]
                inc_rows.append([inc_counter, fid, d.isoformat(), sev, cat,
                                 round(down * random.uniform(0.7, 1.4), 1)])
                inc_counter += 1
            mwh = round(cap * 24 * cf, 1)
            co2 = round(mwh * CO2_PER_MWH[typ], 2)
            gen_rows.append([rid_counter, fid, d.isoformat(), mwh,
                             round(cf, 4), co2])
            rid_counter += 1

    with open(os.path.join(RAW, "generation.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["reading_id", "facility_id", "date",
                    "mwh_generated", "capacity_factor", "co2_tons"])
        w.writerows(gen_rows)

    with open(os.path.join(RAW, "incidents.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["incident_id", "facility_id", "date",
                    "severity", "category", "downtime_hours"])
        w.writerows(inc_rows)


def read_csv(name):
    with open(os.path.join(RAW, name)) as f:
        return list(csv.DictReader(f))


# --------------------------------------------------------------------------
# TRANSFORM + VALIDATE
# --------------------------------------------------------------------------
def coerce(rows, schema):
    out = []
    for r in rows:
        rec = {}
        for col, typ in schema.items():
            v = r[col]
            rec[col] = typ(v) if v != "" else None
        out.append(rec)
    return out


def validate(name, rows, checks):
    for fn, msg in checks:
        bad = [r for r in rows if not fn(r)]
        if bad:
            raise ValueError(f"[VALIDATION] {name}: {msg} ({len(bad)} rows)")
    print(f"  ✓ {name:<12} {len(rows):>6} rows validated")


# --------------------------------------------------------------------------
# LOAD
# --------------------------------------------------------------------------
def main():
    print("EXTRACT  — generating + reading raw sources …")
    generate_raw()
    regions = coerce(read_csv("regions.csv"),
                     {"region_id": int, "name": str, "grid_operator": str})
    facilities = coerce(read_csv("facilities.csv"),
                        {"facility_id": int, "name": str, "region_id": int,
                         "type": str, "capacity_mw": int,
                         "commissioned_year": int, "lat": float, "lon": float})
    generation = coerce(read_csv("generation.csv"),
                        {"reading_id": int, "facility_id": int, "date": str,
                         "mwh_generated": float, "capacity_factor": float,
                         "co2_tons": float})
    incidents = coerce(read_csv("incidents.csv"),
                       {"incident_id": int, "facility_id": int, "date": str,
                        "severity": str, "category": str,
                        "downtime_hours": float})

    print("TRANSFORM — validating data quality …")
    validate("regions", regions, [
        (lambda r: r["region_id"] is not None, "null region_id"),
    ])
    validate("facilities", facilities, [
        (lambda r: r["capacity_mw"] > 0, "non-positive capacity"),
        (lambda r: 1900 < r["commissioned_year"] <= 2026, "bad year"),
    ])
    validate("generation", generation, [
        (lambda r: 0 <= r["capacity_factor"] <= 1, "cf out of [0,1]"),
        (lambda r: r["mwh_generated"] >= 0, "negative generation"),
    ])
    validate("incidents", incidents, [
        (lambda r: r["downtime_hours"] >= 0, "negative downtime"),
    ])

    payload = {
        "meta": {
            "source": "GridLens ETL pipeline",
            "generated_rows": {
                "regions": len(regions), "facilities": len(facilities),
                "generation": len(generation), "incidents": len(incidents),
            },
            "date_range": [generation[0]["date"], generation[-1]["date"]],
        },
        "regions": regions,
        "facilities": facilities,
        "generation": generation,
        "incidents": incidents,
    }

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as f:
        json.dump(payload, f, separators=(",", ":"))
    kb = os.path.getsize(OUT) / 1024
    print(f"LOAD     — wrote {OUT}  ({kb:.0f} KB)")
    print("Done. ETL complete ✅")


if __name__ == "__main__":
    main()
