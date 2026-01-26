# Cloudex

Cloudex (formerly PETVERSE/DINEXA) is a comprehensive SaaS platform designed for modern business management. It features a robust backend API and a dynamic, responsive frontend dashboard.

## 🚀 Project Overview

- **Cloudex Web**: A Next.js-based frontend application providing a premium user interface for dashboard, orders, inventory, and settings management.
- **Cloudex API**: A NestJS-based backend server handling business logic, authentication, and database interactions.

## 🛠️ Technology Stack

### Frontend (Web)
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animation**: Framer Motion
- **State Management**: Zustand
- **Icons**: Lucide React
- **Internationalization**: i18next
- **Charts**: Recharts

### Backend (API)
- **Framework**: [NestJS](https://nestjs.com/)
- **Database**: PostgreSQL (v15)
- **Caching/Queue**: Redis (v7)
- **ORM**: TypeORM
- **Real-time**: Socket.io
- **Validation**: class-validator, class-transformer
- **Containerization**: Docker

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Docker](https://www.docker.com/) & Docker Compose (for database services)
- [Git](https://git-scm.com/)

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository_url>
cd Cloudex
```

### 2. Configure Environment Variables

#### API (`apps/api/.env`)
Create a `.env` file in the `apps/api` directory based on your configuration. Common variables:
```env
PORT=3000
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_USER=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=cloudex
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_jwt_secret
SMTP_HOST=your_smtp_host
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

#### Web (`apps/web/.env.local`)
Create a `.env.local` file in the `apps/web` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Start Infrastructure Services
Use Docker Compose to start PostgreSQL and Redis:
```bash
docker-compose up -d
```

### 4. Install Dependencies
Install dependencies for both applications. It is recommended to run this from the root if using a workspace manager, or individually in each app folder.

```bash
# In apps/api
cd apps/api
npm install

# In apps/web
cd apps/web
npm install
```

## 🚀 Running the Application

### Start the API Server
```bash
cd apps/api
# Development mode
npm run start:dev
```
The API will start on `http://localhost:3000` (or your configured PORT).

### Start the Web Dashboard
```bash
cd apps/web
# Development mode
npm run dev
```
The web application will start on `http://localhost:3001` (Next.js automatically detects port 3000 is busy and switches).

## 🧪 Testing

### API Tests
```bash
cd apps/api
npm run test
npm run test:e2e
```

## 🐳 Docker Deployment
The project includes a `docker-compose.yml` for database services. You can extend this to containerize the entire stack if needed.

---
© 2026 Cloudex. All rights reserved.