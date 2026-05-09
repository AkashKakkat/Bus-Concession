# Bus Concession

A full-stack bus concession management system for students, admins, and conductors. The application supports student registration with OTP verification, admin approval, route selection, QR pass generation, wallet payments, conductor validation, and admin reporting.

## Features

- Student signup with email OTP verification
- College ID card upload for student approval
- Admin dashboard for managing students, conductors, routes, transactions, and reports
- Student login, profile, route selection, wallet balance, and transaction history
- QR-based student bus pass generation
- Conductor login and QR/payment validation
- Wallet top-up and fare payment flow
- Route fares with configurable concession percentage
- Password reset and password change flows
- Gmail API based OTP and payment confirmation emails

## Tech Stack

**Frontend**

- React 18
- Vite
- React Router
- Axios
- Tailwind CSS
- QR code display/scanning packages

**Backend**

- Node.js
- Express
- MongoDB with Mongoose
- JWT authentication
- Bcrypt password hashing
- Multer file upload
- Google Gmail API
- QR code generation

## Project Structure

```text
Bus-Concession/
|-- Backend/
|   |-- Config/
|   |-- Controllers/
|   |-- Middleware/
|   |-- Models/
|   |-- Routes/
|   |-- Utils/
|   |-- scripts/
|   |-- app.js
|   `-- package.json
|-- Frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- context/
|   |   |-- pages/
|   |   |-- services/
|   |   `-- utils/
|   |-- index.html
|   |-- vite.config.js
|   `-- package.json
`-- README.md
```

## Prerequisites

- Node.js
- npm
- MongoDB database
- Gmail API OAuth credentials for email features

## Environment Variables

Create a `.env` file inside the `Backend` folder:

```env
PORT=5000
MONGO_URL=your_mongodb_connection_string
MONGO_DB_NAME=your_database_name
JWT_SECRET=your_jwt_secret

FRONTEND_URL=http://localhost:5173

ADMIN_NAME=System Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password

EMAIL=your_gmail_address
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret
GMAIL_REFRESH_TOKEN=your_gmail_refresh_token
EMAIL_PASS=optional_email_password_flag
```

Create a `.env` file inside the `Frontend` folder if you need to override the default API URL:

```env
VITE_API_URL=http://localhost:5000
```

## Installation

Install backend dependencies:

```bash
cd Backend
npm install
```

Install frontend dependencies:

```bash
cd ../Frontend
npm install
```

## Running Locally

Start the backend server:

```bash
cd Backend
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

Start the frontend development server:

```bash
cd Frontend
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

## Seed Routes

The backend includes a script to seed default bus routes:

```bash
cd Backend
npm run routes:seed
```

This script clears existing routes and inserts the fixed route list from `Backend/scripts/seedRoutes.js`.

## Default Admin

On backend startup, the app checks `ADMIN_EMAIL` and `ADMIN_PASSWORD`. If those values are configured and the admin does not already exist, a default admin account is created automatically.

Admin login page:

```text
/admin-login
```

## Main Pages

- `/` - Home
- `/signup` - Student signup
- `/login` - Student login
- `/dashboard` - Student dashboard
- `/generate-pass` - Student QR pass
- `/wallet` - Student wallet
- `/change-password` - Student password change
- `/forgot-password` - Password reset flow
- `/admin-login` - Admin login
- `/admin-dashboard` - Admin dashboard
- `/conductor-login` - Conductor login
- `/conductor-dashboard` - Conductor dashboard

## API Overview

The backend exposes these main route groups:

- `/auth` - Student authentication, OTP, password reset, and password change
- `/student` - Student profile, route selection, QR pass generation, and pass verification
- `/admin` - Admin login and protected admin management APIs
- `/conductor` - Conductor login
- `/route` - Route creation and route listing
- `/wallet` - Wallet balance, add money, pay, and transaction history
- `/payment` - Conductor payment completion and payment history

## Build

Build the frontend for production:

```bash
cd Frontend
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Deployment Notes

- The frontend includes `vercel.json` rewrites for Vercel single-page app routing.
- Set `VITE_API_URL` in the frontend deployment environment to point to the deployed backend.
- Set `FRONTEND_URL` in the backend deployment environment to the deployed frontend origin for CORS.
- Configure all backend secrets in the hosting provider environment variables.

## Security Notes

- Do not commit `.env` files or credentials.
- Use a strong `JWT_SECRET`.
- Keep Gmail OAuth credentials private.
- Restrict production CORS to the real frontend URL.
- Use HTTPS in production.

## License

This project is currently marked as ISC in the backend package metadata.
