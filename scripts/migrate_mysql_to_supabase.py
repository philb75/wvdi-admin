#!/usr/bin/env python3
"""
Migrate data from MySQL (Laravel) to Supabase (Next.js)
Run from nextjs directory: python scripts/migrate_mysql_to_supabase.py
"""

import subprocess
import json
import os
from datetime import datetime

# Configuration
MYSQL_CONTAINER = "wvdi-mysql-1"
MYSQL_USER = "root"
MYSQL_PASSWORD = "JTgjKtkl73iKFPC3nk4h"
MYSQL_DATABASE = "wvdi_local"

SUPABASE_URL = "https://ynvvjlttqmnwwtbmbkfu.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

def run_mysql_query(query):
    """Execute MySQL query and return results as list of dicts"""
    cmd = f'docker exec {MYSQL_CONTAINER} mysql -u{MYSQL_USER} -p{MYSQL_PASSWORD} {MYSQL_DATABASE} -N -e "{query}"'
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"MySQL Error: {result.stderr}")
        return []

    lines = result.stdout.strip().split('\n')
    return [line.split('\t') for line in lines if line]

def escape_sql(value):
    """Escape SQL string value"""
    if value is None or value == 'NULL' or value == '\\N':
        return 'NULL'
    # Escape single quotes
    value = str(value).replace("'", "''")
    return f"'{value}'"

def migrate_branches():
    """Migrate w_branches table"""
    print("Migrating w_branches...")
    rows = run_mysql_query("""
        SELECT id, name, email, phone1, phone2, address1, address2,
               region, city, zip_code, place_id, permission, branch_color, status
        FROM w_branches
    """)

    if not rows:
        print("No branches to migrate")
        return

    values = []
    for row in rows:
        vals = [
            row[0],  # id
            escape_sql(row[1]),  # name
            escape_sql(row[2]) if len(row) > 2 else 'NULL',  # email
            escape_sql(row[3]) if len(row) > 3 else 'NULL',  # phone1
            escape_sql(row[4]) if len(row) > 4 else 'NULL',  # phone2
            escape_sql(row[5]) if len(row) > 5 else 'NULL',  # address1
            escape_sql(row[6]) if len(row) > 6 else 'NULL',  # address2
            escape_sql(row[7]) if len(row) > 7 else 'NULL',  # region
            escape_sql(row[8]) if len(row) > 8 else 'NULL',  # city
            escape_sql(row[9]) if len(row) > 9 else 'NULL',  # zip_code
            escape_sql(row[10]) if len(row) > 10 else 'NULL',  # place_id
            escape_sql(row[11]) if len(row) > 11 else 'NULL',  # permission
            escape_sql(row[12]) if len(row) > 12 else 'NULL',  # branch_color
            escape_sql(row[13]) if len(row) > 13 else "'A'"  # status
        ]
        values.append(f"({', '.join(vals)})")

    sql = f"""
    INSERT INTO w_branches (id, name, email, phone1, phone2, address1, address2,
                           region, city, zip_code, place_id, permission, branch_color, status)
    VALUES {', '.join(values)}
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        status = EXCLUDED.status;
    SELECT setval('w_branches_id_seq', (SELECT COALESCE(MAX(id), 1) FROM w_branches));
    """

    print(f"SQL for branches ({len(rows)} rows):")
    print(sql[:500] + "..." if len(sql) > 500 else sql)
    return sql

