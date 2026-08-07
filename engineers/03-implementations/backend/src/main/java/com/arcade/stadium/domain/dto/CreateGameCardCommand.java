package com.arcade.stadium.domain.dto;

public record CreateGameCardCommand(
    String gameId,
    String title,
    String coverArtUrl,
    String description
) {}
