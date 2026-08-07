package com.arcade.stadium.adapter.out.persistence;

import com.arcade.stadium.domain.model.LeaderboardEntry;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.query.ReactiveQueryByExampleExecutor;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.util.UUID;

@Repository
public interface LeaderboardEntryRepository extends ReactiveCrudRepository<LeaderboardEntry, UUID>, ReactiveQueryByExampleExecutor<LeaderboardEntry> {
    
    @Query("SELECT * FROM leaderboard_entry WHERE game_card_id = :gameCardId ORDER BY score DESC, player_email ASC LIMIT 10")
    Flux<LeaderboardEntry> findTop10ByGameCardId(UUID gameCardId);

    Flux<LeaderboardEntry> findTop10ByGameCardIdOrderByScoreDescPlayerEmailAsc(UUID gameCardId);
}
