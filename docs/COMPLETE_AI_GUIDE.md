# Complete AI Implementation & API Reference Guide

**Dr. Dieu Phan D.C - Chiropractic Practice Management System**  
**Target:** AI Agents for Implementation  
**Version:** 2.0 | **Date:** January 2025  
**Priority:** HIGH - Production Issues

---

## 🚨 **CRITICAL ISSUES TO FIX FIRST**

### Issue #1: Frontend 404 Errors
**Status:** PARTIALLY FIXED - Gateway routes added, frontend calls need correction

**Problem:**
- Frontend making incorrect API calls to `/v1/api/2025/users/reports` (should be `/v1/api/2025/reports`)
- Doctors endpoint was missing from gateway (✅ FIXED)

### Issue #2: Performance Problems
**Status:** NEEDS IMPLEMENTATION  
**Problem:** Slow state updates (66ms-1607ms) in frontend `store.jsx` line 154

---

## 🚀 **SYSTEM OVERVIEW**

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

### Gateway API Routes (All frontend requests go through gateway)
```
Authentication: /v1/api/2025/auth/*
User Management: /v1/api/2025/users/*
Reports: /v1/api/2025/reports/*
Blog System: /v1/api/2025/blog/*
Chat System: /v1/api/2025/chat/*
Appointments: /v1/api/2025/appointments/*
Doctors: /v1/api/2025/doctors/*
Clinical Notes: /v1/api/2025/notes/*
Patient Vitals: /v1/api/2025/patients/:id/vitals/*
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

## 📋 **IMMEDIATE IMPLEMENTATION TASKS**

### Task 1: Fix Frontend API Endpoints (CRITICAL)

#### 1.1 Update Frontend API Calls
**File Location:** Frontend codebase (React/JavaScript)
**Search Pattern:** Look for these incorrect endpoints:

```javascript
// INCORRECT - Fix these immediately
fetch('/v1/api/2025/users/reports')
axios.get('/v1/api/2025/users/reports')

// CORRECT - Change to these
fetch('/v1/api/2025/reports')
axios.get('/v1/api/2025/reports')
```

**Implementation Steps:**
1. Search all frontend files for `/users/reports`
2. Replace with `/reports`
3. Test endpoints return 200 instead of 404

#### 1.2 Gateway Routes Status
✅ **COMPLETED** - Gateway routes already added:
- `/v1/api/2025/doctors` → `http://appointment-service:3005`
- `/v1/api/2025/reports` → `http://user-service:3002`

### Task 2: Optimize Frontend Performance (HIGH PRIORITY)

#### 2.1 Fix Slow State Updates
**Target:** `store.jsx` line 154
**Expected Performance:** <50ms state updates

**Common Issues to Look For:**
```javascript
// PROBLEM: Large object updates causing 1607ms delays
setState(prevState => ({
  ...prevState,
  largeObject: newLargeObject // Causes slow updates
}));

// SOLUTION: Targeted updates
setState(prevState => ({
  ...prevState,
  largeObject: {
    ...prevState.largeObject,
    specificField: newValue
  }
}));
```

**Performance Optimization Checklist:**
- [ ] Add React.memo() to frequently re-rendering components
- [ ] Optimize useEffect dependency arrays
- [ ] Implement proper memoization with useMemo/useCallback
- [ ] Split large state objects into smaller chunks
- [ ] Add performance monitoring
- [ ] Implement virtual scrolling for large lists
- [ ] Use React.lazy() for code splitting

#### 2.2 State Management Best Practices
```javascript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* component content */}</div>;
});

// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// Memoize event handlers
const handleClick = useCallback(() => {
  // handle click
}, [dependencies]);

// Optimize Redux/Zustand selectors
const selectOptimized = useMemo(() => 
  createSelector([selectData], (data) => data.specificField)
, []);
```

---

## 🔐 **AUTHENTICATION API**

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
```http
POST /v1/api/2025/auth/forgot-password    # Request reset
POST /v1/api/2025/auth/reset-password     # Reset with token
```

