-- Flyway Migration V5: Seed New Rally-X Game Card & Top 10 Leaderboard Entries

INSERT INTO game_card (id, game_id, title, cover_art_url, description, total_play_count, created_at, updated_at)
VALUES 
('54321098-10fe-dcba-9876-543210fedcba', 'rallyx', 'New Rally-X Classic', '/assets/covers/rallyx.png', 'Classic 1981 arcade racing maze game. Collect 10 flags, deploy smoke screens to spin out red chasers, and watch your fuel gauge!', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Seed Initial Top 10 Leaderboard Entries for New Rally-X Classic (Score Range: 2,800 ~ 32,800)
INSERT INTO leaderboard_entry (id, game_card_id, player_email, score, submitted_at, created_at, updated_at)
VALUES
('e5555555-5555-4555-e555-555555555501', '54321098-10fe-dcba-9876-543210fedcba', 'speed.demon@arcade.com', 32800, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('e5555555-5555-4555-e555-555555555502', '54321098-10fe-dcba-9876-543210fedcba', 'smoke.screen@arcade.com', 27500, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('e5555555-5555-4555-e555-555555555503', '54321098-10fe-dcba-9876-543210fedcba', 'flag.chaser@arcade.com', 23400, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('e5555555-5555-4555-e555-555555555504', '54321098-10fe-dcba-9876-543210fedcba', 'special.flag@arcade.com', 19800, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('e5555555-5555-4555-e555-555555555505', '54321098-10fe-dcba-9876-543210fedcba', 'lucky.fuel@arcade.com', 16500, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('e5555555-5555-4555-e555-555555555506', '54321098-10fe-dcba-9876-543210fedcba', 'radar.master@arcade.com', 13200, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('e5555555-5555-4555-e555-555555555507', '54321098-10fe-dcba-9876-543210fedcba', 'drift.king@arcade.com', 10600, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('e5555555-5555-4555-e555-555555555508', '54321098-10fe-dcba-9876-543210fedcba', 'red.evader@arcade.com', 7900, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('e5555555-5555-4555-e555-555555555509', '54321098-10fe-dcba-9876-543210fedcba', 'vortex.runner@arcade.com', 5400, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('e5555555-5555-4555-e555-555555555510', '54321098-10fe-dcba-9876-543210fedcba', 'rookie.driver@arcade.com', 2800, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

