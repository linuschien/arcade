package com.arcade.stadium.domain.dto;

import java.util.UUID;

public record GameCardResponse(
    UUID id,
    String gameId,
    String title,
    String coverArtUrl,
    String description,
    int totalPlayCount
) {}
