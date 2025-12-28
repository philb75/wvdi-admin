
    DELETE FROM w_vehicles;
    INSERT INTO w_vehicles (id, branch_id, brand, model, color, plate_number,
                           start_date, price_purchased, end_date, price_sold, status)
    VALUES (1, 1, 'Toyota', 'Vios', 'Red', 'ABC 123', '2023-05-04', 10000000.00, '2023-05-04', 1000000.00, 'A'), (2, 1, 'Toyota', 'Innova', 'Silver', 'ABC 123', '2023-05-04', 10000000.00, '2023-05-04', 1000000.00, 'A');
    SELECT setval('w_vehicles_id_seq', (SELECT COALESCE(MAX(id), 1) FROM w_vehicles));
    