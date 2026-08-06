Feature: Tetris Game Over Condition and Arcade Continue Window
  As an Arcade Player
  I want a Block Out condition to trigger a 10-second continue countdown window on Game Over
  So that I can insert a coin to continue my session without losing my current score.

  Background:
    Given the Tetris game service "tetris-game-service" is active
    And the Primary Port "TetrisGameEngineAdapter" is monitoring spawn block collisions

  Scenario Outline: Block Out Game Over Trigger
    Given the top spawn row (row 0, row 1) of the 10x20 Playfield Matrix is obstructed by locked blocks
    When a new Tetromino "<tetromino_type>" attempts to spawn at row 0
    Then a Block Out collision is detected
    And the game state should transition to "GAMEOVER"
    And a 10-second continue countdown modal should be displayed in the Host Shell

    Examples:
      | tetromino_type |
      | I              |
      | T              |

  Scenario Outline: Arcade Continue Action vs Countdown Timeout
    Given the game is in "GAMEOVER" state with a active 10-second continue countdown
    When the user triggers action "<user_action>"
    Then the system outcome should be "<expected_outcome>"

    Examples:
      | user_action                             | expected_outcome                                                            |
      | Press Coin/Continue (deduct credit)     | Clear playfield top rows, resume game state to "PLAYING", preserve score   |
      | Allow countdown to reach 0 seconds      | Finalize session, emit "GAME_OVER" summary event, transition to "LOBBY"    |
