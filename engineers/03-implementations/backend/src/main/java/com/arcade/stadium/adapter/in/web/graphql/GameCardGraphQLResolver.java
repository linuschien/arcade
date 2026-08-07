package com.arcade.stadium.adapter.in.web.graphql;

import com.arcade.stadium.application.port.in.GameCardQueryService;
import com.arcade.stadium.domain.dto.GameCardFilterInput;
import com.arcade.stadium.domain.dto.GameCardResponse;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Controller
public class GameCardGraphQLResolver {

    private final GameCardQueryService gameCardQueryService;

    public GameCardGraphQLResolver(GameCardQueryService gameCardQueryService) {
        this.gameCardQueryService = gameCardQueryService;
    }

    @QueryMapping
    public Flux<GameCardResponse> listGameCards(@Argument GameCardFilterInput filter) {
        return gameCardQueryService.listGameCards(filter);
    }

    @QueryMapping
    public Mono<GameCardResponse> getGameCardBySlug(@Argument String gameId) {
        return gameCardQueryService.getGameCardBySlug(gameId);
    }
}
