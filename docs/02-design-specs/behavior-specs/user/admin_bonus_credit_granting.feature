Feature: Admin Bonus Credit Granting
  As an Arcade Platform Administrator
  I want to grant bonus credits to specific player wallets
  So that players can receive bonus attempts that bypass daily midnight reset.

  Background:
    Given the Arcade Stadium platform API service "arcade-stadium-platform-api" is running
    And the Primary Port "UserWalletRestControllerAdapter" (<<RestController>>) is active on "/api/v1/players/{playerId}/user-wallets/{userWalletId}:grantAdminCredit"

  Scenario Outline: Granting Admin Bonus Credit to Player Wallet
    Given player "<player_id>" owns wallet "<wallet_id>" with initial "adminBonusCredit" <initial_bonus>
    When a POST request is sent to "/api/v1/players/<player_id>/user-wallets/<wallet_id>:grantAdminCredit" with payload amount <grant_amount>
    Then the response status code should be <http_status>
    And the wallet "adminBonusCredit" should become <expected_bonus>
    And the wallet "dailyFreeCredit" should remain unchanged

    Examples:
      | player_id                           | wallet_id                           | initial_bonus | grant_amount | http_status | expected_bonus |
      | 550e8400-e29b-41d4-a716-446655440000 | a3b1c2d3-e4f5-6789-abcd-ef0123456789 | 0             | 10           | 200         | 10             |
      | 550e8400-e29b-41d4-a716-446655440000 | a3b1c2d3-e4f5-6789-abcd-ef0123456789 | 5             | 20           | 200         | 25             |
