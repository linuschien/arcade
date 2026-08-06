Feature: Tetris State Store Adapter Internal Contract
  As the Tetris Game Engine
  I want the TetrisStateStoreAdapter to maintain in-memory playfield matrix state and scoring accumulators
  So that game state remains fast, thread-safe, and deterministic across render cycles.

  Background:
    Given the Secondary Port "TetrisStateStoreAdapter" (<<ClientStateStore>>) implementing "TetrisStateStore" is initialized

  Scenario Outline: Matrix State Update on Piece Lock Down
    Given a 10x20 Playfield Matrix initialized with empty cells
    When a Tetromino "<piece_type>" locks down at grid coordinate (<grid_x>, <grid_y>)
    Then the "TetrisStateStoreAdapter" should update matrix cells at (<grid_x>, <grid_y>) to state occupied by "<piece_type>"
    And the current score accumulator should be incremented by <lock_down_score>

    Examples:
      | piece_type | grid_x | grid_y | lock_down_score |
      | O          | 4      | 18     | 0               |
      | I          | 3      | 19     | 0               |
