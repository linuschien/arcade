Feature: User Wallet Credit Deduction
  As an Arcade Stadium Player
  I want to deduct credits seamlessly when starting or continuing a game
  So that my balance is updated accurately according to the deduction priority rules.

  Background:
    Given the Arcade Stadium platform API service "arcade-stadium-platform-api" is running
    And the Primary Port "UserWalletRestControllerAdapter" (<<RestController>>) is active on "/api/v1/players/{playerId}/user-wallets/{userWalletId}:deductCredit"

  Scenario Outline: Atomic Credit Deduction with Daily Free First Priority
    Given player "<player_id>" owns wallet "<wallet_id>" with "dailyFreeCredit" <daily_free> and "adminBonusCredit" <admin_bonus>
    When a POST request is sent to "/api/v1/players/<player_id>/user-wallets/<wallet_id>:deductCredit"
    Then the response status code should be <http_status>
    And the wallet "dailyFreeCredit" should become <expected_daily_free>
    And the wallet "adminBonusCredit" should become <expected_admin_bonus>

    Examples:
      | player_id                           | wallet_id                           | daily_free | admin_bonus | http_status | expected_daily_free | expected_admin_bonus |
      | 550e8400-e29b-41d4-a716-446655440000 | a3b1c2d3-e4f5-6789-abcd-ef0123456789 | 10         | 5           | 200         | 9                   | 5                    |
      | 550e8400-e29b-41d4-a716-446655440000 | a3b1c2d3-e4f5-6789-abcd-ef0123456789 | 1          | 5           | 200         | 0                   | 5                    |
      | 550e8400-e29b-41d4-a716-446655440000 | a3b1c2d3-e4f5-6789-abcd-ef0123456789 | 0          | 3           | 200         | 0                   | 2                    |

  Scenario Outline: Insufficient Funds Deduction Rejection
    Given player "<player_id>" owns wallet "<wallet_id>" with "dailyFreeCredit" 0 and "adminBonusCredit" 0
    When a POST request is sent to "/api/v1/players/<player_id>/user-wallets/<wallet_id>:deductCredit"
    Then the response status code should be 400
    And the response body error message should indicate insufficient credit
    And the wallet "dailyFreeCredit" should remain 0
    And the wallet "adminBonusCredit" should remain 0

    Examples:
      | player_id                           | wallet_id                           |
      | 550e8400-e29b-41d4-a716-446655440000 | a3b1c2d3-e4f5-6789-abcd-ef0123456789 |
