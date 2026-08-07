package com.arcade.stadium.application.service;

import com.arcade.stadium.adapter.out.persistence.UserWalletRepository;
import com.arcade.stadium.application.port.in.UserWalletCommandService;
import com.arcade.stadium.application.port.in.UserWalletQueryService;
import com.arcade.stadium.domain.dto.*;
import com.arcade.stadium.domain.exception.InsufficientCreditsException;
import com.arcade.stadium.domain.exception.OptimisticLockConflictException;
import com.arcade.stadium.domain.exception.ResourceNotFoundException;
import com.arcade.stadium.domain.model.UserWallet;
import org.springframework.dao.OptimisticLockingFailureException;
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
public class UserWalletServiceImpl implements UserWalletCommandService, UserWalletQueryService {

    private final UserWalletRepository walletRepository;

    public UserWalletServiceImpl(UserWalletRepository walletRepository) {
        this.walletRepository = walletRepository;
    }

    @Override
    @Transactional
    public Mono<OperationStatus> deductCredit(UUID playerId, UUID walletId) {
        return walletRepository.findById(walletId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("User wallet not found with id: " + walletId)))
                .flatMap(wallet -> {
                    UserWallet checkedWallet = performLazyResetIfNeeded(wallet);
                    int currentDaily = checkedWallet.dailyFreeCredit();
                    int currentAdmin = checkedWallet.adminBonusCredit();

                    int newDaily;
                    int newAdmin;

                    if (currentDaily > 0) {
                        newDaily = currentDaily - 1;
                        newAdmin = currentAdmin;
                    } else if (currentAdmin > 0) {
                        newDaily = 0;
                        newAdmin = currentAdmin - 1;
                    } else {
                        return Mono.error(new InsufficientCreditsException("OUT OF CREDITS"));
                    }

                    UserWallet updatedWallet = new UserWallet(
                            checkedWallet.id(),
                            checkedWallet.playerId(),
                            newDaily,
                            newAdmin,
                            checkedWallet.lastDailyResetTime(),
                            checkedWallet.version(),
                            checkedWallet.createdAt(),
                            Instant.now(),
                            checkedWallet.deletedAt()
                    );

                    return walletRepository.save(updatedWallet)
                            .map(saved -> OperationStatus.ok("Credit deducted successfully."))
                            .onErrorResume(OptimisticLockingFailureException.class,
                                    ex -> Mono.error(new OptimisticLockConflictException("Resource state modified by another transaction.", checkedWallet.version() != null ? checkedWallet.version() : 1)));
                });
    }

    @Override
    @Transactional
    public Mono<OperationStatus> grantAdminCredit(UUID playerId, UUID walletId, int amount) {
        return walletRepository.findById(walletId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("User wallet not found with id: " + walletId)))
                .flatMap(wallet -> {
                    UserWallet updated = new UserWallet(
                            wallet.id(),
                            wallet.playerId(),
                            wallet.dailyFreeCredit(),
                            wallet.adminBonusCredit() + amount,
                            wallet.lastDailyResetTime(),
                            wallet.version(),
                            wallet.createdAt(),
                            Instant.now(),
                            wallet.deletedAt()
                    );
                    return walletRepository.save(updated)
                            .map(saved -> OperationStatus.ok("Admin credits granted successfully."));
                });
    }

    @Override
    @Transactional
    public Mono<UserWalletResponse> checkAndApplyLazyDailyReset(UUID walletId) {
        return walletRepository.findById(walletId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("User wallet not found with id: " + walletId)))
                .flatMap(wallet -> {
                    UserWallet checked = performLazyResetIfNeeded(wallet);
                    if (checked != wallet) {
                        return walletRepository.save(checked);
                    }
                    return Mono.just(wallet);
                })
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public Mono<UserWalletResponse> createUserWallet(CreateWalletCommand command) {
        Instant now = Instant.now();
        int daily = command.dailyFreeCredit() != null ? command.dailyFreeCredit() : 10;
        int admin = command.adminBonusCredit() != null ? command.adminBonusCredit() : 0;

        UserWallet wallet = new UserWallet(null, command.playerId(), daily, admin, now, null, now, now, null);
        return walletRepository.save(wallet).map(this::mapToResponse);
    }

    @Override
    @Transactional
    public Mono<UserWalletResponse> updateUserWallet(UUID walletId, UpdateWalletCommand command) {
        return walletRepository.findById(walletId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("User wallet not found with id: " + walletId)))
                .flatMap(existing -> {
                    int daily = command.dailyFreeCredit() != null ? command.dailyFreeCredit() : existing.dailyFreeCredit();
                    int admin = command.adminBonusCredit() != null ? command.adminBonusCredit() : existing.adminBonusCredit();

                    UserWallet updated = new UserWallet(
                            existing.id(),
                            command.playerId() != null ? command.playerId() : existing.playerId(),
                            daily,
                            admin,
                            existing.lastDailyResetTime(),
                            existing.version(),
                            existing.createdAt(),
                            Instant.now(),
                            existing.deletedAt()
                    );
                    return walletRepository.save(updated);
                })
                .map(this::mapToResponse)
                .onErrorResume(OptimisticLockingFailureException.class,
                        ex -> Mono.error(new OptimisticLockConflictException("Resource state modified by another transaction.", 1)));
    }

    @Override
    @Transactional
    public Mono<Void> deleteUserWallet(UUID walletId) {
        return walletRepository.findById(walletId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("User wallet not found with id: " + walletId)))
                .flatMap(wallet -> walletRepository.deleteById(wallet.id()));
    }

    @Override
    public Mono<UserWalletResponse> getUserWalletById(UUID walletId) {
        return walletRepository.findById(walletId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("User wallet not found with id: " + walletId)))
                .map(this::mapToResponse);
    }

    @Override
    public Mono<UserWalletResponse> getUserWalletByPlayerId(UUID playerId) {
        return walletRepository.findByPlayerId(playerId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("User wallet not found for player: " + playerId)))
                .map(this::mapToResponse);
    }

    @Override
    public Flux<UserWalletResponse> listUserWallets(WalletFilterInput filter) {
        if (filter == null) {
            return walletRepository.findAll().map(this::mapToResponse);
        }

        UserWallet probe = new UserWallet(filter.id(), filter.playerId(), 0, 0, null, null, null, null, null);
        ExampleMatcher matcher = ExampleMatcher.matchingAll()
                .withIgnoreNullValues()
                .withIgnorePaths("dailyFreeCredit", "adminBonusCredit", "version");

        return walletRepository.findAll(Example.of(probe, matcher)).map(this::mapToResponse);
    }

    private UserWallet performLazyResetIfNeeded(UserWallet wallet) {
        LocalDate lastResetDate = wallet.lastDailyResetTime().atZone(ZoneId.systemDefault()).toLocalDate();
        LocalDate today = LocalDate.now(ZoneId.systemDefault());

        if (lastResetDate.isBefore(today)) {
            return new UserWallet(
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
        }
        return wallet;
    }

    private UserWalletResponse mapToResponse(UserWallet wallet) {
        return new UserWalletResponse(
                wallet.id(),
                wallet.playerId(),
                wallet.dailyFreeCredit(),
                wallet.adminBonusCredit(),
                wallet.totalCredits(),
                wallet.lastDailyResetTime(),
                wallet.version() != null ? wallet.version() : 1
        );
    }
}
