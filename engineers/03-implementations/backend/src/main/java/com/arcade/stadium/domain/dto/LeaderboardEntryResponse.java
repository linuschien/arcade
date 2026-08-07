package com.arcade.stadium.domain.dto;

import java.time.Instant;
import java.util.UUID;

public record LeaderboardEntryResponse(
    UUID id,
    UUID gameCardId,
    String playerEmail,
    int score,
    Instant submittedAt
) {}
