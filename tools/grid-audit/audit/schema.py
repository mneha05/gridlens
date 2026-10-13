def required_columns(headers, columns):
    return [f"missing required column: {name}" for name in columns if name not in headers]
