Feature: Tetris Casual Gravity Curve and Level 15 Cap
  As a Casual Tetris Player
  I want the gravity drop speed to increase smoothly with level progression and cap at Level 15 (200ms)
  So that the game remains engaging and controllable without unplayable kill screens.

  Background:
    Given the Tetris game service "tetris-game-service" is active
    And the "TetrisGameEngineAdapter" is managing gravity tick intervals

  Scenario Outline: Level Speed Mapping and 200ms Level 15 Cap
    Given the current game level is <level>
    Then the automatic drop interval should be exactly "<drop_interval_ms>ms"

    Examples:
      | level | drop_interval_ms | experience_type |
      | 1     | 1000             | Relaxed Start   |
      | 2     | 900              | Smooth          |
      | 3     | 800              | Moderate        |
      | 5     | 600              | Steady          |
      | 8     | 450              | Mild Challenge  |
      | 10    | 350              | Fast            |
      | 12    | 250              | Intense         |
      | 15    | 200              | Max Level Cap   |
      | 18    | 200              | Capped at 200ms |

  Scenario Outline: Automatic Level Progression per 10 Lines Cleared
    Given total cumulative lines cleared is <lines_cleared>
    When line clear processing is evaluated
    Then the updated game level should be <expected_level>

    Examples:
      | lines_cleared | expected_level |
      | 0             | 1              |
      | 9             | 1              |
      | 10            | 2              |
      | 25            | 3              |
      | 140           | 15             |
      | 200           | 15             |
