
    DELETE FROM w_accounts WHERE id NOT IN (SELECT DISTINCT account_id FROM w_register WHERE account_id IS NOT NULL);
    INSERT INTO w_accounts (id, account_name, account_type, status, account_category, list_order)
    VALUES (1, 'BPI Bacolod', 'Global', 'A', Bank, 20), (2, 'AR', 'Other', 'A', Finance, 30), (3, 'Cash', 'Branch', 'A', Cash, 1), (7, 'GCASH', 'Global', 'A', Cash, 11), (8, 'Owners', 'Other', 'I', Finance, 31), (9, 'Loan', 'Other', 'A', Finance, 32), (10, 'Closed', 'Other', 'I', Finance, 10), (18, 'BPI Dumaguete', 'Global', 'A', Bank, 21), (19, 'GCash-Joy', 'Global', 'I', Cash, 10)
    ON CONFLICT (id) DO UPDATE SET account_name = EXCLUDED.account_name;
    SELECT setval('w_accounts_id_seq', (SELECT COALESCE(MAX(id), 1) FROM w_accounts));
    