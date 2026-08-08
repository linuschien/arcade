package com.arcade.stadium.adapter.in.web.rest;

import com.arcade.stadium.adapter.in.web.advice.GlobalRestControllerAdvice;
import com.arcade.stadium.application.port.in.PlayerCommandService;
import com.arcade.stadium.application.port.in.PlayerQueryService;
import com.arcade.stadium.domain.dto.PlayerRequest;
import com.arcade.stadium.domain.dto.PlayerResponse;
import com.arcade.stadium.domain.dto.UserWalletResponse;
import com.arcade.stadium.domain.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PlayerRestControllerTest {

    private PlayerCommandService playerCommandService;
    private PlayerQueryService playerQueryService;
    private WebTestClient webTestClient;

    @BeforeEach
    void setUp() {
        playerCommandService = mock(PlayerCommandService.class);
        playerQueryService = mock(PlayerQueryService.class);
        PlayerRestController controller = new PlayerRestController(playerCommandService, playerQueryService);
        webTestClient = WebTestClient.bindToController(controller)
                .webFilter(new com.arcade.stadium.infrastructure.security.AuthenticationWebFilter("guest@arcade-stadium.local", java.util.List.of("linus.chien@gmail.com")))
                .controllerAdvice(new GlobalRestControllerAdvice())
                .build();
    }

    @Test
    void testWhoamiEndpoint() {
        UUID playerId = UUID.randomUUID();
        Instant now = Instant.now();
        UserWalletResponse wallet = new UserWalletResponse(UUID.randomUUID(), playerId, 10, 0, 10, now, 1);
        PlayerResponse response = new PlayerResponse(playerId, "test@example.com", false, now, wallet);

        when(playerCommandService.whoami("test@example.com")).thenReturn(Mono.just(response));

        webTestClient.post()
                .uri("/api/v1/players:whoami")
                .header("X-Goog-Authenticated-User-Email", "test@example.com")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.gcpIapEmail").isEqualTo("test@example.com")
                .jsonPath("$.wallet.dailyFreeCredit").isEqualTo(10);
    }

    @Test
    void testGetPlayerByIdNotFound() {
        UUID playerId = UUID.randomUUID();
        when(playerQueryService.getPlayerById(playerId)).thenReturn(Mono.error(new ResourceNotFoundException("Player not found")));

        webTestClient.get()
                .uri("/api/v1/players/{playerId}", playerId)
                .exchange()
                .expectStatus().isNotFound()
                .expectBody()
                .jsonPath("$.code").isEqualTo("NOT_FOUND");
    }
}
