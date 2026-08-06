Feature: Tetris Gameplay Mechanics and Controls
  As a Tetris Player
  I want to rotate, drop, hold, and clear lines of Tetrominoes using standard controls
  So that I can score points and enjoy casual arcade gameplay.

  Background:
    Given the Tetris game service "tetris-game-service" is active
    And the Primary Port "TetrisGameEngineAdapter" (<<ClientGameEngine>>) and "TetrisInputAdapter" (<<InputAdapter>>) are initialized

  Scenario Outline: Fair Tetromino Spawning via 7-Bag Generator
    Given a new Tetris game round is started
    When 7 consecutive Tetrominoes are spawned
    Then the set of spawned pieces must contain exactly one of each: "I", "J", "L", "O", "S", "T", "Z"

    Examples:
      | round_id |
      | 1        |
      | 2        |

  Scenario Outline: Line Clear Scoring Progression
    Given current game level is <level>
    When <lines_cleared> lines are cleared simultaneously on a single drop
    Then the awarded score increment should be <expected_score_increment>

    Examples:
      | level | lines_cleared | expected_score_increment | clear_type |
      | 1     | 1             | 100                      | Single     |
      | 1     | 2             | 300                      | Double     |
      | 1     | 3             | 500                      | Triple     |
      | 1     | 4             | 800                      | Tetris     |
      | 5     | 1             | 500                      | Single     |
      | 5     | 4             | 4000                     | Tetris     |

  Scenario Outline: Classic vs Modern Mode Feature Availability
    Given game mode is configured as "<game_mode>"
    Then the Hold Queue feature availability should be <hold_available>
    And the Ghost Piece preview availability should be <ghost_available>
    And the Next Piece preview window count should be <next_count>

    Examples:
      | game_mode    | hold_available | ghost_available | next_count |
      | Classic Mode | false          | false           | 1          |
      | Modern Mode  | true           | true            | 3          |

  Scenario Outline: Soft Drop and Hard Drop Bonus Points
    Given a active falling Tetromino at row <start_row>
    When player executes "<drop_action>" to locked row <end_row>
    Then the bonus score awarded for drop distance should be <expected_bonus_points>

    Examples:
      | start_row | end_row | drop_action | expected_bonus_points |
      | 0         | 15      | Soft Drop   | 15                    |
      | 0         | 18      | Hard Drop   | 36                    |
