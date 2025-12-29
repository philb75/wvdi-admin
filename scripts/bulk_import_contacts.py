#!/usr/bin/env python3
"""
Bulk import w_contacts data to Supabase
"""

import json
import re
import urllib.request
import urllib.error

SUPABASE_URL = "https://ynvvjlttqmnwwtbmbkfu.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludnZqbHR0cW1ud3d0Ym1ia2Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MzE3NjksImV4cCI6MjA4MjUwNzc2OX0.dQ8q7T8oY8SQXGWUDt2DHm3EW7_lmxBwU3cxqPfP32Q"

# Mapping for contact_type: lowercase to uppercase
CONTACT_TYPE_MAP = {
    'student': 'STUDENT',
    'employee': 'EMPLOYEE',
    'supplier': 'SUPPLIER',
    'agent': 'AGENT',
}

# Mapping for contact_status: A/I to Active/Inactive
CONTACT_STATUS_MAP = {
    'A': 'Active',
    'I': 'Inactive',
    'Active': 'Active',
    'Inactive': 'Inactive',
    '': 'Active',  # Default
}

def parse_sql_insert(sql_line):
    """Parse INSERT INTO w_contacts statement"""
    if not sql_line.strip().startswith('INSERT INTO w_contacts'):
        return None

    # Extract columns
    cols_match = re.search(r'\(([^)]+)\)\s*VALUES', sql_line)
    if not cols_match:
        return None
    columns = [c.strip() for c in cols_match.group(1).split(',')]

    # Extract values
    values_match = re.search(r'VALUES\s*\((.+)\);?\s*$', sql_line)
    if not values_match:
        return None

    values_str = values_match.group(1)
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

    # Convert contact_type to uppercase
    if result.get('contact_type'):
        ct = result['contact_type'].lower()
        result['contact_type'] = CONTACT_TYPE_MAP.get(ct, ct.upper())

    # Convert contact_status to Active/Inactive
    if result.get('contact_status') is not None:
        cs = result['contact_status']
        result['contact_status'] = CONTACT_STATUS_MAP.get(cs, 'Active')
    else:
        result['contact_status'] = 'Active'

    # Map branch_id=0 to branch_id=1 (default branch)
    if result.get('branch_id') == 0:
        result['branch_id'] = 1

    return result

def get_existing_ids():
    """Get list of already imported contact IDs using pagination"""
    all_ids = set()
    offset = 0
    limit = 1000

    while True:
        url = f"{SUPABASE_URL}/rest/v1/w_contacts?select=id&offset={offset}&limit={limit}"
        headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': f'Bearer {SUPABASE_ANON_KEY}'
        }
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=60) as response:
                data = json.loads(response.read().decode())
                if not data:
                    break
                for r in data:
                    all_ids.add(r['id'])
                if len(data) < limit:
                    break
                offset += limit
        except Exception as e:
            print(f"Error getting existing IDs at offset {offset}: {e}")
            break

    return all_ids

def insert_batch(records):
    """Insert batch of records to w_contacts"""
    url = f"{SUPABASE_URL}/rest/v1/w_contacts"
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
    sql_file = '/Users/philippebarthelemy/dev/wvdi/wvdi/nextjs/scripts/migrations/contacts_import.sql'

    print("Getting existing contact IDs...")
    existing_ids = get_existing_ids()
    print(f"Found {len(existing_ids)} existing records")

    print(f"\nReading {sql_file}...")
    with open(sql_file, 'r') as f:
        lines = f.readlines()

    print(f"Parsing {len(lines)} lines...")
    records = []
    type_counts = {}
    for line in lines:
        record = parse_sql_insert(line)
        if record and record.get('id') not in existing_ids:
            records.append(record)
            ct = record.get('contact_type', 'unknown')
            type_counts[ct] = type_counts.get(ct, 0) + 1

    print(f"Parsed {len(records)} new records to import")
    print(f"Type distribution: {type_counts}")

    if not records:
        print("No new records to import!")
        return

    batch_size = 100
    total_batches = (len(records) + batch_size - 1) // batch_size
    success_count = 0
    error_count = 0

    print(f"\nInserting in {total_batches} batches of {batch_size}...")

    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        batch_num = (i // batch_size) + 1

        success, error = insert_batch(batch)
        if success:
            success_count += len(batch)
            if batch_num % 50 == 0 or batch_num == 1:
                print(f"  Batch {batch_num}/{total_batches}: OK ({success_count} total)")
        else:
            # Try individual inserts for failed batch
            for record in batch:
                s, e = insert_batch([record])
                if s:
                    success_count += 1
                else:
                    error_count += 1
                    if error_count <= 20:
                        print(f"    Record {record.get('id')} failed: {e[:150]}")

    print(f"\nDone! {success_count} inserted, {error_count} errors")

if __name__ == "__main__":
    main()
