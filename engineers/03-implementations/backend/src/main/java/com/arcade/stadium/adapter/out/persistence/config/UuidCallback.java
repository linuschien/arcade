package com.arcade.stadium.adapter.out.persistence.config;

import com.arcade.stadium.domain.model.GameCard;
import com.arcade.stadium.domain.model.LeaderboardEntry;
import com.arcade.stadium.domain.model.Player;
import com.arcade.stadium.domain.model.UserWallet;
import org.reactivestreams.Publisher;
import org.springframework.data.r2dbc.mapping.event.BeforeConvertCallback;
import org.springframework.data.relational.core.sql.SqlIdentifier;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Component
public class UuidCallback implements BeforeConvertCallback<Object> {

    @Override
    public Publisher<Object> onBeforeConvert(Object entity, SqlIdentifier table) {
        if (entity instanceof Player player) {
            if (player.id() == null) {
                return Mono.just(player.withId(UUID.randomUUID()));
            }
        } else if (entity instanceof UserWallet wallet) {
            if (wallet.id() == null) {
                return Mono.just(wallet.withId(UUID.randomUUID()));
            }
        } else if (entity instanceof GameCard card) {
            if (card.id() == null) {
                return Mono.just(card.withId(UUID.randomUUID()));
            }
        } else if (entity instanceof LeaderboardEntry entry) {
            if (entry.id() == null) {
                return Mono.just(entry.withId(UUID.randomUUID()));
            }
        }
        return Mono.just(entity);
    }
}
