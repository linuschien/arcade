package com.arcade.stadium.domain.dto;

import java.util.UUID;

public record UpdateWalletCommand(
    UUID playerId,
    Integer dailyFreeCredit,
    Integer adminBonusCredit
) {}
