# Zila Parishad Primary School, Ghorad — Web Portal & Backend API

Official website and backend inquiry management system for Zila Parishad Primary School, Ghorad (Taluka Kalmeshwar, District Nagpur, Maharashtra).

---

## Architecture Overview

- **Frontend**: Responsive website (HTML5, Vanilla CSS, Vanilla JavaScript).
- **Backend**: Node.js & Express REST API with security middleware (`helmet`, `cors`, `express-rate-limit`, `express-validator`).
- **Database**: **MongoDB Atlas** (Cloud Database) via Mongoose.
- **Notifications**: Automated dispatch via **Meta WhatsApp Cloud API** and **Nodemailer / SMTP**.

---

## MongoDB Atlas Setup Guide (Step-by-Step)

Follow these 10 steps to connect the backend to your MongoDB Atlas cloud database:

### 1. Create a MongoDB Atlas Account
- Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and sign up for a free account (or log in).

### 2. Create a Free Database Cluster
- In the Atlas dashboard, click **Create** / **Build a Database**.
- Choose the **M0 Free (Shared)** tier.
- Select your preferred cloud provider and region (e.g., AWS / Google Cloud in Mumbai `ap-south-1` for lowest latency in India).
- Click **Create Deployment**.

### 3. Create a Database User
- In the left sidebar under **Security**, navigate to **Database Access**.
- Click **Add New Database User**.
- Select **Password** as the authentication method.

### 4. Set the Database Username and Password
- Enter a username (e.g., `schoolAdmin`).
- Generate or type a secure password (e.g., `MyStrongPass123`).
- Under **Database User Privileges**, select **Read and write to any database** (or `Built-in Role: Atlas admin`).
- Click **Add User**.

### 5. Add Development IP Address to Network Access
- In the left sidebar under **Security**, navigate to **Network Access**.
- Click **Add IP Address**.
- Click **Add Current IP Address** to whitelist your computer's IP address.
- **For Development / Dynamic IPs**: You can temporarily select **Allow Access from Anywhere** (`0.0.0.0/0`).
  > **SECURITY WARNING**: Allowing `0.0.0.0/0` allows connections from any IP address on the internet. While convenient during development with changing WiFi/mobile networks, you should restrict this to specific server/static IP addresses for production deployments.
- Click **Confirm**.

### 6. Get the MongoDB Connection String
- In the Atlas sidebar, navigate to **Database** (or **Deployments**).
- Click the **Connect** button next to your cluster.
- Under **Connect your application**, choose **Drivers** (Driver: `Node.js`, Version: `5.5 or later` / latest).
- Copy the provided SRV connection string, which will look like:
  ```text
  mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
  ```

### 7. Put the Connection String inside `backend/.env`
- Open the `backend/.env` file in your editor (or copy from `backend/.env.example` if not already present).
- Set the `MONGODB_URI` environment variable:
  ```env
  MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/schoolWebsite?retryWrites=true&w=majority
  ```

### 8. Replace USERNAME and PASSWORD with Actual Credentials
- Replace `USERNAME` with your database username created in Step 4.
- Replace `PASSWORD` with your database user password created in Step 4.
- Replace `CLUSTER` with your actual cluster hostname (e.g. `cluster0.abcde`).
- Specify the database name after the domain (e.g., `schoolWebsite` or `zp_school_ghorad`).

### 9. URL-Encode Special Characters in Passwords
- If your database password contains special characters like `@`, `:`, `/`, `?`, `#`, `[`, `]`, `%`, you **must URL-encode** them:
  - `@` $\rightarrow$ `%40`
  - `#` $\rightarrow$ `%23`
  - `$` $\rightarrow$ `%24`
  - `%` $\rightarrow$ `%25`
  - `&` $\rightarrow$ `%26`
  - `+` $\rightarrow$ `%2B`
  - `/` $\rightarrow$ `%2F`
  - `:` $\rightarrow$ `%3A`
  - `?` $\rightarrow$ `%3F`
- *Example*: If password is `Admin@2026#`, use `Admin%402026%23` in the URI.

### 10. Restart the Backend Server
- After editing `backend/.env`, restart your Node.js backend:
  ```bash
  cd backend
  node server.js
  ```
- You should see:
  ```text
  MongoDB connected successfully
  [MongoDB] Connected to host: cluster0-shard-00-00.abcde.mongodb.net, database: schoolWebsite
  ```

---

## Environment Variables (`backend/.env.example`)

```env
PORT=5000

MONGODB_URI=

SCHOOL_EMAIL=

EMAIL_FROM=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=

WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_RECIPIENT_NUMBER=919850326135
WHATSAPP_TEMPLATE_NAME=
WHATSAPP_TEMPLATE_LANGUAGE=en
```

---

## Inquiry Submission Flow & Error Handling

When a user submits the contact form:
1. **Frontend Request**: Submits `POST /api/inquiries` with JSON payload `{ name, phone, category, message }`.
2. **Rate Limiting & Validation**: Validates Indian phone number (10 digits starting with 6–9), name, honeypot spam detection, and length limits.
3. **Database Save**: Saves the inquiry record to MongoDB Atlas.
   - If MongoDB is disconnected or unavailable, the backend immediately returns HTTP `503 Service Unavailable` with message `"Database service is currently unavailable. Please try again later."` and logs the real error to the server console.
   - No email or WhatsApp notifications are dispatched if the database save fails.
4. **Notification Dispatch**: Upon successful database save, Nodemailer (Email) and Meta WhatsApp Cloud API notifications are triggered in parallel (`Promise.allSettled`).
   - If email or WhatsApp credentials are not configured or dispatch fails, the inquiry **remains securely saved in MongoDB**, the error is logged to the server, and the failure status is recorded in the database without rolling back the inquiry.
5. **Success Response**: HTTP `201 Created` is returned to the client, and the frontend displays the success alert banner.

---

## Running the Application Locally

1. **Install backend dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Add your MONGODB_URI to backend/.env
   ```

3. **Start backend server**:
   ```bash
   node server.js
   # or with auto-restart during development:
   npm run dev
   ```

4. **Open the website**:
   - Serve the root directory with any HTTP server (e.g. VS Code Live Server or access via `http://localhost:5000/contact.html`).
