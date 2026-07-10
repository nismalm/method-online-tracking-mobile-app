# METHOD App — Stack & Hosting Plan

## Overview

Production iOS + Android app for a personal coaching business (200 max clients).
Target: App Store + Play Store live product.

---

## App Stack

### Mobile (Client App)

| Layer | Choice | Notes |
|---|---|---|
| Framework | React Native CLI + TypeScript | Not Expo, full native control |
| Navigation | React Navigation v6 | Stack + Bottom Tabs |
| Animations | React Native Reanimated 3 | 60fps ring/chart animations |
| Charts & SVG | react-native-svg | Activity rings, line charts, gauge |
| Share card | react-native-view-shot | Captures RN component as PNG on demand |
| Sharing | react-native-share | Native iOS/Android share sheet |
| State | Zustand | Lightweight, no boilerplate |
| Auth storage | react-native-async-storage | Persist session tokens |
| Push notifications | @react-native-firebase/messaging (FCM) | iOS + Android |
| Gesture handling | react-native-gesture-handler | Required by React Navigation |

### Key Dependencies

```json
{
  "@react-navigation/native": "^6",
  "@react-navigation/bottom-tabs": "^6",
  "@react-navigation/stack": "^6",
  "@supabase/supabase-js": "^2",
  "react-native-reanimated": "^3",
  "react-native-svg": "^15",
  "react-native-view-shot": "^3",
  "react-native-share": "^10",
  "@react-native-async-storage/async-storage": "^1",
  "zustand": "^4",
  "@react-native-firebase/app": "^18",
  "@react-native-firebase/messaging": "^18",
  "react-native-gesture-handler": "^2"
}
```

---

## Backend Stack

### Hosting: Supabase Free Tier ($0/month)

| Service | Usage | Free Limit | Our Usage |
|---|---|---|---|
| PostgreSQL | All app data | 500MB | ~90MB max (200 users x 90 days) |
| Auth | Phone OTP login | 50,000 MAU | 200 users |
| Realtime | Coach dashboard live updates | Included | Low traffic |
| Edge Functions | Business logic, push notifications | 500k calls/month | ~30k/month max |
| pg_cron | Daily reminder scheduling | Included | 1 job/day |
| Storage | Not needed | 1GB | 0 |

### Why no separate API server

Supabase Edge Functions (Deno/TypeScript) replace a Node.js API entirely:
- Score calculation on progress submission
- FCM push notification triggers
- Any server-side business logic

pg_cron handles scheduled tasks inside the database:
- Daily reminder at set time
- Weekly score summaries

### Database Schema

```sql
-- Coach
coaches (
  id uuid primary key,
  name text,
  email text unique,
  created_at timestamptz
)

-- Clients
clients (
  id uuid primary key references auth.users,
  coach_id uuid references coaches,
  name text,
  phone text unique,
  package_name text,
  package_days int,
  package_start date,
  created_at timestamptz
)

-- Daily progress entries
progress_entries (
  id uuid primary key,
  client_id uuid references clients,
  date date,
  weight numeric,
  water text,
  workout_am boolean,
  workout_pm boolean,
  diet_followed boolean,
  steps text,
  sleep_ok boolean,
  score numeric,
  notes text,
  created_at timestamptz,
  unique(client_id, date)
)

-- Workout sessions
workout_sessions (
  id uuid primary key,
  client_id uuid references clients,
  date date,
  workout_name text,
  day_number int,
  started_at timestamptz,
  ended_at timestamptz,
  duration_mins int,
  total_volume numeric
)

-- Exercises within a session
session_exercises (
  id uuid primary key,
  session_id uuid references workout_sessions,
  exercise_name text,
  muscle_group text,
  sets_data jsonb   -- [{reps: 12, weight: 60}, ...]
)

-- Coach messages
coach_messages (
  id uuid primary key,
  coach_id uuid references coaches,
  client_id uuid references clients,
  message text,
  created_at timestamptz,
  read_at timestamptz
)

-- Coach-defined workout plans
workout_plans (
  id uuid primary key,
  coach_id uuid references coaches,
  day_number int,
  name text,
  type text,
  exercises jsonb,  -- [{name, muscle, sets, reps_target}, ...]
  created_at timestamptz
)
```

### Row Level Security

```sql
-- Clients only see their own data
create policy "client_own_data" on progress_entries
  for all using (client_id = auth.uid());

-- Coach sees all their clients data
create policy "coach_sees_clients" on progress_entries
  for select using (
    client_id in (
      select id from clients where coach_id = auth.uid()
    )
  );
```

---

## Project Structure

