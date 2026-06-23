# ResQ — Frontend Architecture & Component Documentation (`frontendDetail`)

This document provides a comprehensive, component-by-component audit of the **ResQ (AI Productivity Companion)** React frontend application. It lists all pages, layout structures, state architectures, visual overrides, and the global voice activation features.

---

## 📂 Core Folder Structure Overview

```bash
frontend/
├── dist/                     # Production build bundle
├── public/                   # Static public assets
├── src/
│   ├── assets/               # Image assets (dashboard and widget screenshots)
│   ├── components/
│   │   ├── Dashboard/        # Dashboard subpage components and panels
│   │   ├── Landing/          # Landing page sections
│   │   └── Shared/           # Global components (Voice Assistant)
│   ├── pages/                # Main router pages (Landing and Dashboard)
│   ├── App.css               # Global App styles
│   ├── App.jsx               # Main router and shell layout
│   ├── index.css             # Tailwind rules and custom theme overrides
│   └── main.jsx              # Application entry point
├── package.json              # Dependencies and build scripts
└── vite.config.js            # Vite bundler configurations
```

---

## 🖥️ Layout & Routing (`App.jsx` & Page Views)

### 1. [App.jsx](file:///c:/Users/MDFAIZAANRAZAKHAN/Downloads/AI%20agent/frontend/src/App.jsx)
- **Role**: Root component of the application.
- **Routing**: Employs `react-router-dom` to manage navigation:
  - `/` (Home landing page) -> renders `<Landing />`
  - `/dashboard` (Productivity app workspace) -> renders `<Dashboard />`
- **Global Injections**: Renders `<GlobalVoiceAssistant />` at the root Level (inside `<Router>`), ensuring background listening and voice capabilities persist across pages.

### 2. [Landing.jsx](file:///c:/Users/MDFAIZAANRAZAKHAN/Downloads/AI%20agent/frontend/src/pages/Landing.jsx)
- **Role**: Coordinates the homepage layout.
- **Scroll Engine**: Integrates **Lenis** smooth-scrolling with an exponential easing function.
- **Render Order**:
  1. `Navbar`
  2. `Hero` (with laptop mockup)
  3. `FeatureStrip`
  4. `FeaturesGrid`
  5. `ChronosLayersSection` (New Layer explanation)
  6. `DashboardPreview`
  7. `VoiceSection`
  8. `MobileSection`
  9. `CTASection`
  10. `Footer`

### 3. [Dashboard.jsx](file:///c:/Users/MDFAIZAANRAZAKHAN/Downloads/AI%20agent/frontend/src/pages/Dashboard.jsx)
- **Role**: Main workspace page container.
- **State Management**:
  - `currentTab` ('dashboard' | 'tasks' | 'calendar' | 'goals' | 'habits' | 'voice' | 'notifications' | 'settings')
  - `tasks` state: Shared task array with title, urgency scale, completing, subtask tree, and categories.
  - `habits` state: Shared habits array with streaks and completions.
- **Theme/Plan Mounting**: Checks and applies `localStorage` themes (`light` | `dark` | `matrix`) and subscription plan styles (`premium-active` | `free-active`) directly onto `document.documentElement` to prevent visual resets or flashes.

---

## 🎨 Global Styles & Light Mode Engine (`index.css`)

