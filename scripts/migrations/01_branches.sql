
    INSERT INTO w_branches (id, name, email, phone1, phone2, address1, address2,
                           region, city, zip_code, place_id, permission, branch_color, status)
    VALUES (1, 'Bacolod', 'admin-bacolod@wvdi-ph.com', '123', '123', 'example', 'example', 'Region 6', 'Bacolod City', '6100', '1', 'bacolod_lacson.branch', '9A0606', 'A'), (2, 'BCD Limmans', 'admin-bacolod@wvdi-ph.com', '123', '123', 'example', 'example', 'Region 6', 'Bacolod City', '6100', '1', 'bacolod_limmans.branch', '00FF00', 'I'), (3, 'Kabankalan', 'admin-kabankalan@wvdi-ph.com', '123', '123', 'example', 'example', 'Region 6', 'Bacolod City', '6100', '1', 'kabankalan.branch', '14205A', 'A'), (4, 'Dumaguete', 'admin-dumaguete@wvdi-ph.com', '123', '123', 'example', 'example', 'Region 6', 'Bacolod City', '6100', '1', 'dumaguete.branch', 'BCA756', 'A'), (5, 'Himamaylan', 'admin-himamaylan@wvdi-ph.com', '123', '123', 'example', 'example', 'Region 6', 'Bacolod City', '6100', '1', 'himamaylan.branch', '017904', 'A')
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        status = EXCLUDED.status;
    SELECT setval('w_branches_id_seq', (SELECT COALESCE(MAX(id), 1) FROM w_branches));
    