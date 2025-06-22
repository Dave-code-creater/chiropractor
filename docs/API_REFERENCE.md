# Complete API Reference

**Dr. Dieu Phan D.C - Chiropractic Practice Management System**  
**Version:** 2.0 | **Date:** January 2025

---

## 🚀 Quick Start

### Base URLs
```
Gateway (Main Entry Point): http://localhost:3000
Auth Service: http://localhost:3001
User Service: http://localhost:3002
Blog Service: http://localhost:3003
Chat Service: http://localhost:3004
Appointment Service: http://localhost:3005
Report Service: http://localhost:3006
```

### Gateway API Routes
All frontend requests should go through the gateway:
```
Authentication: /v1/api/2025/auth/*
User Management: /v1/api/2025/users/*
Blog System: /v1/api/2025/blog/*
Chat System: /v1/api/2025/chat/*
Appointments: /v1/api/2025/appointments/*
Doctors: /v1/api/2025/doctors/*
```

### Test Account
```json
{
  "email": "doctor@gmail.com",
  "password": "Oces2023@",
  "role": "doctor"
}
```

---

## 🔐 Authentication API

### User Roles
- `admin` - Full system access
- `doctor` - Medical staff access
- `staff` - Administrative access  
- `patient` - Patient portal access

### 1. Register New User
```http
POST /v1/api/2025/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123@",
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+1234567890",
  "role": "patient"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Registration successful",
  "metadata": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "user@example.com",
      "role": "patient"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "uuid-refresh-token"
  }
}
```

### 2. Login
```http
POST /v1/api/2025/auth/login
Content-Type: application/json

{
  "email": "doctor@gmail.com",
  "password": "Oces2023@"
}
```

### 3. Password Reset System

#### Request Password Reset
```http
POST /v1/api/2025/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Reset Password
```http
POST /v1/api/2025/auth/reset-password
Content-Type: application/json

{
  "token": "abc123def456...",
  "newPassword": "NewSecurePass123@"
}
```

### 4. Token Management
```http
POST /v1/api/2025/auth/refresh     # Refresh token
POST /v1/api/2025/auth/verify      # Verify token
POST /v1/api/2025/auth/logout      # Logout
```

---

## 👥 Patient Management API

### Patient Model
```typescript
interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other';
  address?: object;
  emergency_contact?: object;
  insurance?: object;
  medical_info?: object;
  assigned_doctor_id?: string;
  status: 'active' | 'inactive';
  total_visits: number;
  created_at: string;
  updated_at: string;
}
```

### 1. List All Patients
```http
GET /v1/api/2025/users/patients
Authorization: Bearer <access_token>
Query Parameters:
  - page: number (default: 1)
  - limit: number (default: 10)
  - search: string
  - status: 'active' | 'inactive'
  - assigned_doctor_id: string
