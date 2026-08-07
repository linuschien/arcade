package com.arcade.stadium.adapter.in.web.graphql;

import com.arcade.stadium.application.port.in.UserWalletQueryService;
import com.arcade.stadium.domain.dto.UserWalletResponse;
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

class UserWalletGraphQLResolverTest {

    private UserWalletQueryService walletQueryService;
    private UserWalletGraphQLResolver resolver;

    @BeforeEach
    void setUp() {
        walletQueryService = mock(UserWalletQueryService.class);
        resolver = new UserWalletGraphQLResolver(walletQueryService);
    }

    @Test
    void testListUserWallets() {
        UUID playerId = UUID.randomUUID();
        UserWalletResponse wallet = new UserWalletResponse(UUID.randomUUID(), playerId, 10, 0, 10, Instant.now(), 1);
        when(walletQueryService.listUserWallets(null)).thenReturn(Flux.just(wallet));

        resolver.listUserWallets(null)
                .as(StepVerifier::create)
                .consumeNextWith(resp -> assertEquals(playerId, resp.playerId()))
                .verifyComplete();
    }

    @Test
    void testGetUserWalletByPlayerId() {
        UUID playerId = UUID.randomUUID();
        UserWalletResponse wallet = new UserWalletResponse(UUID.randomUUID(), playerId, 10, 0, 10, Instant.now(), 1);
        when(walletQueryService.getUserWalletByPlayerId(playerId)).thenReturn(Mono.just(wallet));

        resolver.getUserWalletByPlayerId(playerId)
                .as(StepVerifier::create)
                .consumeNextWith(resp -> assertEquals(10, resp.dailyFreeCredit()))
                .verifyComplete();
    }
}
