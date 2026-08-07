package com.arcade.stadium.adapter.in.web.graphql;

import com.arcade.stadium.application.port.in.LeaderboardEntryQueryService;
import com.arcade.stadium.domain.dto.LeaderboardEntryResponse;
import com.arcade.stadium.domain.dto.LeaderboardFilterInput;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;
import reactor.core.publisher.Flux;

@Controller
public class LeaderboardEntryGraphQLResolver {

    private final LeaderboardEntryQueryService leaderboardQueryService;

    public LeaderboardEntryGraphQLResolver(LeaderboardEntryQueryService leaderboardQueryService) {
        this.leaderboardQueryService = leaderboardQueryService;
    }

    @QueryMapping
    public Flux<LeaderboardEntryResponse> getTop10Leaderboard(@Argument String gameId) {
        return leaderboardQueryService.getTop10Leaderboard(gameId);
    }

    @QueryMapping
    public Flux<LeaderboardEntryResponse> listLeaderboardEntries(@Argument LeaderboardFilterInput filter) {
        return leaderboardQueryService.listLeaderboardEntries(filter);
    }
}
