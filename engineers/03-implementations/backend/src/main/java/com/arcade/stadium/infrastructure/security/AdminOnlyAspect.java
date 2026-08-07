package com.arcade.stadium.infrastructure.security;

import com.arcade.stadium.domain.exception.ForbiddenException;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Aspect
@Component
public class AdminOnlyAspect {

    @Around("@annotation(com.arcade.stadium.infrastructure.security.AdminOnly) || @within(com.arcade.stadium.infrastructure.security.AdminOnly)")
    public Object checkAdminOnly(ProceedingJoinPoint joinPoint) throws Throwable {
        Class<?> returnType = (joinPoint.getSignature() instanceof MethodSignature ms)
                ? ms.getReturnType()
                : Object.class;

        if (Mono.class.isAssignableFrom(returnType)) {
            return Mono.deferContextual(ctx -> {
                UserAuthentication auth = ctx.get(UserAuthentication.class);
                if (!auth.isAdmin()) {
                    return Mono.error(new ForbiddenException("Access denied: Admin privileges required for email: " + auth.email()));
                }
                try {
                    return (Mono<?>) joinPoint.proceed();
                } catch (Throwable e) {
                    return Mono.error(e);
                }
            });
        } else if (Flux.class.isAssignableFrom(returnType)) {
            return Flux.deferContextual(ctx -> {
                UserAuthentication auth = ctx.get(UserAuthentication.class);
                if (!auth.isAdmin()) {
                    return Flux.error(new ForbiddenException("Access denied: Admin privileges required for email: " + auth.email()));
                }
                try {
                    return (Flux<?>) joinPoint.proceed();
                } catch (Throwable e) {
                    return Flux.error(e);
                }
            });
        }
        return joinPoint.proceed();
    }
}
