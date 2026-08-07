package com.arcade.stadium.adapter.out.persistence;

import com.arcade.stadium.domain.model.Player;
import org.springframework.data.repository.query.ReactiveQueryByExampleExecutor;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Repository
public interface PlayerRepository extends ReactiveCrudRepository<Player, UUID>, ReactiveQueryByExampleExecutor<Player> {
    Mono<Player> findByGcpIapEmail(String gcpIapEmail);
}