def migrate_account_categories():
    """Migrate w_account_categories table"""
    print("\nMigrating w_account_categories...")
    rows = run_mysql_query("""
        SELECT id, name, type, revenue_type, parent_id, list_order
        FROM w_account_categories
    """)

    if not rows:
        print("No account categories to migrate")
        return

    values = []
    for row in rows:
        vals = [
            row[0],  # id
            escape_sql(row[1]),  # name
            escape_sql(row[2]) if len(row) > 2 else 'NULL',  # type
            escape_sql(row[3]) if len(row) > 3 else 'NULL',  # revenue_type
            row[4] if len(row) > 4 and row[4] != '\\N' and row[4] else 'NULL',  # parent_id
            row[5] if len(row) > 5 and row[5] != '\\N' else '0'  # list_order
        ]
        values.append(f"({', '.join(vals)})")

    sql = f"""
    DELETE FROM w_account_categories;
    INSERT INTO w_account_categories (id, name, type, revenue_type, parent_id, list_order)
    VALUES {', '.join(values)};
    SELECT setval('w_account_categories_id_seq', (SELECT COALESCE(MAX(id), 1) FROM w_account_categories));
    """

    print(f"Generated SQL for {len(rows)} account categories")
    return sql

def migrate_accounts():
    """Migrate w_accounts table"""
    print("\nMigrating w_accounts...")
    rows = run_mysql_query("""
        SELECT id, account_name, account_type, status, account_category, list_order
        FROM w_accounts
    """)

    if not rows:
        print("No accounts to migrate")
        return

    values = []
    for row in rows:
        vals = [
            row[0],  # id
            escape_sql(row[1]),  # account_name
            escape_sql(row[2]),  # account_type
            escape_sql(row[3]) if len(row) > 3 else "'A'",  # status
            row[4] if len(row) > 4 and row[4] != '\\N' and row[4] else 'NULL',  # account_category
            row[5] if len(row) > 5 and row[5] != '\\N' else '0'  # list_order
        ]
        values.append(f"({', '.join(vals)})")

    sql = f"""
    DELETE FROM w_accounts WHERE id NOT IN (SELECT DISTINCT account_id FROM w_register WHERE account_id IS NOT NULL);
    INSERT INTO w_accounts (id, account_name, account_type, status, account_category, list_order)
    VALUES {', '.join(values)}
    ON CONFLICT (id) DO UPDATE SET account_name = EXCLUDED.account_name;
    SELECT setval('w_accounts_id_seq', (SELECT COALESCE(MAX(id), 1) FROM w_accounts));
    """

    print(f"Generated SQL for {len(rows)} accounts")
    return sql

def migrate_services():
    """Migrate w_services table"""
    print("\nMigrating w_services...")
    rows = run_mysql_query("""
        SELECT id, branch_id, name, service_code, description, price, category, status
        FROM w_services
    """)

    if not rows:
        print("No services to migrate")
        return

    values = []
    for row in rows:
        vals = [
            row[0],  # id
            row[1] if row[1] != '\\N' else 'NULL',  # branch_id
            escape_sql(row[2]),  # name
            escape_sql(row[3]) if len(row) > 3 else 'NULL',  # service_code
            escape_sql(row[4]) if len(row) > 4 else 'NULL',  # description
            row[5] if len(row) > 5 and row[5] != '\\N' else '0',  # price
            escape_sql(row[6]) if len(row) > 6 else 'NULL',  # category
            escape_sql(row[7]) if len(row) > 7 else "'active'"  # status
        ]
        values.append(f"({', '.join(vals)})")

    sql = f"""
    DELETE FROM w_services;
    INSERT INTO w_services (id, branch_id, name, service_code, description, price, category, status)
    VALUES {', '.join(values)};
    SELECT setval('w_services_id_seq', (SELECT COALESCE(MAX(id), 1) FROM w_services));
    """

    print(f"Generated SQL for {len(rows)} services")
    return sql

def migrate_user_branches():
    """Migrate w_user_branches table"""
    print("\nMigrating w_user_branches...")
    rows = run_mysql_query("""
        SELECT user_id, branch_id FROM w_user_branches
    """)

    if not rows:
        print("No user branches to migrate")
        return

    values = []
    for row in rows:
        values.append(f"({row[0]}, {row[1]})")

    sql = f"""
    DELETE FROM w_user_branches;
    INSERT INTO w_user_branches (user_id, branch_id) VALUES {', '.join(values)}
    ON CONFLICT (user_id, branch_id) DO NOTHING;
    """

    print(f"Generated SQL for {len(rows)} user-branch mappings")
    return sql

