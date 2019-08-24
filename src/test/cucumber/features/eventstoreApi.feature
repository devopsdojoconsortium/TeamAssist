Feature: Test all /Eventstore streams service

  Scenario: Teams stream should return valid JSON, etag and entries prop
  Given I set headers to
  | name              | value             |
  | Accept  | application/json |
    When I GET /streams/a_teams/head/backward/5?embed=tryharder
    Then response header etag should exist
    And response body should be valid json
    And response body prop: entries should not be empty
