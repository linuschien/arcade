package com.arcade.stadium.adapter.out.persistence;

import com.arcade.stadium.domain.model.Player;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import reactor.test.StepVerifier;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class PlayerRepositoryTest {

    @Autowired
    private PlayerRepository playerRepository;

    @Test
    void testSaveAndFindByEmail() {
        Instant now = Instant.now();
        Player player = new Player(null, "test@arcade.com", now, now, null);

        playerRepository.save(player)
                .as(StepVerifier::create)
                .consumeNextWith(saved -> {
                    assertNotNull(saved.id());
                    assertEquals("test@arcade.com", saved.gcpIapEmail());
                })
                .verifyComplete();

        playerRepository.findByGcpIapEmail("test@arcade.com")
                .as(StepVerifier::create)
                .consumeNextWith(found -> assertEquals("test@arcade.com", found.gcpIapEmail()))
                .verifyComplete();
    }
}
