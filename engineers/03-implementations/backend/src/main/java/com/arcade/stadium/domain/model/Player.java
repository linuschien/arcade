package com.arcade.stadium.domain.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

@Table("player")
public record Player(
    @Id
    @Column("id")
    UUID id,

    @Column("gcp_iap_email")
    String gcpIapEmail,

    @Column("created_at")
    Instant createdAt,

    @Column("updated_at")
    Instant updatedAt,

    @Column("deleted_at")
    Instant deletedAt
) {
    public Player withId(UUID newId) {
        return new Player(newId, gcpIapEmail, createdAt, updatedAt, deletedAt);
    }

    public Player withUpdatedTimestamps(Instant newUpdatedAt) {
        return new Player(id, gcpIapEmail, createdAt, newUpdatedAt, deletedAt);
    }
}