### 4. Token Management
```http
POST /v1/api/2025/auth/refresh     # Refresh token
POST /v1/api/2025/auth/verify      # Verify token
POST /v1/api/2025/auth/logout      # Logout
```

---

## 👥 **PATIENT MANAGEMENT API**

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

### 5. Patient Statistics
```http
GET /v1/api/2025/users/patients/stats
Authorization: Bearer <access_token>
```

---

## 🏥 **DOCTOR MANAGEMENT API**

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

### 4. Get Available Doctors for Date/Time
```http
GET /v1/api/2025/doctors/available?date=2024-01-01&time=10:00
Authorization: Bearer <access_token>
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
      "specializations": ["Chiropractic", "Pain Management"],
      "available_slots": ["10:00", "10:30", "11:00"],
      "consultation_fee": 180.00
    }
  ],
  "message": "Available doctors retrieved successfully"
}
```

### 5. Create New Doctor (Admin Only)
```http
POST /v1/api/2025/doctors
Authorization: Bearer <access_token>
Content-Type: application/json
Required Role: admin, staff

{
  "first_name": "John",
  "last_name": "Smith",
  "email": "doctor.smith@clinic.com",
  "phone_number": "+1-555-DOCTOR",
  "specializations": ["Chiropractic", "Sports Medicine"],
  "license_number": "DC67890",
  "years_experience": 8,
  "education": ["Doctor of Chiropractic - Palmer College"],
  "certifications": ["Board Certified Chiropractor"],
  "bio": "Specialized in sports injuries and rehabilitation",
  "consultation_fee": 200.00
}
```

### 6. Update Doctor Profile
```http
PUT /v1/api/2025/doctors/:id
Authorization: Bearer <access_token>
Required Role: admin, staff, doctor (own profile)
```

### 7. Doctor Availability Management
```http
GET /v1/api/2025/doctors/:id/availability
PUT /v1/api/2025/doctors/:id/availability
```

---

## 📋 **REPORTS MANAGEMENT API** ⚠️ **CRITICAL - FIX FRONTEND CALLS**

### Report Model
```typescript
interface Report {
  id: string;
  name: string;
  template_id?: string;
  template_data?: object;
  patient_id?: string;
  status: 'draft' | 'completed' | 'archived';
  category: 'consultation' | 'follow-up' | 'assessment';
  completion_percentage: number;
  created_by: string;
  assigned_to: string;
  created_at: string;
  updated_at: string;
}
```

### 1. List All Reports ⚠️ **FRONTEND ISSUE HERE**
```http
GET /v1/api/2025/reports
Authorization: Bearer <access_token>
Query Parameters:
  - page: number (default: 1)
  - limit: number (default: 20)
  - category: 'consultation' | 'follow-up' | 'assessment' | 'all'
  - status: 'draft' | 'completed' | 'archived' | 'all'
  - search: string
  - patientId: string
  - sortBy: 'createdAt' | 'updatedAt' | 'name'
  - sortOrder: 'asc' | 'desc'
```

**❌ INCORRECT Frontend Call (causing 404):**
```javascript
fetch('/v1/api/2025/users/reports')  // WRONG - Fix this!
```

**✅ CORRECT Frontend Call:**
```javascript
fetch('/v1/api/2025/reports')  // RIGHT - Use this!
```

### 2. Create New Report
```http
POST /v1/api/2025/reports
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Initial Consultation Report",
  "patientId": "PAT-123456",
  "templateId": "template_consultation_v1",
  "category": "consultation",
  "assignedTo": "doctor_user_id"
}
```

### 3. Get Report Details
```http
GET /v1/api/2025/reports/:reportId
Authorization: Bearer <access_token>
```

### 4. Update Report
```http
PUT /v1/api/2025/reports/:reportId
Authorization: Bearer <access_token>
```

