# IGetBack API Documentation

Unless otherwise indicated, all endpoints below should have `/api/` prepended to them.  For example, `/user/create` indicates that the proper endpoint for user creation is `/api/user/create`.

Unless otherwise indicated, all response bodies are inside an object called `data`.  So if an example response body is `{ "foo": "bar" }`, the body will actually look like `{ "data": { "foo": "bar" }}`.  If an error occurred, the response body will look like `{ "error": { "message": "reason" }}`.

All responses should come back with a 200 status if no error occurred.

Actions for trips from campus to the airport are identical to each other; the only difference is one has `fromCampus` in the URL, and the other has `fromAirport`.  So if an example endpoint is `/from{Campus,Airport}/create`, you may use `/fromCampus/create` or `fromAirport/create`.
## User Actions
* `/user/create` - create a new user
  * Request format:
    * Method: `POST`
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
    * Method: `POST`
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
 
## Trip Actions
* `/from{Campus,Airport}/create` - create a new trip
