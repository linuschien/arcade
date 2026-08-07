package com.arcade.stadium.application.port.in;

import com.arcade.stadium.domain.dto.CreateGameCardCommand;
import com.arcade.stadium.domain.dto.GameCardResponse;
import com.arcade.stadium.domain.dto.OperationStatus;
import com.arcade.stadium.domain.dto.UpdateGameCardCommand;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface GameCardCommandService {
    Mono<OperationStatus> incrementPlayCount(UUID gameCardId);
    Mono<OperationStatus> insertCoin(UUID gameCardId, UUID playerId);
    Mono<GameCardResponse> createGameCard(CreateGameCardCommand command);
    Mono<GameCardResponse> updateGameCard(UUID gameCardId, UpdateGameCardCommand command);
    Mono<Void> deleteGameCard(UUID gameCardId);
}
