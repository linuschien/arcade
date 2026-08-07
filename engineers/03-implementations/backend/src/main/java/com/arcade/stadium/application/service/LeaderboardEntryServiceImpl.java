package com.arcade.stadium.application.service;

import com.arcade.stadium.adapter.out.persistence.GameCardRepository;
import com.arcade.stadium.adapter.out.persistence.LeaderboardEntryRepository;
import com.arcade.stadium.application.port.in.LeaderboardEntryCommandService;
import com.arcade.stadium.application.port.in.LeaderboardEntryQueryService;
import com.arcade.stadium.domain.dto.*;
import com.arcade.stadium.domain.exception.ResourceNotFoundException;
import com.arcade.stadium.domain.model.LeaderboardEntry;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.ExampleMatcher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

@Service
public class LeaderboardEntryServiceImpl implements LeaderboardEntryCommandService, LeaderboardEntryQueryService {

    private final LeaderboardEntryRepository leaderboardRepository;
    private final GameCardRepository gameCardRepository;

    public LeaderboardEntryServiceImpl(LeaderboardEntryRepository leaderboardRepository, GameCardRepository gameCardRepository) {
        this.leaderboardRepository = leaderboardRepository;
        this.gameCardRepository = gameCardRepository;
    }

    @Override
    @Transactional
    public Mono<LeaderboardEntryResponse> submitHighScore(UUID gameCardId, SubmitScoreCommand command) {
        return gameCardRepository.findById(gameCardId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Game card not found with id: " + gameCardId)))
                .flatMap(card -> {
                    Instant now = Instant.now();
                    LeaderboardEntry entry = new LeaderboardEntry(null, card.id(), command.playerEmail(), command.score(), now, now, now, null);
                    return leaderboardRepository.save(entry);
                })
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public Mono<Void> deleteLeaderboardEntry(UUID entryId) {
        return leaderboardRepository.findById(entryId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Leaderboard entry not found with id: " + entryId)))
                .flatMap(entry -> leaderboardRepository.deleteById(entry.id()));
    }

    @Override
    public Mono<LeaderboardEntryResponse> getLeaderboardEntryById(UUID entryId) {
        return leaderboardRepository.findById(entryId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Leaderboard entry not found with id: " + entryId)))
                .map(this::mapToResponse);
    }

    @Override
    public Flux<LeaderboardEntryResponse> getTop10Leaderboard(String gameId) {
        return gameCardRepository.findByGameId(gameId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Game card not found with slug: " + gameId)))
                .flatMapMany(card -> leaderboardRepository.findTop10ByGameCardIdOrderByScoreDescPlayerEmailAsc(card.id()))
                .map(this::mapToResponse);
    }

    @Override
    public Flux<LeaderboardEntryResponse> listLeaderboardEntries(LeaderboardFilterInput filter) {
        if (filter == null) {
            return leaderboardRepository.findAll().map(this::mapToResponse);
        }

        LeaderboardEntry probe = new LeaderboardEntry(filter.id(), filter.gameCardId(), filter.playerEmail(), 0, null, null, null, null);
        ExampleMatcher matcher = ExampleMatcher.matchingAll()
                .withIgnoreNullValues()
                .withIgnorePaths("score");

        return leaderboardRepository.findAll(Example.of(probe, matcher)).map(this::mapToResponse);
    }

    private LeaderboardEntryResponse mapToResponse(LeaderboardEntry entry) {
        return new LeaderboardEntryResponse(
                entry.id(),
                entry.gameCardId(),
                entry.playerEmail(),
                entry.score(),
                entry.submittedAt()
        );
    }
}
