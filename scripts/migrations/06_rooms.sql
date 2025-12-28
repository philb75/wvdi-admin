
    DELETE FROM w_rooms;
    INSERT INTO w_rooms (id, branch_id, room_name) VALUES (1, 1, 'Room 1'), (2, 1, 'Room 2');
    SELECT setval('w_rooms_id_seq', (SELECT COALESCE(MAX(id), 1) FROM w_rooms));
    