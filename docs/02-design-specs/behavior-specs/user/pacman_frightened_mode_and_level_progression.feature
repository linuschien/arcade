Feature: Pac-Man Frightened Mode and Level Progression
  As a Pac-Man Player
  I want Frightened mode duration and flash warnings to decrease per level specs until 0 seconds at Level 17+
  So that game difficulty scales authentically across levels.

  Background:
    Given the Pac-Man game service "pacman-game-service" is active

  Scenario Outline: Level-based Frightened Duration and Flash Warnings
    Given current level is <level>
    When Pac-Man eats a Power Pellet
    Then ghosts should enter Frightened Mode for exactly <fright_duration_sec> seconds
    And ghosts should flash blue/white <flash_count> times before returning to normal

    Examples:
      | level | fright_duration_sec | flash_count |
      | 1     | 6.0                 | 5           |
      | 2     | 5.0                 | 5           |
      | 3     | 4.0                 | 5           |
      | 4     | 3.0                 | 5           |
      | 5     | 2.0                 | 5           |
      | 9     | 1.0                 | 3           |
      | 17    | 0.0                 | 0           |

  Scenario Outline: Maze Clear Level Progression vs Life Loss Game Over
    Given game status in level <current_level>
    When condition "<game_condition>" occurs
    Then system state transition should be "<expected_state_transition>"

    Examples:
      | current_level | game_condition                           | expected_state_transition                                      |
      | 1             | All 244 pellets eaten                    | Flash maze, increment level to 2, reset pellets and ghosts     |
      | 1             | Ghost touches Pac-Man while not fright   | Decrement life count by 1                                      |
      | 1             | Pac-Man life count reaches 0             | Trigger Game Over modal, show 10s continue countdown window    |
