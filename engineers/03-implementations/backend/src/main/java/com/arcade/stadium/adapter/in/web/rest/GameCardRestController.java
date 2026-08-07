package com.arcade.stadium.adapter.in.web.rest;

import com.arcade.stadium.application.port.in.GameCardCommandService;
import com.arcade.stadium.application.port.in.GameCardQueryService;
import com.arcade.stadium.domain.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/game-cards")
public class GameCardRestController {

    private final GameCardCommandService gameCardCommandService;
    private final GameCardQueryService gameCardQueryService;

    public GameCardRestController(GameCardCommandService gameCardCommandService, GameCardQueryService gameCardQueryService) {
        this.gameCardCommandService = gameCardCommandService;
        this.gameCardQueryService = gameCardQueryService;
    }

    @PostMapping
    public Mono<ResponseEntity<GameCardResponse>> createGameCard(@Valid @RequestBody GameCardRequest request) {
        return gameCardCommandService.createGameCard(new CreateGameCardCommand(request.gameId(), request.title(), request.coverArtUrl(), request.description()))
                .map(response -> ResponseEntity.status(HttpStatus.CREATED).body(response));
    }

    @GetMapping("/{gameCardId}")
    public Mono<ResponseEntity<GameCardResponse>> getGameCardById(@PathVariable UUID gameCardId) {
        return gameCardQueryService.getGameCardById(gameCardId)
                .map(ResponseEntity::ok);
    }

    @PutMapping("/{gameCardId}")
    public Mono<ResponseEntity<GameCardResponse>> updateGameCard(
            @PathVariable UUID gameCardId,
            @Valid @RequestBody GameCardRequest request) {
        return gameCardCommandService.updateGameCard(gameCardId, new UpdateGameCardCommand(request.gameId(), request.title(), request.coverArtUrl(), request.description()))
                .map(ResponseEntity::ok);
    }

    @DeleteMapping("/{gameCardId}")
    public Mono<ResponseEntity<Void>> deleteGameCard(@PathVariable UUID gameCardId) {
        return gameCardCommandService.deleteGameCard(gameCardId)
                .then(Mono.just(ResponseEntity.noContent().build()));
    }

    @PostMapping("/{gameCardId}:insertCoin")
    public Mono<ResponseEntity<OperationStatus>> insertCoin(
            @PathVariable UUID gameCardId,
            @Valid @RequestBody InsertCoinRequest request) {
        return gameCardCommandService.insertCoin(gameCardId, request.playerId())
                .map(ResponseEntity::ok);
    }

    @PostMapping("/{gameCardId}:incrementPlayCount")
    public Mono<ResponseEntity<OperationStatus>> incrementPlayCount(@PathVariable UUID gameCardId) {
        return gameCardCommandService.incrementPlayCount(gameCardId)
                .map(ResponseEntity::ok);
    }
}
