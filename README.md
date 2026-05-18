# Strictly Friendly

A social networking web app focused on friendly, non-romantic connections. Users can build profiles, find people with shared interests, chat in real time, share activities, and manage their friend network.

## Tech stack

**Client** ([client/](client/))
- React 18 + TypeScript + Vite
- Redux Toolkit for state management
- React Router for navigation
- Tailwind CSS, Ant Design, Radix UI, Framer Motion for UI
- Socket.IO client for real-time features
- Supabase JS client
- Google Maps, ECharts, Schedule-X calendar

**Server** ([server/](server/))
- Node.js + Express
- Socket.IO for real-time messaging, presence, and notifications
- Supabase + MongoDB for data
- JWT auth with `bcrypt` password hashing
- Helmet, CORS, rate limiting, express-validator for security
- Nodemailer / Resend for email
- Multer for file uploads
- Winston + Morgan for logging

## Project structure

```
.
├── client/   React + Vite frontend
├── server/   Express API + Socket.IO server
└── package.json
```

## Getting started

### Prerequisites
- Node.js (LTS)
- npm
- A Supabase project and any required third-party credentials (Google Maps, reCAPTCHA, email provider, etc.)

### Install

```bash
# Client
cd client
npm install

# Server
cd ../server
npm install
```

### Environment variables

Create `.env` files in both [client/](client/) and [server/](server/) with the keys your environment expects (Supabase URL/keys, JWT secret, Google Maps API key, reCAPTCHA keys, email credentials, etc.). `.env*` files are gitignored.

### Run in development

```bash
# Server (from server/)
npm run dev

# Client (from client/, in a separate terminal)
npm run dev
```

### Build for production

```bash
# Client
cd client
npm run build

# Server
cd ../server
npm start
```

## Scripts

**Client** ([client/package.json](client/package.json))
- `npm run dev` — start Vite dev server
- `npm run build` — type-check and build for production
- `npm run lint` — run ESLint
- `npm run preview` — preview the production build

**Server** ([server/package.json](server/package.json))
- `npm run dev` — start with nodemon
- `npm start` — start with node
- `npm run lint` — run ESLint
- `npm test` — run Jest tests

## HTTPS / certificates

The server can be run over HTTPS using a local certificate. `.pem` files are gitignored — generate your own (e.g. with `mkcert`) and place them in [server/](server/).
