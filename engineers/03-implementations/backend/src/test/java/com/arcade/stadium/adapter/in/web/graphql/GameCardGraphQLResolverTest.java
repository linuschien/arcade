package com.arcade.stadium.adapter.in.web.graphql;

import com.arcade.stadium.application.port.in.GameCardQueryService;
import com.arcade.stadium.domain.dto.GameCardResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GameCardGraphQLResolverTest {

    private GameCardQueryService gameCardQueryService;
    private GameCardGraphQLResolver resolver;

    @BeforeEach
    void setUp() {
        gameCardQueryService = mock(GameCardQueryService.class);
        resolver = new GameCardGraphQLResolver(gameCardQueryService);
    }

    @Test
    void testListGameCards() {
        GameCardResponse card = new GameCardResponse(UUID.randomUUID(), "tetris", "Tetris", "/covers/tetris.png", "Tetris game", 0);
        when(gameCardQueryService.listGameCards(null)).thenReturn(Flux.just(card));

        resolver.listGameCards(null)
                .as(StepVerifier::create)
                .consumeNextWith(resp -> assertEquals("tetris", resp.gameId()))
                .verifyComplete();
    }

    @Test
    void testGetGameCardBySlug() {
        GameCardResponse card = new GameCardResponse(UUID.randomUUID(), "pacman", "Pac-Man", "/covers/pacman.png", "Pac-Man game", 0);
        when(gameCardQueryService.getGameCardBySlug("pacman")).thenReturn(Mono.just(card));

        resolver.getGameCardBySlug("pacman")
                .as(StepVerifier::create)
                .consumeNextWith(resp -> assertEquals("Pac-Man", resp.title()))
                .verifyComplete();
    }
}
