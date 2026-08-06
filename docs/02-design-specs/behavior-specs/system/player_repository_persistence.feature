Feature: Player Repository Persistence Internal Contract
  As the Domain Core of Arcade Stadium Platform
  I want the PlayerRepositoryAdapter to persist and query Player entities reliably
  So that player records maintain UUID v4 integrity and GCP IAP email indexing.

  Background:
    Given the Secondary Port "PlayerRepositoryAdapter" (<<Repository>>) implementing "PlayerRepository" is initialized with R2DBC H2 database

  Scenario Outline: Persist New Player Entity with UUID Primary Key
    Given a new "Player" entity with email "<gcp_iap_email>"
    When the "PlayerRepositoryAdapter" saves the entity
    Then the persisted record should have a non-null UUID v4 "id"
    And the "gcpIapEmail" should match "<gcp_iap_email>"
    And the "createdAt" timestamp should be populated automatically

    Examples:
      | gcp_iap_email     |
      | player@arcade.com |
      | admin@arcade.com  |

  Scenario Outline: Find Player by GCP IAP Email Secondary Index
    Given an existing "Player" entity in database with email "<gcp_iap_email>" and id "<player_id>"
    When the "PlayerRepositoryAdapter" invokes "findByGcpIapEmail(\"<gcp_iap_email>\")"
    Then the returning Optional should contain the Player entity with id "<player_id>"

    Examples:
      | gcp_iap_email      | player_id                           |
      | tester@arcade.com  | 550e8400-e29b-41d4-a716-446655440000 |
