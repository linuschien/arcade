package com.arcade.stadium.application.port.in;

import com.arcade.stadium.domain.dto.GameCardFilterInput;
import com.arcade.stadium.domain.dto.GameCardResponse;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface GameCardQueryService {
    Mono<GameCardResponse> getGameCardById(UUID gameCardId);
    Mono<GameCardResponse> getGameCardBySlug(String gameId);
    Flux<GameCardResponse> listGameCards(GameCardFilterInput filter);
}
