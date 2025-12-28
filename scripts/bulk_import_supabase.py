#!/usr/bin/env python3
"""
Bulk import data to Supabase using REST API
"""

import os
import json
import re
import requests
from datetime import datetime

# Configuration
SUPABASE_URL = "https://ynvvjlttqmnwwtbmbkfu.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludnZqbHR0cW1ud3d0Ym1ia2Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MzE3NjksImV4cCI6MjA4MjUwNzc2OX0.dQ8q7T8oY8SQXGWUDt2DHm3EW7_lmxBwU3cxqPfP32Q"

def parse_sql_insert(sql_line):
    """Parse an INSERT statement and extract values as a dict"""
    # Extract values from: INSERT INTO w_contacts (...) VALUES (...);
    if not sql_line.strip().startswith('INSERT INTO w_contacts'):
        return None

    # Get column names
    cols_match = re.search(r'\(([^)]+)\)\s*VALUES', sql_line)
    if not cols_match:
        return None
    columns = [c.strip() for c in cols_match.group(1).split(',')]

    # Get values - this is tricky due to escaped quotes
    values_match = re.search(r'VALUES\s*\((.+)\);?\s*$', sql_line)
    if not values_match:
        return None

    values_str = values_match.group(1)

    # Parse values carefully handling quoted strings
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
            # Check for escaped quote
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

    # Build dict
    result = {}
    for col, val in zip(columns, values):
        if val == 'NULL':
            result[col] = None
        elif val.startswith("'") and val.endswith("'"):
            # Remove quotes and unescape
            result[col] = val[1:-1].replace("''", "'")
        else:
            # Try to convert to number
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
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    }

    url = f"{SUPABASE_URL}/rest/v1/{table}"

    try:
        response = requests.post(url, headers=headers, json=records)
        if response.status_code in [200, 201]:
            return True, None
        else:
            return False, f"HTTP {response.status_code}: {response.text}"
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

    # Insert in batches of 100
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
            if batch_num % 10 == 0 or batch_num == 1:
                print(f"  Batch {batch_num}/{total_batches}: OK ({success_count} total)")
        else:
            error_count += len(batch)
            print(f"  Batch {batch_num} FAILED: {error}")
            # Try inserting one by one
            for record in batch:
                s, e = insert_batch([record])
                if s:
                    success_count += 1
                else:
                    error_count += 1
                    print(f"    Record {record.get('id')} failed: {e}")

    print(f"\nDone! {success_count} inserted, {error_count} errors")

if __name__ == "__main__":
    main()
