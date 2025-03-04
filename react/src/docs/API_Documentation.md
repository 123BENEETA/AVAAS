# AVAASS API Documentation

This documentation provides details about all API endpoints available in the AVAASS application.

## Base URLs

- **Backend API**: `http://localhost:5000/api`
- **WebSocket TTS Server**: `ws://localhost:8000`

## Authentication API

Authentication is handled using JWT (JSON Web Tokens). Most endpoints require a valid token.

### Register User

Creates a new user account.

- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Auth required**: No
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "johndoe@example.com",
    "password": "securepassword123"
  }
  ```
- **Success Response**:
  - **Code**: 201 Created
  - **Content**:
    ```json
    {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "John Doe",
      "email": "johndoe@example.com",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```
- **Error Response**:
  - **Code**: 400 Bad Request
  - **Content**: `{ "message": "User already exists" }` or `{ "message": "Invalid user data" }`

### Login User

Authenticates a user and returns a JWT token.

- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Auth required**: No
- **Request Body**:
  ```json
  {
    "email": "johndoe@example.com",
    "password": "securepassword123"
  }
  ```
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    ```json
    {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "John Doe",
      "email": "johndoe@example.com",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```
- **Error Response**:
  - **Code**: 401 Unauthorized
  - **Content**: `{ "message": "Invalid email or password" }`

### Get Current User

Retrieves the currently authenticated user's profile.

- **URL**: `/api/auth/user`
- **Method**: `GET`
- **Auth required**: Yes
- **Headers**: `Authorization: Bearer [JWT_TOKEN]`
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    ```json
    {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "John Doe",
      "email": "johndoe@example.com"
    }
    ```
- **Error Response**:
  - **Code**: 401 Unauthorized
  - **Content**: `{ "message": "Not authorized" }`

### Social Authentication

Handles authentication through social providers (Google, Facebook, etc.).

- **URL**: `/api/auth/social`
- **Method**: `POST`
- **Auth required**: No
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "johndoe@example.com",
    "provider": "google"
  }
  ```
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    ```json
    {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "John Doe",
      "email": "johndoe@example.com",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```

### Forgot Password

Sends a password reset email to the user.

- **URL**: `/api/auth/forgot-password`
- **Method**: `POST`
- **Auth required**: No
- **Request Body**:
  ```json
  {
    "email": "johndoe@example.com"
  }
  ```
- **Success Response**:
  - **Code**: 200 OK
  - **Content**: `{ "message": "Password reset email sent" }`
- **Error Response**:
  - **Code**: 404 Not Found
  - **Content**: `{ "message": "No account with that email was found" }`

### Reset Password

Resets a user's password using a valid reset token.

- **URL**: `/api/auth/reset-password/:resetToken`
- **Method**: `PUT`
- **Auth required**: No
- **URL Parameters**: `resetToken=[string]`
- **Request Body**:
  ```json
  {
    "password": "newSecurePassword123"
  }
  ```
- **Success Response**:
  - **Code**: 200 OK
  - **Content**: `{ "message": "Password updated successfully" }`
- **Error Response**:
  - **Code**: 400 Bad Request
  - **Content**: `{ "message": "Invalid or expired token" }`

## Text-to-Speech API

### TTS WebSocket

Converts text to speech audio and streams the audio data to the client.

- **URL**: `ws://localhost:8000/tts`
- **Protocol**: WebSocket
- **Auth required**: No
- **Request Format**: Send text as WebSocket message
- **Response Format**: Binary audio chunks followed by "END" text message
- **Example Usage**:
  ```javascript
  const ws = new WebSocket('ws://localhost:8000/tts');
  
  ws.onopen = () => {
    ws.send('Hello, this is a text to be converted to speech.');
  };
  
  ws.onmessage = (event) => {
    if (event.data instanceof Blob) {
      // Handle binary audio data
      const audioChunk = event.data;
      // Process audio chunk
    } else if (event.data === "END") {
      // End of audio stream
      console.log('Audio streaming completed');
    } else if (event.data.startsWith("ERROR:")) {
      // Handle error
      console.error(event.data);
    }
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  ws.onclose = () => {
    console.log('WebSocket connection closed');
  };
  ```

### Health Check Endpoint

Checks the status of the TTS service.

- **URL**: `/health`
- **Method**: `GET`
- **Auth required**: No
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    ```json
    {
      "status": "healthy",
      "model_loaded": true,
      "phonemizer": "g2p_en"
    }
    ```

## Audio Processing API

### Whisper Speech-to-Text

Converts whispered audio to text.

- **URL**: `/api/speech/whisper`
- **Method**: `POST`
- **Auth required**: Yes
- **Headers**: `Authorization: Bearer [JWT_TOKEN]`
- **Content-Type**: `multipart/form-data`
- **Request Body**: Form data with audio file
  ```
  audio: [binary audio file]
  ```
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    ```json
    {
      "text": "This is the transcribed text from the whispered audio."
    }
    ```
- **Error Response**:
  - **Code**: 400 Bad Request
  - **Content**: `{ "message": "No audio file provided" }`

## User Profile API

### Update User Profile

Updates the authenticated user's profile information.

- **URL**: `/api/users/profile`
- **Method**: `PUT`
- **Auth required**: Yes
- **Headers**: `Authorization: Bearer [JWT_TOKEN]`
- **Request Body**:
  ```json
  {
    "name": "Updated Name",
    "email": "updated@example.com",
    "password": "newPassword123" // Optional
  }
  ```
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    ```json
    {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "Updated Name",
      "email": "updated@example.com"
    }
    ```

### Get User History

Retrieves the user's speech conversion history.

- **URL**: `/api/users/history`
- **Method**: `GET`
- **Auth required**: Yes
- **Headers**: `Authorization: Bearer [JWT_TOKEN]`
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    ```json
    [
      {
        "_id": "60d21c1567d0d8992e610c86",
        "text": "This is a saved message",
        "audioUrl": "/uploads/audio/60d21c1567d0d8992e610c86.wav",
        "createdAt": "2023-10-15T14:22:30.123Z"
      }
    ]
    ```

## Error Handling

All API endpoints follow a consistent error response format:

```json
{
  "message": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `200 OK`: The request was successful
- `201 Created`: The resource was successfully created
- `400 Bad Request`: The request was invalid or cannot be served
- `401 Unauthorized`: Authentication is required or failed
- `403 Forbidden`: The request was valid but the server refuses action
- `404 Not Found`: The requested resource could not be found
- `500 Internal Server Error`: An error occurred on the server

## Authentication

Most endpoints require authentication using a JWT token. To authenticate requests:

1. Obtain a token by registering or logging in
2. Include the token in the Authorization header of subsequent requests:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## Rate Limiting

API endpoints are subject to rate limiting to prevent abuse:
- Authentication endpoints: 5 requests per minute
- Other endpoints: 100 requests per minute per user

Exceeding these limits will result in a `429 Too Many Requests` response.
