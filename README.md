# Chiropractor Platform

This repository contains a basic microservice skeleton for a chiropractor platform.
Each service is a minimal Express app written in TypeScript. The services are intended
for experimentation and further development.

## Services
- **gateway** (port 3000) – API Gateway that proxies requests to other services.
- **auth-service** (port 3001) – handles authentication.
- **user-service** (port 3002) – manages user profiles.
- **report-service** (port 3003) – stores patient reports.
- **appointment-service** (port 3004) – handles appointments.
- **chat-service** (port 3005) – simple chat API.
- **blog-service** (port 3006) – blog endpoints.

## Infrastructure
Docker Compose sets up:
- PostgreSQL for several services
- MongoDB for chat and blog
- Redis
- RabbitMQ

## Running
```bash
docker-compose up --build
```
This starts all services on ports 3000–3006.
