# ResQ — AI Productivity Companion

> **Your AI doesn't just remind you. It acts before you miss.**

<div align="center">
  <img src="https://img.shields.io/badge/Node.js-20.x%20%7C%2024.x-green" alt="Node.js version" />
  <img src="https://img.shields.io/badge/React-18-blue" alt="React version" />
  <img src="https://img.shields.io/badge/Gemini-gemini--2.5--flash-orange" alt="Gemini model" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-green" alt="MongoDB database" />
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License" />
</div>

---

**ResQ** is a full-stack, proactive AI productivity companion powered by **Google Gemini** that runs a continuous intelligence loop. It analyzes your workload every 5 minutes and takes *meaningful action before deadlines are missed*, shifting productivity from passive, forgotten lists to active, conversational execution.

---

## ✨ Features

- **🗣️ Agentic Voice Companion** — Use hands-free voice commands via `"Hey ResQ"`. Gemini parses intent and executes direct database actions (create task, schedule event, complete habit, change theme, start focus session) using `@google/generative-ai`.
- **🔄 Multi-Turn Clarification Loops** — Intelligent, human-like interviewer loops. If a request is vague (e.g., *"Create a presentation"*), ResQ asks follow-up questions to gather details (destination, dates, type) and retains context across multiple turns.
- **⚡ Cross-Domain Priority Engine** — A single, consolidated Gemini prompt ranks the top 4 urgent actions across all domains (tasks, calendar, habits, goals) simultaneously.
- **📅 Bidirectional Google Calendar Sync** — Syncs calendar events via OAuth2 and `googleapis`. Includes real-time conflict resolution and a 5-factor scoring scheduler to auto-fill focus time blocks.
- **🛡️ Focus Session & Cognitive Shield** — Deep work overlay that mutes browser notifications, blocks distractions, and enforces time limits.
- **📈 Proactive Cron Alerts** — Monitors workload every 5 minutes to trigger push notifications, emails, and spoken alerts for upcoming deadlines (2 hours prior), meetings (15 mins prior), and incomplete habits (at 8 PM).
- **💳 Payment & Trial Gating** — Secure credit trial tracking (email + phone unique indicators to prevent abuse) and subscription plans verified via Razorpay HMAC signature.

---

## 🏗️ Architecture

ResQ is built using a clean **layered MVC (Model-View-Controller)** pattern. The backend handles request routing, business logic, cron tasks, and AI integrations, while the frontend provides a responsive glassmorphic dashboard interface communicating via REST APIs and WebSockets.

### System Architecture Diagram
```mermaid
graph TD
    User([User]) <-->|Voice / UI| FE[React Frontend]
    FE <-->|WebSockets / REST| BE[Express Backend]
    BE <-->|Mongoose ODM| DB[(MongoDB Database)]
    
    %% AI and API integrations
    BE -->|NLU & Reasoning| Gemini[Google Gemini API]
    BE -->|Voice Synthesis| ElevenLabs[ElevenLabs TTS API]
    BE -->|Calendar Sync| GoogleCal[Google Calendar API]
    BE -->|Payments| Razorpay[Razorpay API]
    BE -->|Alerts & Emails| Resend[Resend API]
```

---

## 🔄 How It Works

1. **Trigger / Action:** The user interacts with the UI or speaks the wake word `"Hey ResQ"` to capture a voice command.
2. **NLU Processing:** The command is sent to the Express backend. Gemini resolves intent and extracts parameters (dates, times, urgency).
3. **Looping Clarification:** If critical details are missing, the backend retains context, returns `needs_clarification`, and the voice engine interviews the user.
4. **State Update:** Once resolved, database mutations are committed, and the backend pushes real-time updates to the UI via Socket.io.
5. **Proactive Scanning:** Every 5 minutes, a cron scanner parses deadlines and initiates alerts across push, email, and TTS channels.

### Data Flow Diagram
```mermaid
flowchart LR
    Input[Voice / UI Input] --> Auth[JWT Authentication]
    Auth --> Controller[Express Controller]
    Controller --> GeminiService[Gemini Service]
    GeminiService -->|JSON Payload| Actions[VCS / DB Actions]
    Actions -->|Save State| Mongo[(MongoDB)]
    Actions -->|Broadcast| Sockets[Socket.io Server]
    Actions -->|Push Notification| WebPush[VAPID Push Service]
    Actions -->|Speak Out| ElevenLabsTTS[ElevenLabs TTS]
    Sockets -->|Live UI Updates| Frontend[Frontend UI]
    WebPush -->|OS Banner| Frontend
    ElevenLabsTTS -->|Audio Output| UserSpeaker([User Speaker])
```

---

## 🗺️ Feature Map

