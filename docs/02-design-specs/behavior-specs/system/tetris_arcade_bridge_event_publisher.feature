Feature: Tetris ArcadeBridge Event Publisher Internal Contract
  As the Tetris Game Core
  I want the ArcadeBridgeEventPublisherAdapter to emit standardize events over the ArcadeBridge event bus
  So that the Host Shell can sync audio, high scores, pause status, and wallet operations.

  Background:
    Given the Secondary Port "ArcadeBridgeEventPublisherAdapter" (<<EventBus>>) implementing "ArcadeBridgeEventBus" is active

  Scenario Outline: Emit GAME_OVER Event with Final Summary Payload
    Given a finished Tetris game session with final score <final_score>, lines cleared <lines_cleared>, and reached level <level>
    When the session terminates without continue
    Then the "ArcadeBridgeEventPublisherAdapter" should emit "GAME_OVER" event with summary:
      | gameId | score        | linesCleared    | level   |
      | tetris | <final_score>| <lines_cleared> | <level> |

    Examples:
      | final_score | lines_cleared | level |
      | 45200       | 52            | 6     |
      | 128000      | 145           | 15    |

  Scenario Outline: Emit PAUSE_REQUESTED Event on User Input or Window Blur
    Given an active Tetris game in "PLAYING" state
    When trigger event "<pause_trigger>" occurs
    Then the "ArcadeBridgeEventPublisherAdapter" should emit "PAUSE_REQUESTED" event to pause canvas loop and web audio

    Examples:
      | pause_trigger    |
      | ESC Key          |
      | Gamepad START    |
      | window.onblur    |
