-- Flyway Migration V6: Seed Sokoban 50 Game Card & Top 10 Leaderboard Entries

INSERT INTO game_card (id, game_id, title, cover_art_url, description, total_play_count, created_at, updated_at)
VALUES 
('43210987-10fe-dcba-9876-543210fedcba', 'sokoban', 'Sokoban 50 Selection', '/assets/covers/sokoban.png', 'Curated 50-stage warehouse box-pushing puzzle game across 4 diorama worlds. Features orthogonal corner deadlock alerts, push-granularity undo, and stage steganography scoring.', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Seed Initial Top 10 Leaderboard Entries for Sokoban 50 (Reasonable Score Range: 1,101 ~ 16,808 with two-digit stage steganography)
INSERT INTO leaderboard_entry (id, game_card_id, player_email, score, submitted_at, created_at, updated_at)
VALUES
('f6666666-6666-4666-f666-666666666601', '43210987-10fe-dcba-9876-543210fedcba', 'arcade.veteran@arcade.com', 16808, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('f6666666-6666-4666-f666-666666666602', '43210987-10fe-dcba-9876-543210fedcba', 'cyber.runner@arcade.com', 14207, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('f6666666-6666-4666-f666-666666666603', '43210987-10fe-dcba-9876-543210fedcba', 'grid.master@arcade.com', 11806, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('f6666666-6666-4666-f666-666666666604', '43210987-10fe-dcba-9876-543210fedcba', 'depot.champ@arcade.com', 9605, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('f6666666-6666-4666-f666-666666666605', '43210987-10fe-dcba-9876-543210fedcba', 'box.pusher@arcade.com', 7804, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('f6666666-6666-4666-f666-666666666606', '43210987-10fe-dcba-9876-543210fedcba', 'forklift.driver@arcade.com', 5903, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('f6666666-6666-4666-f666-666666666607', '43210987-10fe-dcba-9876-543210fedcba', 'warehouse.intern@arcade.com', 4202, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('f6666666-6666-4666-f666-666666666608', '43210987-10fe-dcba-9876-543210fedcba', 'undo.saver@arcade.com', 2802, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('f6666666-6666-4666-f666-666666666609', '43210987-10fe-dcba-9876-543210fedcba', 'puzzle.novice@arcade.com', 1701, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('f6666666-6666-4666-f666-666666666610', '43210987-10fe-dcba-9876-543210fedcba', 'rookie.pusher@arcade.com', 1101, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

