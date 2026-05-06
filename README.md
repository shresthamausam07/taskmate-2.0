# TaskMate

A household management web app built for roommates to stay organized and on top of shared responsibilities.

## Abstract

Living with roommates gets messy fast — who paid for groceries, whose turn is it to clean, did anyone buy soap? TaskMate is a full-stack web application that brings everything into one place. Roommates can create or join groups, track shared expenses with automatic bill splitting, assign and complete chores, manage a shared shopping list, and chat with each other in real time.

The app supports user accounts with JWT-based authentication, protected routes on both the frontend and backend, and real-time updates using Socket.io for shopping and chat. Expenses can be split among all group members or just a subset — useful for situations where not everyone was involved. The dashboard shows a running balance of what you owe and what you're owed across both groups and friends. All data is stored in MongoDB and persists across page refreshes and server restarts. The app is fully responsive and works on both mobile and desktop, and is set up as a PWA so it can be installed on your device.

## Team

- Mausam Shrestha

## Demo Video

https://drive.google.com/drive/folders/1La4r9pXmvGv_iOE_iF81TXfWi8caaCB_?usp=drive_link

## Tech Stack

**Frontend:** React 19, Vite, TailwindCSS 4, React Router v7, Socket.io client, Lucide React  
**Backend:** Node.js, Express 5, Mongoose 9, Socket.io 4, JWT, bcryptjs  
**Database:** MongoDB Atlas

## Setup

### Prerequisites
- Node.js 18+
- A MongoDB Atlas connection string (or local MongoDB)

### 1. Clone the repo
```bash
git clone https://github.com/shresthamausam07/taskmate-2.0.git
cd taskmate-2.0
```

### 2. Server setup
```bash
cd server
npm install
```

Create a `.env` file in the `server` folder:
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=any_random_secret_string
PORT=5001
```

Start the server:
```bash
node index.js
```

### 3. Client setup
```bash
cd client
npm install
npm run dev
```

The app runs at `http://localhost:5173`. The Vite dev server proxies all `/api` and `/socket.io` requests to `http://localhost:5001`.

## Test Credentials

```
Email: test@test.com
Password: test123
```

> You can also register a new account from the login page.

## Completed MVPs

- User registration, login, and logout (JWT-based, server-side token blacklist)
- Create and join groups via invite code or email invite
- Group expense tracking with automatic splitting (split among all or selected members)
- Mark individual splits as paid or settle all at once
- Chore assignments with completion tracking
- Real-time shared shopping list (Socket.io)
- Real-time group chat with message delete
- Friends system with direct expense splitting and settle up
- Dashboard with net balance overview across all groups and friends
- User profile editing and password change

## Stretch Features

- Receipt upload (stored as base64 in MongoDB) with in-app modal lightbox
- Expense analytics by category (visual breakdown per group)
- Group rename and cascade delete (creator only)
- Pending friend request badge on the nav
- Progressive Web App (PWA) — installable on desktop and mobile
- Leave group blocked if unsettled balances exist

---

## API Documentation

All routes except `/api/auth/register` and `/api/auth/login` require an `Authorization: Bearer <token>` header.

---

### Auth — `/api/auth`

---

**POST /api/auth/register**  
Register a new user account.  
Auth required: No

Request body:
```json
{ "name": "John Doe", "email": "john@example.com", "password": "secret123" }
```

Example response (201):
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": { "_id": "664abc...", "name": "John Doe", "email": "john@example.com" }
}
```

Errors: `400` fields missing, `400` email already in use

---

**POST /api/auth/login**  
Log in with email and password.  
Auth required: No

Request body:
```json
{ "email": "john@example.com", "password": "secret123" }
```

Example response (200):
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": { "_id": "664abc...", "name": "John Doe", "email": "john@example.com" }
}
```

Errors: `401` invalid credentials

---

**POST /api/auth/logout**  
Blacklists the current token so it cannot be reused.  
Auth required: Yes

