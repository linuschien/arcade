Feature: Pac-Man State Store Adapter Internal Contract
  As the Pac-Man Game Engine
  I want the PacmanStateStoreAdapter to maintain tile matrix states, pellet counts, lives, and active ghost states
  So that state transitions remain fast, isolated, and deterministic across render cycles.

  Background:
    Given the Secondary Port "PacmanStateStoreAdapter" (<<ClientStateStore>>) implementing "PacmanStateStore" is initialized

  Scenario Outline: In-Memory Maze Pellet Matrix Consumption State Tracking
    Given a Pac-Man maze tile matrix with 244 active pellets
    When Pac-Man moves through tile (<tile_x>, <tile_y>) containing a pellet
    Then the "PacmanStateStoreAdapter" should update tile (<tile_x>, <tile_y>) state to EMPTY
    And the remaining pellet count in store should be decremented to <expected_remaining_pellets>

    Examples:
      | tile_x | tile_y | expected_remaining_pellets |
      | 1      | 1      | 243                        |
      | 1      | 2      | 242                        |
