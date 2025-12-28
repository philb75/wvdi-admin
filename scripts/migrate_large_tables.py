#!/usr/bin/env python3
"""
Migrate large tables (contacts and register) from MySQL to Supabase
"""

import subprocess
import os

# Configuration
MYSQL_CMD = "docker exec wvdi-mysql-1 mysql -u root -pJTgjKtkl73iKFPC3nk4h wvdi_local -N -e"

def run_mysql_query(query):
    """Execute MySQL query and return results"""
    cmd = f'{MYSQL_CMD} "{query}"'
    result = subprocess.run(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode != 0:
        print(f"MySQL Error: {result.stderr.decode('utf-8', errors='replace')}")
        return []
    # Decode with error handling for non-UTF8 characters
    output = result.stdout.decode('utf-8', errors='replace')
    lines = output.strip().split('\n') if output.strip() else []
    return lines

def escape_sql_string(s):
    """Escape string for SQL"""
    if s is None or s == 'NULL':
        return 'NULL'
    s = str(s).replace("'", "''").replace("\\", "\\\\")
    return f"'{s}'"

def export_contacts_batch(offset, limit):
    """Export a batch of contacts from MySQL"""
    query = f"""
    SELECT id, branch_id, contact_type, contact_status,
           IFNULL(company,''), IFNULL(first_name,''), IFNULL(middle_name,''), last_name,
           IFNULL(nick_name,''), IFNULL(email,''), IFNULL(gender,''), IFNULL(license_code,''),
           IFNULL(referral_type,''), IFNULL(phone1,''), IFNULL(phone2,''),
           IFNULL(address1,''), IFNULL(address2,''), IFNULL(region,''), IFNULL(city,''),
           IFNULL(zip_code,''), IFNULL(photo,''), IFNULL(updated_by,'NULL'),
           created_at, updated_at
    FROM w_contacts ORDER BY id LIMIT {limit} OFFSET {offset}
    """
    return run_mysql_query(query)

def export_register_batch(offset, limit):
    """Export a batch of register entries from MySQL"""
    query = f"""
    SELECT id, branch_id, contact_id, IFNULL(account_id,'NULL'), IFNULL(service_id,'NULL'),
           register_type, register_status, register_date, IFNULL(description,''),
           IFNULL(received_by,'NULL'), IFNULL(cash,0), IFNULL(gcash,0), IFNULL(bank,0),
           IFNULL(ar,0), IFNULL(refund,0), IFNULL(expense_category,'NULL'), IFNULL(notes,''),
           created_at, updated_at, IFNULL(updated_by,'NULL')
    FROM w_register ORDER BY id LIMIT {limit} OFFSET {offset}
    """
    return run_mysql_query(query)

def main():
    print("Starting large table migration...")

    # Count records
    contacts_count = run_mysql_query("SELECT COUNT(*) FROM w_contacts")
    register_count = run_mysql_query("SELECT COUNT(*) FROM w_register")

    print(f"Contacts to migrate: {contacts_count[0] if contacts_count else 0}")
    print(f"Register entries to migrate: {register_count[0] if register_count else 0}")

    # Export contacts in batches
    batch_size = 500
    offset = 0
    total_contacts = int(contacts_count[0]) if contacts_count else 0

    print("\nExporting contacts...")
    all_contacts = []
    while offset < total_contacts:
        batch = export_contacts_batch(offset, batch_size)
        all_contacts.extend(batch)
        offset += batch_size
        print(f"  Exported {min(offset, total_contacts)}/{total_contacts} contacts")

    # Write to SQL file for import
    with open('/Users/philippebarthelemy/dev/wvdi/wvdi/nextjs/scripts/migrations/contacts_import.sql', 'w') as f:
        f.write("-- Contacts data for Supabase import\n")
        f.write("DELETE FROM w_register;\n")  # Clear register first due to FK
        f.write("DELETE FROM w_contacts;\n\n")

        for i, line in enumerate(all_contacts):
            if not line.strip():
                continue
            fields = line.split('\t')
            if len(fields) >= 24:
                sql = f"""INSERT INTO w_contacts (id, branch_id, contact_type, contact_status, company, first_name, middle_name, last_name, nick_name, email, gender, license_code, referral_type, phone1, phone2, address1, address2, region, city, zip_code, photo, updated_by, created_at, updated_at) VALUES ({fields[0]}, {fields[1]}, {escape_sql_string(fields[2])}, {escape_sql_string(fields[3])}, {escape_sql_string(fields[4])}, {escape_sql_string(fields[5])}, {escape_sql_string(fields[6])}, {escape_sql_string(fields[7])}, {escape_sql_string(fields[8])}, {escape_sql_string(fields[9])}, {escape_sql_string(fields[10])}, {escape_sql_string(fields[11])}, {escape_sql_string(fields[12])}, {escape_sql_string(fields[13])}, {escape_sql_string(fields[14])}, {escape_sql_string(fields[15])}, {escape_sql_string(fields[16])}, {escape_sql_string(fields[17])}, {escape_sql_string(fields[18])}, {escape_sql_string(fields[19])}, {escape_sql_string(fields[20])}, {fields[21] if fields[21] != 'NULL' else 'NULL'}, {escape_sql_string(fields[22])}, {escape_sql_string(fields[23])});\n"""
                f.write(sql)

    print(f"Wrote {len(all_contacts)} contacts to contacts_import.sql")

    # Export register in batches
    total_register = int(register_count[0]) if register_count else 0
    offset = 0

    print("\nExporting register entries...")
    all_register = []
    while offset < total_register:
        batch = export_register_batch(offset, batch_size)
        all_register.extend(batch)
        offset += batch_size
        print(f"  Exported {min(offset, total_register)}/{total_register} register entries")

    # Write to SQL file
    with open('/Users/philippebarthelemy/dev/wvdi/wvdi/nextjs/scripts/migrations/register_import.sql', 'w') as f:
        f.write("-- Register data for Supabase import\n\n")

        for i, line in enumerate(all_register):
            if not line.strip():
                continue
            fields = line.split('\t')
            if len(fields) >= 20:
                sql = f"""INSERT INTO w_register (id, branch_id, contact_id, account_id, service_id, register_type, register_status, register_date, description, received_by, cash, gcash, bank, ar, refund, expense_category, notes, created_at, updated_at, updated_by) VALUES ({fields[0]}, {fields[1]}, {fields[2]}, {fields[3] if fields[3] != 'NULL' else 'NULL'}, {fields[4] if fields[4] != 'NULL' else 'NULL'}, {escape_sql_string(fields[5])}, {escape_sql_string(fields[6])}, {escape_sql_string(fields[7])}, {escape_sql_string(fields[8])}, {fields[9] if fields[9] != 'NULL' else 'NULL'}, {fields[10]}, {fields[11]}, {fields[12]}, {fields[13]}, {fields[14]}, {fields[15] if fields[15] != 'NULL' else 'NULL'}, {escape_sql_string(fields[16])}, {escape_sql_string(fields[17])}, {escape_sql_string(fields[18])}, {fields[19] if fields[19] != 'NULL' else 'NULL'});\n"""
                f.write(sql)

    print(f"Wrote {len(all_register)} register entries to register_import.sql")
    print("\nExport complete! Use Supabase SQL editor to import the files.")

if __name__ == "__main__":
    main()
