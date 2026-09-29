# Backend API — ZP Primary School, Ghorad

Node.js / Express / Mongoose backend API for the official school website.

---

## MongoDB Atlas Configuration

The backend is configured to connect to **MongoDB Atlas** via `process.env.MONGODB_URI`.

### Setup Checklist:
1. Create a [MongoDB Atlas account](https://www.mongodb.com/cloud/atlas/register).
2. Create an M0 Free Cluster.
3. Create a database user with read/write privileges.
4. Set database user password.
5. In Network Access, whitelist your IP or allow `0.0.0.0/0` (for development).
6. Copy the connection string (`mongodb+srv://...`).
7. Paste into `backend/.env` under `MONGODB_URI`.
8. Substitute `USERNAME` and `PASSWORD` with real credentials.
9. URL-encode special characters in password (e.g. `@` -> `%40`, `#` -> `%23`).
10. Restart server: `node server.js`.

---

## Environment Configuration

`.env.example` structure:

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

## Available Scripts

- `npm start` — Run production server with `node server.js`
- `npm run dev` — Run development server with `nodemon server.js`
- `npm test` — Run fast unit and API route test suite
