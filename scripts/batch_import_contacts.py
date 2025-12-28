#!/usr/bin/env python3
"""
Batch import contacts to Supabase using psycopg2
"""

import os
import sys

# Check if psycopg2 is installed
try:
    import psycopg2
except ImportError:
    print("Installing psycopg2-binary...")
    os.system("pip3 install psycopg2-binary")
    import psycopg2

# Supabase PostgreSQL connection
# Format: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
# You need to get the password from Supabase dashboard: Settings -> Database -> Connection string

def get_connection_string():
    """Get connection string - needs password from Supabase dashboard"""
    project_ref = "ynvvjlttqmnwwtbmbkfu"
    # Transaction mode pooler for batched inserts
    return f"postgresql://postgres.{project_ref}:YOUR_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"

def read_sql_file(filepath):
    """Read SQL file and extract INSERT statements"""
    with open(filepath, 'r') as f:
        lines = f.readlines()

    # Skip header lines and get INSERT statements
    inserts = [line.strip() for line in lines if line.strip().startswith('INSERT INTO w_contacts')]
    return inserts

def execute_batch(conn, statements, batch_num, total_batches):
    """Execute a batch of INSERT statements"""
    cursor = conn.cursor()
    try:
        for stmt in statements:
            cursor.execute(stmt)
        conn.commit()
        print(f"  Batch {batch_num}/{total_batches}: {len(statements)} rows inserted")
        return True
    except Exception as e:
        conn.rollback()
        print(f"  Batch {batch_num} error: {e}")
        return False
    finally:
        cursor.close()

def main():
    sql_file = '/Users/philippebarthelemy/dev/wvdi/wvdi/nextjs/scripts/migrations/contacts_import.sql'

    print("Reading SQL file...")
    inserts = read_sql_file(sql_file)
    print(f"Found {len(inserts)} INSERT statements")

    # Skip first 20 (already imported)
    inserts = inserts[20:]
    print(f"Skipping first 20 (already imported), {len(inserts)} remaining")

    print("\nTo run this script, you need to:")
    print("1. Go to Supabase Dashboard -> Settings -> Database")
    print("2. Copy the password from 'Connection string'")
    print("3. Set it as environment variable: export SUPABASE_DB_PASSWORD='your_password'")
    print("4. Re-run this script")

    password = os.environ.get('SUPABASE_DB_PASSWORD')
    if not password:
        print("\nSUPABASE_DB_PASSWORD not set. Exiting.")
        sys.exit(1)

    # Connection string
    project_ref = "ynvvjlttqmnwwtbmbkfu"
    conn_string = f"postgresql://postgres.{project_ref}:{password}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"

    print(f"\nConnecting to Supabase...")
    try:
        conn = psycopg2.connect(conn_string)
        print("Connected successfully!")
    except Exception as e:
        print(f"Connection failed: {e}")
        sys.exit(1)

    # Execute in batches of 100
    batch_size = 100
    total_batches = (len(inserts) + batch_size - 1) // batch_size

    print(f"\nInserting {len(inserts)} contacts in {total_batches} batches of {batch_size}...")

    success_count = 0
    for i in range(0, len(inserts), batch_size):
        batch = inserts[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        if execute_batch(conn, batch, batch_num, total_batches):
            success_count += len(batch)

    conn.close()
    print(f"\nDone! {success_count} contacts imported successfully.")

if __name__ == "__main__":
    main()
