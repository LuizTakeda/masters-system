#!/bin/bash

set -e

echo "[db-init.sh] Creating users and databases..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" <<-EOSQL

    -- 1. Create users with their respective passwords
    CREATE USER $KEYCLOAK_USER WITH PASSWORD '$KEYCLOAK_PASSWORD';
    CREATE USER $BACKEND_USER WITH PASSWORD '$BACKEND_PASSWORD';

    -- 2. Create databases and assign owners
    CREATE DATABASE $KEYCLOAK_DB OWNER $KEYCLOAK_USER;
    CREATE DATABASE $BACKEND_DB OWNER $BACKEND_USER;

    -- 3. Permission isolation (Ensures databases are strictly isolated)
    REVOKE ALL ON DATABASE $KEYCLOAK_DB FROM PUBLIC;
    GRANT ALL PRIVILEGES ON DATABASE $KEYCLOAK_DB TO $KEYCLOAK_USER;

    REVOKE ALL ON DATABASE $BACKEND_DB FROM PUBLIC;
    GRANT ALL PRIVILEGES ON DATABASE $BACKEND_DB TO $BACKEND_USER;

EOSQL

echo "[db-init.sh] Setting up backend database..."
psql -v ON_ERROR_STOP=1 --username "$BACKEND_USER" --dbname "$BACKEND_DB" <<-EOSQL

    -- Enable time-series extension on the backend database
    CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

EOSQL

echo "[db-init.sh] Initialization complete!"