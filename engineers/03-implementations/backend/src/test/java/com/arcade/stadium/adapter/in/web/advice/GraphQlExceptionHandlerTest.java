package com.arcade.stadium.adapter.in.web.advice;

import com.arcade.stadium.domain.exception.InsufficientCreditsException;
import com.arcade.stadium.domain.exception.OptimisticLockConflictException;
import com.arcade.stadium.domain.exception.ResourceNotFoundException;
import graphql.GraphQLError;
import graphql.execution.ExecutionStepInfo;
import graphql.execution.ResultPath;
import graphql.schema.DataFetchingEnvironment;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GraphQlExceptionHandlerTest {

    private GraphQlExceptionHandler exceptionHandler;
    private DataFetchingEnvironment env;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GraphQlExceptionHandler();
        env = mock(DataFetchingEnvironment.class);
        ExecutionStepInfo stepInfo = mock(ExecutionStepInfo.class);
        when(stepInfo.getPath()).thenReturn(ResultPath.parse("/testPath"));
        when(env.getExecutionStepInfo()).thenReturn(stepInfo);
    }

    @Test
    void testResolveResourceNotFoundException() {
        GraphQLError error = exceptionHandler.resolveToSingleError(new ResourceNotFoundException("Not found"), env);
        assertNotNull(error);
        assertEquals("Not found", error.getMessage());
    }

    @Test
    void testResolveInsufficientCreditsException() {
        GraphQLError error = exceptionHandler.resolveToSingleError(new InsufficientCreditsException("Out of credits"), env);
        assertNotNull(error);
        assertEquals("Out of credits", error.getMessage());
    }

    @Test
    void testResolveOptimisticLockConflictException() {
        GraphQLError error = exceptionHandler.resolveToSingleError(new OptimisticLockConflictException("Conflict", 1), env);
        assertNotNull(error);
        assertEquals("Conflict", error.getMessage());
    }

    @Test
    void testResolveGenericException() {
        GraphQLError error = exceptionHandler.resolveToSingleError(new RuntimeException("Generic error"), env);
        assertNotNull(error);
        assertEquals("Generic error", error.getMessage());
    }
}
