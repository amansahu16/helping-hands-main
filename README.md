# Helping Hands — Empowering Communities, One Rescue and Donation at a Time

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](#)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](#)
[![React Version](https://img.shields.io/badge/react-v19.2.6-blue.svg)](#)
[![Prisma Version](https://img.shields.io/badge/prisma-v6.19.3-indigo.svg)](#)

---

## About the Project

**Helping Hands** is a modern, community-driven social impact platform designed to bridge the gap between compassionate individuals, local donors, and non-governmental organizations (NGOs). The platform facilitates direct action and coordination for community service, stray animal rescues, and resource reallocation.

Whether it is donating excess household items, reporting a stray animal in distress, managing adoption workflows, or organizing volunteering campaigns, Helping Hands provides a unified, real-time command center for local impact.

### Project Architecture & Design Philosophy
Helping Hands is structured as a monorepo containing a modern **Vite/React single-page application** for the client and an **Express/Prisma/PostgreSQL API** for the backend.
- **Glassmorphic UI**: Styled with modern CSS variables, premium typography (Outfit font), and micro-animations.
- **Full Dark Theme Support**: Accessible theme toggle that dynamically shifts colors across the entire user and NGO experience.
- **Resilient Offline Fallback**: Features a fully-functional **Demo Mode** which detects database status and lets users preview flows locally even without a running PostgreSQL instance.

### Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite 8, Tailwind CSS v4 | Ultra-fast rendering, modern styling configuration, and rich UI elements. |
| **Routing & Icons** | React Router DOM v7, Lucide React | Clean client-side page routing and consistent iconography. |
| **Mapping** | Leaflet 1.9, React Leaflet 5 | Interactive map to plot stray emergencies and campaigns in real-time. |
| **Backend** | Node.js, Express.js (v5) | Fast, modular ES module (`type: "module"`) API server. |
| **ORM** | Prisma ORM (v6) | Multi-schema architecture for clean and scalable SQL queries. |
| **Database** | PostgreSQL | Robust relational database hosting user profiles, donation lists, and campaigns. |
| **Security / Auth** | JSON Web Tokens (JWT), Bcrypt | Secure role-based auth (User vs. NGO) and password hashing. |
| **Mail & OTP** | Nodemailer, Mock OTP Service | Verification of account creations via email OTP with console bypass fallback. |
| **File Storage** | Multer, Cloudinary | Seamless upload and hosting of campaign and animal photos. |

---

## Key Features

### 👤 Double-Sided Identity & Auth
- Dedicated signup pipelines for **Individuals** and **NGOs**.
- Multi-layer security featuring password hashing (Bcrypt) and JSON Web Token authorization.
- Real-time **OTP validation** upon registry to keep communication channels authentic.

### 📍 Interactive Animal Rescue Map
- Anyone can report a stray animal emergency, adding crucial details (type, injury level, photo, location description).
- Integrates Leaflet maps to drop coordinates and track nearby incidents visually.
- Multi-stage lifecycle tracking: `OPEN` ➔ `ASSIGNED` ➔ `RESOLVED` ➔ `CLOSED`.

### 📦 Donating Household Items
- Simple interface for individuals to submit surplus goods (Clothes, Food, Books, etc.).
- Pickup scheduling (date/time, pickup address, quantities).
- Transparent state machine tracking for NGOs: `PENDING` ➔ `ACCEPTED` ➔ `PICKED_UP` ➔ `DELIVERED`.

### 🐾 Stray Adoptions
- Allows NGOs to showcase animals looking for a home.
- Let users submit adoption requests.
- Track adoption workflow stages (`IN_PROGRESS`, `COMPLETED`, `CANCELLED`).

### 📢 Impact Campaigns
- NGOs and verified users can plan and launch local drives (volunteering, cleanliness, donation events).
- Track registration, manage max participant caps, and display campaign locations.

### 🎨 Responsive Glassmorphic Design
- Rich gradients, custom layout structures, and animated hover cues.
- Seamless Light / Dark theme toggles.

---

## Getting Started

### Prerequisites
Before setting up Helping Hands, make sure you have the following installed on your machine:
* **Node.js**: `v18.0.0` or higher
* **npm**: `v9.0.0` or higher
* **PostgreSQL** *(Optional for Demo Mode, Required for Full DB connectivity)*: A running database instance.

### Installation

Follow these steps to configure and run the application locally:

#### 1. Clone the Repository
```bash
git clone https://github.com/amansahu16/helping-hands-main.git
cd helping-hands-main
```

#### 2. Install Workspace Dependencies
Install dependencies for the root workspace, which will automatically configure workspace bindings:
```bash
npm install
```
Alternatively, to install backend and frontend packages individually in a single command, you can run:
```bash
npm run install:all
```

#### 3. Setup Environment Variables
Create a `.env` file in the root directory (or ensure the existing one matches your configuration). You can base it on this template:

```ini
# Server Configuration
PORT=8000
CORS_ORIGIN=*

# Database Connections
DATABASE_URL="postgresql://username:password@localhost:5432/HelpingHands?schema=public"
DIRECT_URL="postgresql://username:password@localhost:5432/HelpingHands?schema=public"

# Cloudinary Integration (For Image Uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Authentication & Tokens
ACCESS_TOKEN_SECRET=your_super_secret_jwt_secret_key_123
JWT_SECRET=your_super_secret_jwt_secret_key_123
```

#### 4. Sync Database & Generate ORM Client
With your PostgreSQL server running, execute the following commands to generate Prisma Client bindings and push the schemas:
```bash
# Generate the local Prisma Client files
npm run prisma:generate

# Sync database tables and schema
npm run prisma:push
```

---

## Usage

### Starting Development Servers
Helping Hands uses `concurrently` to run both the frontend and backend local servers simultaneously. Simply execute:
```bash
npm run dev
```

This starts:
- **Backend API Server**: `http://localhost:8000`
- **Vite React Frontend**: `http://localhost:5173`

### Testing Accounts & Flows
1. Open your browser and head to `http://localhost:5173` (or `http://localhost:8000` if serving client assets directly).
2. **Offline Testing (Demo Mode)**: If PostgreSQL is offline, you will see a notice toast. Feel free to use the site anyway; mock databases will activate so you can check and test the interface.
3. **Register/Login Flow**:
   - Toggle to Register, sign up as a User or NGO.
   - For OTP verification during registry, check your backend console logs for the printed code, or use the default bypass code: `123456`.
4. **NGO Management**: Register an NGO account to access the NGO Admin panel, accept stray rescues from the Leaflet map, update items picked up, or write updates/posts.

---

## Roadmap & Future Enhancements
* [ ] Integrate live SMS alerts using Twilio for instant rescue dispatch notifications.
* [ ] Expand Stripe payment gateways for direct monetary donations to verified NGOs.
* [ ] Provide AI-based categorization of stray animal injuries using uploaded images.
* [ ] Mobile-native applications utilizing React Native.

---

## Contributing

We welcome community contributions! Follow these steps to contribute:
1. **Fork** the project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a **Pull Request**.

---

## License

Distributed under the **ISC License**. See [package.json](file:///c:/Users/amans/Desktop/helping-hands-main/backend/package.json) for details.
