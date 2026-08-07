package com.arcade.stadium.application.service;

import com.arcade.stadium.adapter.out.persistence.UserWalletRepository;
import com.arcade.stadium.domain.dto.CreateWalletCommand;
import com.arcade.stadium.domain.dto.UpdateWalletCommand;
import com.arcade.stadium.domain.dto.WalletFilterInput;
import com.arcade.stadium.domain.exception.InsufficientCreditsException;
import com.arcade.stadium.domain.exception.OptimisticLockConflictException;
import com.arcade.stadium.domain.exception.ResourceNotFoundException;
import com.arcade.stadium.domain.model.UserWallet;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.domain.Example;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class UserWalletServiceImplTest {

    private UserWalletRepository walletRepository;
    private UserWalletServiceImpl walletService;

    @BeforeEach
    void setUp() {
        walletRepository = mock(UserWalletRepository.class);
        walletService = new UserWalletServiceImpl(walletRepository);
    }

    @Test
    void testDeductCreditPriorityDailyFreeFirst() {
        UUID playerId = UUID.randomUUID();
        UUID walletId = UUID.randomUUID();
        Instant now = Instant.now();
        UserWallet wallet = new UserWallet(walletId, playerId, 10, 5, now, 1, now, now, null);

        when(walletRepository.findById(walletId)).thenReturn(Mono.just(wallet));
        when(walletRepository.save(any(UserWallet.class))).thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

        walletService.deductCredit(playerId, walletId)
                .as(StepVerifier::create)
                .consumeNextWith(status -> {
                    assertTrue(status.success());
                    assertEquals("Credit deducted successfully.", status.message());
                })
                .verifyComplete();

        verify(walletRepository).save(argThat(saved -> saved.dailyFreeCredit() == 9 && saved.adminBonusCredit() == 5));
    }

    @Test
    void testDeductCreditPriorityAdminBonusSecond() {
        UUID playerId = UUID.randomUUID();
        UUID walletId = UUID.randomUUID();
        Instant now = Instant.now();
        UserWallet wallet = new UserWallet(walletId, playerId, 0, 5, now, 1, now, now, null);

        when(walletRepository.findById(walletId)).thenReturn(Mono.just(wallet));
        when(walletRepository.save(any(UserWallet.class))).thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

        walletService.deductCredit(playerId, walletId)
                .as(StepVerifier::create)
                .consumeNextWith(status -> assertTrue(status.success()))
                .verifyComplete();

        verify(walletRepository).save(argThat(saved -> saved.dailyFreeCredit() == 0 && saved.adminBonusCredit() == 4));
    }

    @Test
    void testDeductCreditInsufficientCredits() {
        UUID playerId = UUID.randomUUID();
        UUID walletId = UUID.randomUUID();
        Instant now = Instant.now();
        UserWallet wallet = new UserWallet(walletId, playerId, 0, 0, now, 1, now, now, null);

        when(walletRepository.findById(walletId)).thenReturn(Mono.just(wallet));

        walletService.deductCredit(playerId, walletId)
                .as(StepVerifier::create)
                .expectError(InsufficientCreditsException.class)
                .verify();
    }

    @Test
    void testDeductCreditOptimisticLockError() {
        UUID playerId = UUID.randomUUID();
        UUID walletId = UUID.randomUUID();
        Instant now = Instant.now();
        UserWallet wallet = new UserWallet(walletId, playerId, 5, 0, now, 1, now, now, null);

        when(walletRepository.findById(walletId)).thenReturn(Mono.just(wallet));
        when(walletRepository.save(any(UserWallet.class))).thenReturn(Mono.error(new OptimisticLockingFailureException("Conflict")));

        walletService.deductCredit(playerId, walletId)
                .as(StepVerifier::create)
                .expectError(OptimisticLockConflictException.class)
                .verify();
    }

    @Test
    void testGrantAdminCredit() {
        UUID playerId = UUID.randomUUID();
        UUID walletId = UUID.randomUUID();
        Instant now = Instant.now();
        UserWallet wallet = new UserWallet(walletId, playerId, 10, 0, now, 1, now, now, null);

        when(walletRepository.findById(walletId)).thenReturn(Mono.just(wallet));
        when(walletRepository.save(any(UserWallet.class))).thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

        walletService.grantAdminCredit(playerId, walletId, 10)
                .as(StepVerifier::create)
                .consumeNextWith(status -> assertTrue(status.success()))
                .verifyComplete();

        verify(walletRepository).save(argThat(saved -> saved.adminBonusCredit() == 10));
    }

    @Test
    void testCreateUserWallet() {
        UUID playerId = UUID.randomUUID();
        Instant now = Instant.now();
        UserWallet wallet = new UserWallet(UUID.randomUUID(), playerId, 10, 0, now, 1, now, now, null);

        when(walletRepository.save(any(UserWallet.class))).thenReturn(Mono.just(wallet));

        walletService.createUserWallet(new CreateWalletCommand(playerId, 10, 0))
                .as(StepVerifier::create)
                .consumeNextWith(resp -> {
                    assertEquals(playerId, resp.playerId());
                    assertEquals(10, resp.dailyFreeCredit());
                })
                .verifyComplete();
    }

    @Test
    void testUpdateUserWallet() {
        UUID walletId = UUID.randomUUID();
        UUID playerId = UUID.randomUUID();
        Instant now = Instant.now();
        UserWallet existing = new UserWallet(walletId, playerId, 5, 0, now, 1, now, now, null);

        when(walletRepository.findById(walletId)).thenReturn(Mono.just(existing));
        when(walletRepository.save(any())).thenReturn(Mono.just(existing));

        walletService.updateUserWallet(walletId, new UpdateWalletCommand(playerId, 10, 5))
                .as(StepVerifier::create)
                .consumeNextWith(resp -> assertEquals(walletId, resp.id()))
                .verifyComplete();
    }

    @Test
    void testDeleteUserWallet() {
        UUID walletId = UUID.randomUUID();
        UserWallet wallet = new UserWallet(walletId, UUID.randomUUID(), 10, 0, Instant.now(), 1, Instant.now(), Instant.now(), null);

        when(walletRepository.findById(walletId)).thenReturn(Mono.just(wallet));
        when(walletRepository.deleteById(walletId)).thenReturn(Mono.empty());

        walletService.deleteUserWallet(walletId)
                .as(StepVerifier::create)
                .verifyComplete();
    }

    @Test
    void testGetUserWalletById() {
        UUID walletId = UUID.randomUUID();
        UserWallet wallet = new UserWallet(walletId, UUID.randomUUID(), 10, 0, Instant.now(), 1, Instant.now(), Instant.now(), null);

        when(walletRepository.findById(walletId)).thenReturn(Mono.just(wallet));

        walletService.getUserWalletById(walletId)
                .as(StepVerifier::create)
                .consumeNextWith(resp -> assertEquals(walletId, resp.id()))
                .verifyComplete();
    }

    @Test
    void testGetUserWalletByPlayerId() {
        UUID playerId = UUID.randomUUID();
        UserWallet wallet = new UserWallet(UUID.randomUUID(), playerId, 10, 0, Instant.now(), 1, Instant.now(), Instant.now(), null);

        when(walletRepository.findByPlayerId(playerId)).thenReturn(Mono.just(wallet));

        walletService.getUserWalletByPlayerId(playerId)
                .as(StepVerifier::create)
                .consumeNextWith(resp -> assertEquals(playerId, resp.playerId()))
                .verifyComplete();
    }

    @Test
    void testListUserWallets() {
        UserWallet wallet = new UserWallet(UUID.randomUUID(), UUID.randomUUID(), 10, 0, Instant.now(), 1, Instant.now(), Instant.now(), null);
        when(walletRepository.findAll(any(Example.class))).thenReturn(Flux.just(wallet));

        walletService.listUserWallets(new WalletFilterInput(wallet.id(), wallet.playerId()))
                .as(StepVerifier::create)
                .consumeNextWith(resp -> assertEquals(wallet.id(), resp.id()))
                .verifyComplete();
    }

    @Test
    void testCheckAndApplyLazyDailyReset() {
        UUID walletId = UUID.randomUUID();
        UserWallet wallet = new UserWallet(walletId, UUID.randomUUID(), 5, 0, Instant.now(), 1, Instant.now(), Instant.now(), null);

        when(walletRepository.findById(walletId)).thenReturn(Mono.just(wallet));

        walletService.checkAndApplyLazyDailyReset(walletId)
                .as(StepVerifier::create)
                .consumeNextWith(resp -> assertEquals(walletId, resp.id()))
                .verifyComplete();
    }
}
