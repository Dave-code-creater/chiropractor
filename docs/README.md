# Documentation Hub

**Dr. Dieu Phan D.C - Chiropractic Practice Management System**

---

## 📚 Documentation Overview

This documentation hub provides comprehensive guides for the chiropractic practice management system.

### 🚀 Quick Start Documents

| Document | Purpose | Target Audience |
|----------|---------|-----------------|
| **[API Reference](API_REFERENCE.md)** | Complete API documentation with examples | Frontend developers, API consumers |
| **[Services Guide](SERVICES_GUIDE.md)** | System architecture and service details | Backend developers, DevOps |
| **[Frontend Quick Reference](FRONTEND_QUICK_REFERENCE.md)** | Frontend development guide | Frontend developers |
| **[Cleanup Summary](CLEANUP_SUMMARY.md)** | Recent system changes and cleanup | All developers |

---

## 🏗️ System Architecture

```
Frontend ──► Gateway ──► Microservices
   │            │            │
   │            │            ├── Auth Service (3001)
   │            │            ├── User Service (3002)  
   │            │            ├── Blog Service (3003)
   │            │            ├── Chat Service (3004)
   │            │            ├── Appointment Service (3005)
   │            │            └── Report Service (3006)
   │            │
   └── All requests through Gateway (3000)
```

---

## 🔑 Key Features

### Modern Template-Based Forms System
- **6 Pre-defined Templates**: Patient Intake, Insurance Details, Pain Evaluation, Detailed Description, Work Impact, Health Conditions
- **Progress Tracking**: Automatic completion percentage calculation
- **Validation**: Form-specific validation rules
- **Permissions**: Creator/assigned user access control

### Doctor Management
- **Public API**: No authentication required for basic doctor queries
- **Comprehensive Search**: By specialization, availability, location
- **Availability Tracking**: Real-time scheduling integration

### Authentication & Security
- **JWT-based Authentication**: Secure token management
- **Role-based Access Control**: Admin, Doctor, Staff, Patient roles
- **Password Reset System**: Secure password recovery

---

## 📖 Getting Started

### For Frontend Developers
1. Start with **[Frontend Quick Reference](FRONTEND_QUICK_REFERENCE.md)** for immediate setup
2. Reference **[API Reference](API_REFERENCE.md)** for endpoint details
3. Use test account: `doctor@gmail.com` / `Oces2023@`

### For Backend Developers
1. Review **[Services Guide](SERVICES_GUIDE.md)** for architecture overview
2. Check **[Cleanup Summary](CLEANUP_SUMMARY.md)** for recent changes
3. Follow service-specific setup instructions

### For API Consumers
1. **[API Reference](API_REFERENCE.md)** contains all endpoints with examples
2. All requests go through Gateway: `http://localhost:3000`
3. Authentication required for most endpoints

---

## 🚨 Important Notes

### Recent System Changes
- **Legacy Endpoints Removed**: Individual form controllers consolidated into template-based system
- **Doctor Routes Updated**: Moved from `/appointments/doctors` to `/doctors`
- **New Versioning**: Template forms use `/v1/` prefix for future compatibility

### Database Migrations Required
```bash
# Run in user-service to enable template forms
npm run migrate

# Seed appointment service with doctors
cd appointment-service
node scripts/seed-doctors.js
```

---

## 🔧 Development Workflow

### 1. Environment Setup
```bash
# Start all services
docker-compose up -d

# Check system health
curl http://localhost:3000/health
```

### 2. Testing
```bash
# Run all tests
npm test

# Service-specific tests
cd [service-name] && npm test
```

### 3. API Testing
- Use test credentials: `doctor@gmail.com` / `Oces2023@`
- All API requests through Gateway: `http://localhost:3000`
- Check service health endpoints for debugging

---

## 📞 Support

For questions about:
- **API Usage**: See [API Reference](API_REFERENCE.md)
- **System Architecture**: See [Services Guide](SERVICES_GUIDE.md)  
- **Frontend Integration**: See [Frontend Quick Reference](FRONTEND_QUICK_REFERENCE.md)
- **Recent Changes**: See [Cleanup Summary](CLEANUP_SUMMARY.md)

---

**Last Updated:** January 2025 | **Version:** 2.0 