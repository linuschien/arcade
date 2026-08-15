-- Flyway Migration V3: Seed Pipe Mania Classic Game Card & Top 10 Leaderboard Entries

INSERT INTO game_card (id, game_id, title, cover_art_url, description, total_play_count, created_at, updated_at)
VALUES 
('76543210-10fe-dcba-9876-543210fedcba', 'pipemania', 'Pipe Mania Classic', '/assets/covers/pipemania.png', 'Classic path-building puzzle game. Connect pipes before the Flooz flows!', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Seed Initial Top 10 Leaderboard Entries for Pipe Mania Classic (Score Range: 1,500 ~ 18,500)
INSERT INTO leaderboard_entry (id, game_card_id, player_email, score, submitted_at, created_at, updated_at)
VALUES
('c3333333-3333-4333-c333-333333333301', '76543210-10fe-dcba-9876-543210fedcba', 'plumber.pro@arcade.com', 18500, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('c3333333-3333-4333-c333-333333333302', '76543210-10fe-dcba-9876-543210fedcba', 'pipe.master@arcade.com', 15200, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('c3333333-3333-4333-c333-333333333303', '76543210-10fe-dcba-9876-543210fedcba', 'flooz.surfer@arcade.com', 13800, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('c3333333-3333-4333-c333-333333333304', '76543210-10fe-dcba-9876-543210fedcba', 'valve.wizard@arcade.com', 11400, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('c3333333-3333-4333-c333-333333333305', '76543210-10fe-dcba-9876-543210fedcba', 'cross.pipe99@arcade.com', 9600, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('c3333333-3333-4333-c333-333333333306', '76543210-10fe-dcba-9876-543210fedcba', 'aqua.flow@arcade.com', 7800, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('c3333333-3333-4333-c333-333333333307', '76543210-10fe-dcba-9876-543210fedcba', 'fast.forward@arcade.com', 5900, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('c3333333-3333-4333-c333-333333333308', '76543210-10fe-dcba-9876-543210fedcba', 'wrench.hero@arcade.com', 4200, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('c3333333-3333-4333-c333-333333333309', '76543210-10fe-dcba-9876-543210fedcba', 'copper.drain@arcade.com', 2800, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('c3333333-3333-4333-c333-333333333310', '76543210-10fe-dcba-9876-543210fedcba', 'leak.stopper@arcade.com', 1500, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
