package com.arcade.stadium.adapter.in.web.rest;

import com.arcade.stadium.application.port.in.PlayerCommandService;
import com.arcade.stadium.application.port.in.PlayerQueryService;
import com.arcade.stadium.domain.dto.CreatePlayerCommand;
import com.arcade.stadium.domain.dto.PlayerRequest;
import com.arcade.stadium.domain.dto.PlayerResponse;
import com.arcade.stadium.domain.dto.UpdatePlayerCommand;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.UUID;

import com.arcade.stadium.infrastructure.security.AdminOnly;
import com.arcade.stadium.infrastructure.security.UserAuthentication;

@RestController
@RequestMapping("/api/v1")
public class PlayerRestController {

    private final PlayerCommandService playerCommandService;
    private final PlayerQueryService playerQueryService;

    public PlayerRestController(PlayerCommandService playerCommandService, PlayerQueryService playerQueryService) {
        this.playerCommandService = playerCommandService;
        this.playerQueryService = playerQueryService;
    }

    @PostMapping("/players:whoami")
    public Mono<ResponseEntity<PlayerResponse>> whoami() {
        return Mono.deferContextual(ctx -> {
            UserAuthentication auth = ctx.get(UserAuthentication.class);
            return playerCommandService.whoami(auth.email())
                    .map(ResponseEntity::ok);
        });
    }

    @AdminOnly
    @PostMapping("/players")
    public Mono<ResponseEntity<PlayerResponse>> createPlayer(@Valid @RequestBody PlayerRequest request) {
        return playerCommandService.createPlayer(new CreatePlayerCommand(request.gcpIapEmail()))
                .map(response -> ResponseEntity.status(HttpStatus.CREATED).body(response));
    }

    @AdminOnly
    @GetMapping("/players/{playerId}")
    public Mono<ResponseEntity<PlayerResponse>> getPlayerById(@PathVariable UUID playerId) {
        return playerQueryService.getPlayerById(playerId)
                .map(ResponseEntity::ok);
    }

    @AdminOnly
    @PutMapping("/players/{playerId}")
    public Mono<ResponseEntity<PlayerResponse>> updatePlayer(
            @PathVariable UUID playerId,
            @Valid @RequestBody PlayerRequest request) {
        return playerCommandService.updatePlayer(playerId, new UpdatePlayerCommand(request.gcpIapEmail()))
                .map(ResponseEntity::ok);
    }

    @AdminOnly
    @DeleteMapping("/players/{playerId}")
    public Mono<ResponseEntity<Void>> deletePlayer(@PathVariable UUID playerId) {
        return playerCommandService.deletePlayer(playerId)
                .then(Mono.just(ResponseEntity.noContent().build()));
    }
}
