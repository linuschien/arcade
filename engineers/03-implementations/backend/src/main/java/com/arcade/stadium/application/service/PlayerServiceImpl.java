package com.arcade.stadium.application.service;

import com.arcade.stadium.adapter.out.persistence.PlayerRepository;
import com.arcade.stadium.adapter.out.persistence.UserWalletRepository;
import com.arcade.stadium.application.port.in.PlayerCommandService;
import com.arcade.stadium.application.port.in.PlayerQueryService;
import com.arcade.stadium.domain.dto.*;
import com.arcade.stadium.domain.exception.ResourceNotFoundException;
import com.arcade.stadium.domain.model.Player;
import com.arcade.stadium.domain.model.UserWallet;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.ExampleMatcher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;

@Service
public class PlayerServiceImpl implements PlayerCommandService, PlayerQueryService {

    private final PlayerRepository playerRepository;
    private final UserWalletRepository walletRepository;

    public PlayerServiceImpl(
            PlayerRepository playerRepository,
            UserWalletRepository walletRepository) {
        this.playerRepository = playerRepository;
        this.walletRepository = walletRepository;
    }

    @Override
    @Transactional
    public Mono<PlayerResponse> whoami(String email) {
        if (email == null || email.isBlank()) {
            return Mono.error(new IllegalArgumentException("Email must not be null or blank"));
        }

        return playerRepository.findByGcpIapEmail(email)
                .flatMap(player -> walletRepository.findByPlayerId(player.id())
                        .flatMap(wallet -> checkAndApplyLazyReset(wallet))
                        .map(wallet -> mapToResponse(player, wallet)))
                .switchIfEmpty(Mono.defer(() -> provisionNewPlayer(email)));
    }

    private Mono<PlayerResponse> provisionNewPlayer(String email) {
        Instant now = Instant.now();
        Player newPlayer = new Player(null, email, now, now, null);

        return playerRepository.save(newPlayer)
                .flatMap(savedPlayer -> {
                    UserWallet newWallet = new UserWallet(null, savedPlayer.id(), 10, 0, now, null, now, now, null);
                    return walletRepository.save(newWallet)
                            .map(savedWallet -> mapToResponse(savedPlayer, savedWallet));
                });
    }

    private Mono<UserWallet> checkAndApplyLazyReset(UserWallet wallet) {
        LocalDate lastResetDate = wallet.lastDailyResetTime().atZone(ZoneId.systemDefault()).toLocalDate();
        LocalDate today = LocalDate.now(ZoneId.systemDefault());

        if (lastResetDate.isBefore(today)) {
            UserWallet resetWallet = new UserWallet(
                    wallet.id(),
                    wallet.playerId(),
                    10,
                    wallet.adminBonusCredit(),
                    Instant.now(),
                    wallet.version(),
                    wallet.createdAt(),
                    Instant.now(),
                    wallet.deletedAt()
            );
            return walletRepository.save(resetWallet);
        }
        return Mono.just(wallet);
    }

    @Override
    @Transactional
    public Mono<PlayerResponse> createPlayer(CreatePlayerCommand command) {
        Instant now = Instant.now();
        Player player = new Player(null, command.gcpIapEmail(), now, now, null);
        return playerRepository.save(player)
                .flatMap(savedPlayer -> {
                    UserWallet wallet = new UserWallet(null, savedPlayer.id(), 10, 0, now, null, now, now, null);
                    return walletRepository.save(wallet)
                            .map(savedWallet -> mapToResponse(savedPlayer, savedWallet));
                });
    }

    @Override
    @Transactional
    public Mono<PlayerResponse> updatePlayer(UUID id, UpdatePlayerCommand command) {
        return playerRepository.findById(id)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Player not found with id: " + id)))
                .flatMap(existing -> {
                    Player updated = new Player(existing.id(), command.gcpIapEmail(), existing.createdAt(), Instant.now(), existing.deletedAt());
                    return playerRepository.save(updated);
                })
                .flatMap(savedPlayer -> walletRepository.findByPlayerId(savedPlayer.id())
                        .map(wallet -> mapToResponse(savedPlayer, wallet))
                        .defaultIfEmpty(mapToResponse(savedPlayer, null)));
    }

    @Override
    @Transactional
    public Mono<Void> deletePlayer(UUID id) {
        return playerRepository.findById(id)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Player not found with id: " + id)))
                .flatMap(player -> playerRepository.deleteById(player.id()));
    }

    @Override
    public Mono<PlayerResponse> getPlayerById(UUID id) {
        return playerRepository.findById(id)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Player not found with id: " + id)))
                .flatMap(player -> walletRepository.findByPlayerId(player.id())
                        .map(wallet -> mapToResponse(player, wallet))
                        .defaultIfEmpty(mapToResponse(player, null)));
    }

    @Override
    public Flux<PlayerResponse> listPlayers(PlayerFilterInput filter) {
        if (filter == null) {
            return playerRepository.findAll()
                    .flatMap(player -> walletRepository.findByPlayerId(player.id())
                            .map(wallet -> mapToResponse(player, wallet))
                            .defaultIfEmpty(mapToResponse(player, null)));
        }

        Player probe = new Player(filter.id(), filter.gcpIapEmail(), null, null, null);
        ExampleMatcher matcher = ExampleMatcher.matchingAll().withIgnoreNullValues();

        return playerRepository.findAll(Example.of(probe, matcher))
                .flatMap(player -> walletRepository.findByPlayerId(player.id())
                        .map(wallet -> mapToResponse(player, wallet))
                        .defaultIfEmpty(mapToResponse(player, null)));
    }

    private PlayerResponse mapToResponse(Player player, UserWallet wallet) {
        UserWalletResponse walletResp = null;
        if (wallet != null) {
            walletResp = new UserWalletResponse(
                    wallet.id(),
                    wallet.playerId(),
                    wallet.dailyFreeCredit(),
                    wallet.adminBonusCredit(),
                    wallet.totalCredits(),
                    wallet.lastDailyResetTime(),
                    wallet.version() != null ? wallet.version() : 1
            );
        }
        return new PlayerResponse(player.id(), player.gcpIapEmail(), player.createdAt(), walletResp);
    }
}
