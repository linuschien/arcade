Feature: Per-Game Top 10 Leaderboard
  As an Arcade Stadium Player
  I want to submit high scores and query per-game Top 10 leaderboards
  So that scores are ranked fairly with email tie-breaking rules.

  Background:
    Given the Arcade Stadium platform API service "arcade-stadium-platform-api" is running
    And the Primary Port "LeaderboardEntryRestControllerAdapter" (<<RestController>>) is active on "/api/v1/game-cards/{gameCardId}/leaderboard-entries"
    And the Primary Port "LeaderboardEntryGraphQLResolverAdapter" (<<GraphQLResolver>>) is active for query "getTop10Leaderboard"

  Scenario Outline: Submit High Score for a Game
    Given a game card "<game_card_id>" exists for game "<game_id>"
    And an authenticated player email "<player_email>"
    When a POST request is sent to "/api/v1/game-cards/<game_card_id>/leaderboard-entries" with score <score>
    Then the response status code should be 201
    And a new "LeaderboardEntry" should be stored with score <score> and playerEmail "<player_email>"

    Examples:
      | game_card_id                         | game_id | player_email      | score |
      | 98765432-10fe-dcba-9876-543210fedcba | tetris  | alice@example.com | 15000 |
      | 11111111-2222-3333-4444-555555555555 | pacman  | bob@example.com   | 28400 |

  Scenario Outline: Query Top 10 Leaderboard with Score DESC and Email ASC Tie-Breaking
    Given existing leaderboard entries for game "<game_id>":
      | playerEmail       | score |
      | charlie@arcade.com| 10000 |
      | alice@arcade.com  | 10000 |
      | bob@arcade.com    | 12000 |
      | david@arcade.com  | 8000  |
    When GraphQL query "getTop10Leaderboard(gameId: \"<game_id>\")" is executed
    Then the returned leaderboard list should be ordered as:
      | rank | playerEmail       | score |
      | 1    | bob@arcade.com    | 12000 |
      | 2    | alice@arcade.com  | 10000 |
      | 3    | charlie@arcade.com| 10000 |
      | 4    | david@arcade.com  | 8000  |

    Examples:
      | game_id |
      | tetris  |
      | pacman  |