```

### 2. Get Patient Details
```http
GET /v1/api/2025/users/patients/:id
Authorization: Bearer <access_token>
```

### 3. Create New Patient
```http
POST /v1/api/2025/users/patients
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane.smith@email.com",
  "phone": "+1234567890",
  "date_of_birth": "1990-05-15",
  "gender": "Female",
  "address": {
    "street": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "zip": "62701"
  },
  "emergency_contact": {
    "name": "John Smith",
    "phone": "+1234567891",
    "relationship": "Spouse"
  }
}
```

### 4. Update Patient
```http
PUT /v1/api/2025/users/patients/:id
Authorization: Bearer <access_token>
```

### 5. Get Patient Medical History
```http
GET /v1/api/2025/users/patients/:id/medical-history
Authorization: Bearer <access_token>
```

---

## 📋 Template-Based Forms API

### Overview
The template-based forms system provides a modern, structured approach to patient data collection with pre-defined templates and comprehensive validation.

### Template Model
```typescript
interface Template {
  id: string;
  name: string;
  description: string;
  version: string;
  fields: TemplateField[];
  validation_rules: object;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### Report Model
```typescript
interface Report {
  id: string;
  patient_id: string;
  template_id: string;
  title: string;
  data: object;
  completion_percentage: number;
  status: 'draft' | 'in_progress' | 'completed' | 'archived';
  created_by: string;
  assigned_to: string;
  created_at: string;
  updated_at: string;
}
```

### 1. Template Management

#### Get All Templates
```http
GET /v1/api/2025/users/v1/templates
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "metadata": [
    {
      "id": "patient-intake",
      "name": "Patient Intake Form",
      "description": "Comprehensive patient information collection",
      "version": "1.0",
      "is_active": true
    },
    {
      "id": "insurance-details",
      "name": "Insurance Details Form",
      "description": "Insurance and accident information",
      "version": "1.0",
      "is_active": true
    }
  ]
}
```

#### Get Specific Template
```http
GET /v1/api/2025/users/v1/templates/:templateId
Authorization: Bearer <access_token>
```

### 2. Report Management

#### Create New Report
```http
POST /v1/api/2025/users/v1/reports
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "patient_id": "123",
  "template_id": "patient-intake",
  "title": "John Doe - Initial Assessment",
  "assigned_to": "456"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "metadata": {
    "id": "report_789",
    "patient_id": "123",
    "template_id": "patient-intake",
    "title": "John Doe - Initial Assessment",
    "completion_percentage": 0,
    "status": "draft",
    "created_by": "789",
    "assigned_to": "456",
    "created_at": "2025-01-20T10:00:00Z"
  }
}
```

#### List Reports
```http
GET /v1/api/2025/users/v1/reports
Authorization: Bearer <access_token>
Query Parameters:
  - patient_id: string
  - template_id: string
  - status: string
  - assigned_to: string
  - page: number
  - limit: number
```

#### Get Specific Report
```http
GET /v1/api/2025/users/v1/reports/:reportId
Authorization: Bearer <access_token>
```

#### Update Report
```http
PUT /v1/api/2025/users/v1/reports/:reportId
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Updated Title",
  "status": "in_progress"
}
```

#### Delete Report
```http
DELETE /v1/api/2025/users/v1/reports/:reportId
Authorization: Bearer <access_token>
```

### 3. Form Section Submissions

#### Patient Intake Form
```http
POST /v1/api/2025/users/v1/reports/:reportId/patient-intake
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "middle_name": "Michael",
  "date_of_birth": "1985-03-15",
  "gender": "Male",
  "phone": "+1-555-0123",
  "email": "john.doe@email.com",
  "address": {
    "street": "123 Main Street",
    "city": "Springfield",
    "state": "IL",
    "zip_code": "62701"
  },
  "emergency_contact": {
    "name": "Jane Doe",
    "phone": "+1-555-0124",
    "relationship": "Spouse"
  },
  "insurance": {
    "provider": "Blue Cross Blue Shield",
    "policy_number": "BC123456789",
    "group_number": "GRP001"
  }
}
```

#### Insurance Details Form
```http
POST /v1/api/2025/users/v1/reports/:reportId/insurance-details
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "insurance_carrier": "State Farm",
  "policy_number": "SF987654321",
  "claim_number": "CLM2025001",
  "adjuster_name": "Sarah Johnson",
  "adjuster_phone": "+1-555-0199",
  "accident_date": "2025-01-15",
  "accident_description": "Rear-end collision at intersection",
  "police_report_number": "PR2025001234",
  "attorney_involved": false,
  "prior_treatment": false
}
```

#### Pain Evaluation Form
```http
POST /v1/api/2025/users/v1/reports/:reportId/pain-evaluation
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "current_pain_level": 7,
  "pain_description": "Sharp, shooting pain",
  "pain_frequency": "Constant",
  "pain_triggers": ["Movement", "Sitting", "Standing"],
  "pain_relief_methods": ["Ice", "Rest"],
  "pain_mapping": {
    "neck": 8,
    "upper_back": 6,
    "lower_back": 7,
    "left_shoulder": 5,
    "right_shoulder": 3
  },
  "pain_history": {
    "onset_date": "2025-01-15",
    "progression": "Worsening",
    "previous_episodes": false
  }
}
```

#### Work Impact Assessment
```http
POST /v1/api/2025/users/v1/reports/:reportId/work-impact
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "occupation": "Software Developer",
  "employer": "Tech Solutions Inc",
  "work_schedule": "Full-time, 40 hours/week",
  "physical_demands": ["Sitting", "Computer work", "Minimal lifting"],
  "missed_work_days": 5,
  "work_restrictions": ["No heavy lifting", "Frequent breaks"],
  "return_to_work_status": "Modified duty",
  "impact_on_productivity": "Significantly reduced"
}
```

#### Health Conditions Form
```http
POST /v1/api/2025/users/v1/reports/:reportId/health-conditions
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "current_medications": [
    {
      "name": "Ibuprofen",
      "dosage": "400mg",
      "frequency": "Twice daily"
    }
  ],
  "allergies": ["Penicillin", "Shellfish"],
  "medical_history": [
    {
      "condition": "Hypertension",
      "diagnosed_date": "2020-05-01",
      "status": "Controlled"
    }
  ],
  "family_history": ["Diabetes", "Heart disease"],
  "lifestyle_factors": {
    "smoking": false,
    "alcohol_consumption": "Occasional",
    "exercise_frequency": "2-3 times per week"
  }
}
```

---

## 🏥 Doctor Management API

### Doctor Model
```typescript
interface Doctor {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  specializations: string[];
  license_number: string;
  years_experience: number;
  education: string[];
  certifications: string[];
  bio: string;
  consultation_fee: number;
  rating: number;
  total_reviews: number;
  is_available: boolean;
  status: 'active' | 'inactive';
}
```

### 1. List All Doctors (Public)
```http
GET /v1/api/2025/doctors
Query Parameters:
  - specialization: string
  - is_available: boolean
  - status: string
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "metadata": [
    {
      "id": 1,
      "first_name": "Dieu",
      "last_name": "Phan",
      "email": "doctor@gmail.com",
      "phone_number": "+1-555-CHIRO",
      "specializations": ["Chiropractic", "Spinal Manipulation", "Pain Management"],
      "license_number": "DC12345",
      "years_experience": 12,
      "consultation_fee": 180.00,
      "rating": 4.9,
      "total_reviews": 387,
      "is_available": true,
      "status": "active"
    }
  ],
  "message": "Doctors retrieved successfully"
}
```

### 2. Get Doctor by ID (Public)
```http
GET /v1/api/2025/doctors/:id
```

### 3. Search Doctors (Public)
```http
GET /v1/api/2025/doctors/search?q=searchTerm
Query Parameters:
  - q: string (search term)
  - specialization: string
  - is_available: boolean
```

### 4. Get Available Doctors (Public)
```http
GET /v1/api/2025/doctors/available?date=2024-12-20&time=10:00
Query Parameters:
  - date: string (YYYY-MM-DD)
  - time: string (HH:MM)
```

### 5. Get Specializations (Public)
```http
GET /v1/api/2025/doctors/specializations
```

### 6. Get Doctor Availability (Public)
```http
GET /v1/api/2025/doctors/:id/availability
```

---

## 📅 Appointment Management API

### Appointment Model
```typescript
interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  scheduled_at: string;
  arrival_time?: string;
  completed_at?: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  reason_id?: number;
  visit_number: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}
```

### 1. List Appointments
```http
GET /v1/api/2025/appointments
Authorization: Bearer <access_token>
Query Parameters:
  - doctor_id: number
  - patient_id: number
  - status: string
  - date: string (YYYY-MM-DD)
```

### 2. Create Appointment
```http
POST /v1/api/2025/appointments
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "patient_id": 123,
  "doctor_id": 1,
  "scheduled_at": "2025-01-25T10:00:00Z",
  "reason_id": 1,
  "notes": "Initial consultation"
}
```

### 3. Update Appointment
```http
PUT /v1/api/2025/appointments/:id
Authorization: Bearer <access_token>
```

### 4. Cancel Appointment
```http
DELETE /v1/api/2025/appointments/:id
Authorization: Bearer <access_token>
```

---

## 📊 Dashboard Analytics API

### 1. Dashboard Statistics
```http
GET /v1/api/2025/users/dashboard/stats
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "metadata": {
    "patients": {
      "total": 150,
      "active": 135,
      "inactive": 15,
      "newThisMonth": 12
    },
    "reports": {
      "total": 450,
      "completed": 380,
      "pending": 70,
      "completionRate": 84
    },
    "appointments": {
      "today": 8,
      "thisWeek": 45,
      "thisMonth": 180
    }
  }
}
```

### 2. Appointment Statistics
```http
GET /v1/api/2025/users/appointments/stats?date=2025-01-20
Authorization: Bearer <access_token>
```

### 3. Patient Reports
```http
GET /v1/api/2025/users/reports/patients?startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer <access_token>
```

---

## 💬 Chat API

### 1. WebSocket Connection
```javascript
const socket = io('http://localhost:3004', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### 2. WebSocket Events

#### Client to Server
```javascript
// Join a conversation
socket.emit('join-conversation', { conversationId: '123' });

// Send a message
socket.emit('send-message', {
  conversationId: '123',
  content: 'Hello, how are you?',
  type: 'text'
});

// Typing indicator
socket.emit('typing', { conversationId: '123' });
```

#### Server to Client
```javascript
// Receive a message
socket.on('message-received', (message) => {
  console.log('New message:', message);
});

// User typing
socket.on('user-typing', (data) => {
  console.log(`${data.username} is typing...`);
});

// User online status
socket.on('user-online', (userId) => {
  console.log(`User ${userId} is online`);
});
```

---

## 📝 Blog API

### 1. List Published Posts
```http
GET /v1/api/2025/blog/posts
Query Parameters:
  - page: number
  - limit: number
  - search: string
  - tags: string[]
```

### 2. Get Specific Post
```http
GET /v1/api/2025/blog/posts/:id
```

### 3. Create New Post (Auth Required)
```http
POST /v1/api/2025/blog/posts
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Understanding Chiropractic Care",
  "content": "Detailed content about chiropractic care...",
  "tags": ["health", "chiropractic", "wellness"],
  "status": "published"
}
```

---

## 🏥 System Health Monitoring

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "metadata": {
    "status": "healthy",
    "timestamp": "2025-01-20T12:00:00.000Z",
    "services": [
      {
        "service": "auth-service",
        "status": "healthy",
        "error": null
      },
      {
        "service": "user-service", 
        "status": "healthy",
        "error": null
      },
      {
        "service": "appointment-service",
        "status": "unhealthy",
        "error": "Connection timeout"
      }
    ]
  }
}
```

---

## 🔧 Error Handling

### Standard Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation error",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

---

## 📱 Frontend Integration Examples

### Authentication Flow
```javascript
// Login
const response = await fetch('/v1/api/2025/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'doctor@gmail.com',
    password: 'Oces2023@'
  })
});

const data = await response.json();
localStorage.setItem('accessToken', data.metadata.token);
```

### Template-Based Form Submission
```javascript
// Create a report
const reportResponse = await fetch('/v1/api/2025/users/v1/reports', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  },
  body: JSON.stringify({
    patient_id: '123',
    template_id: 'patient-intake',
    title: 'John Doe - Initial Assessment'
  })
});

const report = await reportResponse.json();

// Submit patient intake form
const intakeResponse = await fetch(`/v1/api/2025/users/v1/reports/${report.metadata.id}/patient-intake`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  },
  body: JSON.stringify({
    first_name: 'John',
    last_name: 'Doe',
    // ... other form data
  })
});
```

---

**For architectural details, see: `SERVICES_GUIDE.md`** 