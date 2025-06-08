# Chiropractor Platform

This repository contains a basic microservice skeleton for a chiropractor platform.
Each service is a minimal Express app written in Node.js. The services are intended
for experimentation and further development.

## Services
- **gateway** (port 3000) – API Gateway that proxies requests to other services.
- **auth-service** (port 3001) – handles authentication and returns a JWT token on login.
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
Run the helper script to build and start all services:

```bash
./deploy.sh
```
This invokes `docker-compose up --build` and starts all services on ports 3000–3006.

### Kubernetes
To deploy the services to a local Kubernetes cluster that can access your local Docker images (for example **minikube** or **kind**), run:
```bash
./deploy-k8s.sh
```
The script builds the Docker images for all services and applies the manifests in the `k8s/` directory.
