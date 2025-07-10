# Chiropractor Practice Management System (Monolithic)

A comprehensive practice management system for chiropractic clinics, converted from microservices to a monolithic architecture for simplified deployment and development.

## 🏗️ Architecture Overview

This application consolidates all previously separate microservices into a single, unified application:

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Patient Management**: Complete patient records, intake forms, medical history
- **Appointment Scheduling**: Doctor-patient appointment booking and management
- **Clinical Notes & Vitals**: Medical documentation and vital signs tracking
- **Real-time Chat**: Socket.IO-based communication system
- **Blog Management**: Content management for clinic blog/news
- **Analytics & Reporting**: Practice analytics and patient reports
- **Health Monitoring**: Comprehensive health checks and monitoring

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT tokens
- **Real-time**: Socket.IO
- **Caching**: Redis (optional)
- **Containerization**: Docker & Docker Compose

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (recommended)
- PostgreSQL (if running locally)

### Option 1: Docker Compose (Recommended)

1. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd chiropractor-monolith
   ```

2. **Create environment file**
   ```bash
   cp .env.monolith.example .env
   # Edit .env with your configuration
   ```

3. **Start all services**
   ```bash
   npm run docker:up
   ```

4. **Check application health**
   ```bash
   curl http://localhost:3000/health
   ```

### Option 2: Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup database**
   ```bash
   # Start PostgreSQL locally
   # Update .env with your database credentials
   ```

3. **Run migrations**
   ```bash
   npm run migrate
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
chiropractor-monolith/
├── src/
│   ├── index.js                 # Main application entry point
│   ├── config/
│   │   ├── index.js            # Configuration management
│   │   └── database.js         # Database connections
│   ├── controllers/            # Business logic controllers
│   ├── routes/                 # API route definitions
│   ├── middleware/             # Express middleware
│   ├── models/                 # Database models (to be implemented)
│   ├── services/               # Business services (to be implemented)
│   ├── socket/                 # Socket.IO handlers
│   └── utils/                  # Utility functions
├── migrations/                 # Database migration files
├── scripts/                    # Utility scripts
├── test/                       # Test files (to be implemented)
├── docker-compose.yml          # Docker services configuration
├── Dockerfile                  # Application container
└── package.json               # Dependencies and scripts
```

## 🔌 API Endpoints

### Health Check
- `GET /health` - Application and database health status

### Authentication (No Auth Required)
- `POST /v1/api/2025/auth/register` - Register new user
- `POST /v1/api/2025/auth/login` - User login
- `POST /v1/api/2025/auth/logout` - User logout
- `POST /v1/api/2025/auth/refresh` - Refresh JWT token
- `POST /v1/api/2025/auth/verify` - Verify JWT token
- `POST /v1/api/2025/auth/forgot-password` - Request password reset
- `GET /v1/api/2025/auth/verify-reset-token` - Verify reset token
- `POST /v1/api/2025/auth/reset-password` - Reset password

### Users & Patients (Auth Required)
- `GET /v1/api/2025/users/patients` - Get all patients
- `POST /v1/api/2025/users/patients` - Create new patient
- `GET /v1/api/2025/users/patients/:id` - Get patient by ID
- `PUT /v1/api/2025/users/patients/:id` - Update patient
- `DELETE /v1/api/2025/users/patients/:id` - Delete patient

### Appointments (Auth Required)
- `GET /v1/api/2025/appointments` - Get all appointments
- `POST /v1/api/2025/appointments` - Create new appointment
- `GET /v1/api/2025/appointments/:id` - Get appointment by ID
- `PUT /v1/api/2025/appointments/:id` - Update appointment
- `DELETE /v1/api/2025/appointments/:id` - Cancel appointment
- `GET /v1/api/2025/appointments/doctors` - Get available doctors

### Blog (Auth Required)
- `GET /v1/api/2025/blog/posts` - Get all blog posts
- `POST /v1/api/2025/blog/posts` - Create new post
- `GET /v1/api/2025/blog/posts/:id` - Get post by ID
- `PUT /v1/api/2025/blog/posts/:id` - Update post
- `DELETE /v1/api/2025/blog/posts/:id` - Delete post

### Chat (Auth Required)
- `GET /v1/api/2025/chat/conversations` - Get conversations
- `POST /v1/api/2025/chat/conversations` - Create conversation
- `GET /v1/api/2025/chat/messages/:conversationId` - Get messages
- `POST /v1/api/2025/chat/messages` - Send message

### Reports (Auth Required)
- `GET /v1/api/2025/reports` - Get all reports
- `POST /v1/api/2025/reports` - Create new report
- `GET /v1/api/2025/reports/:id` - Get report by ID
- `PUT /v1/api/2025/reports/:id` - Update report
- `DELETE /v1/api/2025/reports/:id` - Delete report

### Backward Compatibility
- `POST /auth/*` - Legacy auth endpoints

## 🗄️ Database Schema

### PostgreSQL Database
- `users` - User accounts and authentication
- `patients` - Patient information and medical records
- `doctors` - Doctor profiles and schedules
- `appointments` - Appointment scheduling
- `reports` - Analytics and reports
- `clinical_notes` - Medical documentation
- `vitals` - Patient vital signs
- `api_keys` - JWT token management
- `password_resets` - Password reset tokens
- `patient_intake_responses` - Patient intake forms
- `insurance_details` - Insurance information
- `health_conditions` - Medical history
- `pain_descriptions` - Pain assessment data
- `emergency_contacts` - Emergency contact information
- `posts` - Blog posts and content
- `conversations` - Chat conversations
- `messages` - Chat messages

## 🔧 Development

### Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests
npm run migrate    # Run database migrations
npm run lint       # Run ESLint
npm run lint:fix   # Fix ESLint issues
npm run health-check # Check application health
```

### Docker Commands

```bash
# Basic operations
npm run docker:build     # Build Docker image
npm run docker:up        # Start all services
npm run docker:down      # Stop all services
npm run docker:clean     # Remove all containers and volumes

# Development with full stack
docker-compose up --build                    # Start app + databases
docker-compose --profile admin up -d         # Start with admin tools
docker-compose --profile test up --build     # Run comprehensive tests

# Monitoring and logs
docker-compose logs -f chiropractor-app      # View app logs
docker-compose ps                            # Check service status
docker-compose exec chiropractor-app bash    # Access app container
```

### 🏥 Complete Clinic System Services

The Docker setup provides a full clinic management environment:

**Core Services:**
- **Clinic App** (port 3000): Main application with all features
- **PostgreSQL** (port 5432): All application data including patient records, appointments, clinical data, blog posts, and chat messages
- **Redis** (port 6379): Session management, caching, real-time features

**Admin Tools (with `--profile admin`):**
- **pgAdmin** (port 5050): PostgreSQL database administration
  - URL: http://localhost:5050
  - Login: admin@clinic.com / admin123
- **Redis Commander** (port 8082): Redis cache administration
  - URL: http://localhost:8082

**Test Environment (with `--profile test`):**
- Runs comprehensive test suite including:
  - 🏥 Clinic integration tests (35+ test cases)
  - 🚀 Performance and load testing
  - 🔒 Security and authentication tests
  - 📊 Database connection handling
  - 💬 Real-time features testing

## 🌍 Environment Variables

Key environment variables (see `.env.monolith.example` for complete list):

```env
# Application
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=password
DB_NAME=chiropractor_monolith
MONGO_URI=mongodb://localhost:27017/chiropractor_monolith

# Security
JWT_SECRET=your-super-secure-jwt-secret-key-here
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

## 🏥 Migration from Microservices

This monolithic version consolidates the following services:

| Original Service | New Location | Description |
|-----------------|-------------|-------------|
| Gateway Service | `src/index.js` | Integrated routing |
| Auth Service | `src/routes/auth.routes.js` | Authentication endpoints |
| User Service | `src/routes/user.routes.js` | Patient management |
| Appointment Service | `src/routes/appointment.routes.js` | Scheduling |
| Blog Service | `src/routes/blog.routes.js` | Content management |
| Chat Service | `src/routes/chat.routes.js` + `src/socket/` | Real-time communication |
| Report Service | `src/routes/report.routes.js` | Analytics |

### Benefits of Monolithic Architecture:
- ✅ Simplified deployment and operations
- ✅ Easier local development setup
- ✅ Reduced network latency between services
- ✅ Simplified transaction management
- ✅ Single codebase for easier maintenance
- ✅ Single database connection pool

### Trade-offs:
- ❌ Less scalable than microservices
- ❌ Single point of failure
- ❌ Technology stack coupling
- ❌ Larger deployment units

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --grep "auth"
```

## 📊 Monitoring

The application includes comprehensive health monitoring:

- **Application Health**: `/health` endpoint
- **Database Connectivity**: PostgreSQL and MongoDB status
- **Service Status**: All integrated services status
- **Performance Metrics**: Uptime, memory usage

## 🚀 Deployment

### Production Docker Build

```bash
# Build optimized production image
docker build -t chiropractor-monolith:latest .

# Run production container
docker run -d \
  --name chiropractor-app \
  -p 3000:3000 \
  --env-file .env.production \
  chiropractor-monolith:latest
```

### Production Environment Variables

```env
NODE_ENV=production
DATABASE_SSL=true
CORS_ORIGIN=https://your-domain.com
LOG_LEVEL=warn
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, email support@drdieuphanchiropractor.com or create an issue in this repository.

## 🔄 Development Status

This monolithic version provides the foundational structure. The following components need implementation:

- [ ] Complete authentication controllers
- [ ] Database models and repositories
- [ ] Business logic services
- [ ] Real-time chat functionality
- [ ] Blog content management
- [ ] Patient management features
- [ ] Appointment scheduling logic
- [ ] Reporting and analytics
- [ ] Test suite
- [ ] API documentation

The current version provides a working foundation with health checks, routing structure, and database schema ready for implementation.
