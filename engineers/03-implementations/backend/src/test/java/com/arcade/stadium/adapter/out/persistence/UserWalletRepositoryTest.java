package com.arcade.stadium.adapter.out.persistence;

import com.arcade.stadium.adapter.out.persistence.config.UuidCallback;
import com.arcade.stadium.domain.model.Player;
import com.arcade.stadium.domain.model.UserWallet;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.r2dbc.DataR2dbcTest;
import org.springframework.context.annotation.Import;
import reactor.test.StepVerifier;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

@DataR2dbcTest
@Import(UuidCallback.class)
class UserWalletRepositoryTest {

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private UserWalletRepository walletRepository;

    @Test
    void testSaveAndFindByPlayerId() {
        Instant now = Instant.now();
        Player player = new Player(null, "walletplayer@arcade.com", now, now, null);

        playerRepository.save(player)
                .flatMap(savedPlayer -> {
                    UserWallet wallet = new UserWallet(null, savedPlayer.id(), 10, 5, now, null, now, now, null);
                    return walletRepository.save(wallet);
                })
                .as(StepVerifier::create)
                .consumeNextWith(savedWallet -> {
                    assertNotNull(savedWallet.id());
                    assertEquals(10, savedWallet.dailyFreeCredit());
                    assertEquals(5, savedWallet.adminBonusCredit());
                    assertEquals(15, savedWallet.totalCredits());
                })
                .verifyComplete();
    }
}
