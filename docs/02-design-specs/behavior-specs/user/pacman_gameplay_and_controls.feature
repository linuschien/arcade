Feature: Pac-Man Gameplay Mechanics and Controls
  As a Pac-Man Player
  I want to control Pac-Man through the maze, eat dots, power pellets, and fruits using InputService
  So that I can clear levels and earn high scores.

  Background:
    Given the Pac-Man game service "pacman-game-service" is active
    And the Primary Port "PacmanGameEngineAdapter" (<<ClientGameEngine>>) and "PacmanInputAdapter" (<<InputAdapter>>) are initialized

  Scenario Outline: Scoring Breakdown for Dots, Power Pellets, and Fruits
    Given Pac-Man moves into a tile containing item "<item_type>"
    When the collision is processed by the game engine
    Then the item should be removed from the tile matrix
    And the player score should be incremented by <score_value>

    Examples:
      | item_type    | score_value |
      | Pellet       | 10          |
      | Power Pellet | 50          |
      | Cherry       | 100         |
      | Strawberry   | 300         |
      | Peach        | 500         |
      | Apple        | 700         |
      | Pineapple    | 1000        |
      | Galaxian     | 2000        |
      | Bell         | 3000        |
      | Key          | 5000        |

  Scenario Outline: Dynamic Fruit Spawning Triggers and 9.5-Second Despawn Timer
    Given a Pac-Man maze initialized with 244 total pellets
    When the remaining pellet count drops to <remaining_pellets>
    Then a fruit "<fruit_name>" should spawn at Ghost House bottom tile (13, 20)
    And if not eaten within 9.5 seconds, the fruit should despawn automatically

    Examples:
      | remaining_pellets | trigger_condition | fruit_name |
      | 174               | 70 dots eaten     | Level Fruit|
      | 74                | 170 dots eaten    | Level Fruit|

  Scenario Outline: Sequential Ghost Eating Multiplier Scoring
    Given Frightened Mode is active
    When Pac-Man eats <ghosts_eaten_in_fright_mode> ghosts sequentially during a single Frightened Mode cycle
    Then the score awarded for the last eaten ghost should be <expected_ghost_score>

    Examples:
      | ghosts_eaten_in_fright_mode | expected_ghost_score |
      | 1                           | 200                  |
      | 2                           | 400                  |
      | 3                           | 800                  |
      | 4                           | 1600                 |
