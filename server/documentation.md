# IGetBack API Documentation

Unless otherwise indicated, all endpoints below should have `/api/` prepended to them.  For example, `/user/create` indicates that the proper endpoint for user creation is `/api/user/create`.

Unless otherwise indicated, all response bodies are inside an object called `data`.  So if an example response body is `{ "foo": "bar" }`, the body will actually look like `{ "data": { "foo": "bar" }}`.  If an error occurred, the response body will look like `{ "error": { "message": "reason" }}`.

All requests should be made as `POST` requests unless otherwise indicated.  All responses should come back with a 200 status if no error occurred.

Actions for trips from campus to the airport are identical to each other; the only difference is one has `fromCampus` in the URL, and the other has `fromAirport`.  So if an example endpoint is `/from{Campus,Airport}/create`, you may use `/fromCampus/create` or `fromAirport/create`.
## User Actions
* `/user/create` - create a new user
  * Request format:
    * Example body:
    ```
    {
      "firstName": "Graham",
      "lastName": "Goudeau",
      "email": "grahamgoudeau@example.com",
      "password": "BearsBeetsBattlestarGalactica"
    }
    ```
  * Response format:
    * Example body:
    ```
    {
      "newUser": {
        // new user details here
      },
      "emailSendSuccess": // true if the user was sent a confirmation email, false otherwise
    }
    ```
* `/user/login` - authenticate future user actions
  * Request format:
    * Example body:
    ```
    {
      "email": "grahamgoudeau@example.com",
      "password": "BearsBeetsBattlestarGalactica"
    }
    ```
  * Response format:
    * Example body:
    ```
    {
      "authToken": "72b0ccbbb9f3141b0...." // a long hexadecimal string
    }
    ```
    * The authToken string should be added to the browser's cookies as: `IgetbackAuth=72b0ccbbb9f3141b0...`
* `/user/subscribe/from{Campus,Airport}` - subscribe to email notifications when a matching trip is created
  * (Still in development- subject to change)
  * Request format:
    * Example body:
    ```
    {
      "tripDate": "03/21/2017", // must be in MM/dd/YYYY format
      "tripHour": 13,
      "tripQuarterHour": 30,
      "college": "Tufts University", // must be one of the colleges in server/data/colleges.dat
      "airport": "Boston, MA|BOS" // must be an airport from server/data/airport-codes.dat
    }
    ```
  * Response format:
    * Status code 200 if successful, no other data returned

## Trip Actions
* `/from{Campus,Airport}/create` - create a new trip
  * Request format:
    * Example body:
    ```
    {
      "maxOtherMembers": 3,
      "tripDate": "03/21/2017", // must be in MM/dd/YYYY format
      "tripHour": 13,
      "tripQuarterHour": 30,
      "tripName": "Spring Break",
      "college": "Tufts University", // must be one of the colleges in server/data/colleges.dat
      "airport": "Boston, MA|BOS" // must be an airport from server/data/airport-codes.dat
    }
    ```
  * Response format:
    * Example body:
    ```
    {
      // various trip details, including its new ID (probably as a field called _id)
    }
    ```
* `/from{Campus,Airport}/join` - join an existing trip
  * Request format:
    * Example body:
    ```
    {
      "tripId": "58539381c02e8054e48fc93a"
    }
    ```
  * Response format:
    * Status code 200 if successful, no other data returned
* `from{Campus,Airport}/delete/:tripId` - delete a trip that the user owns
  * Request format:
    * Method: `DELETE`
    * Replace `:tripId` above with the ID of the trip in question, e.g. 58539381c02e8054e48fc93a.
  * Response format:
    * Status code 200 if successful, no other data returned
* `from{Campus,Airport}/search` - search for matching trips
  * Request format:
    * Example body:
    ```
    {
      "tripDate": "03/21/2017", // must be in MM/dd/YYYY format
      "tripHour": 13,
      "college": "Tufts University", // must be one of the colleges in server/data/colleges.dat
      "airport": "Boston, MA|BOS" // must be an airport from server/data/airport-codes.dat
    }
    ```
  * Response format:
    * Example body (instead of an object, the `"data"` field is an array of matching trips):
    ```
    {
      "data": [
        // found trips
      ]
    }
    ```
