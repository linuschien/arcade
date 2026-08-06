Feature: User Wallet Repository Persistence and Concurrency Internal Contract
  As the Domain Core of Arcade Stadium Platform
  I want the UserWalletRepositoryAdapter to enforce atomic credit updates and optimistic locking
  So that credit deductions are thread-safe and optimistic lock conflicts return 409 status.

  Background:
    Given the Secondary Port "UserWalletRepositoryAdapter" (<<Repository>>) implementing "UserWalletRepository" is initialized with R2DBC H2 database

  Scenario Outline: Atomic Credit Deduction and Version Increment
    Given an existing "UserWallet" record with "id" "<wallet_id>", "dailyFreeCredit" <initial_free>, "adminBonusCredit" <initial_bonus>, and "version" <initial_version>
    When "UserWalletRepositoryAdapter" executes credit deduction for 1 credit
    Then the persisted record "dailyFreeCredit" should be <expected_free>
    And the persisted record "adminBonusCredit" should be <expected_bonus>
    And the entity "@Version" field should be incremented to <expected_version>

    Examples:
      | wallet_id                           | initial_free | initial_bonus | initial_version | expected_free | expected_bonus | expected_version |
      | a3b1c2d3-e4f5-6789-abcd-ef0123456789 | 10           | 0             | 1               | 9             | 0              | 2                |
      | a3b1c2d3-e4f5-6789-abcd-ef0123456789 | 0            | 5             | 3               | 0             | 4              | 4                |

  Scenario Outline: Optimistic Locking Stale Version Conflict Handling (409 Conflict)
    Given an existing "UserWallet" record with "id" "<wallet_id>" and current database version 5
    When a concurrent update transaction attempts to save with stale version <stale_version>
    Then the "UserWalletRepositoryAdapter" should throw an OptimisticLockingFailureException
    And the application service should map the exception to HTTP 409 Conflict status

    Examples:
      | wallet_id                           | stale_version |
      | a3b1c2d3-e4f5-6789-abcd-ef0123456789 | 4             |
      | a3b1c2d3-e4f5-6789-abcd-ef0123456789 | 2             |
