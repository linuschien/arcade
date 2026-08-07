package com.arcade.stadium.adapter.in.web.graphql;

import com.arcade.stadium.application.port.in.LeaderboardEntryQueryService;
import com.arcade.stadium.domain.dto.LeaderboardEntryResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Flux;
import reactor.test.StepVerifier;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LeaderboardEntryGraphQLResolverTest {

    private LeaderboardEntryQueryService leaderboardQueryService;
    private LeaderboardEntryGraphQLResolver resolver;

    @BeforeEach
    void setUp() {
        leaderboardQueryService = mock(LeaderboardEntryQueryService.class);
        resolver = new LeaderboardEntryGraphQLResolver(leaderboardQueryService);
    }

    @Test
    void testGetTop10Leaderboard() {
        LeaderboardEntryResponse entry = new LeaderboardEntryResponse(UUID.randomUUID(), UUID.randomUUID(), "p1@test.com", 1000, Instant.now());
        when(leaderboardQueryService.getTop10Leaderboard("tetris")).thenReturn(Flux.just(entry));

        resolver.getTop10Leaderboard("tetris")
                .as(StepVerifier::create)
                .consumeNextWith(resp -> assertEquals("p1@test.com", resp.playerEmail()))
                .verifyComplete();
    }

    @Test
    void testListLeaderboardEntries() {
        LeaderboardEntryResponse entry = new LeaderboardEntryResponse(UUID.randomUUID(), UUID.randomUUID(), "p2@test.com", 500, Instant.now());
        when(leaderboardQueryService.listLeaderboardEntries(null)).thenReturn(Flux.just(entry));

        resolver.listLeaderboardEntries(null)
                .as(StepVerifier::create)
                .consumeNextWith(resp -> assertEquals(500, resp.score()))
                .verifyComplete();
    }
}
