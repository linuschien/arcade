package com.arcade.stadium.adapter.in.web.graphql;

import com.arcade.stadium.application.port.in.UserWalletQueryService;
import com.arcade.stadium.domain.dto.UserWalletResponse;
import com.arcade.stadium.domain.dto.WalletFilterInput;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

import com.arcade.stadium.infrastructure.security.AdminOnly;

@AdminOnly
@Controller
public class UserWalletGraphQLResolver {

    private final UserWalletQueryService walletQueryService;

    public UserWalletGraphQLResolver(UserWalletQueryService walletQueryService) {
        this.walletQueryService = walletQueryService;
    }

    @QueryMapping
    public Flux<UserWalletResponse> listUserWallets(@Argument WalletFilterInput filter) {
        return walletQueryService.listUserWallets(filter);
    }

    @QueryMapping
    public Mono<UserWalletResponse> getUserWalletByPlayerId(@Argument UUID playerId) {
        return walletQueryService.getUserWalletByPlayerId(playerId);
    }
}
