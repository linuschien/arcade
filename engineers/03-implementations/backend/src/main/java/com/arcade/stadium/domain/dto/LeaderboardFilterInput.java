package com.arcade.stadium.domain.dto;

import java.util.UUID;

public record LeaderboardFilterInput(
    UUID id,
    UUID gameCardId,
    String playerEmail
) {}
