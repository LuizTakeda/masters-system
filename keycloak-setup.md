# Keycloak Initial Setup Guide

This document outlines the step-by-step procedure to configure Keycloak for the Master's System backend API and frontend dashboard.

---

## 1. Access Admin Console

- **URL:** `https://auth.system.local` (or `http://localhost:8080`)
- **Username:** `admin`
- **Password:** `admin` *(as defined in `docker-compose.yml`)*

---

## 2. Create Realm

1. Open the top-left realm dropdown and select **Create Realm**.
2. Set **Realm name:** `iot-dashboard`.
3. Click **Create**.

---

## 3. Configure Client (`backend`)

1. Navigate to **Clients** > **Create client**.
2. **General Settings:**
   - **Client type:** `OpenID Connect`
   - **Client ID:** `backend`
   - Click **Next**.
3. **Capability Config:**
   - **Client authentication:** `ON` (Confidential client)
   - **Authentication flow:** Check `Standard flow` and `Direct access grants`.
   - Click **Next**.
4. **Login Settings:**
   - **Root URL:** `https://app.system.local`
   - **Home URL:** `https://app.system.local`
   - **Valid redirect URIs:**
     ```text
     https://app.system.local/*
     https://app.system.local/api/auth/callback
     http://localhost:3000/*
     http://localhost:5173/*
     ```
   - **Valid post logout redirect URIs:**
     ```text
     https://app.system.local/*
     ```
   - **Web origins:**
     ```text
     +
     ```
5. Click **Save**.

---

## 4. Retrieve Client Secret

1. Open the **Credentials** tab inside the `backend` client.
2. Copy the **Client Secret**.
3. Update `KEYCLOAK_CLIENT_SECRET` in `apps/api/.env`:
   ```env
   KEYCLOAK_REALM="iot-dashboard"
   KEYCLOAK_CLIENT_ID="backend"
   KEYCLOAK_CLIENT_SECRET="<YOUR_COPIED_CLIENT_SECRET>"
   ```

---

## 5. Configure Groups Token Mapper

The backend JWT verifier (`apps/api/src/plugins/jose.ts`) requires group memberships inside the token claims.

1. Navigate to **Clients** > `backend` > **Client scopes** tab.
2. Click the dedicated scope link (e.g., `backend-dedicated`).
3. Click **Add mapper** > **By configuration** > **Group Membership**.
4. Configure:
   - **Name:** `groups`
   - **Token Claim Name:** `groups`
   - **Full group path:** `OFF`
   - **Add to ID token:** `ON`
   - **Add to access token:** `ON`
   - **Add to userinfo:** `ON`
5. Click **Save**.

---

## 6. Create Realm Roles

1. Navigate to **Realm roles** > **Create role**.
2. Set **Role name:** `system-admin`.
3. Click **Save**.

---

## 7. Create Project Groups

1. Navigate to **Groups** > **Create group**.
2. Create standard project groups used by context routing, for example:
   - `project-1`
   - `project-alpha`

---

## 8. Create User

1. Navigate to **Users** > **Add user**.
2. Fill in **Username**, **Email**, **First Name**, and **Last Name**. Click **Create**.
3. **Credentials** tab:
   - Click **Set password**, enter password, and set **Temporary** to `OFF`.
4. **Role mapping** tab:
   - Click **Assign role** and assign `system-admin`.
5. **Groups** tab:
   - Click **Join Group** and select `project-1`.