```mermaid
mindmap
  root((ResQ AI))
    Voice AI Companion
      Hey ResQ Wake Word
      Multi-turn Conversations
      Fuzzy Wake word engine
      ElevenLabs Premium TTS
    Smart Task Engine
      Semantic Urgency Inference
      AI Priority Ranking
      Focus Session Mode
      Cognitive Shield Blockers
    Proactive Alerts
      2h Deadline Alerts
      15m Pre-meeting Alerts
      Habit Streaks at 8 PM
      Goal Pace Reminders
    Calendar Sync
      Bidirectional Google Calendar
      Conflict Resolution
      5-factor Smart Scheduler
    Habits and Goals
      Milestone Decomposition
      Coaching insights
      Streaks heatmap
    Subscription System
      Razorpay Subscription
      Free Trial Verification
      Feature Gating
```

---

## 🛠️ Tech Stack

### Technology Inventory

| Layer | Technology | Purpose | Version |
| :--- | :--- | :--- | :--- |
| **Frontend** | React | Component-based UI library | `^19.2.6` |
| **Frontend** | Vite | Rapid bundler & development server | `^8.0.12` |
| **Frontend** | GSAP / Framer Motion | Smooth dashboard transitions & micro-animations | `^3.15.0` / `^12.42.0` |
| **Backend** | Node.js / Express | Server platform and REST routing API | `20+` / `^4.19.2` |
| **Backend** | Socket.IO | Bi-directional websocket connection for alerts | `^4.7.5` |
| **Backend** | Node-cron | Scheduled database scanners (5-minute interval) | `^4.5.0` |
| **Database** | MongoDB / Mongoose | Database hosting & object modeling | `Atlas` / `^8.4.1` |
| **AI Integration**| Google Gemini | Core NLU, prioritization, and scheduling logic | `gemini-2.5-flash` |
| **Voice / Sync** | Web Speech API | Client-side Speech-To-Text (STT) parsing | *Native* |
| **Voice / Sync** | ElevenLabs API | High-fidelity Text-To-Speech (TTS) engine | *REST API* |
| **Integrations** | Google Calendar API | Calendar event synchronizations (OAuth2) | `v3` / `^173.0.0` |
| **Payments** | Razorpay SDK | Order processing & signature checks | `^2.9.6` |
| **Mailing** | Resend / Nodemailer | Automated transactional email triggers | `^6.14.0` / `^9.0.1` |

### Tech Stack Layers
```mermaid
graph TD
    subgraph Frontend Layer
        React[React 18]
        Vite[Vite]
        CSS[Vanilla CSS]
        GSAP[GSAP / Framer Motion]
    end
    subgraph Backend Layer
        Node[Node.js 20/24]
        Express[Express 4]
        Cron[Node-cron]
        SocketIO[Socket.IO]
    end
    subgraph Storage Layer
        Mongo[(MongoDB Atlas)]
        Mongoose[Mongoose ODM]
    end
    subgraph AI & Cloud Integrations
        Gemini[Gemini 2.5 Flash]
        ElevenLabs[ElevenLabs TTS]
        Google[Google Calendar API]
        Razorpay[Razorpay Payment]
        Resend[Resend Email]
    end
    React --> SocketIO
    Express --> Mongoose
    Mongoose --> Mongo
    Express --> Gemini
    Express --> ElevenLabs
    Express --> Google
    Express --> Razorpay
    Express --> Resend
```

---

## 📁 Project Structure

```
├── backend/
│   ├── config/              # Database, Gemini, and Google API configurations
│   ├── controllers/         # Express API controllers (Auth, Tasks, Voice, Payments)
│   ├── middleware/          # Authentication guards, error handlers, and billing checks
│   ├── models/              # Mongoose DB Schemas (User, Task, Event, Habit, goal)
│   ├── routes/              # Express endpoint routers
│   ├── services/            # Core business logic (Gemini, Google Cal, Cron scheduler)
│   ├── socket/              # WebSockets management and room bindings
│   ├── server.js            # Node app entry point
│   └── package.json         # Backend dependencies & dev scripts
├── frontend/
│   ├── src/
│   │   ├── components/      # UI parts (Dashboard widgets, Landing sections)
│   │   ├── config/          # Client environment variables
│   │   ├── pages/           # Landing, Sign-in, and Dashboard parent layouts
│   │   ├── services/        # Client socket, API, Wake Word, and Voice engines
│   │   ├── index.css        # Main glassmorphic styling sheet
│   │   └── main.jsx         # React application entry point
│   ├── package.json         # Frontend dependencies & configurations
│   └── vite.config.js       # Vite bundle configuration
├── Dockerfile               # Production multi-stage Docker build pipeline
└── README.md                # Project documentation
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js `20.x` or `24.x`
- MongoDB database (local or MongoDB Atlas)
- Google Cloud Console credentials (OAuth 2.0 client)
- Gemini API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/its5zoo/ResQ.git
   cd ResQ
   ```