Example response (200):
```json
{ "message": "Logged out" }
```

---

**PUT /api/auth/profile**  
Update name, email, or password.  
Auth required: Yes

Request body:
```json
{ "name": "New Name", "email": "new@example.com", "currentPassword": "old123", "newPassword": "new456" }
```

Example response (200):
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": { "_id": "664abc...", "name": "New Name", "email": "new@example.com" }
}
```

Errors: `400` email taken, `401` current password incorrect

---

### Households (Groups) — `/api/households`

---

**GET /api/households**  
Get all groups the current user belongs to.  
Auth required: Yes

Example response (200):
```json
[
  {
    "_id": "665abc...",
    "name": "Apartment 4B",
    "invite_code": "A3F9C2",
    "created_by": "664abc...",
    "members": [{ "_id": "664abc...", "name": "John Doe", "email": "john@example.com" }]
  }
]
```

---

**POST /api/households**  
Create a new group.  
Auth required: Yes

Request body:
```json
{ "name": "Apartment 4B" }
```

Example response (201):
```json
{ "_id": "665abc...", "name": "Apartment 4B", "invite_code": "A3F9C2", "members": [...] }
```

Errors: `400` name required

---

**GET /api/households/:id**  
Get a single group by ID.  
Auth required: Yes

Example response (200):
```json
{ "_id": "665abc...", "name": "Apartment 4B", "invite_code": "A3F9C2", "members": [...] }
```

Errors: `404` group not found

---

**PUT /api/households/:id**  
Rename a group. Creator only.  
Auth required: Yes

Request body:
```json
{ "name": "New Group Name" }
```

Example response (200):
```json
{ "_id": "665abc...", "name": "New Group Name", "members": [...] }
```

Errors: `403` not the creator, `400` name required

---

**DELETE /api/households/:id**  
Delete a group and all related data (expenses, chores, messages, shopping items). Creator only.  
Auth required: Yes

Example response (200):
```json
{ "message": "Group deleted" }
```

Errors: `403` not the creator

---

**POST /api/households/join/:code**  
Join a group using its invite code.  
Auth required: Yes

Example response (200):
```json
{ "_id": "665abc...", "name": "Apartment 4B", "members": [...] }
```

Errors: `404` invalid invite code

---

**POST /api/households/:id/leave**  
Leave a group. Blocked if unsettled balances exist.  
Auth required: Yes

Example response (200):
```json
{ "message": "Left group" }
```

Errors: `400` unsettled balances exist

---

**POST /api/households/:id/invite**  
Send an in-app invite to a registered user by email.  
Auth required: Yes

Request body:
```json
{ "email": "friend@example.com" }
```

Example response (200):
```json
{ "message": "Invite sent to Jane Smith" }
```

Errors: `404` user not found, `400` already a member or invite already sent, `403` not a group member

---

**GET /api/households/invites**  
Get all pending group invites for the current user.  
Auth required: Yes

Example response (200):
```json
[
  {
    "_id": "667abc...",
    "household_id": { "_id": "665abc...", "name": "Apartment 4B" },
    "inviter_id": { "name": "John Doe", "email": "john@example.com" },
    "status": "pending"
  }
]
```

---

**PUT /api/households/invites/:inviteId/accept**  
Accept a group invite. Adds the user to the group.  
Auth required: Yes

Example response (200):
```json
{ "_id": "665abc...", "name": "Apartment 4B", "members": [...] }
```

Errors: `404` invite not found

---

**DELETE /api/households/invites/:inviteId**  
Decline a group invite.  
Auth required: Yes

Example response (200):
```json
{ "message": "Invite declined" }
```

---

### Expenses — `/api/expenses`

---

**GET /api/expenses/group-balance**  
Net balance across all groups for the current user.  
Auth required: Yes

Example response (200):
```json
{ "balance": 24.50 }
```

Positive = owed to you, negative = you owe.

---

**GET /api/expenses/:householdId**  
Get all expenses for a group with splits.  
Auth required: Yes

Example response (200):
```json
[
  {
    "_id": "668abc...",
    "description": "Groceries",
    "amount": 60,
    "category": "food",
    "payer_id": { "_id": "664abc...", "name": "John Doe" },
    "splits": [
      { "_id": "669abc...", "user_id": { "name": "John Doe" }, "amount_owed": 30, "is_paid": true },
      { "_id": "669def...", "user_id": { "name": "Jane" }, "amount_owed": 30, "is_paid": false }
    ]
  }
]
```

---

**POST /api/expenses**  
Add a new group expense.  
Auth required: Yes

Request body:
```json
{
  "household_id": "665abc...",
  "amount": 60,
  "description": "Groceries",
  "category": "food",
  "paid_by_id": "664abc...",
  "split_among": ["664abc...", "664def..."],
  "receipt_url": "data:image/png;base64,..."
}
```

`split_among` is optional — defaults to all members. `receipt_url` is optional.

Example response (201):
```json
{ "_id": "668abc...", "description": "Groceries", "amount": 60, "category": "food" }
```

---

**PUT /api/expenses/:id**  
Edit an expense and recalculate splits.  
Auth required: Yes

Request body (all fields optional):
```json
{ "amount": 75, "description": "Groceries run", "category": "food" }
```

Example response (200):
```json
{ "_id": "668abc...", "description": "Groceries run", "amount": 75 }
```

---

**DELETE /api/expenses/:id**  
Delete an expense and all its splits.  
Auth required: Yes

Example response (200):
```json
{ "message": "Deleted" }
```

---

**PUT /api/expenses/splits/:splitId/pay**  
Mark a single expense split as paid.  
Auth required: Yes

Example response (200):
```json
{ "_id": "669abc...", "amount_owed": 30, "is_paid": true }
```

---

**PUT /api/expenses/settle-all/:householdId**  
Mark all of the current user's unpaid splits in a group as paid.  
Auth required: Yes

Example response (200):
```json
{ "message": "Settled" }
```

---

### Friends — `/api/friends`

---

**GET /api/friends/requests**  
Get all pending friend requests sent to the current user.  
Auth required: Yes

Example response (200):
```json
[
  { "_id": "670abc...", "requester_id": { "name": "Jane", "email": "jane@example.com" }, "status": "pending" }
]
```

---

**GET /api/friends/balances**  
Get balance with each friend.  
Auth required: Yes

Example response (200):
```json
[
  { "friendship_id": "670abc...", "friend": { "name": "Jane", "email": "jane@example.com" }, "balance": -15.00 }
]
```

Positive = friend owes you, negative = you owe friend.

---

**POST /api/friends/request**  
Send a friend request by email.  
Auth required: Yes

Request body:
```json
{ "email": "jane@example.com" }
```

Example response (200):
```json
{ "message": "Friend request sent" }
```

Errors: `404` user not found, `400` already friends or request already pending

---

**PUT /api/friends/:id/accept**  
Accept a friend request.  
Auth required: Yes

Example response (200):
```json
{ "_id": "670abc...", "status": "accepted" }
```

Errors: `404` request not found

---

**DELETE /api/friends/:id**  
Remove a friend or decline a request.  
Auth required: Yes

Example response (200):
```json
{ "message": "Removed" }
```

---

**GET /api/friends/:friendId/expenses**  
Get all direct expenses shared between current user and a friend.  
Auth required: Yes

Example response (200):
```json
[
  {
    "_id": "671abc...",
    "description": "Lunch",
    "amount": 30,
    "payer_id": { "name": "John Doe" },
    "splits": [...]
  }
]
```

---

**POST /api/friends/:friendId/expenses**  
Add a direct expense with a friend, split 50/50.  
Auth required: Yes

Request body:
```json
{ "amount": 30, "description": "Lunch", "category": "food", "paidBy": "me" }
```

`paidBy` is either `"me"` or `"friend"`.

Example response (201):
```json
{ "_id": "671abc...", "description": "Lunch", "amount": 30 }
```

---

**POST /api/friends/:friendId/settle**  
Mark all shared expenses with a friend as settled.  
Auth required: Yes

Example response (200):
```json
{ "message": "Settled" }
```

---

### Chores — `/api/chores`

---

**GET /api/chores/:householdId**  
Get all chores for a group.  
Auth required: Yes

Example response (200):
```json
[
  {
    "_id": "672abc...",
    "title": "Take out trash",
    "assigned_to": { "name": "John Doe" },
    "frequency": "weekly",
    "is_complete": false
  }
]
```

---

**POST /api/chores**  
Create a chore.  
Auth required: Yes

Request body:
```json
{ "household_id": "665abc...", "title": "Take out trash", "assigned_to": "664abc...", "frequency": "weekly" }
```

Example response (201):
```json
{ "_id": "672abc...", "title": "Take out trash", "assigned_to": { "name": "John Doe" }, "is_complete": false }
```

---

**PUT /api/chores/:id**  
Update a chore — mark complete, reassign, etc.  
Auth required: Yes

Request body:
```json
{ "is_complete": true }
```

Example response (200):
```json
{ "_id": "672abc...", "title": "Take out trash", "is_complete": true }
```

---

**DELETE /api/chores/:id**  
Delete a chore.  
Auth required: Yes

Example response (200):
```json
{ "message": "Deleted" }
```

---

### Shopping List — `/api/shopping`

---

**GET /api/shopping/:householdId**  
Get all shopping items for a group.  
Auth required: Yes

Example response (200):
```json
[
  { "_id": "673abc...", "name": "Milk", "quantity": 2, "is_checked": false, "added_by": { "name": "John Doe" } }
]
```

---

**POST /api/shopping**  
Add a shopping item. Emits `shopping:add` via Socket.io.  
Auth required: Yes

Request body:
```json
{ "household_id": "665abc...", "name": "Milk", "quantity": 2 }
```

Example response (201):
```json
{ "_id": "673abc...", "name": "Milk", "quantity": 2, "is_checked": false }
```

---

**PUT /api/shopping/:id**  
Update an item — check it off, change quantity, etc. Emits `shopping:update`.  
Auth required: Yes

Request body:
```json
{ "is_checked": true }
```

Example response (200):
```json
{ "_id": "673abc...", "name": "Milk", "is_checked": true }
```

---

**DELETE /api/shopping/checked/:householdId**  
Delete all checked-off items in a group. Emits `shopping:delete` for each removed item.  
Auth required: Yes

Example response (200):
```json
{ "message": "Cleared" }
```

---

**DELETE /api/shopping/:id**  
Delete a single shopping item. Emits `shopping:delete`.  
Auth required: Yes

Example response (200):
```json
{ "message": "Deleted" }
```

---

### Messages — `/api/messages`

---

**GET /api/messages/:householdId**  
Get all messages for a group, sorted oldest first.  
Auth required: Yes

Example response (200):
```json
[
  { "_id": "674abc...", "content": "Did anyone buy soap?", "sender_id": { "name": "John Doe" }, "timestamp": "2026-05-01T10:00:00Z" }
]
```

---

**POST /api/messages**  
Send a message. Emits `message:new` via Socket.io.  
Auth required: Yes

Request body:
```json
{ "household_id": "665abc...", "content": "Did anyone buy soap?" }
```

Example response (201):
```json
{ "_id": "674abc...", "content": "Did anyone buy soap?", "sender_id": { "name": "John Doe" } }
```

---

**DELETE /api/messages/:id**  
Delete your own message. Only works if sender matches current user.  
Auth required: Yes

Example response (200):
```json
{ "message": "Deleted" }
```

---

### Splits — `/api/splits`

---

**PUT /api/splits/:splitId/pay**  
Mark an individual expense split as paid.  
Auth required: Yes

Example response (200):
```json
{ "_id": "669abc...", "amount_owed": 30, "is_paid": true }
```
