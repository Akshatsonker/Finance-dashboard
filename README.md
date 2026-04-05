# Finance Dashboard Backend

This project is a backend system for a finance dashboard where users can manage financial records based on their roles and permissions.

The goal of this project is to demonstrate backend design, API structure, role-based access control, and data handling in a clean and practical way.

---

## Overview

The system allows different types of users to interact with financial data:

* **Viewer** → Can only view data
* **Analyst** → Can view records and access summaries
* **Admin** → Full access (create, update, delete, manage users)

It supports managing financial transactions and provides summary data that can be used in a dashboard.

---

## Features

### User & Role Management

* Create and manage users
* Assign roles (Viewer, Analyst, Admin)
* Enable/disable users
* Restrict actions based on roles

### Financial Records

* Create, update, delete transactions
* View all records
* Filter records by:

  * Date range
  * Category
  * Type (income / expense)

### Dashboard APIs

* Total income
* Total expenses
* Net balance
* Category-wise breakdown
* Recent transactions

### Access Control

* Role-based permissions enforced using middleware
* Unauthorized actions are blocked with proper responses

### Validation & Error Handling

* Input validation for requests
* Proper HTTP status codes
* Clear error messages

### Data Persistence

* SQLite database
* Structured schema
* Soft delete support (records are not permanently removed)

---

## Tech Stack

* Node.js
* Express.js
* SQLite
* Middleware-based architecture

---

## Project Structure

```
project/
│
├── controllers/     # Business logic
├── routes/          # API routes
├── middleware/      # Auth, validation, access control
├── database/        # DB setup and queries
├── tests/           # Basic API tests
├── app.js           # Entry point
└── package.json
```

---

## Installation & Setup

1. Clone the repository

```
git clone <your-repo-link>
cd project-folder
```

2. Install dependencies

```
npm install
```

3. Run the server

```
npm start
```

Server will run on:

```
http://localhost:3000
```

---

## API Endpoints (Sample)

### Auth / Users

* `POST /users` → Create user
* `GET /users` → Get users

### Transactions

* `POST /transactions` → Create record
* `GET /transactions` → Get all records
* `PUT /transactions/:id` → Update record
* `DELETE /transactions/:id` → Delete record

### Filters

```
GET /transactions?type=income&category=food&from=2024-01-01&to=2024-12-31
```

### Dashboard

* `GET /dashboard/summary`
* `GET /dashboard/categories`
* `GET /dashboard/recent`

---

## Assumptions

* Authentication is simplified for demonstration purposes
* Roles are predefined (Viewer, Analyst, Admin)
* SQLite is used for simplicity instead of a production database
* Soft delete is used instead of permanent deletion

---

## Possible Improvements

* Add JWT-based authentication
* Add pagination to all endpoints
* Add monthly/weekly analytics
* Improve test coverage
* Add Swagger or Postman documentation

---

## Final Notes

This project focuses on clarity and backend fundamentals rather than complexity. The structure is kept simple but scalable, and the goal is to demonstrate clean API design, proper access control, and maintainable code.

---
