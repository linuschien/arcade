package com.arcade.stadium.domain.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

@Table("user_wallet")
public record UserWallet(
    @Id
    @Column("id")
    UUID id,

    @Column("player_id")
    UUID playerId,

    @Column("daily_free_credit")
    int dailyFreeCredit,

    @Column("admin_bonus_credit")
    int adminBonusCredit,

    @Column("last_daily_reset_time")
    Instant lastDailyResetTime,

    @Version
    @Column("version")
    Integer version,

    @Column("created_at")
    Instant createdAt,

    @Column("updated_at")
    Instant updatedAt,

    @Column("deleted_at")
    Instant deletedAt
) {
    public UserWallet withId(UUID newId) {
        return new UserWallet(newId, playerId, dailyFreeCredit, adminBonusCredit, lastDailyResetTime, version, createdAt, updatedAt, deletedAt);
    }

    public int totalCredits() {
        return dailyFreeCredit + adminBonusCredit;
    }
}
