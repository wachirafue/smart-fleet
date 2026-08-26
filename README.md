# 🚚 Smart Fleet Management System

A full-stack IoT Fleet Management application featuring real-time vehicle telemetry, MQTT integration, predictive maintenance, and a responsive dark-mode dashboard.

---

## 🏗️ Project Structure

```text
smart-fleet/
├── backend/     # Node.js + Express + Prisma + MQTT
└── frontend/    # Next.js + Tailwind CSS + Recharts (PWA)

⚙️ Tech Stack
Backend: Node.js, Express, Prisma ORM, MQTT.js, Web Push

Frontend: Next.js (App Router), Tailwind CSS, Recharts, Lucide Icons

Database & Broker: TiDB Cloud (MySQL compatible), HiveMQ Cloud

📋 Prerequisites
Before you begin, ensure you have the following installed:

Node.js (version 18+ recommended)

MySQL / TiDB Cloud account & connection URL

MQTT Broker (e.g., HiveMQ Cloud or local Mosquitto)

🚀 Quick Start
1. Backend Setup
Navigate to the backend directory, install dependencies, and configure your environment:

Bash
cd backend
npm install
Create a .env file in the backend folder and add your credentials:

DATABASE_URL="mysql://USER:PASSWORD@HOST:4000/smart_fleet?sslaccept=strict"
PORT=3001
MQTT_BROKER_URL=your_mqtt_broker_url
MQTT_USERNAME=your_username
MQTT_PASSWORD=your_password
Run database migration and start the development server:

Bash
npx prisma db push
npm run db:seed
npm run dev

2. Frontend Setup
Open a new terminal, navigate to the frontend directory, and install dependencies:

cd frontend
npm install
Create a .env.local file in the frontend folder:

NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your_vapid_public_key"
Start the frontend development server:

npm run dev
Open http://localhost:3000 in your browser to view the dashboard.

💡 Features
Real-time Telemetry: Live tracking and monitoring of vehicle data via MQTT protocol.

Alert & Notifications: Instant warnings and Web Push alerts for critical events.

Modern Dashboard: Built with Next.js and Tailwind CSS featuring a sleek dark-mode UI.

👨‍💻 Author
Developed with 💻 and ☕ by Wiwat (Sripatum University - Computer Engineering)
