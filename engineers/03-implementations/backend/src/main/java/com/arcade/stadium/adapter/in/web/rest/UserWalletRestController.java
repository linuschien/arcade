package com.arcade.stadium.adapter.in.web.rest;

import com.arcade.stadium.application.port.in.UserWalletCommandService;
import com.arcade.stadium.application.port.in.UserWalletQueryService;
import com.arcade.stadium.domain.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.UUID;

import com.arcade.stadium.infrastructure.security.AdminOnly;

@AdminOnly
@RestController
@RequestMapping("/api/v1/players/{playerId}/user-wallets")
public class UserWalletRestController {

    private final UserWalletCommandService walletCommandService;
    private final UserWalletQueryService walletQueryService;

    public UserWalletRestController(UserWalletCommandService walletCommandService, UserWalletQueryService walletQueryService) {
        this.walletCommandService = walletCommandService;
        this.walletQueryService = walletQueryService;
    }

    @PostMapping
    public Mono<ResponseEntity<UserWalletResponse>> createUserWallet(
            @PathVariable UUID playerId,
            @Valid @RequestBody UserWalletRequest request) {
        return walletCommandService.createUserWallet(new CreateWalletCommand(playerId, request.dailyFreeCredit(), request.adminBonusCredit()))
                .map(response -> ResponseEntity.status(HttpStatus.CREATED).body(response));
    }

    @GetMapping("/{userWalletId}")
    public Mono<ResponseEntity<UserWalletResponse>> getUserWalletById(
            @PathVariable UUID playerId,
            @PathVariable UUID userWalletId) {
        return walletQueryService.getUserWalletById(userWalletId)
                .map(ResponseEntity::ok);
    }

    @PutMapping("/{userWalletId}")
    public Mono<ResponseEntity<UserWalletResponse>> updateUserWallet(
            @PathVariable UUID playerId,
            @PathVariable UUID userWalletId,
            @Valid @RequestBody UserWalletRequest request) {
        return walletCommandService.updateUserWallet(userWalletId, new UpdateWalletCommand(playerId, request.dailyFreeCredit(), request.adminBonusCredit()))
                .map(ResponseEntity::ok);
    }

    @DeleteMapping("/{userWalletId}")
    public Mono<ResponseEntity<Void>> deleteUserWallet(
            @PathVariable UUID playerId,
            @PathVariable UUID userWalletId) {
        return walletCommandService.deleteUserWallet(userWalletId)
                .then(Mono.just(ResponseEntity.noContent().build()));
    }

    @PostMapping("/{userWalletId}:grantAdminCredit")
    public Mono<ResponseEntity<OperationStatus>> grantAdminCredit(
            @PathVariable UUID playerId,
            @PathVariable UUID userWalletId,
            @Valid @RequestBody GrantAdminCreditRequest request) {
        return walletCommandService.grantAdminCredit(playerId, userWalletId, request.amount())
                .map(ResponseEntity::ok);
    }
}
