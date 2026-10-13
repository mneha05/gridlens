def duplicate_count(rows, columns):
    seen = set()
    duplicates = 0
    for row in rows:
        key = tuple(row.get(column, "") for column in columns)
        if key in seen:
            duplicates += 1
        else:
            seen.add(key)
    return duplicates
