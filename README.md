# Aircraft Emergency Equipment List (EEL) Management System

A modern web application for managing Emergency Equipment List for aircraft fleet. Built with Next.js 16, TypeScript, Prisma, and PostgreSQL.

## 🎯 Features

### For Administrators

- ✈️ **Fleet Management** - Manage aircraft types and models
- 📋 **Drawing Management** - Upload aircraft diagrams and create equipment templates
- 📍 **Interactive Marking** - Click on diagrams to mark equipment locations
- 🔧 **Equipment Catalog** - Manage equipment types, part numbers, and descriptions
- 🛠️ **Template System** - Create equipment configurations reusable across multiple aircraft
- 📊 **Auto-Population** - Automatically populate equipment for new aircraft using templates

### For Users (Mechanics/Technicians)

- 🔍 **Quick Search** - Search aircraft by registration number
- 📱 **Interactive View** - Click on diagram markers to see equipment details
- 📝 **Function Locations** - Find exact function location codes for each part
- ✅ **Status Tracking** - View equipment status and inspection dates

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Radix UI primitives
- **State Management**: Zustand
- **Forms**: React Hook Form with Zod validation

## 📦 Installation

### Prerequisites

- Node.js 18+ installed
- PostgreSQL installed and running

### Setup Steps

1. **Clone the Project**

   ```bash
   git clone <repository-url>
   cd eel
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Setup Database**

   Create a PostgreSQL database:

   ```sql
   CREATE DATABASE aircraft_eel;
   ```

4. **Configure Environment Variables**

   Create a `.env` file in the root directory and add the following:

   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/aircraft_eel?schema=public"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-min-32-characters-long"
   ```

5. **Generate Prisma Client**

   ```bash
   npx prisma generate
   ```

6. **Run Database Migrations**

   ```bash
   npx prisma migrate dev --name init
   ```

7. **Seed Database with Demo Data**

   ```bash
   npm run prisma:seed
   ```

8. **Start Development Server**

   ```bash
   npm run dev
   ```

9. **Open Application**

   Navigate to: [http://localhost:3000](http://localhost:3000)

## 👤 Demo Credentials

### Administrator Account

- Email: `admin@gmf.co.id`
- Password: `admin123`

### User Account

- Email: `user@gmf.co.id`
- Password: `user123`

## 🛠️ Development Commands

```bash
npm run dev                # Start dev server
npm run build              # Build for production
npm run prisma:studio      # Open Prisma Studio
npm run prisma:seed        # Seed database
```

## Checklist langkah untuk Memindahkan Project:

Copy project files
Install Node.js (nodejs.org)
Install dependencies (npm install)
Install database server (rekomendasi: postgreSQL)
Update .env untuk database
Generate Prisma Client (npx prisma generate)
Run database migration (npx prisma migrate dev)
Seed database (npm run prisma:seed) (opsional)
Jalankan aplikasi (npm run dev)
