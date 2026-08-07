package com.arcade.stadium.domain.dto;

import java.util.UUID;

public record CreateWalletCommand(
    UUID playerId,
    Integer dailyFreeCredit,
    Integer adminBonusCredit
) {}
