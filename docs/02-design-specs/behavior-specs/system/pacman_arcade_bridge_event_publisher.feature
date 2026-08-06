Feature: Pac-Man ArcadeBridge Event Publisher Internal Contract
  As the Pac-Man Game Core
  I want the ArcadeBridgeEventPublisherAdapter to emit standardize events over the ArcadeBridge event bus
  So that the Host Shell can sync audio, high scores, pause status, and wallet operations.

  Background:
    Given the Secondary Port "ArcadeBridgeEventPublisherAdapter" (<<EventBus>>) implementing "ArcadeBridgeEventBus" is active

  Scenario Outline: Emit GAME_OVER Event with Final Summary Payload
    Given a finished Pac-Man game session with final score <final_score> and reached level <level>
    When the session terminates without continue
    Then the "ArcadeBridgeEventPublisherAdapter" should emit "GAME_OVER" event with summary:
      | gameId | score        | level   |
      | pacman | <final_score>| <level> |

    Examples:
      | final_score | level |
      | 28400       | 3     |
      | 152000      | 12    |

  Scenario Outline: Emit FRIGHT_MODE_STARTED Event on Power Pellet Consumption
    Given an active Pac-Man game session
    When Pac-Man consumes a Power Pellet
    Then the "ArcadeBridgeEventPublisherAdapter" should emit "FRIGHT_MODE_STARTED" event with fright duration payload
