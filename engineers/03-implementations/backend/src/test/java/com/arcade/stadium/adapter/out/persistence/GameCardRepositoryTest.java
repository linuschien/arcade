package com.arcade.stadium.adapter.out.persistence;

import com.arcade.stadium.domain.model.GameCard;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import reactor.test.StepVerifier;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class GameCardRepositoryTest {

    @Autowired
    private GameCardRepository gameCardRepository;

    @Test
    void testSaveAndFindByGameIdSlug() {
        Instant now = Instant.now();
        GameCard card = new GameCard(null, "tetris-test", "Tetris Classic Test", "/covers/tetris.png", "Tetris game", 0, now, now, null);

        gameCardRepository.save(card)
                .as(StepVerifier::create)
                .consumeNextWith(saved -> assertNotNull(saved.id()))
                .verifyComplete();

        gameCardRepository.findByGameId("tetris-test")
                .as(StepVerifier::create)
                .consumeNextWith(found -> {
                    assertEquals("tetris-test", found.gameId());
                    assertEquals("Tetris Classic Test", found.title());
                })
                .verifyComplete();
    }
}
