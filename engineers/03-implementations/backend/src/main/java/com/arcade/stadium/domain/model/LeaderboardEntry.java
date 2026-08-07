package com.arcade.stadium.domain.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

@Table("leaderboard_entry")
public record LeaderboardEntry(
    @Id
    @Column("id")
    UUID id,

    @Column("game_card_id")
    UUID gameCardId,

    @Column("player_email")
    String playerEmail,

    @Column("score")
    int score,

    @Column("submitted_at")
    Instant submittedAt,

    @Column("created_at")
    Instant createdAt,

    @Column("updated_at")
    Instant updatedAt,

    @Column("deleted_at")
    Instant deletedAt
) {
    public LeaderboardEntry withId(UUID newId) {
        return new LeaderboardEntry(newId, gameCardId, playerEmail, score, submittedAt, createdAt, updatedAt, deletedAt);
    }
}
