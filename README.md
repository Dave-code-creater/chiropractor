# Chiropractor Platform

This repository contains a basic microservice skeleton for a chiropractor platform.
Each service is a minimal Express app written in Node.js. The services are intended
for experimentation and further development.

## Services
- **gateway** (port 3000) – API Gateway that proxies requests to other services.
- **auth-service** (port 3001) – handles authentication and returns a JWT token on login.
- **user-service** (port 3002) – manages user profiles.
 - **blog-service** (port 3003) – blog endpoints.
 - **chat-service** (port 3004) – simple chat API.
 - **appointment-service** (port 3005) – handles appointments.
 - **report-service** (port 3006) – stores patient reports.

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

Docker Compose now also starts a RabbitMQ container on ports 5672 and 15672 so
services can publish and consume events locally.
All services are configured with `RABBITMQ_URL=amqp://rabbitmq:5672` so they
connect to the broker automatically.

## Additional Endpoints

- `DELETE /appointments/{id}` – remove an appointment
- `DELETE /reports/{id}` – remove a report
- `POST /forgot-password` – reset a user's password after verifying email and phone number
- `GET /users/{userId}/posts` – list blog posts for a user
- `GET /tags/{tag}/posts` – list blog posts with a tag
- `GET /users/{id}` – retrieve an auth user by id
- `GET /doctors/{doctorId}/appointments` – list appointments for a doctor
- `PUT /users/{id}` – update an auth user
- `DELETE /users/{id}` – remove an auth user
- `GET /users` – list all auth users

## Kubernetes

Kubernetes manifests are located in the `k8s/` folder. Apply them with:

```bash
kubectl apply -f k8s/
```

The manifest also deploys a `rabbitmq` pod so services can communicate using
AMQP inside the cluster.

### Service discovery

Kubernetes automatically creates DNS records for each `Service`. Pods can
reach another microservice using the service name and port. The
`appointment-service` retrieves doctor data from the `auth-service` like so:

```javascript
const fetch = require('node-fetch');
const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';

async function getDoctor(id) {
  const res = await fetch(`${AUTH_URL}/users/${id}`);
  if (!res.ok) throw new Error('failed to fetch doctor');
  return res.json();
}
```

The deployment sets the `AUTH_SERVICE_URL` environment variable so pods use
the cluster DNS entry:

```yaml
env:
  - name: AUTH_SERVICE_URL
    value: "http://auth-service:3001"
```

With the default DNS search path this resolves to
`auth-service.default.svc.cluster.local` inside the cluster.

### Event Messaging

Each service publishes domain events to RabbitMQ using a simple `publish` helper.
Other services subscribe to queues and react to the events. The broker URL is
provided via the `RABBITMQ_URL` environment variable in every Deployment.

```javascript
const { publish, subscribe } = require('./utils/messageBroker.js');

// publish when a resource is created
await publish('appointments.created', appointment);

// subscribe elsewhere
subscribe('appointments.created', (msg) => {
  console.log('event received:', msg);
});
```
