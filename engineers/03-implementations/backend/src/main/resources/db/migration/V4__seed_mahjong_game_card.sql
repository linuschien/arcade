-- Flyway Migration V4: Seed Taiwanese 16-Tile Mahjong Game Card & Top 10 Leaderboard Entries

INSERT INTO game_card (id, game_id, title, cover_art_url, description, total_play_count, created_at, updated_at)
VALUES 
('65432109-10fe-dcba-9876-543210fedcba', 'mahjong', 'Taiwanese 16-Tile Mahjong', '/assets/covers/mahjong.png', 'Classic Taiwanese 16-tile Mahjong with 500 base / 200 fan against AI opponents.', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Seed Initial Top 10 Leaderboard Entries for Taiwanese 16-Tile Mahjong (Realistic Net Score Range: 3,200 ~ 26,800)
INSERT INTO leaderboard_entry (id, game_card_id, player_email, score, submitted_at, created_at, updated_at)
VALUES
('d4444444-4444-4444-d444-444444444401', '65432109-10fe-dcba-9876-543210fedcba', 'god.of.gamblers@arcade.com', 26800, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('d4444444-4444-4444-d444-444444444402', '65432109-10fe-dcba-9876-543210fedcba', 'knight.of.gamblers@arcade.com', 21400, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('d4444444-4444-4444-d444-444444444403', '65432109-10fe-dcba-9876-543210fedcba', 'saint.of.gamblers@arcade.com', 17600, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('d4444444-4444-4444-d444-444444444404', '65432109-10fe-dcba-9876-543210fedcba', 'queen.of.gamblers@arcade.com', 14200, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('d4444444-4444-4444-d444-444444444405', '65432109-10fe-dcba-9876-543210fedcba', 'thirteen.orphans@arcade.com', 11800, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('d4444444-4444-4444-d444-444444444406', '65432109-10fe-dcba-9876-543210fedcba', 'pure.green@arcade.com', 9600, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('d4444444-4444-4444-d444-444444444407', '65432109-10fe-dcba-9876-543210fedcba', 'all.honors@arcade.com', 7800, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('d4444444-4444-4444-d444-444444444408', '65432109-10fe-dcba-9876-543210fedcba', 'blessing.heaven@arcade.com', 6200, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('d4444444-4444-4444-d444-444444444409', '65432109-10fe-dcba-9876-543210fedcba', 'self.triplets@arcade.com', 4800, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('d4444444-4444-4444-d444-444444444410', '65432109-10fe-dcba-9876-543210fedcba', 'rob.kong@arcade.com', 3200, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
