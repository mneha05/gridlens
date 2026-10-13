from .duplicates import duplicate_count
from .nulls import missing_values
from .numeric import numeric_values
from .schema import required_columns


def audit(headers, rows, column, lower=None, upper=None):
    errors = required_columns(headers, [column])
    if errors:
        return {"rows": len(rows), "errors": errors}
    values, invalid = numeric_values(rows, column)
    out_of_range = sum((lower is not None and v < lower) or (upper is not None and v > upper) for v in values)
    return {"rows": len(rows), "missing": missing_values(rows, [column])[column], "invalid_rows": invalid,
            "duplicates": duplicate_count(rows, headers), "out_of_range": out_of_range,
            "minimum": min(values) if values else None, "maximum": max(values) if values else None,
            "mean": sum(values) / len(values) if values else None,
            "errors": [f"{len(invalid)} invalid numerics"] if invalid else []}
