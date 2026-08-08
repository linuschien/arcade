package com.arcade.stadium.application.service;

import com.arcade.stadium.adapter.out.persistence.PlayerRepository;
import com.arcade.stadium.adapter.out.persistence.UserWalletRepository;
import com.arcade.stadium.domain.dto.CreatePlayerCommand;
import com.arcade.stadium.domain.dto.PlayerFilterInput;
import com.arcade.stadium.domain.dto.UpdatePlayerCommand;
import com.arcade.stadium.domain.exception.ResourceNotFoundException;
import com.arcade.stadium.domain.model.Player;
import com.arcade.stadium.domain.model.UserWallet;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.springframework.data.domain.Example;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PlayerServiceImplTest {

    private PlayerRepository playerRepository;
    private UserWalletRepository walletRepository;
    private PlayerServiceImpl playerService;

    @BeforeEach
    void setUp() {
        playerRepository = mock(PlayerRepository.class);
        walletRepository = mock(UserWalletRepository.class);
        playerService = new PlayerServiceImpl(playerRepository, walletRepository);
    }

    @Test
    void testWhoamiExistingPlayer() {
        UUID playerId = UUID.randomUUID();
        Instant now = Instant.now();
        Player existingPlayer = new Player(playerId, "existing@test.com", now, now, null);
        UserWallet wallet = new UserWallet(UUID.randomUUID(), playerId, 10, 0, now, 1, now, now, null);

        when(playerRepository.findByGcpIapEmail("existing@test.com")).thenReturn(Mono.just(existingPlayer));
        when(walletRepository.findByPlayerId(playerId)).thenReturn(Mono.just(wallet));

        playerService.whoami("existing@test.com")
                .as(StepVerifier::create)
                .consumeNextWith(resp -> {
                    assertEquals(playerId, resp.id());
                    assertEquals("existing@test.com", resp.gcpIapEmail());
                    assertFalse(resp.isAdmin());
                    assertNotNull(resp.wallet());
                    assertEquals(10, resp.wallet().dailyFreeCredit());
                })
                .verifyComplete();
    }

    @Test
    void testWhoamiNewPlayerProvisioning() {
        Instant now = Instant.now();
        UUID playerId = UUID.randomUUID();
        UUID walletId = UUID.randomUUID();
        Player newPlayer = new Player(playerId, "new@test.com", now, now, null);
        UserWallet newWallet = new UserWallet(walletId, playerId, 10, 0, now, 1, now, now, null);

        when(playerRepository.findByGcpIapEmail("new@test.com")).thenReturn(Mono.empty());
        when(playerRepository.save(any(Player.class))).thenReturn(Mono.just(newPlayer));
        when(walletRepository.save(any(UserWallet.class))).thenReturn(Mono.just(newWallet));

        playerService.whoami("new@test.com")
                .as(StepVerifier::create)
                .consumeNextWith(resp -> {
                    assertEquals("new@test.com", resp.gcpIapEmail());
                    assertNotNull(resp.wallet());
                })
                .verifyComplete();
    }

    @Test
    void testCreatePlayer() {
        UUID playerId = UUID.randomUUID();
        Instant now = Instant.now();
        Player player = new Player(playerId, "create@test.com", now, now, null);
        UserWallet wallet = new UserWallet(UUID.randomUUID(), playerId, 10, 0, now, 1, now, now, null);

        when(playerRepository.save(any(Player.class))).thenReturn(Mono.just(player));
        when(walletRepository.save(any(UserWallet.class))).thenReturn(Mono.just(wallet));

        playerService.createPlayer(new CreatePlayerCommand("create@test.com"))
                .as(StepVerifier::create)
                .consumeNextWith(resp -> assertEquals("create@test.com", resp.gcpIapEmail()))
                .verifyComplete();
    }

    @Test
    void testUpdatePlayerNotFound() {
        UUID id = UUID.randomUUID();
        when(playerRepository.findById(id)).thenReturn(Mono.empty());

        playerService.updatePlayer(id, new UpdatePlayerCommand("new@test.com"))
                .as(StepVerifier::create)
                .expectError(ResourceNotFoundException.class)
                .verify();
    }

    @Test
    void testDeletePlayer() {
        UUID id = UUID.randomUUID();
        Player player = new Player(id, "del@test.com", Instant.now(), Instant.now(), null);

        when(playerRepository.findById(id)).thenReturn(Mono.just(player));
        when(playerRepository.deleteById(id)).thenReturn(Mono.empty());

        playerService.deletePlayer(id)
                .as(StepVerifier::create)
                .verifyComplete();
    }

    @Test
    void testGetPlayerById() {
        UUID id = UUID.randomUUID();
        Player player = new Player(id, "get@test.com", Instant.now(), Instant.now(), null);
        when(playerRepository.findById(id)).thenReturn(Mono.just(player));
        when(walletRepository.findByPlayerId(id)).thenReturn(Mono.empty());

        playerService.getPlayerById(id)
                .as(StepVerifier::create)
                .consumeNextWith(resp -> assertEquals("get@test.com", resp.gcpIapEmail()))
                .verifyComplete();
    }

    @Test
    void testUpdatePlayerSuccess() {
        UUID id = UUID.randomUUID();
        Player existing = new Player(id, "old@test.com", Instant.now(), Instant.now(), null);
        Player updated = new Player(id, "new@test.com", existing.createdAt(), Instant.now(), null);

        when(playerRepository.findById(id)).thenReturn(Mono.just(existing));
        when(playerRepository.save(any())).thenReturn(Mono.just(updated));
        when(walletRepository.findByPlayerId(id)).thenReturn(Mono.empty());

        playerService.updatePlayer(id, new UpdatePlayerCommand("new@test.com"))
                .as(StepVerifier::create)
                .consumeNextWith(resp -> assertEquals("new@test.com", resp.gcpIapEmail()))
                .verifyComplete();
    }

    @Test
    void testListPlayersWithFilter() {
        Player player = new Player(UUID.randomUUID(), "list@test.com", Instant.now(), Instant.now(), null);
        when(playerRepository.findAll(any(Example.class))).thenReturn(Flux.just(player));
        when(walletRepository.findByPlayerId(player.id())).thenReturn(Mono.empty());

        playerService.listPlayers(new PlayerFilterInput(player.id(), "list@test.com"))
                .as(StepVerifier::create)
                .consumeNextWith(resp -> assertEquals("list@test.com", resp.gcpIapEmail()))
                .verifyComplete();
    }
}
