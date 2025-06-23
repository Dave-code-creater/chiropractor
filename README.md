# 🏥 Dr. Dieu Phan D.C - Chiropractic Practice Management System

> **Enterprise-grade microservices architecture for comprehensive chiropractic practice management**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://postgresql.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green.svg)](https://mongodb.com/)

## 🚀 **Recent Major Cleanup & Improvements**

This codebase has been **completely refactored** with senior-level engineering practices:

### ✅ **Code Quality Improvements**
- **Eliminated duplicate routes** - Consolidated to single API versioning (`/v1/api/2025`)
- **Removed code duplication** - Shared server configuration across all services
- **Enhanced error handling** - Comprehensive error management with proper logging
- **Standardized responses** - Consistent API response format across all endpoints
- **Security hardening** - Rate limiting, helmet security headers, input validation
- **Environment validation** - Joi-based configuration validation for all services

### 🏗️ **Architecture Enhancements**
- **Shared utilities** - Common server config, response handlers, validators
- **Graceful shutdown** - Proper SIGTERM/SIGINT handling for all services
- **Health checks** - Comprehensive health monitoring with database status
- **Request tracing** - UUID-based request tracking for debugging
- **Performance optimization** - Compression, caching headers, connection pooling

### 🔐 **Security Improvements**
- **Removed hardcoded secrets** - Environment-based configuration
- **Rate limiting** - Service-specific rate limiting (100-200 req/15min)
- **CORS security** - Proper origin validation
- **JWT validation** - Enhanced token security with proper expiration
- **Input sanitization** - Joi validation for all API inputs

## 📋 **System Overview**

### **Microservices Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Gateway      │    │   Auth Service  │    │  User Service   │
│   Port: 3000    │────│   Port: 3001    │────│   Port: 3002    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Blog Service   │    │  Chat Service   │    │Appointment Svc  │
│   Port: 3003    │    │   Port: 3004    │    │   Port: 3005    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
    MongoDB            MongoDB            PostgreSQL
```

### **Core Features**
- 🏥 **Patient Management** - Complete patient records with medical history
- 📝 **Clinical Notes** - SOAP notes with timestamps and provider tracking
- 📊 **Vital Signs** - Blood pressure, heart rate, temperature monitoring
- 📋 **Template Forms** - 6 comprehensive intake and assessment forms
- 📈 **Dashboard Analytics** - Real-time practice metrics and reporting
- 💬 **Real-time Chat** - WebSocket-based communication system
- 📚 **Blog Management** - Content management for practice updates
- 🔐 **Role-based Access** - Doctor/Staff/Admin permission system

## 🛠️ **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- Docker & Docker Compose
- PostgreSQL 16+
- MongoDB Latest

### **Installation**
```bash
# 1. Clone the repository
git clone <repository-url>
cd chiropractor

# 2. Copy environment configuration
cp env.example .env
# Edit .env with your secure values

# 3. Install dependencies and setup shared utilities
npm run setup

# 4. Start all services
npm run dev

# 5. Run database migrations
npm run migrate
```

### **Service URLs**
- **Gateway**: http://localhost:3000
- **Auth Service**: http://localhost:3001
- **User Service**: http://localhost:3002
- **Blog Service**: http://localhost:3003
- **Chat Service**: http://localhost:3004
- **Appointment Service**: http://localhost:3005
- **Report Service**: http://localhost:3006

## 📚 **API Documentation**

### **Consistent API Versioning**
All endpoints follow the pattern: `/v1/api/2025/{resource}`

### **Core Endpoints**
```javascript
// Authentication
POST /v1/api/2025/auth/login
POST /v1/api/2025/auth/register
POST /v1/api/2025/auth/refresh

// Patient Management
GET    /v1/api/2025/patients
POST   /v1/api/2025/patients
GET    /v1/api/2025/patients/:id
PUT    /v1/api/2025/patients/:id

// Clinical Notes
POST   /v1/api/2025/notes
GET    /v1/api/2025/notes
GET    /v1/api/2025/patients/:patientId/notes

