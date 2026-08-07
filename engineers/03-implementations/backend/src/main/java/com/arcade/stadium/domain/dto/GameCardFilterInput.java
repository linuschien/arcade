package com.arcade.stadium.domain.dto;

import java.util.UUID;

public record GameCardFilterInput(
    UUID id,
    String gameId,
    String title
) {}
