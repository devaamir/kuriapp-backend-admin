# Mobile App API Specification

This document defines the API endpoints, request payloads, and response structures for the KuriApp Mobile Application.

**Base URL:** `http://<YOUR_IP>:3001/api/v1`
*(Replace `<YOUR_IP>` with the IP address of your backend server, e.g., `192.168.1.24`)*

---

## 1. Authentication

### **Login**
Authenticate a user and receive an access token (mock).

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "token": "mock-jwt-token",
  "user": {
    "id": "u_101",
    "name": "Arun Kumar",
    "email": "user@example.com",
    "uniqueCode": "#AK8821",
    "role": "member",
    "avatar": "https://ui-avatars.com/api/?name=Arun+Kumar"
  }
}
```

---

### **Register (Sign Up)**
Create a new user account.

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "name": "Sneha Reddy",
  "email": "sneha@example.com",
  "password": "securePass789"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "token": "mock-jwt-token",
  "user": {
    "id": "u_102",
    "name": "Sneha Reddy",
    "email": "sneha@example.com",
    "uniqueCode": "#SR9932", 
    "role": "member",
    "status": "active"
  }
}
```

---

## 2. Kuri Management

### **Get All Kuris**
Fetch a list of Kuris. Can filter by user.

**Endpoint:** `GET /kuris`
**Query Parameters:**
- `userId` (optional): Filter Kuris where user is admin, member, or creator.

**Response (200 OK):**
```json
[
  {
    "id": "k_501",
    "name": "Office Monthly Savings",
    "monthlyAmount": 5000,
    "status": "active",
    "adminId": "u_101",
    "memberIds": ["u_101", "u_105"]
  }
]
```

---

### **Get Kuri Details**
Fetch full details of a specific Kuri, including full member details.

**Endpoint:** `GET /kuris/:id`

**Response (200 OK):**
```json
{
  "id": "k_501",
  "name": "Office Monthly Savings",
  "description": "Savings group for the sales team.",
  "monthlyAmount": 5000,
  "status": "active",
  "adminId": "u_101",
  "memberIds": ["u_101", "u_105"],
  "members": [
    {
      "id": "u_101",
      "name": "Arun Kumar",
      "uniqueCode": "#AK8821",
      "avatar": "...",
      "role": "member"
    },
    {
      "id": "u_105",
      "name": "Rahul S",
      "uniqueCode": "#RS2211",
      "avatar": "...",
      "role": "member"
    }
  ],
  "payments": [
    {
      "memberId": "u_101",
      "month": 1,
      "status": "paid",
      "paidDate": "2024-05-05"
    }
  ]
}
```

---

### **Create New Kuri**
Create a new Kuri scheme.

**Endpoint:** `POST /kuris`

**Request Body:**
```json
{
  "name": "Trip to Goa 2024",
  "monthlyAmount": 2000,
  "description": "Saving up for the year end trip",
  "duration": "10 Months",
  "startDate": "2024-06-01",
  "adminId": "u_101",
  "memberIds": ["u_101"]
}
```

**Response (201 Created):**
```json
{
  "id": "k_601",
  "name": "Trip to Goa 2024",
  "status": "pending",
  ...
}
```

---

### **Update Kuri**
Update Kuri details, including adding members or updating payments.

**Endpoint:** `PUT /kuris/:id`

**Request Body (Example: Adding a member):**
```json
{
  "memberIds": ["u_101", "u_105", "u_999"]
}
```

**Request Body (Example: Updating payments):**
```json
{
  "payments": [
    { "memberId": "u_101", "month": 1, "status": "paid" }
  ]
}
```

**Response (200 OK):**
Returns the updated Kuri object.

---

### **Delete Kuri**
Delete a Kuri.

**Endpoint:** `DELETE /kuris/:id`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Kuri deleted"
}
```

---

## 3. User Management

### **Get All Users**
Fetch a list of all users. Useful for searching/selecting members.

**Endpoint:** `GET /users`

**Response (200 OK):**
```json
[
  {
    "id": "u_101",
    "name": "Arun Kumar",
    "email": "user@example.com",
    "uniqueCode": "#AK8821"
  }
]
```

### **Create User (or Dummy)**
Create a new user. If password is omitted, it's treated as a dummy user.

**Endpoint:** `POST /users`

**Request Body:**
```json
{
  "name": "Grandma",
  "email": "grandma@dummy.com",
  "role": "member"
}
```

**Response (201 Created):**
Returns the created user object.

