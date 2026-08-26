# Smart Fleet Management System

A full-stack IoT Fleet Management application with real-time telemetry, MQTT integration, predictive maintenance, and a responsive dark-mode dashboard.

## Project Structure

`
smart-fleet/
├── backend/     - Node.js + Express + Prisma + MQTT
└── frontend/    - Next.js + Tailwind CSS + Recharts (PWA)
`

## Prerequisites

- **Node.js** 18+
- **MySQL** 8.0+ running locally
- **Mosquitto MQTT Broker** running locally (port 1883)

## Quick Start

### 1. Backend Setup

`ash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MySQL credentials and MQTT broker URL

# Generate VAPID keys for Web Push
npm run generate:vapid
# Copy output into your .env file

# Set up database
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed

# Start backend (dev mode)
npm run dev
`

Backend runs at: http://localhost:3001

### 2. Frontend Setup

`ash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit: NEXT_PUBLIC_API_URL=http://localhost:3001

# Start frontend (dev mode)
npm run dev
`

Frontend runs at: http://localhost:3000

## Simulating MQTT Data

Use mosquitto_pub or MQTT Explorer to simulate device messages:

### Telemetry Data (every 5s from ESP32)
`ash
mosquitto_pub -h localhost -t "fleet/TRUCK_01/data" -m '{
  "temperature": 24.5,
  "humidity": 65.0,
  "light": 300,
  "accel_x": 0.02,
  "accel_y": -0.01,
  "accel_z": 9.81,
  "speed": 75.5,
  "door_status": 0,
  "lat": 13.7500,
  "lng": 100.5000
}'
`

### Simulate Geofence Breach (within 1km of destination)
`ash
mosquitto_pub -h localhost -t "fleet/TRUCK_01/data" -m '{
  "temperature": 24.5, "humidity": 65.0, "speed": 10.0,
  "door_status": 0, "lat": 13.7563, "lng": 100.5018
}'
`

### DMS Alert (AI Camera)
`ash
mosquitto_pub -h localhost -t "fleet/TRUCK_01/dms_alert" -m '{
  "type": "DROWSINESS",
  "confidence": 0.92
}'
`

### Simulate Predictive Maintenance (3 rising temps)
`ash
mosquitto_pub -h localhost -t "fleet/TRUCK_01/data" -m '{"temperature":25.0,"humidity":60,"speed":50,"door_status":0}'
sleep 2
mosquitto_pub -h localhost -t "fleet/TRUCK_01/data" -m '{"temperature":27.0,"humidity":60,"speed":50,"door_status":0}'
sleep 2
mosquitto_pub -h localhost -t "fleet/TRUCK_01/data" -m '{"temperature":29.0,"humidity":60,"speed":50,"door_status":0}'
`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/vehicles | All vehicles with latest telemetry |
| GET | /api/vehicles/:id | Single vehicle details |
| GET | /api/telemetry/:truckId | Historical telemetry (?limit=50) |
| GET | /api/alerts/:truckId | Alert logs (?limit=20) |
| POST | /api/command/:truckId | Send AC command (body: {"command": "LEVEL_3"}) |
| POST | /api/subscribe | Register Web Push subscription |
| GET | /api/subscribe/vapid-public-key | Get VAPID public key |
| GET | /api/sse | Server-Sent Events stream |
| GET | /health | Health check |

## AC Commands

Valid command values for POST /api/command/:truckId:
- OFF - Turn AC off
- LEVEL_1 - Low cooling
- LEVEL_2 - Medium cooling
- LEVEL_3 - High cooling (Pre-cooling)
- AUTO - Automatic mode