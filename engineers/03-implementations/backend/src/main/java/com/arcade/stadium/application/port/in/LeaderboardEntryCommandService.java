package com.arcade.stadium.application.port.in;

import com.arcade.stadium.domain.dto.LeaderboardEntryResponse;
import com.arcade.stadium.domain.dto.SubmitScoreCommand;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface LeaderboardEntryCommandService {
    Mono<LeaderboardEntryResponse> submitHighScore(UUID gameCardId, SubmitScoreCommand command);
    Mono<Void> deleteLeaderboardEntry(UUID entryId);
}