2. **Configure Backend Environment Variables:**
   Create a `.env` file in the `backend/` directory:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/resq
   JWT_SECRET=your_jwt_signature_secret_string
   GEMINI_API_KEY=your_gemini_api_credentials
   GEMINI_MODEL=gemini-2.5-flash
   GOOGLE_CLIENT_ID=your_gcp_oauth_client_id
   GOOGLE_CLIENT_SECRET=your_gcp_oauth_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:5000/api/google/callback
   ELEVENLABS_API_KEY=your_eleven_labs_voice_api_key
   VAPID_PUBLIC_KEY=vapid_key_for_push_notifications
   VAPID_PRIVATE_KEY=vapid_private_key_for_push_notifications
   VAPID_EMAIL=mailto:support@yourdomain.com
   RAZORPAY_KEY_ID=rzp_test_your_razorpay_key
   RAZORPAY_KEY_SECRET=your_razorpay_secret_key
   CLIENT_URL=http://localhost:5173
   ```

3. **Configure Frontend Environment Variables:**
   Create a `.env` file in the `frontend/` directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   VITE_RAZORPAY_KEY_ID=rzp_test_your_razorpay_key
   ```

4. **Install dependencies:**
   ```bash
   # Install Backend dependencies
   cd backend && npm install
   
   # Install Frontend dependencies
   cd ../frontend && npm install
   ```

5. **Generate VAPID Keys (for WebPush):**
   ```bash
   cd ../backend
   npx web-push generate-vapid-keys
   ```

6. **Run the Application:**
   ```bash
   # In terminal 1 (Backend):
   cd backend
   npm run dev
   
   # In terminal 2 (Frontend):
   cd frontend
   npm run dev
   ```
   Open `http://localhost:5173` to access the application.

---

## 🔌 API Reference

### Auth & Settings
| Method | Endpoint | Description | Headers |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Register new user account | None |
| **POST** | `/api/auth/login` | Login to retrieve JWT token | None |
| **GET** | `/api/auth/me` | Fetch active user credentials | `Authorization: Bearer <Token>` |
| **GET** | `/api/google/login-url` | Generate Google Calendar OAuth URL | `Authorization: Bearer <Token>` |
| **GET** | `/api/google/callback` | OAuth2 callback redirect handler | None |

### Voice AI Companion
| Method | Endpoint | Description | Headers |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/voice/command` | Dispatch voice command to Gemini | `Authorization: Bearer <Token>` |
| **GET** | `/api/voice/usage` | Fetch monthly quota statistics | `Authorization: Bearer <Token>` |
| **POST** | `/api/voice/tts` | Synthesize ElevenLabs voice audio | `Authorization: Bearer <Token>` |

### Tasks & Scheduler
| Method | Endpoint | Description | Headers |
| :--- | :--- | :--- | :--- |
| **GET / POST** | `/api/tasks` | Fetch or create user tasks | `Authorization: Bearer <Token>` |
| **POST** | `/api/tasks/prioritize` | Trigger Gemini task priority sorting | `Authorization: Bearer <Token>` |
| **POST** | `/api/tasks/auto-schedule`| Auto-schedule focus slots on calendar | `Authorization: Bearer <Token>` |

---

## 🗄️ Database Schema

```mermaid
erDiagram
    USER ||--o{ TASK : manages
    USER ||--o{ CALENDAR_EVENT : schedules
    USER ||--o{ HABIT : tracks
    USER ||--o{ GOAL : owns
    USER ||--o{ PAYMENT : makes
    USER ||--o| TRIAL_TRACKING : verifies

    TASK ||--o{ CALENDAR_EVENT : links_to
    GOAL ||--o{ MILESTONE : contains

    USER {
        string id PK
        string name
        string email
        string password
        object googleTokens
        object subscription
        object settings
    }
    TASK {
        string id PK
        string userId FK
        string title
        int urgency
        date dueDate
        int estimatedMinutes
        int aiPriorityRank
    }
    CALENDAR_EVENT {
        string id PK
        string userId FK
        string taskId FK
        date startTime
        date endTime
        string type
        string googleEventId
        boolean aiGenerated
    }
    HABIT {
        string id PK
        string userId FK
        string name
        array targetDays
        int streak
        array completions
    }
    GOAL {
        string id PK
        string userId FK
        string title
        date targetDate
        int progress
        array keyResults
    }
```

---

## 🚢 Deployment

The application is deployed using a multi-stage `Dockerfile` targeting serverless environments like **Google Cloud Run**.

1. **Build the production Docker image locally:**
   ```bash
   docker build -t resq-app:latest .
   ```
2. **Deploy to Google Cloud Run:**
   ```bash
   gcloud run deploy resq-service \
     --image=gcr.io/your-project-id/resq-app:latest \
     --platform=managed \
     --region=us-central1 \
     --allow-unauthenticated
   ```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository and create a new feature branch.
2. Ensure your changes compile locally (`npm run build`).
3. Run the linter (`npm run lint`) to avoid code styling regressions.
4. Submit a Pull Request describing your changes and testing logs.

---

## 📄 License

MIT — Built with ❤️ for the Google AI Hackathon 2025

*ResQ — Because missing deadlines is not an option.*
