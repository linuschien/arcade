package com.arcade.stadium.application.port.in;

import com.arcade.stadium.domain.dto.LeaderboardEntryResponse;
import com.arcade.stadium.domain.dto.LeaderboardFilterInput;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface LeaderboardEntryQueryService {
    Mono<LeaderboardEntryResponse> getLeaderboardEntryById(UUID entryId);
    Flux<LeaderboardEntryResponse> getTop10Leaderboard(String gameId);
    Flux<LeaderboardEntryResponse> listLeaderboardEntries(LeaderboardFilterInput filter);
}