### 5. Submit Form Sections
```http
POST /v1/api/2025/reports/:reportId/patient-intake
POST /v1/api/2025/reports/:reportId/insurance-details
POST /v1/api/2025/reports/:reportId/pain-evaluation
POST /v1/api/2025/reports/:reportId/detailed-description
POST /v1/api/2025/reports/:reportId/work-impact
POST /v1/api/2025/reports/:reportId/health-conditions
```

---

## 📝 **CLINICAL NOTES & VITALS API**

### Clinical Notes Model
```typescript
interface ClinicalNote {
  id: string;
  patient_id: string;
  note_type: 'general' | 'treatment' | 'assessment' | 'progress' | 'discharge' | 'consultation';
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  follow_up_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}
```

### 1. Clinical Notes Endpoints
```http
GET /v1/api/2025/notes                    # List all notes with filtering
POST /v1/api/2025/notes                   # Create new note
GET /v1/api/2025/notes/:id                # Get specific note
PUT /v1/api/2025/notes/:id                # Update note
DELETE /v1/api/2025/notes/:id             # Delete note
GET /v1/api/2025/patients/:id/notes       # Get patient-specific notes
```

### 2. Patient Vitals Endpoints
```http
GET /v1/api/2025/patients/:id/vitals              # Get patient vitals
POST /v1/api/2025/patients/:id/vitals             # Record new vitals
GET /v1/api/2025/patients/:id/vitals/summary      # Get vitals statistics
GET /v1/api/2025/patients/:id/vitals/trends       # Get trend analysis
```

### Vitals Model
```typescript
interface PatientVitals {
  id: string;
  patient_id: string;
  systolic_bp?: number;
  diastolic_bp?: number;
  heart_rate?: number;
  temperature?: number;
  temperature_unit: 'F' | 'C';
  respiratory_rate?: number;
  oxygen_saturation?: number;
  weight?: number;
  weight_unit: 'lbs' | 'kg';
  height?: number;
  height_unit: 'in' | 'cm';
  bmi?: number;
  pain_level?: number; // 0-10 scale
  recorded_by: string;
  recorded_at: string;
  notes?: string;
}
```

**Example Vitals Creation:**
```http
POST /v1/api/2025/patients/PAT-123/vitals
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "systolic_bp": 120,
  "diastolic_bp": 80,
  "heart_rate": 72,
  "temperature": 98.6,
  "temperature_unit": "F",
  "weight": 150,
  "weight_unit": "lbs",
  "height": 68,
  "height_unit": "in",
  "pain_level": 3,
  "notes": "Patient reports mild discomfort"
}
```

---

## 📅 **APPOINTMENT MANAGEMENT API**

### Appointment Model
```typescript
interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: number;
  appointment_date: string;
  appointment_time: string;
  duration: number;
  type: 'consultation' | 'follow-up' | 'treatment';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
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
  - page: number
  - limit: number
  - patientId: string
  - doctorId: number
  - status: string
  - date: string
```

### 2. Create Appointment
```http
POST /v1/api/2025/appointments
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "patient_id": "PAT-123456",
  "doctor_id": 1,
  "appointment_date": "2024-01-15",
  "appointment_time": "10:00",
  "duration": 30,
  "type": "consultation",
  "notes": "Initial consultation for back pain"
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

## 💬 **CHAT & MESSAGING API**

### 1. Chat Endpoints
```http
GET /v1/api/2025/chat/conversations      # List conversations
POST /v1/api/2025/chat/conversations     # Create conversation
GET /v1/api/2025/chat/conversations/:id  # Get conversation
POST /v1/api/2025/chat/messages          # Send message
```

### 2. Real-time Socket Events
```javascript
// Socket.IO events
socket.on('message:received', (data) => {
  // Handle incoming message
});