// Patient Vitals
POST   /v1/api/2025/patients/:patientId/vitals
GET    /v1/api/2025/patients/:patientId/vitals
GET    /v1/api/2025/patients/:patientId/vitals/trends

// Reports & Forms
POST   /v1/api/2025/reports
GET    /v1/api/2025/reports
POST   /v1/api/2025/reports/:reportId/patient-intake
```

### **Health Checks**
```bash
# Check all services
npm run health-check

# Individual service health
curl http://localhost:3001/health
curl http://localhost:3002/health
```

## 🔧 **Development**

### **Available Scripts**
```bash
npm run dev          # Start all services in development mode
npm run start        # Start all services in production mode
npm run stop         # Stop all services
npm run clean        # Clean all containers and volumes
npm run logs         # View all service logs
npm run test         # Run all service tests
npm run lint         # Lint all services
npm run lint:fix     # Fix linting issues
npm run migrate      # Run database migrations
npm run copy-shared  # Copy shared utilities to services
```

### **Development Workflow**
1. Make changes to shared utilities in `/shared`
2. Run `npm run copy-shared` to distribute changes
3. Test individual services: `cd user-service && npm run dev`
4. Run integration tests: `npm test`
5. Check health status: `npm run health-check`

## 🗄️ **Database Schema**

### **PostgreSQL Services**
- **Auth DB** (Port 5433): Users, API keys, password resets, doctors
- **User DB** (Port 5434): Patients, clinical notes, vitals, reports
- **Appointment DB** (Port 5435): Appointments, schedules, availability
- **Report DB** (Port 5436): Report templates, submissions, analytics

### **MongoDB Services**
- **Blog DB** (Port 27017): Posts, categories, comments
- **Chat DB** (Port 27018): Messages, conversations, users

## 🔐 **Security Features**

- **JWT Authentication** with secure token management
- **Rate Limiting** (100-200 requests per 15 minutes)
- **CORS Protection** with configurable origins
- **Helmet Security Headers** (CSP, HSTS, etc.)
- **Input Validation** with Joi schemas
- **Environment Validation** for configuration security
- **Request Tracing** with UUID tracking
- **Error Logging** with structured JSON format

## 📊 **Monitoring & Health**

### **Health Check Endpoints**
Each service provides comprehensive health information:
```json
{
  "service": "user-service",
  "status": "healthy",
  "timestamp": "2025-01-27T10:30:00.000Z",
  "uptime": 3600,
  "memory": { "rss": 50331648, "heapUsed": 25165824 },
  "database": {
    "status": "connected",
    "type": "postgresql",
    "tables": ["patients", "clinical_notes", "patient_vitals"]
  }
}
```

### **Logging**
- **Development**: Human-readable console logs
- **Production**: Structured JSON logs for monitoring
- **Error Tracking**: Comprehensive error context with request tracing

## 🚀 **Deployment**

### **Docker Compose**
```bash
# Production deployment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f

# Scale services
docker-compose up --scale user-service=3
```

### **Environment Variables**
Copy `env.example` to `.env` and configure:
- Database credentials
- JWT secrets (minimum 32 characters)
- CORS origins
- Rate limiting settings
- External service credentials

## 📈 **Performance**

### **Optimizations Implemented**
- **Response Compression** - Gzip compression for all responses
- **Connection Pooling** - PostgreSQL connection pooling (2-10 connections)
- **Request Caching** - HTTP caching headers
- **JSON Parsing** - Optimized with size limits (10MB)
- **Graceful Shutdown** - Proper connection cleanup

### **Monitoring Metrics**
- Request response times
- Database query performance
- Memory usage tracking
- Error rates and patterns
- Service availability

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes following the established patterns
4. Run tests: `npm test`
5. Run linting: `npm run lint:fix`
6. Commit changes: `git commit -m 'Add amazing feature'`
7. Push to branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍⚕️ **About Dr. Dieu Phan D.C**

This comprehensive practice management system is designed specifically for chiropractic practices, incorporating industry best practices for patient care, documentation, and practice management.

---

**Built with ❤️ for the chiropractic community**