The [index.css](file:///c:/Users/MDFAIZAANRAZAKHAN/Downloads/AI%20agent/frontend/src/index.css) file implements the Tailwind 4 config and coordinates the theme-accent combinations:
- **Matrix Theme**: Employs cyber-punk black/green styles (`#00FF33` neon accents).
- **Light Theme**: Backgrounds turn to crisp whites/grays (`#F8F9FA` and `#FFFFFF`).
  - **Light Free Active**: Cards and inputs render with solid **Black** borders (`#000000`, 1.5px thickness). Checkboxes, icons, active menus, and range inputs display in solid black.
  - **Light Premium Active**: Cards and inputs render with solid **Gold** borders (`#E5B842`, 1.5px thickness). Checkboxes, icons, active menus, and range inputs display in premium gold.

---

## 🏠 Landing Page Components (`components/Landing/`)

### 1. [Navbar.jsx](file:///c:/Users/MDFAIZAANRAZAKHAN/Downloads/AI%20agent/frontend/src/components/Landing/Navbar.jsx)
- Glassmorphic top navigation bar with layout page anchor links.
- Font sizes scaled to `text-sm font-semibold` to boost readability.

### 2. [Hero.jsx](file:///c:/Users/MDFAIZAANRAZAKHAN/Downloads/AI%20agent/frontend/src/components/Landing/Hero.jsx)
- Contains landing text headers and call-to-actions.
- **CSS Laptop Mockup**: A realistic, custom space-gray metallic laptop frame containing a centered webcam lens dot, display bezel, screen hinge, and base plate with a trackpad notch.
- **Parallax Mouse Tilt Hook**: Integrates mouse parallax variables (`rotateX`, `rotateY`, `scale`) that tilt the mockup dynamically on hover.
- **Image Preview**: Loads `dashboard_preview.png` inside the bezel.

### 3. [FeatureStrip.jsx](file:///c:/Users/MDFAIZAANRAZAKHAN/Downloads/AI%20agent/frontend/src/components/Landing/FeatureStrip.jsx)
- High-level metric statistics strip (e.g. 98% focus rate, 4.2x calendar efficiency).

### 4. [FeaturesGrid.jsx](file:///c:/Users/MDFAIZAANRAZAKHAN/Downloads/AI%20agent/frontend/src/components/Landing/FeaturesGrid.jsx)
- Alternating layout details for core features.
- **Intelligent Task Prioritization card**: Outer gray container box was removed. Instead, the raw priority stack widget screenshot (`task_prioritization_preview.png`) renders directly in the column, styled with `w-full h-auto rounded-3xl border border-white/10 shadow-2xl` and hover zooms.
- **AI-Powered Scheduling card**: Outer box container was removed. The raw `calendar_sync_preview.png` widget screenshot renders directly in the column, centered and constrained to `max-w-[420px] mx-auto` to look like a realistic widget.
- **Cognitive Text Highlight**: The word "cognitive" inside the grid heading is styled with a simple flat gold color (`#E5B842`).

### 5. [ChronosLayersSection.jsx](file:///c:/Users/MDFAIZAANRAZAKHAN/Downloads/AI%20agent/frontend/src/components/Landing/ChronosLayersSection.jsx)
- **Role**: 3-column detailed section outlining Chronos Layers.
- **Cards**:
  - **AI Block Card**: Pulses gold highlights, details cognitive shield automation.
  - **User Block Card**: Details bidirectional external calendar sync in silver/white.
  - **Deadline Card**: Details task milestone radar warning indicators in warning red.
- **Animations**: Mouse hovers trigger matching color glows and shadow projections on the individual cards.

### 6. [DashboardPreview.jsx](file:///c:/Users/MDFAIZAANRAZAKHAN/Downloads/AI%20agent/frontend/src/components/Landing/DashboardPreview.jsx)
- Interactive mockup simulator showing the prioritized task stack list. Users can check off tasks or drag priorities to test simulated re-order flows.

### 7. [VoiceSection.jsx](file:///c:/Users/MDFAIZAANRAZAKHAN/Downloads/AI%20agent/frontend/src/components/Landing/VoiceSection.jsx)
- Showcases conversational transcript bubble simulations.

### 8. [MobileSection.jsx](file:///c:/Users/MDFAIZAANRAZAKHAN/Downloads/AI%20agent/frontend/src/components/Landing/MobileSection.jsx)
- **3D Phone Mockup**: A dual-layer metallic graphite chassis frame featuring fine bevels, a black camera pill notch, and glass hairline reflections.
- **Badges**: Beautiful vector App Store and Google Play Store download buttons.
- **Height Resolution**: Expanded section padding prevents any items from getting clipped.

### 9. [CTASection.jsx](file:///c:/Users/MDFAIZAANRAZAKHAN/Downloads/AI%20agent/frontend/src/components/Landing/CTASection.jsx)
- Dark premium banner prompting users to open the app or register.

### 10. [Footer.jsx](file:///c:/Users/MDFAIZAANRAZAKHAN/Downloads/AI%20agent/frontend/src/components/Landing/Footer.jsx)
- Realigned `3/2/3/4` grid layout prevents text wrapping or overlap on larger screens.

---

## 📊 Dashboard Components (`components/Dashboard/`)

### 1. [Sidebar.jsx](file:///c:/Users/MDFAIZAANRAZAKHAN/Downloads/AI%20agent/frontend/src/components/Dashboard/Sidebar.jsx)
- Left navigation pane. Has a large `text-4xl` brand header logo (**ResQ**), menu navigation buttons with indicator dots, unread alert tags, and a user profile button.

### 2. [DashboardHome.jsx](file:///c:/Users/MDFAIZAANRAZAKHAN/Downloads/AI%20agent/frontend/src/components/Dashboard/DashboardHome.jsx)
- Dashboard landing dashboard. Features focus metrics progress circles, active goals milestones, and the **AI Advisor** recommendation prompt panel.

### 3. [TasksPage.jsx](file:///c:/Users/MDFAIZAANRAZAKHAN/Downloads/AI%20agent/frontend/src/components/Dashboard/TasksPage.jsx)
- Task management list.
- **Urgency Meter**: Visual sliders showing priority scoring from 1 to 10.
- **Dialogs**: "Create Task" overlay and individual subtask checklist builders.

### 4. [CalendarPage.jsx](file:///c:/Users/MDFAIZAANRAZAKHAN/Downloads/AI%20agent/frontend/src/components/Dashboard/CalendarPage.jsx)
- Visual time-blocking grid.
- **Hover Tooltips**: Shows custom tooltip popups detailing event type, slot name, and advisor insights on hover.
- **Modal Bookings**: Click a slot to book or modify titles, times, and layers (AI block, User block, Deadline) with internal conflict checks.
- **Auto-Scheduler**: Checks tasks and schedules them into empty slots on the fly.
- **Filters**: Checkboxes filter AI Focus blocks, Deadlines, or User meetings.

### 5. [GoalsPage.jsx](file:///c:/Users/MDFAIZAANRAZAKHAN/Downloads/AI%20agent/frontend/src/components/Dashboard/GoalsPage.jsx)
- Multi-tier objective tracker showing quarterly key results and progress meters.

### 6. [HabitsPage.jsx](file:///c:/Users/MDFAIZAANRAZAKHAN/Downloads/AI%20agent/frontend/src/components/Dashboard/HabitsPage.jsx)
- habit tracking matrix.
- **Days Selector**: Form lets users select target days of the week (Mon-Sun) with bulk actions.
- **Heatmap**: Shows habit matrices matching targeted vs. non-targeted off-days.

### 7. [VoiceAIPage.jsx](file:///c:/Users/MDFAIZAANRAZAKHAN/Downloads/AI%20agent/frontend/src/components/Dashboard/VoiceAIPage.jsx)
- AI Voice assistant companion controller (mic settings, proactive prompts, volume levels).

### 8. [NotificationsPage.jsx](file:///c:/Users/MDFAIZAANRAZAKHAN/Downloads/AI%20agent/frontend/src/components/Dashboard/NotificationsPage.jsx)
- Tracks notifications feed. Read notifications shift to monochrome styles, while unread alerts display gold accents, pulsing notification indicator lights, and left color markers.

### 9. [SettingsPage.jsx](file:///c:/Users/MDFAIZAANRAZAKHAN/Downloads/AI%20agent/frontend/src/components/Dashboard/SettingsPage.jsx)
- Comprehensive sticky settings panel with a 14-tab side navigation.
- **Personalization tab**: Features a root font-size step-slider scaling the app's font sizes from 12px to 20px dynamically, saving choice to localStorage.
- **Billing tab**: Toggles between Free and Premium tiers. Upgrading opens a checkout details modal with validation checks, loading spinners, and tier transitions.
- **Theme tab**: Toggles light/dark/matrix styles and persists choices in localStorage.

---

## 🎙️ Global Voice AI Assistant (`components/Shared/GlobalVoiceAssistant.jsx`)

The global Voice AI Assistant is a floating widget designed to handle conversational scheduling queries.

### 1. Background Wake-Word Detection
- Integrates browser `webkitSpeechRecognition` or `SpeechRecognition` to continuously monitor background audio.
- Wakes up immediately if the phrase **"Hey ResQ"** (or speech variations like "Hey rescue") is detected.
- Keeps background listening alive during page navigation.

### 2. Physical UI Elements
- **Floating Mic Orb**: Glowing dark circle button in the bottom right corner with a golden breathing outline. It displays a small badge showing speech capture state.
- **Glassmorphic Console drawer**: Expands upon wake-up.
- **Audio Wave Visualizer**: Displays a dynamic, 19-bar CSS/SVG wave visualizer that animates actively based on speech status.

### 3. Speech Synthesis (Text-to-Speech)
- Translates AI responses out loud using the browser's `SpeechSynthesisUtterance` synthesis engine.

### 4. Interactive Scenarios (Pre-coded UI/UX Decision Trees)
The assistant includes pre-coded response logs and interactive button options to simulate smart decision trees:

| User Query | ResQ AI Text/Speech Response | Renders Action Buttons |
| :--- | :--- | :--- |
| **"summarize my day"** / **"today"** | *"Here is your plan for today: You have a team sync scheduled for 10:00 AM, and I have blocked out an AI Focus Block for React UI integration at 04:00 PM."* | `View Calendar`, `View Tasks` |
| **"set study time table"** / **"study"** | *"I'd love to schedule a study block for you. Do you have a particular time in mind to study? If you choose a specific time, I will fix it on your calendar. Otherwise, we can keep the time flexible and only fix the day."* | `Study at 10:00 AM (Fixed)`, `Study at 04:00 PM (Fixed)`, `Flexible (Only fix the day)` |
| **"show deadlines"** / **"deadline"** | *"Warning: Your Hackathon Project deadline is at 06:00 PM today. Our hazard radar registers zero schedule buffer remaining. Focus shield is active. Let's work smart."* | `Check Buffer Time` |
| **Other custom spoken queries** | *"I heard you say: '[User input]'. ResQ AI is ready to execute. I will connect this request to your backend logic when hooked up."* | `Reset Conversation` |

- **Study Time Decision Tree**:
  - Selecting a **Fixed** time responds: *"Perfect. I have booked your study block at [time] on your calendar. Focus shielding will engage automatically."*
  - Selecting a **Flexible (day-only)** option responds: *"Understood. The study block is set to flexible. I will register the day as a study target on your goals dashboard, and let the AI find the optimal focus window on the fly."*
  - After making a choice, navigation shortcuts to the `Calendar` page or the `Goals` page are rendered to complete the user flow.
