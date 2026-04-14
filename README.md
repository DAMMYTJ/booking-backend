# Booking Backend — Group 14

A RESTful booking backend built with Node.js, TypeScript, Express and MongoDB.

## Group Members
- Oluwadamilola Tijani (DAMMYTJ)
- Jay Mahida (Jmahida7504)
- Shiv Patel (shivp08092003)

## Tech Stack
- Node.js + TypeScript
- Express.js
- MongoDB + Mongoose
- JWT Authentication
- Jest (Testing)
- Winston (Logging)

## Setup Instructions

### 1. Clone the repo
\`\`\`bash
git clone https://github.com/DAMMYTJ/booking-backend.git
cd booking-backend
\`\`\`

### 2. Install dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Create .env file
\`\`\`bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017/booking-backend
JWT_SECRET=your_jwt_secret
\`\`\`

### 4. Run the server
\`\`\`bash
npm run dev
\`\`\`

### 5. Run tests
\`\`\`bash
npm test
\`\`\`

## API Endpoints

### Auth
- POST /auth/register — Register a new user
- POST /auth/login — Login and get JWT token

### Bookings
- POST /bookings — Create a booking (guest or user)
- GET /bookings — Get all bookings (admin)
- GET /bookings/:id — Get booking by ID
- PATCH /bookings/:id/status — Accept or decline booking (admin)
- PATCH /bookings/:id — Edit booking (admin)

### Time Slots
- GET /timeslots — Get available time slots
- POST /timeslots — Create a time slot (admin)
- DELETE /timeslots/:id — Delete a time slot (admin)

## Architecture
Clean Architecture pattern:
- domain/ — Models and error classes
- use-cases/ — Business logic
- infrastructure/ — Database, middleware
- ports/rest/routes/ — API routes
