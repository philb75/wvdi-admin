#!/usr/bin/env python3
"""
Bulk import data to Supabase using urllib (stdlib)
"""

import json
import re
import urllib.request
import urllib.error
from datetime import datetime

# Configuration
SUPABASE_URL = "https://ynvvjlttqmnwwtbmbkfu.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludnZqbHR0cW1ud3d0Ym1ia2Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MzE3NjksImV4cCI6MjA4MjUwNzc2OX0.dQ8q7T8oY8SQXGWUDt2DHm3EW7_lmxBwU3cxqPfP32Q"

def parse_sql_insert(sql_line):
    """Parse an INSERT statement and extract values as a dict"""
    if not sql_line.strip().startswith('INSERT INTO w_contacts'):
        return None

    # Get column names
    cols_match = re.search(r'\(([^)]+)\)\s*VALUES', sql_line)
    if not cols_match:
        return None
    columns = [c.strip() for c in cols_match.group(1).split(',')]

    # Get values
    values_match = re.search(r'VALUES\s*\((.+)\);?\s*$', sql_line)
    if not values_match:
        return None

    values_str = values_match.group(1)

    # Parse values handling quoted strings
    values = []
    current = ''
    in_quotes = False
    i = 0
    while i < len(values_str):
        char = values_str[i]
        if char == "'" and not in_quotes:
            in_quotes = True
            current += char
        elif char == "'" and in_quotes:
            if i + 1 < len(values_str) and values_str[i + 1] == "'":
                current += "''"
                i += 1
            else:
                in_quotes = False
                current += char
        elif char == ',' and not in_quotes:
            values.append(current.strip())
            current = ''
        else:
            current += char
        i += 1
    values.append(current.strip())

    result = {}
    for col, val in zip(columns, values):
        if val == 'NULL':
            result[col] = None
        elif val.startswith("'") and val.endswith("'"):
            result[col] = val[1:-1].replace("''", "'")
        else:
            try:
                if '.' in val:
                    result[col] = float(val)
                else:
                    result[col] = int(val)
            except ValueError:
                result[col] = val

    return result

def insert_batch(records, table='w_contacts'):
    """Insert a batch of records using Supabase REST API"""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    data = json.dumps(records).encode('utf-8')

    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    }

    req = urllib.request.Request(url, data=data, headers=headers, method='POST')

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            return True, None
    except urllib.error.HTTPError as e:
        return False, f"HTTP {e.code}: {e.read().decode()}"
    except Exception as e:
        return False, str(e)

def main():
    sql_file = '/Users/philippebarthelemy/dev/wvdi/wvdi/nextjs/scripts/migrations/contacts_remaining.sql'

    print(f"Reading {sql_file}...")
    with open(sql_file, 'r') as f:
        lines = f.readlines()

    print(f"Parsing {len(lines)} lines...")
    records = []
    for line in lines:
        record = parse_sql_insert(line)
        if record:
            records.append(record)

    print(f"Parsed {len(records)} records")

    # Insert in batches
    batch_size = 100
    total_batches = (len(records) + batch_size - 1) // batch_size
    success_count = 0
    error_count = 0

    print(f"Inserting in {total_batches} batches of {batch_size}...")

    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        batch_num = (i // batch_size) + 1

        success, error = insert_batch(batch)
        if success:
            success_count += len(batch)
            if batch_num % 20 == 0 or batch_num == 1:
                print(f"  Batch {batch_num}/{total_batches}: OK ({success_count} total)")
        else:
            error_count += len(batch)
            print(f"  Batch {batch_num} FAILED: {error}")

    print(f"\nDone! {success_count} inserted, {error_count} errors")

if __name__ == "__main__":
    main()
