DROP TABLE IF EXISTS leaderboard_entry;
DROP TABLE IF EXISTS user_wallet;
DROP TABLE IF EXISTS game_card;
DROP TABLE IF EXISTS player;

CREATE TABLE player (
    id UUID PRIMARY KEY,
    gcp_iap_email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE TABLE user_wallet (
    id UUID PRIMARY KEY,
    player_id UUID NOT NULL UNIQUE,
    daily_free_credit INT NOT NULL DEFAULT 10,
    admin_bonus_credit INT NOT NULL DEFAULT 0,
    last_daily_reset_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_wallet_player FOREIGN KEY (player_id) REFERENCES player(id) ON DELETE CASCADE
);

CREATE TABLE game_card (
    id UUID PRIMARY KEY,
    game_id VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    cover_art_url VARCHAR(512) NOT NULL,
    description TEXT NULL,
    total_play_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE TABLE leaderboard_entry (
    id UUID PRIMARY KEY,
    game_card_id UUID NOT NULL,
    player_email VARCHAR(255) NOT NULL,
    score INT NOT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_leaderboard_game_card FOREIGN KEY (game_card_id) REFERENCES game_card(id) ON DELETE CASCADE
);

CREATE INDEX idx_leaderboard_rank ON leaderboard_entry(game_card_id, score DESC, player_email ASC);
