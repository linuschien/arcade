package com.arcade.stadium.application.port.in;

import com.arcade.stadium.domain.dto.CreatePlayerCommand;
import com.arcade.stadium.domain.dto.PlayerResponse;
import com.arcade.stadium.domain.dto.UpdatePlayerCommand;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface PlayerCommandService {
    Mono<PlayerResponse> whoami(String email);
    Mono<PlayerResponse> createPlayer(CreatePlayerCommand command);
    Mono<PlayerResponse> updatePlayer(UUID id, UpdatePlayerCommand command);
    Mono<Void> deletePlayer(UUID id);
}
