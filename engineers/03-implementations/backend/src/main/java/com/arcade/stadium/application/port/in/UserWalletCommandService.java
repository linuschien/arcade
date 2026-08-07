package com.arcade.stadium.application.port.in;

import com.arcade.stadium.domain.dto.CreateWalletCommand;
import com.arcade.stadium.domain.dto.OperationStatus;
import com.arcade.stadium.domain.dto.UpdateWalletCommand;
import com.arcade.stadium.domain.dto.UserWalletResponse;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface UserWalletCommandService {
    Mono<OperationStatus> deductCredit(UUID playerId, UUID walletId);
    Mono<OperationStatus> grantAdminCredit(UUID playerId, UUID walletId, int amount);
    Mono<UserWalletResponse> checkAndApplyLazyDailyReset(UUID walletId);
    Mono<UserWalletResponse> createUserWallet(CreateWalletCommand command);
    Mono<UserWalletResponse> updateUserWallet(UUID walletId, UpdateWalletCommand command);
    Mono<Void> deleteUserWallet(UUID walletId);
}
