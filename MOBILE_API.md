# Mobile App API Documentation

**Base URL**: `http://<YOUR_SERVER_IP>:3001/api/v1`
*(Replace `<YOUR_SERVER_IP>` with the IP address of the machine running the backend, e.g., `192.168.1.24`)*

## Authentication

### Register User
Create a new user account.

- **Endpoint**: `POST /auth/register`
- **Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "token": "...",
    "user": { ... }
  }
  ```

### Login User
Authenticate an existing user.

- **Endpoint**: `POST /auth/login`
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "token": "...",
    "user": { ... }
  }
  ```

---

## Kuris (Chit Funds)

### Get All Kuris
Fetch a list of all available Kuris.

- **Endpoint**: `GET /kuris`
- **Query Parameters**:
  - `userId` (optional): Filter Kuris where the user is an admin or a member.
  - Example: `GET /kuris?userId=user_123`
- **Response**: Array of Kuri objects.
  ```json
  [
    {
      "id": "k_12345",
      "name": "Gold Scheme",
      "monthlyAmount": 5000,
      "status": "active",
      ...
    }
  ]
  ```

### Create Kuri
Create a new Kuri scheme.

- **Endpoint**: `POST /kuris`
- **Body**:
  ```json
  {
    "name": "My New Kuri",
    "monthlyAmount": 2000,
    "description": "Optional description"
  }
  ```
- **Response**: The created Kuri object.

---

## Users

### Get All Users
Fetch a list of all users (useful for selecting members).

- **Endpoint**: `GET /users`
- **Response**: Array of User objects.
