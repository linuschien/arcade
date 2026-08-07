package com.arcade.stadium.application.service;

import com.arcade.stadium.adapter.out.persistence.GameCardRepository;
import com.arcade.stadium.domain.dto.CreateGameCardCommand;
import com.arcade.stadium.domain.dto.GameCardFilterInput;
import com.arcade.stadium.domain.dto.UpdateGameCardCommand;
import com.arcade.stadium.domain.exception.ResourceNotFoundException;
import com.arcade.stadium.domain.model.GameCard;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Example;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.arcade.stadium.application.port.in.PlayerCommandService;
import com.arcade.stadium.application.port.in.PlayerQueryService;
import com.arcade.stadium.application.port.in.UserWalletCommandService;
import com.arcade.stadium.domain.dto.PlayerResponse;
import com.arcade.stadium.domain.dto.UserWalletResponse;
import com.arcade.stadium.domain.dto.OperationStatus;

class GameCardServiceImplTest {

    private GameCardRepository gameCardRepository;
    private PlayerQueryService playerQueryService;
    private UserWalletCommandService walletCommandService;
    private GameCardServiceImpl gameCardService;

    @BeforeEach
    void setUp() {
        gameCardRepository = mock(GameCardRepository.class);
        playerQueryService = mock(PlayerQueryService.class);
        walletCommandService = mock(UserWalletCommandService.class);
        gameCardService = new GameCardServiceImpl(
                gameCardRepository, playerQueryService, walletCommandService);
    }

    @Test
    void testInsertCoin() {
        UUID cardId = UUID.randomUUID();
        UUID playerId = UUID.randomUUID();
        UUID walletId = UUID.randomUUID();
        Instant now = Instant.now();
        GameCard card = new GameCard(cardId, "tetris", "Tetris", "/covers/tetris.png", "Tetris game", 5, now, now, null);
        UserWalletResponse walletResp = new UserWalletResponse(walletId, playerId, 9, 0, 9, now, 1);
        PlayerResponse playerResp = new PlayerResponse(playerId, "test@arcade.com", now, walletResp);

        when(gameCardRepository.findById(cardId)).thenReturn(Mono.just(card));
        when(playerQueryService.getPlayerById(playerId)).thenReturn(Mono.just(playerResp));
        when(walletCommandService.deductCredit(playerId, walletId)).thenReturn(Mono.just(OperationStatus.ok("Deducted")));
        when(gameCardRepository.save(any(GameCard.class))).thenAnswer(inv -> Mono.just(inv.getArgument(0)));

        gameCardService.insertCoin(cardId, playerId)
                .as(StepVerifier::create)
                .consumeNextWith(status -> assertTrue(status.success()))
                .verifyComplete();
    }

    @Test
    void testIncrementPlayCount() {
        UUID cardId = UUID.randomUUID();
        Instant now = Instant.now();
        GameCard card = new GameCard(cardId, "tetris", "Tetris", "/covers/tetris.png", "Tetris game", 5, now, now, null);

        when(gameCardRepository.findById(cardId)).thenReturn(Mono.just(card));
        when(gameCardRepository.save(any(GameCard.class))).thenAnswer(inv -> Mono.just(inv.getArgument(0)));

        gameCardService.incrementPlayCount(cardId)
                .as(StepVerifier::create)
                .consumeNextWith(status -> assertTrue(status.success()))
                .verifyComplete();

        verify(gameCardRepository).save(argThat(saved -> saved.totalPlayCount() == 6));
    }

    @Test
    void testGetGameCardBySlug() {
        Instant now = Instant.now();
        GameCard card = new GameCard(UUID.randomUUID(), "pacman", "Pac-Man", "/covers/pacman.png", "Pac-Man game", 10, now, now, null);

        when(gameCardRepository.findByGameId("pacman")).thenReturn(Mono.just(card));

        gameCardService.getGameCardBySlug("pacman")
                .as(StepVerifier::create)
                .consumeNextWith(resp -> {
                    assertEquals("pacman", resp.gameId());
                    assertEquals("Pac-Man", resp.title());
                })
                .verifyComplete();
    }

    @Test
    void testGetGameCardBySlugNotFound() {
        when(gameCardRepository.findByGameId("unknown")).thenReturn(Mono.empty());

        gameCardService.getGameCardBySlug("unknown")
                .as(StepVerifier::create)
                .expectError(ResourceNotFoundException.class)
                .verify();
    }

    @Test
    void testCreateGameCard() {
        GameCard card = new GameCard(UUID.randomUUID(), "tetris", "Tetris", "/covers/tetris.png", "Tetris game", 0, Instant.now(), Instant.now(), null);
        when(gameCardRepository.save(any())).thenReturn(Mono.just(card));

        gameCardService.createGameCard(new CreateGameCardCommand("tetris", "Tetris", "/covers/tetris.png", "Tetris game"))
                .as(StepVerifier::create)
                .consumeNextWith(resp -> assertEquals("tetris", resp.gameId()))
                .verifyComplete();
    }

    @Test
    void testUpdateGameCard() {
        UUID id = UUID.randomUUID();
        GameCard existing = new GameCard(id, "tetris", "Tetris", "/covers/tetris.png", "Tetris game", 0, Instant.now(), Instant.now(), null);
        when(gameCardRepository.findById(id)).thenReturn(Mono.just(existing));
        when(gameCardRepository.save(any())).thenReturn(Mono.just(existing));

        gameCardService.updateGameCard(id, new UpdateGameCardCommand("tetris", "Tetris DX", "/covers/tetris.png", "Tetris game"))
                .as(StepVerifier::create)
                .consumeNextWith(resp -> assertEquals(id, resp.id()))
                .verifyComplete();
    }

    @Test
    void testDeleteGameCard() {
        UUID id = UUID.randomUUID();
        GameCard card = new GameCard(id, "tetris", "Tetris", "/covers/tetris.png", "Tetris game", 0, Instant.now(), Instant.now(), null);
        when(gameCardRepository.findById(id)).thenReturn(Mono.just(card));
        when(gameCardRepository.deleteById(id)).thenReturn(Mono.empty());

        gameCardService.deleteGameCard(id)
                .as(StepVerifier::create)
                .verifyComplete();
    }

    @Test
    void testGetGameCardById() {
        UUID id = UUID.randomUUID();
        GameCard card = new GameCard(id, "tetris", "Tetris", "/covers/tetris.png", "Tetris game", 0, Instant.now(), Instant.now(), null);
        when(gameCardRepository.findById(id)).thenReturn(Mono.just(card));

        gameCardService.getGameCardById(id)
                .as(StepVerifier::create)
                .consumeNextWith(resp -> assertEquals(id, resp.id()))
                .verifyComplete();
    }

    @Test
    void testListGameCards() {
        GameCard card = new GameCard(UUID.randomUUID(), "tetris", "Tetris", "/covers/tetris.png", "Tetris game", 0, Instant.now(), Instant.now(), null);
        when(gameCardRepository.findAll(any(Example.class))).thenReturn(Flux.just(card));

        gameCardService.listGameCards(new GameCardFilterInput(card.id(), "tetris", "Tetris"))
                .as(StepVerifier::create)
                .consumeNextWith(resp -> assertEquals("tetris", resp.gameId()))
                .verifyComplete();
    }
}
