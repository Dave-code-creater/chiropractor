# Chiropractor Backend Services Documentation

## Overview
This is a microservices-based backend system for a chiropractic clinic management application. The system is composed of multiple services that handle different aspects of the clinic's operations.

## Architecture

The system consists of the following microservices:

1. **Gateway Service** - API Gateway/Entry point
2. **Auth Service** - Handles authentication and authorization
3. **User Service** - Manages user profiles and patient information
4. **Appointment Service** - Handles appointment scheduling
5. **Chat Service** - Real-time communication
6. **Blog Service** - Content management
7. **Report Service** - Reporting and analytics

## Authentication

All services require authentication through the Auth Service. Frontend applications need to:

1. Obtain a JWT token through the `/login` endpoint
2. Include the token in all subsequent requests in the Authorization header:
   ```
   Authorization: Bearer <token>
   ```

### Auth Endpoints

- POST `/register` - Register a new user
- POST `/login` - Authenticate and receive JWT token
- POST `/verify` - Verify JWT token validity

## Core Services

### User Service

Handles all patient-related information and forms. Main endpoints:

#### Patient Intake
- GET `/v1/templates` - Get available form templates
- POST `/v1/reports` - Create new patient report
- GET `/v1/reports` - List all patient reports
- GET `/v1/reports/{id}` - Get specific patient report
- PUT `/v1/reports/{id}` - Update patient report
- DELETE `/v1/reports/{id}` - Delete patient report

Required fields for patient intake:
```json
{
  "first_name": "string",
  "last_name": "string",
  "middle_name": "string",
  "dob": "YYYY/MM/DD",
  "gender": "string",
  "street": "string",
  "city": "string",
  "state": "string",
  "zip": "string",
  "emergency_contact_name": "string",
  "emergency_contact_phone": "string",
  "emergency_contact_relationship": "string",
  "marriage_status": "string",
  "race": "string",
  "home_phone": "string"
}
```

#### Health Records
The service provides CRUD operations for:
**⚠️ Legacy endpoints have been replaced with template-based forms:**
- Template-based Patient Intake (`/v1/reports/:id/patient-intake`)
- Template-based Insurance Details (`/v1/reports/:id/insurance-details`)
- Template-based Pain Evaluation (`/v1/reports/:id/pain-evaluation`)
- Template-based Work Impact (`/v1/reports/:id/work-impact`)
- Template-based Health Conditions (`/v1/reports/:id/health-conditions`)

**For complete documentation:** See `docs/TEMPLATE_FORMS_API.md`

Each endpoint supports standard CRUD operations (POST, GET, PUT, DELETE).

### Appointment Service

Manages patient appointments:

- POST `/appointments` - Create new appointment
- GET `/appointments` - List all appointments
- GET `/appointments/{id}` - Get specific appointment
- PUT `/appointments/{id}` - Update appointment
- DELETE `/appointments/{id}` - Delete appointment
- GET `/appointments/{id}/profile` - Get patient profile associated with appointment

### Chat Service

Provides real-time communication capabilities using WebSocket:

- WebSocket connection at `ws://<host>/ws`
- Supports real-time messaging between patients and staff
- Maintains conversation history

### Blog Service

Manages clinic's content and posts:

- Supports CRUD operations for blog posts
- Handles media content
- Manages post categories and tags

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start all services:
   ```bash
   docker-compose up
   ```

## Frontend Integration Requirements

1. **Authentication**:
   - Implement JWT token storage and refresh mechanism
   - Add authentication interceptor for API requests
   - Handle unauthorized (401) responses

2. **Real-time Features**:
   - Implement WebSocket connection management
   - Handle connection drops and reconnection
   - Implement message queue for offline support

3. **Forms**:
   - Implement form validation matching backend requirements
   - Handle file uploads for medical records
   - Implement auto-save for long forms

4. **Error Handling**:
   - Implement global error handling
   - Show appropriate error messages to users
   - Handle network connectivity issues

## API Response Format

All API endpoints return responses in the following format:

```json
{
  "success": boolean,
  "statusCode": number,
  "message": string,
  "metadata": {
    // Response data
  }
}
```

## Security Requirements

1. All sensitive data must be transmitted over HTTPS
2. JWT tokens must be stored securely
3. Implement CSRF protection
4. Handle session timeouts gracefully
5. Implement rate limiting on the frontend

## Testing

Each service includes test files that can serve as additional documentation for expected behavior. Review the test files in each service's `/test` directory for detailed examples of request/response patterns.

## Need Help?

For additional support or questions:
1. Check the OpenAPI documentation in each service's `/docs` directory
2. Review the test files for examples
3. Check Postman collections in services that have them
4. Contact the backend team for clarification

---

Note: This documentation is a living document and will be updated as the services evolve. Always refer to the OpenAPI specifications in each service's `/docs` directory for the most up-to-date API contracts.
