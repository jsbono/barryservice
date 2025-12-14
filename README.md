# Mechanic Service Tracking & Public Service Lookup

A full-stack application for independent mechanics to manage customers, vehicles, and service history, with automated email reminders and a public page for vehicle service recommendations.

## Features

- **Private Mechanic Dashboard**: Manage customers, vehicles, and service history
- **Automated Email Reminders**: Sends reminders for upcoming services based on date and mileage
- **Public Service Lookup**: Anyone can look up recommended service intervals by vehicle make/model/year
- **Service Tracking**: Track oil changes, minor service, major service, and more

## Tech Stack

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL
- Nodemailer for email
- node-cron for scheduled jobs
- JWT authentication

### Frontend
- React with Vite
- TypeScript
- Tailwind CSS
- React Router

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Setup

### 1. Clone and Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

Copy the example environment file and update with your settings:

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your database and SMTP settings:

```
PORT=4000
NODE_ENV=development

DATABASE_URL=postgres://user:password@localhost:5432/mechanic_service_app

JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_pass
SMTP_FROM_EMAIL="Your Shop <no-reply@yourshop.com>"
```

### 3. Create Database

```bash
createdb mechanic_service_app
```

### 4. Run Migrations

```bash
cd backend
npm run migrate
```

### 5. Seed Database (Optional)

This creates a test user and sample data:

```bash
npm run seed
```

Test credentials: `mechanic@example.com` / `password123`

### 6. Start the Application

In separate terminals:

```bash
# Backend (runs on port 4000)
cd backend
npm run dev

# Frontend (runs on port 3000)
cd frontend
npm run dev
```

Visit `http://localhost:3000` to use the application.

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login and receive JWT token
- `GET /api/auth/me` - Get current user (requires auth)

### Customers (requires auth)
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer with vehicles
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Vehicles (requires auth)
- `GET /api/vehicles` - List vehicles (optionally filter by customer_id)
- `POST /api/vehicles` - Create vehicle
- `GET /api/vehicles/:id` - Get vehicle with service history
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle

### Service Logs (requires auth)
- `GET /api/services` - List service logs
- `GET /api/services/upcoming` - Get upcoming services
- `GET /api/services/recent` - Get recent activity
- `POST /api/services` - Create service log
- `GET /api/services/:id` - Get specific service log
- `PUT /api/services/:id` - Update service log

### Public Lookup (no auth required)
- `GET /api/lookup/makes` - Get all vehicle makes
- `GET /api/lookup/models?make=Toyota` - Get models for a make
- `GET /api/lookup/years?make=Toyota&model=Camry` - Get years
- `GET /api/lookup/services?make=Toyota&model=Camry&year=2020` - Get recommended services

### Automation (requires auth)
- `POST /api/automation/trigger` - Manually trigger reminder emails

## Service Intervals

Default intervals (configurable in database):

| Service Type | Mileage | Time |
|-------------|---------|------|
| Oil Change | 5,000 miles | 6 months |
| Minor Service | 12,000 miles | 12 months |
| Major Service | 30,000 miles | 24 months |

## Email Reminders

The system automatically sends reminder emails:
- **When**: Daily at 9 AM (configurable via cron)
- **Criteria**: Service due within 14 days OR within 300 miles
- **Suppression**: No duplicate emails within 7 days for the same service

## Project Structure

```
mechanic-service-app/
├── backend/
│   ├── src/
│   │   ├── index.ts          # Express app entry
│   │   ├── config/           # Environment and database
│   │   ├── models/           # Database models
│   │   ├── routes/           # API routes
│   │   ├── controllers/      # Request handlers
│   │   ├── services/         # Business logic
│   │   ├── middleware/       # Auth and error handling
│   │   └── utils/            # Helpers
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── main.tsx          # React entry
│   │   ├── App.tsx           # Router setup
│   │   ├── routes/           # Page components
│   │   ├── components/       # UI components
│   │   └── lib/              # API client and auth
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## License

MIT

