package com.arcade.stadium.application.service;

import com.arcade.stadium.application.port.in.PlayerQueryService;
import com.arcade.stadium.application.port.in.UserWalletCommandService;
import com.arcade.stadium.adapter.out.persistence.GameCardRepository;
import com.arcade.stadium.application.port.in.GameCardCommandService;
import com.arcade.stadium.application.port.in.GameCardQueryService;
import com.arcade.stadium.domain.dto.*;
import com.arcade.stadium.domain.exception.ResourceNotFoundException;
import com.arcade.stadium.domain.model.GameCard;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.ExampleMatcher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

@Service
public class GameCardServiceImpl implements GameCardCommandService, GameCardQueryService {

    private final GameCardRepository gameCardRepository;
    private final PlayerQueryService playerQueryService;
    private final UserWalletCommandService walletCommandService;

    public GameCardServiceImpl(
            GameCardRepository gameCardRepository,
            PlayerQueryService playerQueryService,
            UserWalletCommandService walletCommandService) {
        this.gameCardRepository = gameCardRepository;
        this.playerQueryService = playerQueryService;
        this.walletCommandService = walletCommandService;
    }

    @Override
    @Transactional
    public Mono<OperationStatus> insertCoin(UUID gameCardId, UUID playerId) {
        if (playerId == null) {
            return Mono.error(new IllegalArgumentException("playerId must not be null"));
        }
        return gameCardRepository.findById(gameCardId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Game card not found with id: " + gameCardId)))
                .flatMap(card -> playerQueryService.getPlayerById(playerId)
                        .flatMap(playerResp ->
                                walletCommandService.deductCredit(playerResp.id(), playerResp.wallet().id())
                                        .then(Mono.defer(() -> {
                                            GameCard updated = new GameCard(
                                                    card.id(),
                                                    card.gameId(),
                                                    card.title(),
                                                    card.coverArtUrl(),
                                                    card.description(),
                                                    card.totalPlayCount() + 1,
                                                    card.createdAt(),
                                                    Instant.now(),
                                                    card.deletedAt()
                                            );
                                            return gameCardRepository.save(updated);
                                        }))
                                        .map(saved -> OperationStatus.ok("Coin inserted and play counter incremented."))
                        )
                );
    }

    @Override
    @Transactional
    public Mono<OperationStatus> incrementPlayCount(UUID gameCardId) {
        return gameCardRepository.findById(gameCardId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Game card not found with id: " + gameCardId)))
                .flatMap(card -> {
                    GameCard updated = new GameCard(
                            card.id(),
                            card.gameId(),
                            card.title(),
                            card.coverArtUrl(),
                            card.description(),
                            card.totalPlayCount() + 1,
                            card.createdAt(),
                            Instant.now(),
                            card.deletedAt()
                    );
                    return gameCardRepository.save(updated)
                            .map(saved -> OperationStatus.ok("Play counter incremented."));
                });
    }

    @Override
    @Transactional
    public Mono<GameCardResponse> createGameCard(CreateGameCardCommand command) {
        Instant now = Instant.now();
        GameCard card = new GameCard(null, command.gameId(), command.title(), command.coverArtUrl(), command.description(), 0, now, now, null);
        return gameCardRepository.save(card).map(this::mapToResponse);
    }

    @Override
    @Transactional
    public Mono<GameCardResponse> updateGameCard(UUID gameCardId, UpdateGameCardCommand command) {
        return gameCardRepository.findById(gameCardId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Game card not found with id: " + gameCardId)))
                .flatMap(existing -> {
                    GameCard updated = new GameCard(
                            existing.id(),
                            command.gameId() != null ? command.gameId() : existing.gameId(),
                            command.title() != null ? command.title() : existing.title(),
                            command.coverArtUrl() != null ? command.coverArtUrl() : existing.coverArtUrl(),
                            command.description() != null ? command.description() : existing.description(),
                            existing.totalPlayCount(),
                            existing.createdAt(),
                            Instant.now(),
                            existing.deletedAt()
                    );
                    return gameCardRepository.save(updated);
                })
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public Mono<Void> deleteGameCard(UUID gameCardId) {
        return gameCardRepository.findById(gameCardId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Game card not found with id: " + gameCardId)))
                .flatMap(card -> gameCardRepository.deleteById(card.id()));
    }

    @Override
    public Mono<GameCardResponse> getGameCardById(UUID gameCardId) {
        return gameCardRepository.findById(gameCardId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Game card not found with id: " + gameCardId)))
                .map(this::mapToResponse);
    }

    @Override
    public Mono<GameCardResponse> getGameCardBySlug(String gameId) {
        return gameCardRepository.findByGameId(gameId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Game card not found with slug: " + gameId)))
                .map(this::mapToResponse);
    }

    @Override
    public Flux<GameCardResponse> listGameCards(GameCardFilterInput filter) {
        if (filter == null) {
            return gameCardRepository.findAll().map(this::mapToResponse);
        }

        GameCard probe = new GameCard(filter.id(), filter.gameId(), filter.title(), null, null, 0, null, null, null);
        ExampleMatcher matcher = ExampleMatcher.matchingAll()
                .withIgnoreNullValues()
                .withIgnorePaths("totalPlayCount");

        return gameCardRepository.findAll(Example.of(probe, matcher)).map(this::mapToResponse);
    }

    private GameCardResponse mapToResponse(GameCard card) {
        return new GameCardResponse(
                card.id(),
                card.gameId(),
                card.title(),
                card.coverArtUrl(),
                card.description(),
                card.totalPlayCount()
        );
    }
}
