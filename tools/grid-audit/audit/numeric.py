import math


def numeric_values(rows, column):
    values, invalid = [], []
    for number, row in enumerate(rows, 2):
        raw = row.get(column, "").strip()
        if not raw:
            continue
        try:
            value = float(raw)
            if not math.isfinite(value):
                raise ValueError("non-finite")
            values.append(value)
        except ValueError:
            invalid.append(number)
    return values, invalid
