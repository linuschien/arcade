package com.arcade.stadium.infrastructure.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;
import reactor.util.context.Context;

import java.util.List;

@Component
public class AuthenticationWebFilter implements WebFilter {

    private final String defaultGuestEmail;
    private final List<String> adminEmails;

    public AuthenticationWebFilter(
            @Value("${arcade.guest-email:guest@arcade-stadium.local}") String defaultGuestEmail,
            @Value("${arcade.admin-emails:linus.chien@gmail.com}") List<String> adminEmails) {
        this.defaultGuestEmail = defaultGuestEmail;
        this.adminEmails = adminEmails;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String rawHeader = exchange.getRequest().getHeaders().getFirst("X-Goog-Authenticated-User-Email");
        boolean isGuest = (rawHeader == null || rawHeader.isBlank());
        String email = isGuest ? defaultGuestEmail : parseEmail(rawHeader);
        boolean isAdmin = adminEmails.contains(email);

        UserAuthentication auth = new UserAuthentication(email, isAdmin, isGuest);

        return chain.filter(exchange)
                .contextWrite(Context.of(UserAuthentication.class, auth));
    }

    private String parseEmail(String rawHeader) {
        if (rawHeader.contains(":")) {
            return rawHeader.substring(rawHeader.lastIndexOf(':') + 1);
        }
        return rawHeader;
    }
}
