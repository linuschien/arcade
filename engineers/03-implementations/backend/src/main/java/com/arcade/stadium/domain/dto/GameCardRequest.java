package com.arcade.stadium.domain.dto;

import jakarta.validation.constraints.NotBlank;

public record GameCardRequest(
    @NotBlank(message = "gameId slug is required")
    String gameId,

    @NotBlank(message = "title is required")
    String title,

    @NotBlank(message = "coverArtUrl is required")
    String coverArtUrl,

    String description
) {}
