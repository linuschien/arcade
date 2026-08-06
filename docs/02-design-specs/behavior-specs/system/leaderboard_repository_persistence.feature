Feature: Leaderboard Entry Repository Persistence Internal Contract
  As the Domain Core of Arcade Stadium Platform
  I want LeaderboardEntryRepositoryAdapter to persist entries and execute Top 10 queries
  So that high score leaderboards strictly enforce score DESC and email ASC tie-breaking.

  Background:
    Given the Secondary Port "LeaderboardEntryRepositoryAdapter" (<<Repository>>) implementing "LeaderboardEntryRepository" is active

  Scenario Outline: Execute Top 10 Query with Email Tie-Breaking
    Given existing "LeaderboardEntry" records for "gameCardId" "<game_card_id>":
      | playerEmail       | score | createdAt           |
      | bob@example.com   | 10000 | 2026-08-06T10:00:00Z|
      | alice@example.com | 10000 | 2026-08-06T11:00:00Z|
      | carl@example.com  | 15000 | 2026-08-06T09:00:00Z|
    When "findTop10ByGameCardIdOrderByScoreDescPlayerEmailAsc(\"<game_card_id>\")" is called
    Then the resulting list should return elements in exact order:
      | index | playerEmail       | score |
      | 0     | carl@example.com  | 15000 |
      | 1     | alice@example.com | 10000 |
      | 2     | bob@example.com   | 10000 |

    Examples:
      | game_card_id                         |
      | 98765432-10fe-dcba-9876-543210fedcba |
