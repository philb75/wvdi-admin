#!/usr/bin/env python3
"""
Import contacts into Supabase in batches using REST API
"""

import subprocess
import json
import os

# Read SQL file and extract INSERT statements
sql_file = '/Users/philippebarthelemy/dev/wvdi/wvdi/nextjs/scripts/migrations/contacts_import.sql'

def get_supabase_credentials():
    """Get Supabase project URL and service key"""
    # Use npx supabase to get the connection info
    return {
        'project_id': 'ynvvjlttqmnwwtbmbkfu',
        'url': 'https://ynvvjlttqmnwwtbmbkfu.supabase.co'
    }

def parse_insert_values(sql_line):
    """Parse an INSERT statement and extract values"""
    # Extract values from INSERT INTO w_contacts (...) VALUES (...);
    if not sql_line.startswith('INSERT INTO w_contacts'):
        return None

    # Find VALUES section
    values_idx = sql_line.find('VALUES (')
    if values_idx == -1:
        return None

    values_str = sql_line[values_idx + 8:-2]  # Remove "VALUES (" and ");"
    return values_str

def batch_execute_sql(batch_sql, batch_num):
    """Execute SQL batch via supabase MCP tool by writing to temp file"""
    temp_file = f'/tmp/supabase_batch_{batch_num}.sql'
    with open(temp_file, 'w') as f:
        f.write(batch_sql)
    print(f"  Batch {batch_num} written to {temp_file} ({len(batch_sql)} chars)")
    return temp_file

def main():
    print("Reading contacts SQL file...")

    with open(sql_file, 'r') as f:
        lines = f.readlines()

    # Skip header lines (first 4 lines)
    insert_lines = [l.strip() for l in lines[4:] if l.strip().startswith('INSERT')]

    print(f"Found {len(insert_lines)} INSERT statements")

    # Create batches of 100 inserts each
    batch_size = 100
    num_batches = (len(insert_lines) + batch_size - 1) // batch_size

    print(f"Will create {num_batches} batches of up to {batch_size} inserts each")

    for batch_num in range(num_batches):
        start_idx = batch_num * batch_size
        end_idx = min((batch_num + 1) * batch_size, len(insert_lines))
        batch_inserts = insert_lines[start_idx:end_idx]

        # Combine into single SQL
        batch_sql = '\n'.join(batch_inserts)

        batch_file = batch_execute_sql(batch_sql, batch_num + 1)

        if (batch_num + 1) % 10 == 0 or batch_num == 0:
            print(f"Created batch {batch_num + 1}/{num_batches} ({start_idx+1}-{end_idx} rows)")

    print(f"\nCreated {num_batches} batch files in /tmp/supabase_batch_*.sql")
    print("Run these in order using Supabase SQL editor or MCP tool")

if __name__ == "__main__":
    main()
