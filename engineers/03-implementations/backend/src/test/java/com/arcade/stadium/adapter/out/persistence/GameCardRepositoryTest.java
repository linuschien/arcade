package com.arcade.stadium.adapter.out.persistence;

import com.arcade.stadium.adapter.out.persistence.config.UuidCallback;
import com.arcade.stadium.domain.model.GameCard;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.r2dbc.DataR2dbcTest;
import org.springframework.context.annotation.Import;
import reactor.test.StepVerifier;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

@DataR2dbcTest
@Import(UuidCallback.class)
class GameCardRepositoryTest {

    @Autowired
    private GameCardRepository gameCardRepository;

    @Test
    void testSaveAndFindByGameIdSlug() {
        Instant now = Instant.now();
        GameCard card = new GameCard(null, "tetris", "Tetris Classic", "/covers/tetris.png", "Tetris game", 0, now, now, null);

        gameCardRepository.save(card)
                .as(StepVerifier::create)
                .consumeNextWith(saved -> assertNotNull(saved.id()))
                .verifyComplete();

        gameCardRepository.findByGameId("tetris")
                .as(StepVerifier::create)
                .consumeNextWith(found -> {
                    assertEquals("tetris", found.gameId());
                    assertEquals("Tetris Classic", found.title());
                })
                .verifyComplete();
    }
}
