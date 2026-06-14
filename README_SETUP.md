# Helping Hands Setup & Verification Guide

This guide walks you through the steps to configure, migrate, run, and test the **Helping Hands** community social impact platform.

---

##  Summary of Fixes Implemented
We reviewed and resolved all critical runtime and architecture errors in the backend codebase:
1. **Prisma Client Exports**: Created `src/lib/prisma.js` to properly initialize and export the named `prisma` instance, resolving import failures in five controllers.
2. **Authentication Middleware**: Created `src/middleware/requireAuth.js` and `requireRole.js` to enforce JWT auth and role-based permissions (User/NGO).
3. **Registration & Mock OTP**: Created `src/services/otp.service.js` to handle email verification during user and NGO signups (printing codes directly to the console; default testing fallback is `123456`).
4. **NGO Dashboard Features**: Implemented all CRUD functions (NGO profile, post management, donation acceptance, and assigning/resolving stray rescues) in `src/controllers/ngo.controller.js`.
5. **Legit Route Integrations**: Modified `src/app.js` to register the new auth, public, and animals endpoints, and clean out broken placeholder imports.
6. **Bcrypt Standardization**: Mapped all imports from `bcryptjs` to standard `bcrypt` to match `package.json`.
7. **Robust Server Startup**: Configured the server to start and serve the frontend even if PostgreSQL is offline (switching to a seamless local preview mock database).
8. **Premium Frontend Application**: Designed and implemented a stunning, responsive single-page client interface inside the `public/` directory, utilizing Outift Google Fonts, custom CSS variables (with Dark Mode support), glassmorphism, and a Leaflet-based interactive rescue map.

---

##  Setup Steps

### 1. Install Dependencies
Open a terminal in the root of the project directory and run:
```powershell
npm install
```

### 2. Verify Environment Variables (`.env`)
The `.env` file has been updated in the workspace. Make sure the database URL matches your local PostgreSQL connection settings:
```ini
PORT=8000
DATABASE_URL=postgresql://chaiaurcode:chaiaurcode@localhost:5432/HelpingHands
CORS_ORIGIN=*

CLOUDINARY_CLOUD_NAME=myCloud
CLOUDINARY_API_KEY=652247213595877   
CLOUDINARY_API_SECRET=RRZibAFQbHQqZBlrpFn72AZHf6s

ACCESS_TOKEN_SECRET=your_super_secret_access_token_jwt_secret_key_123
JWT_SECRET=your_super_secret_access_token_jwt_secret_key_123
```

### 3. Generate Prisma Client & Sync Database
Run the following commands to generate the local Prisma Client files and sync the schema tables with PostgreSQL:
```powershell
# Compile the multi-schema models
npx prisma generate

# Create tables in PostgreSQL (ensure Postgres is running!)
npx prisma db push
```

### 4. Start the Application
Boot up the Node/Express server:
```powershell
npm run dev
```
You should see:
> `Server is running at port : 8000`

---

##  Verification & Testing Steps

Open your browser and navigate to: **`http://localhost:8000`**

### Scenario A: Offline / Demo Preview Mode (No DB Setup Required)
If you start the server before configuring PostgreSQL, the site will detect this, display a warning toast, and switch to a fully-featured **Demo Mode**. You can click around, log in, sign up, test forms, and see mock items.

### Scenario B: Fully Connected Mode (PostgreSQL running)
1. **User Sign Up & Login**:
   - Navigate to the **Login / Register** page.
   - Toggle to **Register** and sign up as an Individual.
   - Enter your email/password. Upon submitting, the **OTP Verification Screen** will appear.
   - Look at the terminal output to find the printed OTP (or simply enter the default dev bypass code: **`123456`**).
   - Enter the code and click verify, then log in using your credentials.
   
2. **Explore Campaigns**:
   - Go to the **Campaigns** tab to view planned drives.
   - Click the **Create Campaign** button, fill in the modal form, and submit. The list will update in real-time.
   - Click **Register** on an existing campaign to join it.

3. **Donate Household Items**:
   - Go to the **Donate** tab.
   - Fill out the donation form (Category: Clothes/Food, pickup location, quantities) and submit.
   - You will be redirected to your **My Dashboard** page where the donation is logged as `PENDING`.

4. **Animal Distress & Rescue map**:
   - Go to the **Animal Rescue** tab.
   - The interactive Leaflet map will render automatically.
   - Fill out the **Report Stray Emergency** form (e.g. "Injured Stray Dog" at "BKC Road") and submit.
   - The incident will be plotted on the map instantly, and added to the list of recent distress cases.

5. **NGO Dashboard Verification**:
   - Log out, and register/login as an **NGO** (ensure you check "NGO" account type).
   - Go to the **NGO Management Dashboard**.
   - Under **Stray Emergencies**, you will see the stray report filed in Step 4. Click **Accept Rescue** or **Resolve Case** to update its status.
   - Under **Incoming Items**, you will see the donation filed in Step 3. Click **Accept** -> **Picked Up** -> **Delivered** to advance the status workflow.
   - Click **Create Post** in the updates tab to publish blog articles.

6. **Interactive Styling Hooks**:
   - Click the **Moon / Sun** button in the header navigation bar to watch the layout transition between premium Light and Dark themes.
 