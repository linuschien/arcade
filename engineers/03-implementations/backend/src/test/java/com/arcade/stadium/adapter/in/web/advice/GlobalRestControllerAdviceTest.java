package com.arcade.stadium.adapter.in.web.advice;

import com.arcade.stadium.domain.dto.ConflictError;
import com.arcade.stadium.domain.dto.ErrorResponse;
import com.arcade.stadium.domain.exception.InsufficientCreditsException;
import com.arcade.stadium.domain.exception.OptimisticLockConflictException;
import com.arcade.stadium.domain.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GlobalRestControllerAdviceTest {

    private GlobalRestControllerAdvice advice;

    @BeforeEach
    void setUp() {
        advice = new GlobalRestControllerAdvice();
    }

    @Test
    void testHandleResourceNotFound() {
        ResponseEntity<ErrorResponse> resp = advice.handleResourceNotFound(new ResourceNotFoundException("Not found"));
        assertEquals(HttpStatus.NOT_FOUND, resp.getStatusCode());
        assertEquals("NOT_FOUND", resp.getBody().code());
    }

    @Test
    void testHandleInsufficientCredits() {
        ResponseEntity<ErrorResponse> resp = advice.handleInsufficientCredits(new InsufficientCreditsException("Out of credits"));
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
        assertEquals("BAD_REQUEST", resp.getBody().code());
    }

    @Test
    void testHandleOptimisticLockConflict() {
        ResponseEntity<ConflictError> resp = advice.handleOptimisticLockConflict(new OptimisticLockConflictException("Conflict", 5));
        assertEquals(HttpStatus.CONFLICT, resp.getStatusCode());
        assertEquals(5, resp.getBody().currentVersion());
    }

    @Test
    void testHandleGenericException() {
        ResponseEntity<ErrorResponse> resp = advice.handleGenericException(new RuntimeException("Server error"));
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, resp.getStatusCode());
        assertEquals("INTERNAL_SERVER_ERROR", resp.getBody().code());
    }
}
