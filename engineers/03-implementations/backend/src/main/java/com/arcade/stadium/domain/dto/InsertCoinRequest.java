package com.arcade.stadium.domain.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record InsertCoinRequest(
        @NotNull(message = "playerId is required")
        UUID playerId
) {}
