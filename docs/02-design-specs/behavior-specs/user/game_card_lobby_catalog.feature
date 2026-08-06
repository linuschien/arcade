Feature: Game Card Lobby Catalog
  As an Arcade Stadium Player
  I want to browse the game card catalog and update play counts
  So that I can preview game details and track popular games in the lobby.

  Background:
    Given the Arcade Stadium platform API service "arcade-stadium-platform-api" is running
    And the Primary Port "GameCardGraphQLResolverAdapter" (<<GraphQLResolver>>) is active for query "listGameCards"
    And the Primary Port "GameCardRestControllerAdapter" (<<RestController>>) is active on "/api/v1/game-cards/{gameCardId}:incrementPlayCount"

  Scenario Outline: Fetch Game Cards for Lobby Carousel
    Given published game cards exist in the database:
      | gameId | title    | genre  | playCount |
      | tetris | Tetris   | Puzzle | 120       |
      | pacman | Pac-Man  | Arcade | 350       |
    When GraphQL query "listGameCards" is executed
    Then the response should return all published game cards with metadata, cover art URLs, and play counts

    Examples:
      | environment |
      | Production  |

  Scenario Outline: Increment Play Count on Game Start
    Given a game card "<game_card_id>" with current playCount <initial_count>
    When a POST request is sent to "/api/v1/game-cards/<game_card_id>:incrementPlayCount"
    Then the response status code should be 200
    And the game card playCount should become <expected_count>

    Examples:
      | game_card_id                         | initial_count | expected_count |
      | 98765432-10fe-dcba-9876-543210fedcba | 120           | 121            |
      | 11111111-2222-3333-4444-555555555555 | 350           | 351            |