def migrate_rooms():
    """Migrate w_rooms table"""
    print("\nMigrating w_rooms...")
    rows = run_mysql_query("""
        SELECT id, branch_id, room_name FROM w_rooms
    """)

    if not rows:
        print("No rooms to migrate")
        return

    values = []
    for row in rows:
        values.append(f"({row[0]}, {row[1]}, {escape_sql(row[2])})")

    sql = f"""
    DELETE FROM w_rooms;
    INSERT INTO w_rooms (id, branch_id, room_name) VALUES {', '.join(values)};
    SELECT setval('w_rooms_id_seq', (SELECT COALESCE(MAX(id), 1) FROM w_rooms));
    """

    print(f"Generated SQL for {len(rows)} rooms")
    return sql

def migrate_vehicles():
    """Migrate w_vehicles table"""
    print("\nMigrating w_vehicles...")
    rows = run_mysql_query("""
        SELECT id, branch_id, brand, model, color, plate_number,
               start_date, price_purchased, end_date, price_sold, status
        FROM w_vehicles
    """)

    if not rows:
        print("No vehicles to migrate")
        return

    values = []
    for row in rows:
        vals = [
            row[0],  # id
            row[1],  # branch_id
            escape_sql(row[2]),  # brand
            escape_sql(row[3]),  # model
            escape_sql(row[4]),  # color
            escape_sql(row[5]),  # plate_number
            escape_sql(row[6]),  # start_date
            row[7] if row[7] != '\\N' else 'NULL',  # price_purchased
            escape_sql(row[8]) if row[8] != '\\N' else 'NULL',  # end_date
            row[9] if len(row) > 9 and row[9] != '\\N' else 'NULL',  # price_sold
            escape_sql(row[10]) if len(row) > 10 else "'A'"  # status
        ]
        values.append(f"({', '.join(vals)})")

    sql = f"""
    DELETE FROM w_vehicles;
    INSERT INTO w_vehicles (id, branch_id, brand, model, color, plate_number,
                           start_date, price_purchased, end_date, price_sold, status)
    VALUES {', '.join(values)};
    SELECT setval('w_vehicles_id_seq', (SELECT COALESCE(MAX(id), 1) FROM w_vehicles));
    """

    print(f"Generated SQL for {len(rows)} vehicles")
    return sql

def get_row_count(table):
    """Get count of rows in MySQL table"""
    result = run_mysql_query(f"SELECT COUNT(*) FROM {table}")
    return int(result[0][0]) if result else 0

def main():
    print("=" * 60)
    print("MySQL to Supabase Data Migration")
    print("=" * 60)

    # Show counts
    tables = ['w_branches', 'w_account_categories', 'w_accounts', 'w_services',
              'w_contacts', 'w_register', 'w_user_branches', 'w_rooms', 'w_vehicles']

    print("\nMySQL row counts:")
    for table in tables:
        count = get_row_count(table)
        print(f"  {table}: {count:,} rows")

    # Generate SQL files
    print("\n" + "=" * 60)
    print("Generating migration SQL...")

    migrations = {
        '01_branches.sql': migrate_branches(),
        '02_account_categories.sql': migrate_account_categories(),
        '03_accounts.sql': migrate_accounts(),
        '04_services.sql': migrate_services(),
        '05_user_branches.sql': migrate_user_branches(),
        '06_rooms.sql': migrate_rooms(),
        '07_vehicles.sql': migrate_vehicles(),
    }

    # Save to files
    output_dir = '/Users/philippebarthelemy/dev/wvdi/wvdi/nextjs/scripts/migrations'
    os.makedirs(output_dir, exist_ok=True)

    for filename, sql in migrations.items():
        if sql:
            filepath = os.path.join(output_dir, filename)
            with open(filepath, 'w') as f:
                f.write(sql)
            print(f"Saved: {filepath}")

    print("\n" + "=" * 60)
    print("Migration SQL files generated!")
    print("Run each file against Supabase to complete migration.")
    print("=" * 60)

if __name__ == "__main__":
    main()
