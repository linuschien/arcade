package com.arcade.stadium.adapter.out.persistence;

import com.arcade.stadium.adapter.out.persistence.config.UuidCallback;
import com.arcade.stadium.domain.model.GameCard;
import com.arcade.stadium.domain.model.LeaderboardEntry;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.r2dbc.DataR2dbcTest;
import org.springframework.context.annotation.Import;
import reactor.test.StepVerifier;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

@DataR2dbcTest
@Import(UuidCallback.class)
class LeaderboardEntryRepositoryTest {

    @Autowired
    private GameCardRepository gameCardRepository;

    @Autowired
    private LeaderboardEntryRepository leaderboardRepository;

    @Test
    void testTop10OrderByScoreDescPlayerEmailAsc() {
        Instant now = Instant.now();
        GameCard card = new GameCard(null, "pacman", "Pac-Man Classic", "/covers/pacman.png", "Pac-Man game", 0, now, now, null);

        gameCardRepository.save(card)
                .flatMapMany(savedCard -> {
                    LeaderboardEntry e1 = new LeaderboardEntry(null, savedCard.id(), "bob@test.com", 1000, now, now, now, null);
                    LeaderboardEntry e2 = new LeaderboardEntry(null, savedCard.id(), "alice@test.com", 1000, now, now, now, null);
                    LeaderboardEntry e3 = new LeaderboardEntry(null, savedCard.id(), "charlie@test.com", 2000, now, now, now, null);
                    return leaderboardRepository.saveAll(java.util.List.of(e1, e2, e3))
                            .thenMany(leaderboardRepository.findTop10ByGameCardIdOrderByScoreDescPlayerEmailAsc(savedCard.id()));
                })
                .as(StepVerifier::create)
                .consumeNextWith(top1 -> assertEquals("charlie@test.com", top1.playerEmail())) // 2000 score
                .consumeNextWith(top2 -> assertEquals("alice@test.com", top2.playerEmail()))   // 1000 score, email 'alice' < 'bob'
                .consumeNextWith(top3 -> assertEquals("bob@test.com", top3.playerEmail()))     // 1000 score
                .verifyComplete();
    }
}
