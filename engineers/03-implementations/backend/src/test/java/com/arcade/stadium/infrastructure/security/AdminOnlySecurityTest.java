package com.arcade.stadium.infrastructure.security;

import com.arcade.stadium.domain.exception.ForbiddenException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AdminOnlySecurityTest {

    private AuthenticationWebFilter filter;

    @BeforeEach
    void setUp() {
        filter = new AuthenticationWebFilter("guest@arcade-stadium.local", List.of("linus.chien@gmail.com"));
    }

    @Test
    void testAdminUserAuthentication() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/")
                        .header("X-Goog-Authenticated-User-Email", "accounts.google.com:linus.chien@gmail.com")
                        .build()
        );

        WebFilterChain chain = ex -> Mono.deferContextual(ctx -> {
            UserAuthentication auth = ctx.get(UserAuthentication.class);
            assertEquals("linus.chien@gmail.com", auth.email());
            assertTrue(auth.isAdmin());
            return Mono.empty();
        });

        filter.filter(exchange, chain)
                .as(StepVerifier::create)
                .verifyComplete();
    }

    @Test
    void testNonAdminUserAuthentication() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/")
                        .header("X-Goog-Authenticated-User-Email", "accounts.google.com:regular.player@gmail.com")
                        .build()
        );

        WebFilterChain chain = ex -> Mono.deferContextual(ctx -> {
            UserAuthentication auth = ctx.get(UserAuthentication.class);
            assertEquals("regular.player@gmail.com", auth.email());
            assertFalse(auth.isAdmin());
            return Mono.empty();
        });

        filter.filter(exchange, chain)
                .as(StepVerifier::create)
                .verifyComplete();
    }

    @Test
    void testDefaultGuestEmailFallback() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/").build()
        );

        WebFilterChain chain = ex -> Mono.deferContextual(ctx -> {
            UserAuthentication auth = ctx.get(UserAuthentication.class);
            assertEquals("guest@arcade-stadium.local", auth.email());
            assertFalse(auth.isAdmin());
            return Mono.empty();
        });

        filter.filter(exchange, chain)
                .as(StepVerifier::create)
                .verifyComplete();
    }
}
