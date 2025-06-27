#!/bin/bash
set -e

# Create test database
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE chiropractor_clinic_test;
    GRANT ALL PRIVILEGES ON DATABASE chiropractor_clinic_test TO $POSTGRES_USER;
EOSQL

echo "✅ PostgreSQL databases initialized successfully"
echo "   - Production DB: chiropractor_clinic"
echo "   - Test DB: chiropractor_clinic_test" 