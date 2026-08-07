package com.arcade.stadium.application.port.in;

import com.arcade.stadium.domain.dto.PlayerFilterInput;
import com.arcade.stadium.domain.dto.PlayerResponse;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface PlayerQueryService {
    Mono<PlayerResponse> getPlayerById(UUID id);
    Flux<PlayerResponse> listPlayers(PlayerFilterInput filter);
}
