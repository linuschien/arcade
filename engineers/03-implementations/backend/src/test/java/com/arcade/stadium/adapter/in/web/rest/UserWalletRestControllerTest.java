package com.arcade.stadium.adapter.in.web.rest;

import com.arcade.stadium.adapter.in.web.advice.GlobalRestControllerAdvice;
import com.arcade.stadium.application.port.in.UserWalletCommandService;
import com.arcade.stadium.application.port.in.UserWalletQueryService;
import com.arcade.stadium.domain.dto.GrantAdminCreditRequest;
import com.arcade.stadium.domain.dto.OperationStatus;
import com.arcade.stadium.domain.dto.UserWalletRequest;
import com.arcade.stadium.domain.dto.UserWalletResponse;
import com.arcade.stadium.domain.exception.InsufficientCreditsException;
import com.arcade.stadium.domain.exception.OptimisticLockConflictException;
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

class UserWalletRestControllerTest {

    private UserWalletCommandService walletCommandService;
    private UserWalletQueryService walletQueryService;
    private WebTestClient webTestClient;

    @BeforeEach
    void setUp() {
        walletCommandService = mock(UserWalletCommandService.class);
        walletQueryService = mock(UserWalletQueryService.class);
        UserWalletRestController controller = new UserWalletRestController(walletCommandService, walletQueryService);
        webTestClient = WebTestClient.bindToController(controller)
                .controllerAdvice(new GlobalRestControllerAdvice())
                .build();
    }

    @Test
    void testCreateUserWallet() {
        UUID playerId = UUID.randomUUID();
        UUID walletId = UUID.randomUUID();
        Instant now = Instant.now();
        UserWalletResponse response = new UserWalletResponse(walletId, playerId, 10, 0, 10, now, 1);

        when(walletCommandService.createUserWallet(any())).thenReturn(Mono.just(response));

        webTestClient.post()
                .uri("/api/v1/players/{playerId}/user-wallets", playerId)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(new UserWalletRequest(playerId, 10, 0))
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.id").isEqualTo(walletId.toString());
    }

    @Test
    void testGetUserWalletById() {
        UUID playerId = UUID.randomUUID();
        UUID walletId = UUID.randomUUID();
        Instant now = Instant.now();
        UserWalletResponse response = new UserWalletResponse(walletId, playerId, 10, 0, 10, now, 1);

        when(walletQueryService.getUserWalletById(walletId)).thenReturn(Mono.just(response));

        webTestClient.get()
                .uri("/api/v1/players/{playerId}/user-wallets/{walletId}", playerId, walletId)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.id").isEqualTo(walletId.toString());
    }

    @Test
    void testUpdateUserWallet() {
        UUID playerId = UUID.randomUUID();
        UUID walletId = UUID.randomUUID();
        Instant now = Instant.now();
        UserWalletResponse response = new UserWalletResponse(walletId, playerId, 10, 5, 15, now, 2);

        when(walletCommandService.updateUserWallet(eq(walletId), any())).thenReturn(Mono.just(response));

        webTestClient.put()
                .uri("/api/v1/players/{playerId}/user-wallets/{walletId}", playerId, walletId)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(new UserWalletRequest(playerId, 10, 5))
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.adminBonusCredit").isEqualTo(5);
    }

    @Test
    void testDeleteUserWallet() {
        UUID playerId = UUID.randomUUID();
        UUID walletId = UUID.randomUUID();

        when(walletCommandService.deleteUserWallet(walletId)).thenReturn(Mono.empty());

        webTestClient.delete()
                .uri("/api/v1/players/{playerId}/user-wallets/{walletId}", playerId, walletId)
                .exchange()
                .expectStatus().isNoContent();
    }

    @Test
    void testDeductCreditSuccess() {
        UUID playerId = UUID.randomUUID();
        UUID walletId = UUID.randomUUID();

        when(walletCommandService.deductCredit(playerId, walletId)).thenReturn(Mono.just(OperationStatus.ok("Credit deducted successfully.")));

        webTestClient.post()
                .uri("/api/v1/players/{playerId}/user-wallets/{walletId}:deductCredit", playerId, walletId)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.success").isEqualTo(true);
    }

    @Test
    void testDeductCreditInsufficientCredits() {
        UUID playerId = UUID.randomUUID();
        UUID walletId = UUID.randomUUID();

        when(walletCommandService.deductCredit(playerId, walletId)).thenReturn(Mono.error(new InsufficientCreditsException("OUT OF CREDITS")));

        webTestClient.post()
                .uri("/api/v1/players/{playerId}/user-wallets/{walletId}:deductCredit", playerId, walletId)
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody()
                .jsonPath("$.code").isEqualTo("BAD_REQUEST");
    }

    @Test
    void testDeductCreditOptimisticLockConflict() {
        UUID playerId = UUID.randomUUID();
        UUID walletId = UUID.randomUUID();

        when(walletCommandService.deductCredit(playerId, walletId)).thenReturn(Mono.error(new OptimisticLockConflictException("Conflict", 2)));

        webTestClient.post()
                .uri("/api/v1/players/{playerId}/user-wallets/{walletId}:deductCredit", playerId, walletId)
                .exchange()
                .expectStatus().isEqualTo(409)
                .expectBody()
                .jsonPath("$.code").isEqualTo("OPTIMISTIC_LOCK_CONFLICT");
    }

    @Test
    void testGrantAdminCredit() {
        UUID playerId = UUID.randomUUID();
        UUID walletId = UUID.randomUUID();

        when(walletCommandService.grantAdminCredit(playerId, walletId, 10)).thenReturn(Mono.just(OperationStatus.ok("Admin credits granted successfully.")));

        webTestClient.post()
                .uri("/api/v1/players/{playerId}/user-wallets/{walletId}:grantAdminCredit", playerId, walletId)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(new GrantAdminCreditRequest(10))
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.success").isEqualTo(true);
    }
}
