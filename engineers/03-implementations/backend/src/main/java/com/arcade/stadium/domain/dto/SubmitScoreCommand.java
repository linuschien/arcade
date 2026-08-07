package com.arcade.stadium.domain.dto;

public record SubmitScoreCommand(
    String playerEmail,
    int score
) {}
