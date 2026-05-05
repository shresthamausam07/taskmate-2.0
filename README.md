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
git clone <your-repo-url>
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

All routes except `/api/auth/register` and `/api/auth/login` require a Bearer token in the `Authorization` header.

---

### Auth — `/api/auth`

**POST /api/auth/register**  
Register a new account.  
Body: `{ name, email, password }`  
Returns: `{ token, user }`  
Errors: 400 if fields missing or email taken

**POST /api/auth/login**  
Log in with email and password.  
Body: `{ email, password }`  
Returns: `{ token, user }`  
Errors: 401 if credentials are wrong

**POST /api/auth/logout**  
Blacklists the current token so it can't be reused.  
Returns: `{ message: "Logged out" }`

**PUT /api/auth/profile**  
Update name, email, or password.  
Body: `{ name?, email?, currentPassword?, newPassword? }`  
Returns: `{ token, user }` (new token issued if name/email changed)  
Errors: 400 if email taken, 401 if currentPassword is wrong

---

### Households (Groups) — `/api/households`

**GET /api/households**  
Get all groups the current user belongs to.  
Returns: array of household objects with populated members

**POST /api/households**  
Create a new group.  
Body: `{ name }`  
Returns: the created household

**GET /api/households/:id**  
Get a single group by ID including members, invite code.

**PUT /api/households/:id**  
Rename a group. Creator only.  
Body: `{ name }`  
Errors: 403 if not the creator

**DELETE /api/households/:id**  
Delete a group and all its expenses, chores, messages, and shopping items. Creator only.  
Errors: 403 if not the creator

**POST /api/households/join/:code**  
Join a group using its invite code.  
Returns: the household

**POST /api/households/:id/leave**  
Leave a group. Blocked if user has unsettled balances.  
Errors: 400 with message if balances exist

**POST /api/households/:id/invite**  
Send an in-app invite to another registered user by email.  
Body: `{ email }`  
Errors: 404 if user not found, 400 if already a member or invite already sent, 403 if not a member

**GET /api/households/invites**  
Get all pending group invites for the current user.  
Returns: array of invites with group name and inviter info

**PUT /api/households/invites/:inviteId/accept**  
Accept a group invite. Adds user to the group.

**DELETE /api/households/invites/:inviteId**  
Decline a group invite.

---

### Expenses — `/api/expenses`

**GET /api/expenses/group-balance**  
Net balance across all groups for the current user.  
Returns: `{ balance }` (positive = owed to you, negative = you owe)

**GET /api/expenses/:householdId**  
Get all expenses for a group, each with their splits.

**POST /api/expenses**  
Add a new group expense.  
Body: `{ household_id, amount, description, category, paid_by_id?, split_among?, receipt_url? }`  
`split_among` is an array of user IDs — defaults to all members if omitted.  
Returns: the created expense

**PUT /api/expenses/:id**  
Edit an expense and recalculate splits.  
Body: `{ amount?, description?, category?, paid_by_id?, split_among?, receipt_url? }`

**DELETE /api/expenses/:id**  
Delete an expense and all its splits.

**PUT /api/expenses/splits/:splitId/pay**  
Mark a single split as paid.

**PUT /api/expenses/settle-all/:householdId**  
Mark all of the current user's unpaid splits in a group as paid.

---

### Friends — `/api/friends`

**GET /api/friends/requests**  
Get pending friend requests sent to the current user.

**GET /api/friends/balances**  
Get balance with each friend (positive = they owe you, negative = you owe them).

**POST /api/friends/request**  
Send a friend request by email.  
Body: `{ email }`  
Errors: 404 if user not found, 400 if already friends or request pending

**PUT /api/friends/:id/accept**  
Accept a friend request.

**DELETE /api/friends/:id**  
Remove a friend or decline a request.

**GET /api/friends/:friendId/expenses**  
Get all direct expenses shared between current user and a friend.

**POST /api/friends/:friendId/expenses**  
Add a direct expense with a friend (split 50/50).  
Body: `{ amount, description, category, paidBy }` where `paidBy` is `"me"` or `"friend"`

**POST /api/friends/:friendId/settle**  
Mark all shared expenses with a friend as settled.

---

### Chores — `/api/chores`

**GET /api/chores/:householdId**  
Get all chores for a group.

**POST /api/chores**  
Create a chore.  
Body: `{ household_id, title, assigned_to, frequency, due_date? }`

**PUT /api/chores/:id**  
Update a chore (e.g., mark complete, reassign).  
Body: any chore fields

**DELETE /api/chores/:id**  
Delete a chore.

---

### Shopping List — `/api/shopping`

**GET /api/shopping/:householdId**  
Get all shopping items for a group.

**POST /api/shopping**  
Add an item. Emits `shopping:add` via Socket.io.  
Body: `{ household_id, name, quantity? }`

**PUT /api/shopping/:id**  
Update an item (e.g., check it off). Emits `shopping:update`.  
Body: any item fields

**DELETE /api/shopping/checked/:householdId**  
Delete all checked-off items in a group. Emits `shopping:delete` for each.

**DELETE /api/shopping/:id**  
Delete a single item. Emits `shopping:delete`.

---

### Messages — `/api/messages`

**GET /api/messages/:householdId**  
Get all messages for a group, sorted oldest first.

**POST /api/messages**  
Send a message. Emits `message:new` via Socket.io.  
Body: `{ household_id, content }`

**DELETE /api/messages/:id**  
Delete your own message.  
Errors: only deletes if `sender_id` matches current user

---

### Splits — `/api/splits`

**PUT /api/splits/:splitId/pay**  
Mark an individual expense split as paid.

---

All routes except `/api/auth/register` and `/api/auth/login` require an `Authorization: Bearer <token>` header.
