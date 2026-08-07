package com.arcade.stadium.domain.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record LeaderboardEntryRequest(
    @NotBlank(message = "playerEmail is required")
    @Email(message = "Invalid email format")
    String playerEmail,

    @Min(value = 0, message = "score cannot be negative")
    int score
) {}
