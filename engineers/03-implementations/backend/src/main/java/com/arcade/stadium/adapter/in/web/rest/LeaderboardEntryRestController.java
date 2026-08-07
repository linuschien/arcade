package com.arcade.stadium.adapter.in.web.rest;

import com.arcade.stadium.application.port.in.LeaderboardEntryCommandService;
import com.arcade.stadium.application.port.in.LeaderboardEntryQueryService;
import com.arcade.stadium.domain.dto.LeaderboardEntryRequest;
import com.arcade.stadium.domain.dto.LeaderboardEntryResponse;
import com.arcade.stadium.domain.dto.SubmitScoreCommand;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/game-cards/{gameCardId}/leaderboard-entries")
public class LeaderboardEntryRestController {

    private final LeaderboardEntryCommandService leaderboardCommandService;
    private final LeaderboardEntryQueryService leaderboardQueryService;

    public LeaderboardEntryRestController(LeaderboardEntryCommandService leaderboardCommandService, LeaderboardEntryQueryService leaderboardQueryService) {
        this.leaderboardCommandService = leaderboardCommandService;
        this.leaderboardQueryService = leaderboardQueryService;
    }

    @PostMapping
    public Mono<ResponseEntity<LeaderboardEntryResponse>> submitHighScore(
            @PathVariable UUID gameCardId,
            @Valid @RequestBody LeaderboardEntryRequest request) {
        return leaderboardCommandService.submitHighScore(gameCardId, new SubmitScoreCommand(request.playerEmail(), request.score()))
                .map(response -> ResponseEntity.status(HttpStatus.CREATED).body(response));
    }

    @GetMapping("/{entryId}")
    public Mono<ResponseEntity<LeaderboardEntryResponse>> getLeaderboardEntryById(
            @PathVariable UUID gameCardId,
            @PathVariable UUID entryId) {
        return leaderboardQueryService.getLeaderboardEntryById(entryId)
                .map(ResponseEntity::ok);
    }

    @DeleteMapping("/{entryId}")
    public Mono<ResponseEntity<Void>> deleteLeaderboardEntry(
            @PathVariable UUID gameCardId,
            @PathVariable UUID entryId) {
        return leaderboardCommandService.deleteLeaderboardEntry(entryId)
                .then(Mono.just(ResponseEntity.noContent().build()));
    }
}
