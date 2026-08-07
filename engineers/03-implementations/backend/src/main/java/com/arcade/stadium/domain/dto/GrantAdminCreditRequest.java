package com.arcade.stadium.domain.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record GrantAdminCreditRequest(
    @NotNull(message = "amount is required")
    @Min(value = 1, message = "amount must be at least 1")
    Integer amount
) {}
