package com.arcade.stadium.domain.dto;

import java.util.UUID;

public record WalletFilterInput(
    UUID id,
    UUID playerId
) {}
