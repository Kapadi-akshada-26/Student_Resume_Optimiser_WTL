# Student Resume Optimiser 🎓

A complete B.Tech college course web application built to analyze existing student resumes, identify missing/weak sections, calculate a transparent rule-based optimization score, and provide actionable recommendations.

---

## 🏗️ Architecture & Technology Stack

```text
React Frontend (Vite)
        │
        ▼ (Fetch API with JSON)
Express REST API (Node.js)
        │
        ▼ (mysql2 connection pool)
  MySQL Database
```

- **Frontend:** React, React Router (`react-router-dom`), HTML5 / JSX, Responsive CSS (Flexbox & Grid), Fetch API
- **Backend:** Node.js, Express.js (REST API architecture with CORS & JSON body parsing)
- **Database:** MySQL (`mysql2/promise` connection pool)
- **PHP Demo:** Standalone PHP form validation script (`php-demo/resume-validation.php`)

---

## 📂 Project Structure

```text
student-resume-optimiser/
│
├── database/
│   └── schema.sql                        # SQL schema (users, resumes, analysis tables)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx                # Responsive Nav (Public vs Authenticated)
│   │   │   ├── Footer.jsx                # Shared Footer
│   │   │   └── ResumeForm.jsx            # Dynamic multi-section resume form with state & badges
│   │   ├── pages/
│   │   │   ├── Home.jsx                  # Landing page
│   │   │   ├── Login.jsx                 # Login form with validation & localStorage session
│   │   │   ├── Register.jsx              # Register form with validation & bcrypt password hashing
│   │   │   ├── Dashboard.jsx             # Real-time statistics, score banner & activity list
│   │   │   ├── OptimiseResume.jsx        # Resume input & edit form page
│   │   │   ├── MyResumes.jsx             # Saved resumes grid, View modal & Delete confirmation
│   │   │   ├── AnalysisResult.jsx        # Score hero card, section bars, strengths & suggestions
│   │   │   ├── History.jsx               # Analysis logs & report history
│   │   │   └── Profile.jsx               # Student details & account statistics
│   │   ├── services/
│   │   │   └── api.js                    # Fetch API integration helpers
│   │   ├── App.jsx                       # Route protection & state management
│   │   ├── index.css                     # Responsive CSS styling & tokens
│   │   └── main.jsx                      # React root entry
│   └── package.json
│
├── backend/
│   ├── config/
│   │   └── db.js                         # MySQL connection pool & database helpers
│   ├── controllers/
│   │   ├── authController.js             # Registration & Login handlers
│   │   ├── resumeController.js           # Full Resume CRUD handlers
│   │   └── analysisController.js         # Analysis Engine trigger & history handlers
│   ├── services/
│   │   └── analysisEngine.js             # Transparent Rule-Based Scoring Engine
│   ├── routes/
│   │   ├── authRoutes.js                 # Authentication routes (/api/auth)
│   │   ├── resumeRoutes.js               # Resume CRUD routes (/api/resumes)
│   │   └── analysisRoutes.js             # Analysis routes (/api/analyse & /api/analysis)
│   ├── server.js                         # Express server entry point
│   ├── .env                              # Environment configurations
│   └── package.json                      # Express, mysql2, bcryptjs, cors, dotenv
│
├── php-demo/
│   └── resume-validation.php             # Standalone PHP validation & session demo
│
└── README.md                             # Comprehensive project documentation
```

---

## 🧮 Resume Scoring Methodology (100 Points Total)

The application features a **transparent, rule-based optimization engine** (no external AI/LLM APIs required):

1. **Personal / Contact Information (15 pts):** Full Name (+3), Email (+3), Phone (+3), LinkedIn (+3), GitHub (+3).
2. **Professional Summary (10 pts):** Summary $\ge 30$ chars (+10), short summary (+5), missing (0).
3. **Education (15 pts):** At least 1 complete education entry (+15).
4. **Skills & Tools (15 pts):** $\ge 5$ skills (+15), 3–4 skills (+10), 1–2 skills (+5), none (0).
5. **Projects (20 pts):** $\ge 2$ projects (+20), 1 project (+12), none (0).
6. **Work Experience (10 pts):** Experience entry present (+10), none (0).
7. **Certifications (5 pts):** Certification entry present (+5), none (0).
8. **Achievements (5 pts):** Honors / Awards present (+5), none (0).
9. **Content Quality (5 pts):** Detailed descriptions with action verbs (+5), basic (+3), none (0).

---

## 🌐 REST API Endpoints

### Authentication
- `POST /api/auth/register` — Creates user account (hashes password with `bcrypt`).
- `POST /api/auth/login` — Authenticates user credentials and returns session profile.

### Resume CRUD
- `POST /api/resumes` — Creates new resume profile.
- `GET /api/resumes` — Lists logged-in user's resumes.
- `GET /api/resumes/:id` — Fetches single resume details (enforces ownership).
- `PUT /api/resumes/:id` — Updates existing resume profile.
- `DELETE /api/resumes/:id` — Deletes resume profile.

### Analysis & History
- `POST /api/analyse/:id` — Evaluates resume, calculates score out of 100, generates strengths & suggestions, and saves report to MySQL.
- `GET /api/analysis/history` — Fetches user's analysis history logs.
- `GET /api/analysis/:id` — Fetches single analysis report details.

---

## 🗄️ Database Setup Instructions

1. Ensure MySQL Server is running on your machine (default port: `3306`).
2. Run the SQL schema script in your MySQL client:
   ```sql
   SOURCE database/schema.sql;
   ```
3. Update database credentials in `backend/.env`.

---

## 🚀 How to Run Backend & Frontend

**Backend Server:**
```powershell
cd backend
npm start
```
*(Runs on `http://localhost:5000`)*

**Frontend Application:**
```powershell
cd frontend
npm run dev
```
*(Runs on `http://localhost:5173`)*

---

## 🧪 System Test Verification

- **Strong Resume Test:** Evaluated complete resume $\rightarrow$ **100 / 100**, 9 Key Strengths generated.
- **Weak Resume Test:** Evaluated incomplete resume $\rightarrow$ **38 / 100**, 10 Actionable Suggestions generated targeting missing LinkedIn, GitHub, phone, summary, and projects.
- **User Data Isolation:** Enforced on all CRUD and Analysis endpoints.
