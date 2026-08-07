package com.arcade.stadium.application.service;

import com.arcade.stadium.adapter.out.persistence.GameCardRepository;
import com.arcade.stadium.adapter.out.persistence.LeaderboardEntryRepository;
import com.arcade.stadium.domain.dto.LeaderboardFilterInput;
import com.arcade.stadium.domain.dto.SubmitScoreCommand;
import com.arcade.stadium.domain.model.GameCard;
import com.arcade.stadium.domain.model.LeaderboardEntry;
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

class LeaderboardEntryServiceImplTest {

    private LeaderboardEntryRepository leaderboardRepository;
    private GameCardRepository gameCardRepository;
    private LeaderboardEntryServiceImpl leaderboardService;

    @BeforeEach
    void setUp() {
        leaderboardRepository = mock(LeaderboardEntryRepository.class);
        gameCardRepository = mock(GameCardRepository.class);
        leaderboardService = new LeaderboardEntryServiceImpl(leaderboardRepository, gameCardRepository);
    }

    @Test
    void testSubmitHighScore() {
        UUID gameCardId = UUID.randomUUID();
        Instant now = Instant.now();
        GameCard card = new GameCard(gameCardId, "tetris", "Tetris", "/covers/tetris.png", "Tetris game", 0, now, now, null);
        LeaderboardEntry entry = new LeaderboardEntry(UUID.randomUUID(), gameCardId, "player@test.com", 99900, now, now, now, null);

        when(gameCardRepository.findById(gameCardId)).thenReturn(Mono.just(card));
        when(leaderboardRepository.save(any(LeaderboardEntry.class))).thenReturn(Mono.just(entry));

        leaderboardService.submitHighScore(gameCardId, new SubmitScoreCommand("player@test.com", 99900))
                .as(StepVerifier::create)
                .consumeNextWith(resp -> {
                    assertEquals("player@test.com", resp.playerEmail());
                    assertEquals(99900, resp.score());
                })
                .verifyComplete();
    }

    @Test
    void testGetTop10Leaderboard() {
        UUID gameCardId = UUID.randomUUID();
        Instant now = Instant.now();
        GameCard card = new GameCard(gameCardId, "tetris", "Tetris", "/covers/tetris.png", "Tetris game", 0, now, now, null);
        LeaderboardEntry entry1 = new LeaderboardEntry(UUID.randomUUID(), gameCardId, "a@test.com", 100, now, now, now, null);
        LeaderboardEntry entry2 = new LeaderboardEntry(UUID.randomUUID(), gameCardId, "b@test.com", 50, now, now, now, null);

        when(gameCardRepository.findByGameId("tetris")).thenReturn(Mono.just(card));
        when(leaderboardRepository.findTop10ByGameCardIdOrderByScoreDescPlayerEmailAsc(gameCardId)).thenReturn(Flux.just(entry1, entry2));

        leaderboardService.getTop10Leaderboard("tetris")
                .as(StepVerifier::create)
                .consumeNextWith(resp -> assertEquals("a@test.com", resp.playerEmail()))
                .consumeNextWith(resp -> assertEquals("b@test.com", resp.playerEmail()))
                .verifyComplete();
    }

    @Test
    void testDeleteLeaderboardEntry() {
        UUID id = UUID.randomUUID();
        LeaderboardEntry entry = new LeaderboardEntry(id, UUID.randomUUID(), "del@test.com", 100, Instant.now(), Instant.now(), Instant.now(), null);
        when(leaderboardRepository.findById(id)).thenReturn(Mono.just(entry));
        when(leaderboardRepository.deleteById(id)).thenReturn(Mono.empty());

        leaderboardService.deleteLeaderboardEntry(id)
                .as(StepVerifier::create)
                .verifyComplete();
    }

    @Test
    void testGetLeaderboardEntryById() {
        UUID id = UUID.randomUUID();
        LeaderboardEntry entry = new LeaderboardEntry(id, UUID.randomUUID(), "get@test.com", 100, Instant.now(), Instant.now(), Instant.now(), null);
        when(leaderboardRepository.findById(id)).thenReturn(Mono.just(entry));

        leaderboardService.getLeaderboardEntryById(id)
                .as(StepVerifier::create)
                .consumeNextWith(resp -> assertEquals(id, resp.id()))
                .verifyComplete();
    }

    @Test
    void testListLeaderboardEntries() {
        LeaderboardEntry entry = new LeaderboardEntry(UUID.randomUUID(), UUID.randomUUID(), "list@test.com", 100, Instant.now(), Instant.now(), Instant.now(), null);
        when(leaderboardRepository.findAll(any(Example.class))).thenReturn(Flux.just(entry));

        leaderboardService.listLeaderboardEntries(new LeaderboardFilterInput(entry.id(), entry.gameCardId(), "list@test.com"))
                .as(StepVerifier::create)
                .consumeNextWith(resp -> assertEquals("list@test.com", resp.playerEmail()))
                .verifyComplete();
    }
}
