package com.arcade.stadium.adapter.in.web.rest;

import com.arcade.stadium.adapter.in.web.advice.GlobalRestControllerAdvice;
import com.arcade.stadium.application.port.in.LeaderboardEntryCommandService;
import com.arcade.stadium.application.port.in.LeaderboardEntryQueryService;
import com.arcade.stadium.domain.dto.LeaderboardEntryRequest;
import com.arcade.stadium.domain.dto.LeaderboardEntryResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LeaderboardEntryRestControllerTest {

    private LeaderboardEntryCommandService leaderboardCommandService;
    private LeaderboardEntryQueryService leaderboardQueryService;
    private WebTestClient webTestClient;

    @BeforeEach
    void setUp() {
        leaderboardCommandService = mock(LeaderboardEntryCommandService.class);
        leaderboardQueryService = mock(LeaderboardEntryQueryService.class);
        LeaderboardEntryRestController controller = new LeaderboardEntryRestController(leaderboardCommandService, leaderboardQueryService);
        webTestClient = WebTestClient.bindToController(controller)
                .controllerAdvice(new GlobalRestControllerAdvice())
                .build();
    }

    @Test
    void testSubmitHighScore() {
        UUID gameCardId = UUID.randomUUID();
        UUID entryId = UUID.randomUUID();
        Instant now = Instant.now();
        LeaderboardEntryResponse response = new LeaderboardEntryResponse(entryId, gameCardId, "player@test.com", 99500, now);

        when(leaderboardCommandService.submitHighScore(eq(gameCardId), any())).thenReturn(Mono.just(response));

        webTestClient.post()
                .uri("/api/v1/game-cards/{gameCardId}/leaderboard-entries", gameCardId)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(new LeaderboardEntryRequest("player@test.com", 99500))
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.score").isEqualTo(99500);
    }

    @Test
    void testGetLeaderboardEntryById() {
        UUID gameCardId = UUID.randomUUID();
        UUID entryId = UUID.randomUUID();
        Instant now = Instant.now();
        LeaderboardEntryResponse response = new LeaderboardEntryResponse(entryId, gameCardId, "player@test.com", 99500, now);

        when(leaderboardQueryService.getLeaderboardEntryById(entryId)).thenReturn(Mono.just(response));

        webTestClient.get()
                .uri("/api/v1/game-cards/{gameCardId}/leaderboard-entries/{entryId}", gameCardId, entryId)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.id").isEqualTo(entryId.toString());
    }

    @Test
    void testDeleteLeaderboardEntry() {
        UUID gameCardId = UUID.randomUUID();
        UUID entryId = UUID.randomUUID();

        when(leaderboardCommandService.deleteLeaderboardEntry(entryId)).thenReturn(Mono.empty());

        webTestClient.delete()
                .uri("/api/v1/game-cards/{gameCardId}/leaderboard-entries/{entryId}", gameCardId, entryId)
                .exchange()
                .expectStatus().isNoContent();
    }
}
