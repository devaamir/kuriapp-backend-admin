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

### **User Dashboard / Get All Kuris**
Fetch a list of Kuris. This endpoint is used to populate the **User Dashboard**.

**Endpoint:** `GET /kuris`
**Query Parameters:**
- `userId` (optional): **Required for Dashboard**. Filter Kuris where user is admin, member, or creator.

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

#### **Dashboard Data Calculation**
The mobile app should calculate the following from the response:
1.  **Total Savings**: Sum of `monthlyAmount * months_paid` (or simplified logic) for all Kuris.
2.  **Active Groups**: Count of Kuris where `status === 'active'`.
3.  **Next Payment**: Derive from the current date and Kuri schedule.

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
  ],
  "payments": [
    {
      "memberId": "u_101",
      "month": 1,
      "status": "paid",
      "paidDate": "2024-05-05"
    }
  ],
  "winners": [
    {
      "month": 1,
      "memberId": "u_105"
    }
  ]
}
```

#### **Displaying Winners (Mobile Integration)**
To display the winners list in the mobile app:
1.  Fetch the Kuri details using `GET /kuris/:id`.
2.  Access the `winners` array from the response.
3.  Map through the `winners` array.
4.  For each winner, find the corresponding member details in the `members` array using `memberId`.
5.  Display the Month number and the Member's Name/Avatar.

---

### **Create New Kuri**
Create a new Kuri scheme.

**Endpoint:** `POST /kuris`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "Trip to Goa 2024",
  "monthlyAmount": 2000,
  "description": "Saving up for the year end trip",
  "duration": "10 Months",
  "startDate": "2024-06-01",
  "memberIds": [] // Optional, creator is automatically added
}
```

**Note:** The authenticated user (from token) is automatically set as the Kuri admin and creator. No need to pass `adminId`. Status defaults to `pending` until approved by a global admin.

**Response (201 Created):**
```json
{
  "id": "k_601",
  "name": "Trip to Goa 2024",
  "adminId": "u_101",
  "createdBy": "u_101",
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

**Request Body (Example: Selecting/Changing Winner):**
```json
{
  "winners": [
    { "month": 1, "memberId": "u_105" }
  ]
}
```
**Note:** The Kuri Admin can change the winner for a specific month at any time, even if one was already selected. The latest request will overwrite the previous winner for that month.

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

---

## 4. Spinner Wheel (Live Synchronization)

### **Stream Spin Events (SSE)**
Connect to receive real-time spin updates for a specific Kuri.

**Endpoint:** `GET /spinner/stream/:kuriId`

**Usage:**
```javascript
const eventSource = new EventSource(`http://<YOUR_IP>:3001/api/v1/spinner/stream/${kuriId}`);

eventSource.onmessage = (event) => {
  const spinData = JSON.parse(event.data);
  // spinData: { easing, speed, rotates, winner, adminId, timestamp }
  // Trigger wheel animation with this data
};

eventSource.onerror = () => {
  eventSource.close();
};
```

---

### **Send Spin Data (Admin Only)**
Admin sends spin configuration to trigger wheel animation for all connected users.

**Endpoint:** `POST /spinner/spin/:kuriId`

**Request Body:**
```json
{
  "easing": "cubic-bezier(0.25, 0.1, 0.25, 1)",
  "speed": 3000,
  "rotates": 5,
  "winner": "u_105",
  "adminId": "u_101"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Spin broadcasted"
}
```

**Note:** Only admin users should be allowed to call this endpoint. All connected clients listening on the SSE stream will receive this spin data instantly.

