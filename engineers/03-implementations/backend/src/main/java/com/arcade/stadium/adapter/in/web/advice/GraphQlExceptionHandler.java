package com.arcade.stadium.adapter.in.web.advice;

import com.arcade.stadium.domain.exception.InsufficientCreditsException;
import com.arcade.stadium.domain.exception.OptimisticLockConflictException;
import com.arcade.stadium.domain.exception.ResourceNotFoundException;
import graphql.GraphQLError;
import graphql.GraphqlErrorBuilder;
import graphql.schema.DataFetchingEnvironment;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.graphql.execution.DataFetcherExceptionResolverAdapter;
import org.springframework.graphql.execution.ErrorType;
import org.springframework.stereotype.Component;

@Component
public class GraphQlExceptionHandler extends DataFetcherExceptionResolverAdapter {

    private static final Logger log = LoggerFactory.getLogger(GraphQlExceptionHandler.class);

    @Override
    protected GraphQLError resolveToSingleError(Throwable ex, DataFetchingEnvironment env) {
        if (ex instanceof ResourceNotFoundException rnfe) {
            log.warn("GraphQL DataFetcher ResourceNotFoundException at path {}: {}", env.getExecutionStepInfo().getPath(), rnfe.getMessage());
            return GraphqlErrorBuilder.newError()
                    .errorType(ErrorType.NOT_FOUND)
                    .path(env.getExecutionStepInfo().getPath())
                    .message(rnfe.getMessage())
                    .build();
        } else if (ex instanceof InsufficientCreditsException ice) {
            log.warn("GraphQL DataFetcher InsufficientCreditsException at path {}: {}", env.getExecutionStepInfo().getPath(), ice.getMessage());
            return GraphqlErrorBuilder.newError()
                    .errorType(ErrorType.BAD_REQUEST)
                    .path(env.getExecutionStepInfo().getPath())
                    .message(ice.getMessage())
                    .build();
        } else if (ex instanceof OptimisticLockConflictException olce) {
            log.warn("GraphQL DataFetcher OptimisticLockConflictException at path {}: {}", env.getExecutionStepInfo().getPath(), olce.getMessage());
            return GraphqlErrorBuilder.newError()
                    .errorType(ErrorType.BAD_REQUEST)
                    .path(env.getExecutionStepInfo().getPath())
                    .message(olce.getMessage())
                    .build();
        }

        log.error("GraphQL DataFetcher unhandled exception at path {}", env.getExecutionStepInfo().getPath(), ex);
        return GraphqlErrorBuilder.newError()
                .errorType(ErrorType.INTERNAL_ERROR)
                .path(env.getExecutionStepInfo().getPath())
                .message(ex.getMessage() != null ? ex.getMessage() : "Internal server error")
                .build();
    }
}