socket.emit('message:send', {
  conversationId: 'conv_123',
  content: 'Hello doctor',
  type: 'text'
});
```

---

## 📰 **BLOG & CONTENT API**

### 1. Blog Post Endpoints
```http
GET /v1/api/2025/blog/posts             # List all posts
POST /v1/api/2025/blog/posts            # Create new post (admin)
GET /v1/api/2025/blog/posts/:id         # Get specific post
PUT /v1/api/2025/blog/posts/:id         # Update post (admin)
DELETE /v1/api/2025/blog/posts/:id      # Delete post (admin)
```

---

## 🧪 **TESTING & VALIDATION**

### API Testing Commands
```bash
# Test doctors endpoint (should return 200)
curl -X GET "http://localhost:3000/v1/api/2025/doctors"

# Test reports endpoint (should return 200, not 404)
curl -X GET "http://localhost:3000/v1/api/2025/reports" \
  -H "Authorization: Bearer <token>"

# Test clinical notes
curl -X GET "http://localhost:3000/v1/api/2025/notes" \
  -H "Authorization: Bearer <token>"

# Test patient vitals
curl -X GET "http://localhost:3000/v1/api/2025/patients/PAT-123/vitals" \
  -H "Authorization: Bearer <token>"
```

### Performance Testing
```javascript
// Test for correct API endpoints in frontend
expect(apiCall).toContain('/v1/api/2025/reports');
expect(apiCall).not.toContain('/v1/api/2025/users/reports');

// Performance tests
expect(stateUpdateTime).toBeLessThan(50); // Should be <50ms
```

---

## 🚀 **IMPLEMENTATION PRIORITY**

### Priority 1 (CRITICAL - Fix Immediately)
1. ✅ Fix gateway routes (COMPLETED)
2. 🔄 **Update frontend API calls** (`/users/reports` → `/reports`)
3. 🔄 **Optimize state management performance** (store.jsx line 154)

### Priority 2 (HIGH - Next Sprint)
1. Complete API documentation updates
2. Add comprehensive error handling
3. Implement rate limiting
4. Add API versioning consistency

### Priority 3 (MEDIUM - Future Enhancement)
1. Add caching mechanisms
2. Implement real-time updates
3. Add comprehensive logging
4. Performance monitoring

---

## 📊 **SUCCESS METRICS**

### Before Implementation
- ❌ 404 errors on doctors endpoint
- ❌ 404 errors on reports endpoint  
- ❌ Slow state updates (66ms-1607ms)

### After Implementation
- ✅ All API endpoints return 200/201
- ✅ State updates <50ms
- ✅ No 404 errors in console
- ✅ Improved user experience

---

## 🔧 **DEPLOYMENT CHECKLIST**

### Backend Services
- [x] Gateway routes updated and tested
- [x] All microservices running
- [x] Database migrations completed
- [x] API endpoints responding correctly

### Frontend Updates (NEEDS IMPLEMENTATION)
- [ ] API endpoint URLs corrected
- [ ] State management optimized
- [ ] Performance improvements implemented
- [ ] Error handling enhanced

### Documentation
- [x] API reference complete
- [x] Implementation guide created
- [x] Examples provided
- [x] Testing procedures documented

---

## 💡 **ADDITIONAL RECOMMENDATIONS**

### Code Quality
1. Add TypeScript for better type safety
2. Implement comprehensive error boundaries
3. Add proper logging and monitoring
4. Use proper HTTP status codes

### Security
1. Implement rate limiting
2. Add request validation
3. Secure sensitive endpoints
4. Add CORS configuration

### Performance
1. Implement caching strategies
2. Add database indexing
3. Optimize queries
4. Use pagination consistently

---

## 🎯 **IMMEDIATE ACTION ITEMS FOR AI AGENTS**

1. **Search frontend codebase for** `/users/reports` and replace with `/reports`
2. **Optimize store.jsx line 154** - implement React.memo, useMemo, useCallback
3. **Test all endpoints** return 200 instead of 404
4. **Add performance monitoring** to track state update times
5. **Implement error boundaries** for better error handling

---

**END OF COMPLETE GUIDE**

*This comprehensive document contains everything needed for AI agents to implement fixes and understand the complete API structure.* 