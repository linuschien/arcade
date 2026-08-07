package com.arcade.stadium.adapter.in.web.rest;

import com.arcade.stadium.adapter.in.web.advice.GlobalRestControllerAdvice;
import com.arcade.stadium.application.port.in.GameCardCommandService;
import com.arcade.stadium.application.port.in.GameCardQueryService;
import com.arcade.stadium.domain.dto.GameCardRequest;
import com.arcade.stadium.domain.dto.GameCardResponse;
import com.arcade.stadium.domain.dto.OperationStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GameCardRestControllerTest {

    private GameCardCommandService gameCardCommandService;
    private GameCardQueryService gameCardQueryService;
    private WebTestClient webTestClient;

    @BeforeEach
    void setUp() {
        gameCardCommandService = mock(GameCardCommandService.class);
        gameCardQueryService = mock(GameCardQueryService.class);
        GameCardRestController controller = new GameCardRestController(gameCardCommandService, gameCardQueryService);
        webTestClient = WebTestClient.bindToController(controller)
                .controllerAdvice(new GlobalRestControllerAdvice())
                .build();
    }

    @Test
    void testCreateGameCard() {
        UUID cardId = UUID.randomUUID();
        GameCardResponse response = new GameCardResponse(cardId, "tetris", "Tetris", "/covers/tetris.png", "Tetris game", 0);

        when(gameCardCommandService.createGameCard(any())).thenReturn(Mono.just(response));

        webTestClient.post()
                .uri("/api/v1/game-cards")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(new GameCardRequest("tetris", "Tetris", "/covers/tetris.png", "Tetris game"))
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.gameId").isEqualTo("tetris");
    }

    @Test
    void testGetGameCardById() {
        UUID cardId = UUID.randomUUID();
        GameCardResponse response = new GameCardResponse(cardId, "pacman", "Pac-Man", "/covers/pacman.png", "Pac-Man game", 10);

        when(gameCardQueryService.getGameCardById(cardId)).thenReturn(Mono.just(response));

        webTestClient.get()
                .uri("/api/v1/game-cards/{gameCardId}", cardId)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.title").isEqualTo("Pac-Man");
    }

    @Test
    void testUpdateGameCard() {
        UUID cardId = UUID.randomUUID();
        GameCardResponse response = new GameCardResponse(cardId, "tetris", "Tetris DX", "/covers/tetris.png", "Tetris DX game", 0);

        when(gameCardCommandService.updateGameCard(eq(cardId), any())).thenReturn(Mono.just(response));

        webTestClient.put()
                .uri("/api/v1/game-cards/{gameCardId}", cardId)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(new GameCardRequest("tetris", "Tetris DX", "/covers/tetris.png", "Tetris DX game"))
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.title").isEqualTo("Tetris DX");
    }

    @Test
    void testDeleteGameCard() {
        UUID cardId = UUID.randomUUID();

        when(gameCardCommandService.deleteGameCard(cardId)).thenReturn(Mono.empty());

        webTestClient.delete()
                .uri("/api/v1/game-cards/{gameCardId}", cardId)
                .exchange()
                .expectStatus().isNoContent();
    }

    @Test
    void testIncrementPlayCount() {
        UUID cardId = UUID.randomUUID();

        when(gameCardCommandService.incrementPlayCount(cardId)).thenReturn(Mono.just(OperationStatus.ok("Play counter incremented.")));

        webTestClient.post()
                .uri("/api/v1/game-cards/{gameCardId}:incrementPlayCount", cardId)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.success").isEqualTo(true);
    }
}
