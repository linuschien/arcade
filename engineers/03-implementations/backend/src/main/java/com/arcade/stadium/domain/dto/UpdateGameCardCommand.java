package com.arcade.stadium.domain.dto;

public record UpdateGameCardCommand(
    String gameId,
    String title,
    String coverArtUrl,
    String description
) {}
