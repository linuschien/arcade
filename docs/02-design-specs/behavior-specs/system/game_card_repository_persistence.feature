Feature: Game Card Repository Persistence Internal Contract
  As the Domain Core of Arcade Stadium Platform
  I want GameCardRepositoryAdapter to query and update game catalog entries
  So that play counts and cabinet details are stored reliably.

  Background:
    Given the Secondary Port "GameCardRepositoryAdapter" (<<Repository>>) implementing "GameCardRepository" is active

  Scenario Outline: Increment Game Play Count Atomically
    Given a "GameCard" record with "id" "<game_card_id>" and current "playCount" <initial_count>
    When the play count increment procedure is executed
    Then the persisted record "playCount" should be updated to <expected_count>

    Examples:
      | game_card_id                         | initial_count | expected_count |
      | 98765432-10fe-dcba-9876-543210fedcba | 50            | 51             |
      | 11111111-2222-3333-4444-555555555555 | 1000          | 1001           |
