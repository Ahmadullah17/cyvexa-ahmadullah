# 🎓 STUDYFLOW — Student Task Manager & Productivity Dashboard

> **Plan your coursework. Master your focus. Achieve academic excellence.**  
> A modern, premium full-stack student productivity platform built with **HTML5, CSS3, Vanilla JavaScript, Supabase Auth, PostgreSQL Database, Row Level Security (RLS)**, and local browser audio APIs. Ready for instant deployment on **Netlify** or local offline execution.

---

## 📑 Table of Contents

1. [Project Overview](#-project-overview)
2. [Key Features](#-key-features)
3. [Technology Stack](#-technology-stack)
4. [Folder Structure](#-folder-structure)
5. [How to Create a Supabase Project](#-how-to-create-a-supabase-project)
6. [Enabling Email/Password Authentication](#-enabling-emailpassword-authentication)
7. [Configuring Email Confirmation](#-configuring-email-confirmation)
8. [Running schema.sql in Supabase SQL Editor](#-running-schemasql-in-supabase-sql-editor)
9. [Configuring Supabase API Keys](#-configuring-supabase-api-keys)
10. [How to Run Locally](#-how-to-run-locally)
11. [How to Upload to GitHub](#-how-to-upload-to-github)
12. [How to Deploy to Netlify](#-how-to-deploy-to-netlify)
13. [Configuring Netlify Environment Variables](#-configuring-netlify-environment-variables)
14. [How the Music System Works](#-how-the-music-system-works)
15. [Explanation of Local Music Files & Browser Security](#-explanation-of-local-music-files--browser-security)
16. [Security & Architectural Best Practices](#-security--architectural-best-practices)
17. [Row Level Security (RLS) Explanation](#-row-level-security-rls-explanation)
18. [License & Acknowledgments](#-license)

---

## 🌟 1. Project Overview

**STUDYFLOW** is an all-in-one productivity suite built specifically for university and school students. Balancing heavy course loads, project deadlines, and revision schedules requires tools that are fast, flexible, and distraction-free.

Unlike generic to-do apps with rigid category menus, STUDYFLOW allows students to type **any custom subject name** (DBMS, Operating Systems, Linear Algebra, AI, etc.) without restriction, run **customizable study timers** with custom durations, play **their own study music directly from their device** with zero server uploads, and securely persist all tasks and sessions across devices using **Supabase PostgreSQL** protected by **Row Level Security (RLS)**.

---

## ✨ 2. Key Features

- **🔐 Robust Supabase Authentication**:
  - Email & password sign-up and login powered by official `@supabase/supabase-js`.
  - Password recovery flow with reset email verification.
  - Persistent login sessions across page reloads and browser restarts (`auth.getSession()` & `onAuthStateChange`).
  - Safe logout and instant guest/demo mode preview.

- **👤 Personalized User Profile**:
  - Dynamic time-of-day greeting (e.g. *"Good evening, Ahmadullah 👋"*).
  - Customizable display name, profile avatar icons, and weekly/daily study target goals.
  - Persisted in Supabase `profiles` table.

- **📚 Full Task Management (CRUD)**:
  - **Free-Text Subjects**: Type any subject or course name without restriction. Dynamic autocomplete remembers your past courses.
  - **Deadlines & Smart Indicators**: Relative deadline calculations (*Due Today*, *Due Tomorrow*, *Due in X days*, or *Overdue by X days*).
  - **Priority System**: 🔴 High, 🟡 Medium, and 🟢 Low.
  - **Live Search, Filter & Sort**: Search across titles, subjects, and descriptions; filter by status or priority; sort by date, priority, or name.

- **📅 Interactive Academic Calendar**:
  - Full monthly calendar grid with month/year navigation and `📍 Go To Today`.
  - Color-coded priority indicators for multiple tasks per day.
  - Interactive day inspection panel: click any date to view scheduled tasks.
  - `+ Add Task` from selected date automatically sets the deadline to that exact date.

- **⏱️ Fully Customizable Study Timer (Pomodoro)**:
  - **Custom Durations**: Enter **ANY** study duration (e.g., 15m, 25m, 45m, 60m, 90m) and break duration (5m, 10m, 20m).
  - Quick-preset chips plus manual numeric input.
  - SVG animated circular progress ring with gradient strokes.
  - Two-tone gentle audio chime synthesized via the **Web Audio API** (no external audio files required).
  - Session tracker with automatic database logging to Supabase `study_sessions`.
  - Configurable auto-start for breaks and study sessions.

- **📈 Productivity Dashboard & Analytics**:
  - Live summary of Total, Completed, Pending, Overdue, and Completion Rate.
  - Dual visual progress bars for Task Completion and Study Time vs Goal with ASCII representations:  
    `Task Completion: ████████████████░░░░ 80%`
  - 7-day activity bar chart showing completed tasks over the past week.
  - Breakdown of coursework by custom subject.

- **🎵 Local Music Player & Focus Ambience**:
  - **Bring Your Own Music**: Select audio files (MP3, WAV, OGG, M4A, FLAC, AAC) directly from your computer or phone using the HTML5 File API and `URL.createObjectURL(file)`.
  - **Persistent Mini-Player**: Music continues playing seamlessly without interruption while you navigate between the Dashboard, Tasks, Calendar, Timer, and Productivity views.
  - Controls: Previous, Play/Pause, Next, Volume slider, Mute toggle, Seek slider, and Loop repeat.
  - **Instant Focus Ambience Generator**: Generate Rain, Lo-Fi vinyl crackle, White Noise, and Alpha waves instantly using the Web Audio API without needing files!

- **🎯 Distraction-Free Focus Mode**:
  - Full-screen minimal study mode featuring an active task selector, large circular timer, and integrated mini-music controls.

- **🌙 Dark & Light Mode**:
  - Default luxury dark charcoal theme (`#090d16`) with warm amber/gold accents (`#f59e0b`).
  - Clean light mode option with persistent settings.

- **📱 Fully Responsive**:
  - 100% mobile-friendly with touch-friendly controls, collapsible navigation, and responsive task cards.

---

## 🛠️ 3. Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend UI** | HTML5 Semantic Elements, Modern CSS3 (Variables, Flexbox, CSS Grid, Glassmorphism) |
| **Fonts** | Plus Jakarta Sans, Outfit, JetBrains Mono |
| **Logic & Scripting** | Vanilla JavaScript (ES6+), Zero Heavy Frameworks |
| **Backend & Database** | Supabase (PostgreSQL 15+, Supabase Auth, Row Level Security) |
| **Client SDK** | `@supabase/supabase-js` v2 via CDN |
| **Audio & Media** | HTML5 Audio Element, Browser File API (`URL.createObjectURL`), Web Audio API (`AudioContext`) |
| **Deployment Target**| Netlify, Vercel, GitHub Pages, or any static host |

---

## 📁 4. Folder Structure

```text
STUDYFLOW/
├── index.html              # Main single-page application & all UI views
├── style.css               # Design system, themes, animations, and glassmorphism
├── script.js               # Application state, Supabase client logic, audio player, calendar
├── supabase-config.js      # Supabase URL & publishable key configuration helper
├── README.md               # Complete documentation and setup guide
└── supabase/
    └── schema.sql          # PostgreSQL DDL, tables, indexes, triggers, and RLS policies
```

---

## ☁️ 5. How to Create a Supabase Project

1. Visit [https://supabase.com](https://supabase.com) and click **Start your project** (or sign in with GitHub).
2. Click **New Project** and choose your organization.
3. Enter your project details:
   - **Name**: `studyflow` (or any name you prefer)
   - **Database Password**: Choose a strong password and save it securely.
   - **Region**: Select a region close to your users (e.g., *East US*, *West EU*, *Central India*).
   - **Pricing Plan**: Free tier (perfect for personal and student use).
4. Click **Create new project**. Supabase will provision your database in about 1–2 minutes.

---

## ✉️ 6. Enabling Email/Password Authentication

1. In your Supabase Dashboard, open **Authentication** from the left navigation bar.
2. Select **Providers** under the Configuration section.
3. Click on **Email**:
   - Ensure **Enable Email provider** is toggled **ON**.
   - Ensure **Confirm email** is set according to your preference (see next section).
4. Click **Save**.

---

## 📩 7. Configuring Email Confirmation

Supabase offers two ways to handle email sign-ups:

- **Option A (Recommended for Quick Testing & Development)**:
  1. In Supabase Dashboard → **Authentication** → **Providers** → **Email**.
  2. Toggle **Confirm email** to **OFF**.
  3. Click **Save**.
  4. *Result*: When students sign up, their account is activated instantly and they are logged in right away without having to verify an email.

- **Option B (Recommended for Production)**:
  1. Leave **Confirm email** toggled **ON**.
  2. In **Authentication** → **URL Configuration**:
     - Set **Site URL** to your Netlify domain (e.g. `https://studyflow-app.netlify.app`) or `http://localhost:8000` for local testing.
     - Add redirect URLs under **Redirect URLs**.
  3. *Result*: When users sign up, STUDYFLOW displays a prompt asking them to check their inbox. Clicking the confirmation link verifies the account.

---

## 📜 8. Running schema.sql in Supabase SQL Editor

To set up the database tables (`profiles`, `tasks`, `study_sessions`, `user_settings`), Row Level Security policies, indexes, and triggers:

1. Open your Supabase Dashboard.
2. Click on **SQL Editor** (icon with `>_`) in the left sidebar.
3. Click **New query** (or `+`).
4. Open the file `supabase/schema.sql` from this project, copy its entire contents, and paste them into the SQL Editor.
5. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`).
6. You will see `Success. No rows returned`.
7. Navigate to **Table Editor** to confirm the 4 tables are created:
   - `profiles`
   - `tasks`
   - `study_sessions`
   - `user_settings`

---

## 🔑 9. Configuring Supabase API Keys

You need two values from your Supabase project:
- **Project URL** (e.g. `https://abcdefghijkl.supabase.co`)
- **Anon / Publishable API Key** (starts with `ey...`)

### Where to find them:
1. Go to your Supabase Dashboard.
2. Click the gear icon (**Project Settings**) in the left sidebar.
3. Click **API** under Configuration.
4. Copy the **Project URL** and the **Project API Keys (`anon` / `public`)**.

### How to configure in STUDYFLOW (Two Easy Methods):

#### Method 1: Directly via the Browser UI (Zero code edits!)
1. Open STUDYFLOW in your browser.
2. On the login screen or in the top-right profile menu, click **⚙️ Supabase Settings** or **Supabase Config**.
3. Paste your **Project URL** and **Anon Key**.
4. Click **🔍 Test Connection** to verify.
5. Click **💾 Save & Connect**. The app will reload and connect immediately!

#### Method 2: Editing `supabase-config.js`
Open `supabase-config.js` and paste your keys into `DEFAULT_SUPABASE_CONFIG`:
```javascript
const DEFAULT_SUPABASE_CONFIG = {
  url: 'https://your-project-id.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};
```

> ⚠️ **SECURITY WARNING**: Never use the `service_role` key in frontend code! Only use the `anon` / `public` key. Row Level Security ensures only the authenticated user's data is accessible.

---

## 💻 10. How to Run Locally

Because STUDYFLOW uses modern native web standards, you can run it with any local server:

### Option A: Using Python (Pre-installed on macOS/Linux/Windows)
Open PowerShell or Terminal in the project folder and run:
```bash
python -m http.server 8000
```
Then open your browser and navigate to:  
`http://localhost:8000`

### Option B: Using Node.js `npx serve`
```bash
npx serve .
```

### Option C: Using VS Code / Antigravity IDE Live Server
Right-click `index.html` and select **Open with Live Server**.

---

## 🐙 11. How to Upload to GitHub

1. Initialize git in your project directory:
   ```bash
   git init
   git add .
   git commit -m "feat: complete STUDYFLOW student task manager"
   ```
2. Create a new repository on [GitHub](https://github.com/new) named `studyflow`.
3. Link your remote repository and push:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/studyflow.git
   git branch -M main
   git push -u origin main
   ```

---

## 🚀 12. How to Deploy to Netlify

Netlify hosts static web applications with global CDN performance:

### Option A: Deploying via Netlify Git Integration (Recommended)
1. Go to [Netlify](https://app.netlify.com) and log in.
2. Click **Add new site** → **Import an existing project**.
3. Choose **GitHub** and select your `studyflow` repository.
4. Leave build command empty (static HTML/CSS/JS) and publish directory as `.` (root).
5. Click **Deploy site**.
6. Your application is live within seconds with a free SSL certificate!

### Option B: Drag & Drop Manual Deploy
1. In Netlify Dashboard, go to **Sites**.
2. Drag and drop your project folder directly into the upload box.
3. Your site will deploy instantly.

---

## 🌐 13. Configuring Netlify Environment Variables

If you prefer injecting Supabase credentials through Netlify configuration:

1. In your Netlify Dashboard, navigate to **Site configuration** → **Environment variables**.
2. Add the following variables:
   - `SUPABASE_URL`: `https://your-project.supabase.co`
   - `SUPABASE_ANON_KEY`: `eyJhbGciOi...`
3. Because STUDYFLOW supports the in-app configuration dialog and `supabase-config.js`, you can also configure your credentials directly through the app UI, which persists securely in the user's browser `localStorage`.

---

## 🎵 14. How the Music System Works

Academic research shows that calming music and lo-fi beats enhance concentration and information retention. STUDYFLOW features a dedicated **Acoustic Focus & Music Player**:

1. Click on **🎵 Music** in the top navigation.
2. Click **+ Add Music from Device**.
3. Select one or more audio files from your computer or phone (MP3, WAV, OGG, M4A, FLAC, AAC).
4. The tracks appear in your **My Study Playlist** queue.
5. The **Persistent Mini-Player** at the bottom of the screen allows you to play, pause, seek, adjust volume, and loop tracks.
6. As you switch between **Dashboard**, **Tasks**, **Calendar**, **Study Timer**, and **Productivity**, the music **keeps playing continuously** without reloading or cutting out!

---

## 🔒 15. Explanation of Local Music Files & Browser Security

- **Zero Server Uploads**: Traditional web apps require users to upload large audio files to cloud storage, consuming bandwidth and risking copyright issues. STUDYFLOW uses the standard browser **File API** and creates a localized blob reference:
  ```javascript
  const objectUrl = URL.createObjectURL(file);
  audioElement.src = objectUrl;
  ```
- **Privacy Guaranteed**: Your audio files remain 100% on your device and are never transmitted over the internet.
- **Browser Object URL Lifecycle**: Modern web browsers revoke `blob:` object URLs when a page is completely reloaded or closed to protect device memory. STUDYFLOW clearly indicates this in the UI, allowing you to re-add your focus tracks whenever you begin a new study session.
- **Built-in Ambience Generator**: If you don't have audio files downloaded, simply click any of the instant ambient focus buttons (**Gentle Rain**, **Lo-Fi Vinyl**, **White Noise**, **Alpha Waves**) to generate sound in real-time using the **Web Audio API**.

---

## 🛡️ 16. Security & Architectural Best Practices

- **Never Expose Secret Keys**: Only the public `anon` key is used in frontend client code. The administrative `service_role` key is **never** embedded in any client scripts.
- **Client-Side Data Sanitization**: All user-entered task titles, subjects, and descriptions are escaped via `escapeHtml()` before rendering to prevent Cross-Site Scripting (XSS).
- **Session Persistence**: Sessions are securely maintained via Supabase SDK storage adapters, automatically refreshing JWT tokens in the background.

---

## 🔏 17. Row Level Security (RLS) Explanation

Row Level Security is a PostgreSQL feature that controls which database rows a user can query, insert, update, or delete.

In `supabase/schema.sql`, RLS is enabled on all tables:
```sql
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
```

Policies are established matching the user's authenticated UUID (`auth.uid()`):
```sql
CREATE POLICY "Users can view own tasks"
    ON public.tasks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
    ON public.tasks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
    ON public.tasks FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
    ON public.tasks FOR DELETE
    USING (auth.uid() = user_id);
```

### Why this matters:
Even if a malicious user inspects network calls or attempts to query the database using PostgREST APIs, PostgreSQL enforces these policies at the database engine level. **User A cannot read, edit, or delete tasks belonging to User B under any circumstances.**

---

## 🔔 18. Task Reminder & Notification Architecture (Sections 42 - 69)

STUDYFLOW includes an enterprise-grade automated Task Reminder and Notification system designed to ensure students never miss an academic deadline.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        STUDYFLOW NOTIFICATION ENGINE                   │
└────────────────────────────────────────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌───────────────────────┐                         ┌───────────────────────┐
│ Client-side Monitor   │                         │ Server Edge Function  │
│ (Every 60 Seconds)    │                         │ (Cron-Scheduled Push) │
└──────────┬────────────┘                         └──────────┬────────────┘
           │                                                 │
           ▼                                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Filter: Exclude completed & deleted tasks                           │
│ 2. Calculate: User-local timezone date difference                      │
│ 3. Evaluate Reminder Level: 7 days, 3 days, 1 day, Today, Overdue      │
│ 4. Deduplicate: Verify (task_id, reminder_type) in task_reminders      │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  In-App Center   │      │ In-App Banner &  │      │ Browser & Web    │
│  🔔 Badge Pulse  │      │ Audio Chime      │      │ Push Alerts      │
│  Notification    │      │ 🚨 Slide-Down    │      │ Service Worker   │
│  History Panel   │      │ Urgent Attention │      │ Background API   │
└──────────────────┘      └──────────────────┘      └──────────────────┘
```

### Automatic Reminder Levels & Urgency:
1. **7 Days Before**: `📚 Task deadline approaching` (Urgency: LOW 🟢)
2. **3 Days Before**: `⚠️ Task due in 3 days` (Urgency: MEDIUM 🟡)
3. **1 Day Before**: `🚨 Task due tomorrow` (Urgency: HIGH 🟠)
4. **On Due Date**: `🔴 Task is due today` (Urgency: CRITICAL 🔴 - **Mandatory**)
5. **After Deadline**: `⛔ Task is overdue` (Urgency: CRITICAL 🔴 - **Mandatory**)

> **Critical Safety Rule**: Users can customize timing for 7-day, 3-day, and 1-day reminders, but **"Due today"** and **"Overdue"** alerts are **mandatory and cannot be disabled** to protect academic standing.

### Components Built:
- **🔔 In-App Notification Center**: Navigation bar bell with live unread counter badge (`🔔 3`), slide-down panel with rich notification history, individual mark-read, and `✓ Mark all as read`.
- **🚨 In-App Critical Deadline Banner**: Animated slide-down banner that displays the nearest critical deadline (today, overdue, or tomorrow) with quick [View Task] and [Dismiss] actions.
- **⚡ "Needs Attention" Dashboard Widget**: Real-time widget featuring all tasks due today, tomorrow, or overdue, or a celebratory `"🎉 You're all caught up!"` card when on track.
- **⏳ "Upcoming Deadlines" Dashboard Widget**: Visual list of upcoming deadlines with urgency-coded dots (🔴, 🟠, 🟡, 🟢) and relative countdown text.
- **📅 Calendar Urgency Indicators**: Calendar date cells display color-coded urgency dots (🔴 Critical, 🟠 Urgent, 🟡 Approaching, 🟢 Normal) based on approaching coursework.
- **🔊 Web Audio Alert Chime**: Pure mathematical synthesizer producing a gentle dual-frequency chime (D5 587Hz & A5 880Hz) respecting browser autoplay guidelines.
- **🛡️ Soft Permission Request**: Gentle explanation card after login or first task creation. Avoids nagging if permission is denied.
- **🌐 Timezone Engine**: Automatically calculates `"Today"` and `"Tomorrow"` according to the student's local timezone (e.g. `Asia/Kolkata`, `America/New_York`, `Europe/London`).
- **🔁 Dynamic Lifecycle**: Editing a task's due date resets the reminder schedule, while completing or deleting a task instantly dismisses alerts and invalidates reminders.
- **⚡ Background Push & Edge Function**:
  - `service-worker.js`: Handles browser push events and notification clicks.
  - `supabase/functions/send-deadline-reminders/index.ts`: Scheduled Supabase Edge Function that queries approaching deadlines, evaluates reminder levels, creates notification records, and dispatches Web Push notifications.

---

## 📄 19. License

This project is licensed under the MIT License. Feel free to use, modify, and distribute it for personal or academic purposes.

---

**🎓 STUDYFLOW — Empowering Students to Achieve More.**

