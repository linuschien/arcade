package com.arcade.stadium.domain.dto;

import java.util.UUID;

public record InsertCoinRequest(
        UUID playerId
) {}
