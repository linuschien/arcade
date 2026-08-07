package com.arcade.stadium.application.port.in;

import com.arcade.stadium.domain.dto.UserWalletResponse;
import com.arcade.stadium.domain.dto.WalletFilterInput;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface UserWalletQueryService {
    Mono<UserWalletResponse> getUserWalletById(UUID walletId);
    Mono<UserWalletResponse> getUserWalletByPlayerId(UUID playerId);
    Flux<UserWalletResponse> listUserWallets(WalletFilterInput filter);
}
