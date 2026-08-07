package com.arcade.stadium.domain.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

@Table("game_card")
public record GameCard(
    @Id
    @Column("id")
    UUID id,

    @Column("game_id")
    String gameId,

    @Column("title")
    String title,

    @Column("cover_art_url")
    String coverArtUrl,

    @Column("description")
    String description,

    @Column("total_play_count")
    int totalPlayCount,

    @Column("created_at")
    Instant createdAt,

    @Column("updated_at")
    Instant updatedAt,

    @Column("deleted_at")
    Instant deletedAt
) {
    public GameCard withId(UUID newId) {
        return new GameCard(newId, gameId, title, coverArtUrl, description, totalPlayCount, createdAt, updatedAt, deletedAt);
    }
}
