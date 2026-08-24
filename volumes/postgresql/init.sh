#!/bin/bash

set -e

echo "[db-init.sh] Creating users and databases..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" <<-EOSQL

    -- 1. Create users (with CREATEDB so Prisma Migrate can create shadow databases in dev)
    CREATE USER $KEYCLOAK_USER WITH PASSWORD '$KEYCLOAK_PASSWORD';
    CREATE USER $BACKEND_USER WITH CREATEDB PASSWORD '$BACKEND_PASSWORD';

    -- 2. Create databases and assign owners
    CREATE DATABASE $KEYCLOAK_DB OWNER $KEYCLOAK_USER;
    CREATE DATABASE $BACKEND_DB OWNER $BACKEND_USER;

    -- 3. Permission isolation at database level
    REVOKE ALL ON DATABASE $KEYCLOAK_DB FROM PUBLIC;
    GRANT ALL PRIVILEGES ON DATABASE $KEYCLOAK_DB TO $KEYCLOAK_USER;

    REVOKE ALL ON DATABASE $BACKEND_DB FROM PUBLIC;
    GRANT ALL PRIVILEGES ON DATABASE $BACKEND_DB TO $BACKEND_USER;

EOSQL

# 4. Grant full ownership of the 'public' schema inside each database
echo "[db-init.sh] Configuring schema permissions for $BACKEND_DB..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$BACKEND_DB" <<-EOSQL
    GRANT ALL ON SCHEMA public TO $BACKEND_USER;
    ALTER SCHEMA public OWNER TO $BACKEND_USER;
EOSQL

echo "[db-init.sh] Configuring schema permissions for $KEYCLOAK_DB..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$KEYCLOAK_DB" <<-EOSQL
    GRANT ALL ON SCHEMA public TO $KEYCLOAK_USER;
    ALTER SCHEMA public OWNER TO $KEYCLOAK_USER;
EOSQL

echo "[db-init.sh] Initialization complete!"