-- Flyway Migration V2: Seed Initial Arcade Game Cards (Tetris & Pac-Man)

INSERT INTO game_card (id, game_id, title, cover_art_url, description, total_play_count, created_at, updated_at)
VALUES 
('98765432-10fe-dcba-9876-543210fedcba', 'tetris', 'Tetris Classic', '/assets/covers/tetris.png', 'Classic 7-Bag SRS Tetris puzzle game.', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('87654321-10fe-dcba-9876-543210fedcba', 'pacman', 'Pac-Man Classic', '/assets/covers/pacman.png', 'Classic arcade maze navigation & ghost evasion game.', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