```
method-app/
├── android/
├── ios/
├── src/
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── SplashScreen.tsx
│   │   │   └── LoginScreen.tsx
│   │   ├── client/
│   │   │   ├── DashboardScreen.tsx
│   │   │   ├── ProgressEntryScreen.tsx
│   │   │   ├── workout/
│   │   │   │   ├── WorkoutHistoryScreen.tsx
│   │   │   │   ├── WorkoutSessionScreen.tsx
│   │   │   │   └── WorkoutShareScreen.tsx
│   │   │   ├── DietScreen.tsx
│   │   │   └── ProfileScreen.tsx
│   │   └── coach/
│   │       ├── CoachDashboardScreen.tsx
│   │       ├── ClientDetailScreen.tsx
│   │       └── PlanBuilderScreen.tsx
│   ├── components/
│   │   ├── ActivityRings.tsx
│   │   ├── LineChart.tsx
│   │   ├── GaugeArc.tsx
│   │   └── ShareCard.tsx
│   ├── lib/
│   │   └── supabase.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useProgress.ts
│   │   └── useWorkoutSession.ts
│   ├── store/
│   │   ├── authStore.ts
│   │   └── sessionStore.ts
│   └── theme/
│       ├── colors.ts
│       └── typography.ts
├── supabase/
│   ├── functions/
│   │   ├── score-calculator/
│   │   │   └── index.ts
│   │   └── push-notification/
│   │       └── index.ts
│   └── migrations/
│       └── 001_initial_schema.sql
└── docs/
    └── STACK_AND_HOSTING.md
```

---

## Workout Session + Share Card Flow

```
Dashboard "Start Session"
    ↓
WorkoutSessionScreen
    ├── Timer starts
    ├── Coach pre-loaded exercises shown
    ├── Client fills sets / reps / weight (hybrid: can add extras)
    └── "End Session" button
         ↓
    Data saved to Supabase
    (workout_sessions + session_exercises)
         ↓
    WorkoutShareScreen
         ├── ShareCard component renders from session data
         │     ├── METHOD logo + branding
         │     ├── Workout name + date + day number
         │     └── Duration / Volume / Sets completed
         ├── react-native-view-shot captures PNG (device memory only)
         ├── Native share sheet opens
         └── PNG discarded after share — never stored
```

---

## Cost

| Item | Cost |
|---|---|
| Supabase (DB, Auth, Edge Functions, Realtime) | $0 |
| Railway | Not needed |
| Storage | Not needed |
| Apple Developer Account | Already have |
| Google Play Account | Already have |
| Domain | Already have |
| FCM (push notifications) | $0 |
| **Total monthly** | **$0** |

---

## Scaling Path (when needed)

Current stack handles 200 users comfortably within free limits.
If user base grows beyond free tier limits:

```
Supabase Free
     ↓
Option A: Supabase Pro ($25/month)
     — zero migration effort, flip a switch

Option B: Migrate to Railway PostgreSQL
     — pg_dump from Supabase (one command)
     — pg_restore to Railway (one command)
     — Replace Edge Functions with Railway Node.js API
     — Replace Supabase Auth with better-auth or custom JWT
     — 2-3 days of work max
```

Data migration is two terminal commands since both are standard PostgreSQL.
All app code (screens, components, business logic) remains unchanged.
Only lib/supabase.ts and API call files need updating.

---

## Build & Release

| Platform | Tooling |
|---|---|
| iOS builds | Xcode (local Mac) |
| Android builds | Android Studio (local Mac) |
| Signing + submission | Fastlane |
| iOS distribution | TestFlight → App Store |
| Android distribution | Internal Testing → Play Store |
| OTA JS updates | Not applicable (RN CLI, no Expo) |

### Mac requirements

- Xcode 15+
- Android Studio
- Node 18+
- JDK 17
- Ruby (for Fastlane)
- CocoaPods

---

## Rollout Timeline

| Phase | Scope | Duration |
|---|---|---|
| 0 — Setup | RN CLI init, Supabase schema, Fastlane config | 3-4 days |
| 1 — Auth + Navigation | Phone OTP, tab shell, screen stubs | 1 week |
| 2 — Dashboard | Real data, activity rings, charts, theme toggle | 1.5 weeks |
| 3 — Progress Entry | Form, score calculation via Edge Function | 1 week |
| 4 — Workout Session | Timer, hybrid log, end session, share card | 2 weeks |
| 5 — Coach Side | Client list, submissions, plan builder, messages | 2 weeks |
| 6 — Push Notifications | FCM + pg_cron daily reminders | 3-4 days |
| 7 — App Store/Play Store | Assets, listings, review submission | 1 week |
| **Live** | | **~2 months** |
