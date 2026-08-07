package com.arcade.stadium.adapter.in.web.graphql;

import com.arcade.stadium.application.port.in.PlayerQueryService;
import com.arcade.stadium.domain.dto.PlayerResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PlayerGraphQLResolverTest {

    private PlayerQueryService playerQueryService;
    private PlayerGraphQLResolver resolver;

    @BeforeEach
    void setUp() {
        playerQueryService = mock(PlayerQueryService.class);
        resolver = new PlayerGraphQLResolver(playerQueryService);
    }

    @Test
    void testListPlayers() {
        PlayerResponse player = new PlayerResponse(UUID.randomUUID(), "gql@test.com", Instant.now(), null);
        when(playerQueryService.listPlayers(null)).thenReturn(Flux.just(player));

        resolver.listPlayers(null)
                .as(StepVerifier::create)
                .consumeNextWith(resp -> assertEquals("gql@test.com", resp.gcpIapEmail()))
                .verifyComplete();
    }

    @Test
    void testGetPlayerById() {
        UUID id = UUID.randomUUID();
        PlayerResponse player = new PlayerResponse(id, "gql@test.com", Instant.now(), null);
        when(playerQueryService.getPlayerById(id)).thenReturn(Mono.just(player));

        resolver.getPlayerById(id)
                .as(StepVerifier::create)
                .consumeNextWith(resp -> assertEquals(id, resp.id()))
                .verifyComplete();
    }
}
