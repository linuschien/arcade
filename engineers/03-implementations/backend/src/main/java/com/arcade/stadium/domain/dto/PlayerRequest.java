package com.arcade.stadium.domain.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record PlayerRequest(
    @NotBlank(message = "gcpIapEmail is required")
    @Email(message = "Invalid email format")
    String gcpIapEmail
) {}
