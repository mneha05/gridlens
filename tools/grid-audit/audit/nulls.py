def missing_values(rows, columns):
    return {name: sum(row.get(name, "").strip() == "" for row in rows) for name in columns}
