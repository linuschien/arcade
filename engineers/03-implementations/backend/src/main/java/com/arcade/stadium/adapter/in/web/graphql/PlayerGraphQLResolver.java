package com.arcade.stadium.adapter.in.web.graphql;

import com.arcade.stadium.application.port.in.PlayerQueryService;
import com.arcade.stadium.domain.dto.PlayerFilterInput;
import com.arcade.stadium.domain.dto.PlayerResponse;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Controller
public class PlayerGraphQLResolver {

    private final PlayerQueryService playerQueryService;

    public PlayerGraphQLResolver(PlayerQueryService playerQueryService) {
        this.playerQueryService = playerQueryService;
    }

    @QueryMapping
    public Flux<PlayerResponse> listPlayers(@Argument PlayerFilterInput filter) {
        return playerQueryService.listPlayers(filter);
    }

    @QueryMapping
    public Mono<PlayerResponse> getPlayerById(@Argument UUID id) {
        return playerQueryService.getPlayerById(id);
    }
}
