package com.arcade.stadium.domain.dto;

import java.util.UUID;

public record PlayerFilterInput(
    UUID id,
    String gcpIapEmail
) {}
