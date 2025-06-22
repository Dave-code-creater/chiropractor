# Services Architecture Guide

**Dr. Dieu Phan D.C - Chiropractic Practice Management System**  
**Version:** 2.0 | **Date:** January 2025

---

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │────│    Gateway      │────│  Load Balancer  │
│   (React/Vue)   │    │   (Port 3000)   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐
        │ Auth Service │ │User Service│ │Appointment  │
        │ (Port 3001)  │ │(Port 3002) │ │Service      │
        └──────────────┘ └────────────┘ │(Port 3005)  │
                                        └─────────────┘
                │               │               │
        ┌───────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐
        │ Blog Service │ │Chat Service│ │Report       │
        │ (Port 3003)  │ │(Port 3004) │ │Service      │
        └──────────────┘ └────────────┘ │(Port 3006)  │
                                        └─────────────┘
```

---

## 🌐 Gateway Service (Port 3000)

**Main entry point for all API requests**

### Features
- Request routing to microservices
- Authentication middleware
- Rate limiting
- CORS handling
- Request/response logging

### Key Routes
```
Authentication:     /v1/api/2025/auth/*        → auth-service
User Management:    /v1/api/2025/users/*       → user-service
Blog System:        /v1/api/2025/blog/*        → blog-service
Chat System:        /v1/api/2025/chat/*        → chat-service
Appointments:       /v1/api/2025/appointments/* → appointment-service
Doctors:           /v1/api/2025/doctors/*      → appointment-service
Reports:           /v1/api/2025/reports/*      → report-service
```

### Health Monitoring
```http
GET /health
```

---

## 🔐 Auth Service (Port 3001)

**Handles authentication, authorization, and user management**

### Features
- JWT token management
- User registration/login
- Password reset system
- Role-based access control
- API key management

### Database Schema
```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'patient',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Key Endpoints
```http
POST /register          # User registration
POST /login             # User authentication
POST /refresh           # Token refresh
POST /logout            # User logout
POST /verify            # Token verification
POST /forgot-password   # Password reset request
POST /reset-password    # Password reset confirmation
```

### User Roles
- `admin` - Full system access
- `doctor` - Medical staff access
- `staff` - Administrative access
- `patient` - Patient portal access

---

## 👥 User Service (Port 3002)

**Manages patient data, medical forms, and template-based reporting**

### Features
- Template-based forms system
- Patient management
- Medical records
- Dashboard analytics
- Report generation

### Database Schema
```sql
-- Patient profiles
CREATE TABLE patients (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES auth.users(id),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  date_of_birth DATE,
  gender VARCHAR(20),
  address JSONB,
  emergency_contact JSONB,
  insurance JSONB,
  medical_info JSONB,
  assigned_doctor_id INT,
  status VARCHAR(20) DEFAULT 'active',
  total_visits INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template-based reports
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  patient_id INT REFERENCES patients(id),
  template_id VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  data JSONB NOT NULL,
  completion_percentage INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft',
  created_by INT REFERENCES auth.users(id),
  assigned_to INT REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Template-Based Forms API
```http
# Template Management
GET /v1/templates                    # List all templates
GET /v1/templates/:id               # Get specific template

# Report Management  
POST /v1/reports                    # Create new report
GET /v1/reports                     # List reports
GET /v1/reports/:id                 # Get specific report
PUT /v1/reports/:id                 # Update report
DELETE /v1/reports/:id              # Delete report

# Form Submissions
POST /v1/reports/:id/patient-intake      # Submit patient intake
POST /v1/reports/:id/insurance-details   # Submit insurance details
POST /v1/reports/:id/pain-evaluation     # Submit pain evaluation
POST /v1/reports/:id/detailed-description # Submit detailed description
POST /v1/reports/:id/work-impact         # Submit work impact
POST /v1/reports/:id/health-conditions   # Submit health conditions
```

### Patient Management
```http
GET /patients                       # List all patients
GET /patients/:id                   # Get patient details
POST /patients                      # Create new patient
PUT /patients/:id                   # Update patient
GET /patients/:id/medical-history   # Get medical history
```

### Dashboard Analytics
```http
GET /dashboard/stats                # Dashboard statistics
GET /appointments/stats             # Appointment statistics
GET /reports/patients               # Patient reports
```

---

## 🏥 Appointment Service (Port 3005)

**Manages appointments, doctors, and scheduling**

### Features
- Appointment scheduling
- Doctor management
- Availability tracking
- Specialization management

### Database Schema
```sql
-- Doctors
CREATE TABLE doctors (
  id SERIAL PRIMARY KEY,
  user_id INT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone_number TEXT,
  specializations TEXT[],
  license_number TEXT UNIQUE,
  years_experience INT,
  education TEXT[],
  certifications TEXT[],
  bio TEXT,
  consultation_fee DECIMAL(10,2),
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INT DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  patient_id INT,
  doctor_id INT REFERENCES doctors(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  arrival_time TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled',
  reason_id INT,
  visit_number INT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doctor availability
CREATE TABLE doctor_availability (
  id SERIAL PRIMARY KEY,
  doctor_id INT REFERENCES doctors(id),
  day_of_week INT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Doctor Management API
```http
GET /doctors                        # List all doctors
GET /doctors/:id                    # Get doctor details
GET /doctors/search                 # Search doctors
GET /doctors/available              # Get available doctors
GET /doctors/specializations        # List specializations
GET /doctors/:id/availability       # Get doctor availability

# Protected routes (admin/staff only)
POST /doctors                       # Create doctor
PUT /doctors/:id                    # Update doctor
DELETE /doctors/:id                 # Delete doctor
PUT /doctors/:id/availability       # Set availability
```

### Appointment Management
```http
GET /appointments                   # List appointments
GET /appointments/:id               # Get appointment
POST /appointments                  # Create appointment
PUT /appointments/:id               # Update appointment
DELETE /appointments/:id            # Delete appointment
```

---

## 📝 Blog Service (Port 3003)

**Content management for blog posts and articles**

### Features
- Blog post management
- Rich content support
- Author management
- Publication workflow

### Database Schema
```sql
-- Blog posts (MongoDB)
{
  _id: ObjectId,
  title: String,
  content: String,
  author_id: Number,
  status: String, // 'draft', 'published', 'archived'
  tags: [String],
  featured_image: String,
  published_at: Date,
  created_at: Date,
  updated_at: Date
}
```

### API Endpoints
```http
GET /posts                          # List published posts
GET /posts/:id                      # Get specific post
POST /posts                         # Create new post (auth required)
PUT /posts/:id                      # Update post (auth required)
DELETE /posts/:id                   # Delete post (auth required)
```

---

## 💬 Chat Service (Port 3004)

**Real-time messaging and communication**

### Features
- Real-time messaging
- WebSocket connections
- Message history
- User presence

### Database Schema
```sql
-- Conversations (MongoDB)
{
  _id: ObjectId,
  participants: [Number],
  type: String, // 'direct', 'group'
  title: String,
  created_at: Date,
  updated_at: Date
}

-- Messages (MongoDB)
{
  _id: ObjectId,
  conversation_id: ObjectId,
  sender_id: Number,
  content: String,
  type: String, // 'text', 'image', 'file'
  timestamp: Date,
  read_by: [Number]
}
```

### WebSocket Events
```javascript
// Client to Server
socket.emit('join-conversation', { conversationId });
socket.emit('send-message', { conversationId, content });
socket.emit('typing', { conversationId });

// Server to Client
socket.on('message-received', (message));
socket.on('user-typing', (data));
socket.on('user-online', (userId));
```

---

## 📊 Report Service (Port 3006)

**Advanced reporting and analytics**

### Features
- Custom report generation
- Data visualization
- Export capabilities
- Scheduled reports

### API Endpoints
```http
GET /reports                        # List available reports
GET /reports/:id                    # Get specific report
POST /reports                       # Generate new report
PUT /reports/:id                    # Update report
DELETE /reports/:id                 # Delete report
```

---

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 16+
- MongoDB 7+
- Docker & Docker Compose

### Quick Start
```bash
# Clone repository
git clone <repository-url>
cd chiropractor

# Start all services
docker-compose up -d

# Check service health
curl http://localhost:3000/health
```

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@host:port/db
MONGODB_URI=mongodb://host:port/db

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h

# Service Configuration
NODE_ENV=development
PORT=3001
```

---

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific service tests
cd auth-service && npm test
cd user-service && npm test
```

### Test Coverage
- Unit tests for all services
- Integration tests for API endpoints
- End-to-end tests for critical workflows

---

## 📈 Monitoring & Health Checks

### Health Endpoints
All services provide health check endpoints:
```http
GET /{service}/health
```

### Service Status
```json
{
  "success": true,
  "statusCode": 200,
  "metadata": {
    "status": "healthy",
    "timestamp": "2025-01-20T12:00:00.000Z",
    "services": [
      {"service": "auth-service", "status": "healthy"},
      {"service": "user-service", "status": "healthy"},
      {"service": "appointment-service", "status": "healthy"}
    ]
  }
}
```

---

## 🚀 Deployment

### Docker Deployment
```bash
# Production build
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose up -d --scale user-service=3
```

### Environment-Specific Configs
- `docker-compose.yml` - Development
- `docker-compose.prod.yml` - Production
- `docker-compose.test.yml` - Testing

---

**For detailed API documentation, see: `API_REFERENCE.md`** 