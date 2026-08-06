Feature: GCP IAP Authentication and Just-In-Time Provisioning
  As an Arcade Stadium Player
  I want to be authenticated automatically via GCP Identity-Aware Proxy
  So that my profile and wallet with daily free credits are provisioned and reset seamlessly.

  Background:
    Given the Arcade Stadium platform API service "arcade-stadium-platform-api" is running
    And the Primary Port "PlayerRestControllerAdapter" (<<RestController>>) is active on "/api/v1/players:whoami"

  Scenario Outline: JIT Provisioning for New Player via GCP IAP Header
    Given no player record exists for email "<iap_email>"
    When a POST request is sent to "/api/v1/players:whoami" with header "X-Goog-Authenticated-User-Email" set to "<iap_email>"
    Then the response status code should be <http_status>
    And a new "Player" entity with a valid UUID v4 should be created
    And a associated "UserWallet" entity should be provisioned with <initial_free_credit> "dailyFreeCredit" and 0 "adminBonusCredit"
    And the response body should contain player email "<iap_email>"

    Examples:
      | iap_email           | http_status | initial_free_credit |
      | player1@example.com | 201         | 10                  |
      | admin@arcade.com    | 201         | 10                  |

  Scenario Outline: Lazy Daily Credit Reset on Whoami Request After Midnight
    Given an existing player "<iap_email>" with wallet "dailyFreeCredit" <current_free_credit> and "lastDailyResetDate" "<last_reset_date>"
    When a POST request is sent to "/api/v1/players:whoami" with header "X-Goog-Authenticated-User-Email" set to "<iap_email>" on current date "<current_date>"
    Then the response status code should be 200
    And the wallet "dailyFreeCredit" should be updated to <expected_free_credit>
    And the "lastDailyResetDate" should be updated to "<current_date>"

    Examples:
      | iap_email          | current_free_credit | last_reset_date | current_date | expected_free_credit |
      | player@example.com | 3                   | 2026-08-05      | 2026-08-06   | 10                   |
      | player@example.com | 0                   | 2026-08-05      | 2026-08-06   | 10                   |
      | player@example.com | 5                   | 2026-08-06      | 2026-08-06   | 5                    |
