Feature: Pac-Man 4 Ghost AI Personalities and Timer Arrays
  As a Pac-Man Player
  I want each of the 4 ghosts (Blinky, Pinky, Inky, Clyde) to exhibit distinct AI targeting and Scatter/Chase behaviors
  So that ghost movement is authentic, tactical, and predictable per level specs.

  Background:
    Given the Pac-Man game service "pacman-game-service" is active
    And 4 ghost AI controllers are active on 28x36 tile grid

  Scenario Outline: 4 Ghost AI Targeting Personalities
    Given Pac-Man is at tile position P with orientation D
    When ghost "<ghost_name>" calculates target tile T during Chase Mode
    Then the target tile calculation formula should match "<target_formula>"

    Examples:
      | ghost_name      | target_formula                                                               | personality_description |
      | Blinky (Red)    | Target = Pacman.tilePosition                                                 | Direct Pursuit Shadow   |
      | Pinky (Pink)    | Target = Pacman.tilePosition + Pacman.direction * 4                         | 4-Tile Ambush Speedy    |
      | Inky (Cyan)     | Target = (Pacman.tilePosition + Pacman.direction * 2) * 2 - Blinky.position   | Vector Intercept Bashful|
      | Clyde (Orange)  | If Dist(Clyde, Pacman) > 8 then Pacman.tilePosition else Patrol Point (0,35) | 8-Tile Radius Pokey     |

  Scenario Outline: Level-based Scatter and Chase Timer Sequences
    Given game level is <level>
    When timer array evaluation runs
    Then the Scatter and Chase duration sequence (in seconds) should be "<timer_array_sec>"

    Examples:
      | level | timer_array_sec             |
      | 1     | [7, 20, 7, 20, 5, 20, 5, ∞] |
      | 2     | [7, 20, 7, 20, 5, 20, 5, ∞] |
      | 3     | [5, 20, 5, 20, 5, 20, 5, ∞] |
      | 5     | [5, 20, 5, 20, 5, 20, 5, ∞] |
