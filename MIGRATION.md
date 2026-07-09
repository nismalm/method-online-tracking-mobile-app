# METHOD Trainer App — Firebase to NestJS REST Migration

Single source of truth for migrating the METHOD trainer mobile app from Firebase (Auth + Firestore) to the new NestJS REST backend. Follow this document exactly. UX must not change.

React Native version: 0.78.2. This is a bare RN CLI project, not Expo.

---

## 1. Overview

### What is changing
- Auth: Firebase Auth is removed. All auth flows go through `POST /auth/login`, `POST /auth/refresh`, `DELETE /auth/logout`, `POST /auth/forgot-password`, `PATCH /auth/update-password`.
- Data: Firestore reads and writes are removed. All persistence goes through REST endpoints on the NestJS backend.
- State: Firestore realtime `onSnapshot` listeners are replaced by explicit polling `GET /users/me` every 60 seconds while the app is foregrounded.
- Tokens: JWT access + refresh tokens are stored in `react-native-keychain` (iOS Keychain + Android Keystore). AsyncStorage is not acceptable for tokens.
- Trainer creation flow: No more secondary Firebase app trick. Backend returns `{ user, tempPassword }`. Trainer credentials share flow (screenshot + PNG share) stays exactly as today, but instead of a Firebase-generated `Method{digits}` password the backend returns the `tempPassword` string.
- Client creation flow: Backend returns `{ client, credentials: { loginCode, tempPassword }, bmi }`. The Client credentials share modal (screenshot + PNG) stays exactly as today. Note: today the app shows only `loginCode`, backend now also returns a `tempPassword` that the client uses on first login. The success modal must be updated to display BOTH loginCode and tempPassword so the trainer can share both.
- Status enums: Firestore stored lowercase strings (`active`, `paused`, `completed`, `stopped`, `Male`, `A+`, `Online`). Backend uses uppercase enums (`ACTIVE`, `PAUSED`, `COMPLETED`, `STOPPED`, `MALE`, `A_POSITIVE`, `ONLINE`, `30`|`60`|`90`|`180`). All app-side comparisons, filters, and displays must be updated. Displayed strings should still look identical to users (capitalized first letter, no all-caps).
- Dates: Firestore side used DD/MM/YYYY strings for `startDate`/`endDate` and Firestore Timestamps for `createdAt`/`stoppedAt`/`pauseHistory[].pausedAt/resumedAt`. Backend uses ISO 8601 strings for everything. All parsing and formatting utilities must handle ISO strings. Existing `dayCalculator.js` logic stays intact but its inputs get pre-normalized (see Section 8).

### What is not changing
- Look, feel, layout, colors, fonts, icons, animations. Every visual element stays identical.
- Component tree, screens, navigators, modals.
- Business rules for pause/resume/stop/renew state transitions.
- Day counting logic in `src/utils/dayCalculator.js`.
- BMI calculation in `src/utils/bmiCalculator.js`.
- Diet chart PNG generation and native share flow.
- Any component in `src/components/` not listed in Section 5.
- Bottom tab navigator visual structure. Only the Trainers-tab visibility flag changes source (from `userProfile.role === 'SuperAdmin'` string to `role === 'SUPER_ADMIN'`).

### What is new
- Diet chart client-mode: builder can now select an existing client from a searchable dropdown, and either creates or updates a persisted diet chart on the backend. Standalone (unpersisted) mode is unchanged from today.

---

## 2. Setup

### 2.1 Packages to install

```bash
npm install axios react-native-keychain
cd ios && pod install && cd ..
```

- `axios` — HTTP client with interceptor support (do not use `fetch`, we need request/response interceptors and retry logic).
- `react-native-keychain` — secure token storage. iOS uses Keychain, Android uses Keystore.

### 2.2 Packages to remove

```bash
npm uninstall @react-native-firebase/auth @react-native-firebase/firestore @react-native-firebase/app
cd ios && pod install && cd ..
```

Keep `@react-native-firebase/messaging` for FCM push notifications (still needed for a future notifications feature). Also keep the Firebase iOS AppDelegate init and `google-services.json` on Android since messaging needs them. Do not touch `firebase.json` or the Firebase native SDK config.

If `@react-native-firebase/app` is required as a transitive dependency of messaging, leave it installed. Verify with `npm ls @react-native-firebase/app` after removal. If messaging fails to build, restore `@react-native-firebase/app`.

### 2.3 Environment config

Create `src/config/env.js`:

```js
// src/config/env.js
// TODO: replace with Railway production URL before release build
export const API_BASE_URL = __DEV__
  ? 'http://<your-local-dev-ip>:3000/api/v1'
  : 'https://<railway-app-url>/api/v1';

export const REQUEST_TIMEOUT_MS = 20000;
export const PROFILE_POLL_INTERVAL_MS = 60000;
```

Production build must use `https://`. Never ship `http://` in a release build (App Store / Play Store rejection).

### 2.4 iOS ATS

If the dev build points at `http://` on localhost, iOS App Transport Security must permit it. Add to `ios/MethodOnlineTracker/Info.plist` under the top-level dict:

```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsLocalNetworking</key>
  <true/>
</dict>
```

Do not add `NSAllowsArbitraryLoads` — it fails App Store review.

### 2.5 Android cleartext

For local dev over HTTP on Android 9+, ensure `android:usesCleartextTraffic="true"` exists in `android/app/src/main/AndroidManifest.xml` `<application>` tag ONLY for dev builds. For production, this must be `false` or absent.

---

## 3. New files to create

### 3.1 `src/services/tokenStorage.js`

Wraps `react-native-keychain` with a small typed API. Uses a single keychain entry with a JSON payload containing both tokens.

```js
// src/services/tokenStorage.js
import * as Keychain from 'react-native-keychain';

const SERVICE = 'com.method.trainer.tokens';

export const saveTokens = async ({accessToken, refreshToken}) => {
  const payload = JSON.stringify({accessToken, refreshToken});
  // username field required by Keychain but not used
  await Keychain.setGenericPassword('tokens', payload, {service: SERVICE});
};

export const loadTokens = async () => {
  try {
    const creds = await Keychain.getGenericPassword({service: SERVICE});
    if (!creds || !creds.password) {
      return null;
    }
    return JSON.parse(creds.password);
  } catch {
    return null;
  }
};

export const clearTokens = async () => {
  await Keychain.resetGenericPassword({service: SERVICE});
};
```

### 3.2 `src/services/apiClient.js`

Central axios instance with:
- Base URL from env config
- 20s timeout
- Attaches `Authorization: Bearer <accessToken>` on every request (except explicitly public ones)
- On 401 response: tries `POST /auth/refresh` once, saves new tokens, retries the original request once. If refresh fails, clears keychain and calls the global logout handler.
- Unwraps `response.data.data` — all endpoints return `{ success, data, timestamp }` so the payload is always `response.data.data`.
- Normalizes error messages from `{ message, statusCode }` shape.

Full spec:

```js
// src/services/apiClient.js
import axios from 'axios';
import {API_BASE_URL, REQUEST_TIMEOUT_MS} from '../config/env';
import * as TokenStorage from './tokenStorage';

let onUnauthenticatedCallback = null;

// AuthContext calls this once on mount so the interceptor can force a logout
// without importing AuthContext (avoids circular dep).
export const setOnUnauthenticatedHandler = (fn) => {
  onUnauthenticatedCallback = fn;
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {'Content-Type': 'application/json'},
});

// Request interceptor: attach token
apiClient.interceptors.request.use(async (config) => {
  // Endpoints that must not carry a token
  const publicPaths = ['/auth/login', '/auth/refresh', '/auth/forgot-password'];
  const isPublic = publicPaths.some((p) => config.url?.startsWith(p));
  if (!isPublic) {
    const tokens = await TokenStorage.loadTokens();
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
  }
  return config;
});

// Track a single in-flight refresh so parallel 401s don't hammer /auth/refresh
let refreshPromise = null;

const performRefresh = async () => {
  const tokens = await TokenStorage.loadTokens();
  if (!tokens?.refreshToken) {
    throw new Error('No refresh token');
  }
  // Use a bare axios call to avoid recursion into this interceptor
  const {data} = await axios.post(
    `${API_BASE_URL}/auth/refresh`,
    {refreshToken: tokens.refreshToken},
    {timeout: REQUEST_TIMEOUT_MS}
  );
  const payload = data?.data ?? data;
  const newTokens = {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
  };
  await TokenStorage.saveTokens(newTokens);
  return newTokens;
};

// Response interceptor: unwrap + handle 401
apiClient.interceptors.response.use(
  (response) => {
    // Backend wraps every success as { success, data, timestamp }
    // Return the unwrapped payload so callers use response.data directly.
    if (response?.data && typeof response.data === 'object' && 'data' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // 401 on a non-refresh request: attempt refresh once then retry
    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retried &&
      !originalRequest.url?.startsWith('/auth/refresh') &&
      !originalRequest.url?.startsWith('/auth/login')
    ) {
      originalRequest._retried = true;
      try {
        if (!refreshPromise) {
          refreshPromise = performRefresh().finally(() => {
            refreshPromise = null;
          });
        }
        const newTokens = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        await TokenStorage.clearTokens();
        if (onUnauthenticatedCallback) {
          onUnauthenticatedCallback();
        }
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

// Extract a user-friendly error message from an axios error
export const extractError = (err) => {
  if (err?.response?.data?.message) {
    return err.response.data.message;
  }
  if (err?.message === 'Network Error') {
    return 'Network error. Please check your connection.';
  }
  return err?.message || 'An unexpected error occurred';
};
```

### 3.3 `src/services/authService.js` (full replacement)

Replaces every function in the current `authService.js`. Keep the same exported function names where the caller signatures are already used across the app to minimize churn, but the return contract changes: instead of `{ success, error, ... }`, functions still return that same shape so all callers keep working. Implement it as a thin wrapper over `apiClient`.

Exports required (matching current usage across the codebase):
- `signIn(emailOrLoginCode, password)` — POST `/auth/login`
- `signOut()` — DELETE `/auth/logout`, then clear keychain
- `changePassword(currentPassword, newPassword)` — PATCH `/auth/update-password`
- `resetPassword(email)` — POST `/auth/forgot-password`
- `getCurrentUser()` — returns cached user object from AuthContext (no network); kept for compatibility, may be removed if not called
- `getUserProfile()` — GET `/users/me`
- `updateUserProfile(data)` — PATCH `/users/me/trainer`
- `createTrainer(name, email, mobile)` — POST `/trainers`; note the fourth parameter `createdByUid` is dropped (backend infers from JWT)
- `getAllTrainers()` — GET `/trainers`
- `updateTrainerStatus(trainerId, statusLowercase)` — PATCH `/trainers/:id` with `{status}` uppercased
- `updateTrainer(trainerId, name, email, mobile)` — PATCH `/trainers/:id`
- `deleteTrainer(trainerId)` — DELETE `/trainers/:id`
- `onAuthStateChanged(cb)` — REMOVED. AuthContext no longer uses this. Callers must be updated (see Section 4).

Full implementation:

```js
// src/services/authService.js
import {apiClient, extractError} from './apiClient';
import * as TokenStorage from './tokenStorage';

// signIn: caller passes email OR loginCode. Trainers login with email.
// Loginocde-based login is only used by the client app, not this trainer app.
// For safety, always send as { email, password } — the trainer app never issues
// a loginCode-based login.
export const signIn = async (email, password) => {
  try {
    const {data} = await apiClient.post('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    });
    // Trainer app: mustChangePassword should never be true (only clients get that).
    // If it is, treat as error.
    if (data.mustChangePassword) {
      return {success: false, error: 'This account requires setup in the client app.'};
    }
    await TokenStorage.saveTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
    return {success: true, user: data.user};
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

export const signOut = async () => {
  try {
    // Best-effort logout — even if network fails, clear local tokens
    await apiClient.delete('/auth/logout').catch(() => {});
    await TokenStorage.clearTokens();
    return {success: true};
  } catch (err) {
    await TokenStorage.clearTokens();
    return {success: false, error: extractError(err)};
  }
};

export const changePassword = async (currentPassword, newPassword) => {
  try {
    await apiClient.patch('/auth/update-password', {currentPassword, newPassword});
    return {success: true};
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

export const resetPassword = async (email) => {
  try {
    await apiClient.post('/auth/forgot-password', {email: email.trim().toLowerCase()});
    // Backend always returns 200 to prevent email enumeration
    return {success: true};
  } catch {
    // Still return success for security — never expose whether email exists
    return {success: true};
  }
};

export const getUserProfile = async () => {
  try {
    const {data} = await apiClient.get('/users/me');
    return {success: true, profile: data};
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

export const updateUserProfile = async (updates) => {
  try {
    const {data} = await apiClient.patch('/users/me/trainer', updates);
    return {success: true, profile: data};
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

// createTrainer: 4th arg from old signature is ignored.
// Backend returns { user: TrainerProfile, tempPassword }
export const createTrainer = async (name, email, mobile /*, _unusedCreatedByUid */) => {
  try {
    const {data} = await apiClient.post('/trainers', {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: mobile.trim(), // backend field is `phone`, app field is `mobile`
    });
    return {
      success: true,
      trainerId: data.user.id,
      password: data.tempPassword, // shown once in the success modal
    };
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

export const getAllTrainers = async () => {
  try {
    const {data} = await apiClient.get('/trainers');
    // Backend returns TrainerProfile[]. Normalize field names so existing
    // UI code keeps working without changes:
    //   backend `id` → app `uid`
    //   backend `phone` → app `mobile`
    //   backend `status` uppercase → app `status` lowercase for display
    const trainers = data.map(normalizeTrainer);
    return {success: true, trainers};
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

export const updateTrainerStatus = async (trainerId, statusLower) => {
  try {
    await apiClient.patch(`/trainers/${trainerId}`, {
      status: statusLower.toUpperCase(), // 'active' → 'ACTIVE'
    });
    return {success: true};
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

export const updateTrainer = async (trainerId, name, email, mobile) => {
  try {
    await apiClient.patch(`/trainers/${trainerId}`, {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: mobile.trim(),
    });
    return {success: true};
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

export const deleteTrainer = async (trainerId) => {
  try {
    await apiClient.delete(`/trainers/${trainerId}`);
    return {success: true};
  } catch (err) {
    return {success: false, error: extractError(err)};
  }
};

// Normalize a backend trainer to the shape the app already expects
const normalizeTrainer = (t) => ({
  uid: t.id,
  name: t.name,
  email: t.email,
  mobile: t.phone,
  status: (t.status || '').toLowerCase(), // 'ACTIVE' → 'active'
  role: 'Trainer',
  createdAt: t.createdAt, // ISO string
});
```

Notes:
- The current app calls `trainer.createdAt.toDate().toLocaleDateString()`. Since `createdAt` is now an ISO string, `TrainersScreen.js` must be updated (see Section 5.5).
- `getErrorMessage(code)` and `signUp(...)` are removed — no callers exist for them once the migration is done. `generateTrainerPassword()` is also removed (backend generates the password).

### 3.4 `src/services/clientService.js` (full replacement)

Same public API surface as today, all wrapped over REST. Rules for field mapping (applied both on outgoing writes and normalization of incoming reads):

| Old (Firestore) app-side field | Backend field |
|---|---|
| `id` (Firestore doc id) | `id` (UUID) |
| `name` | `name` |
| `mobile` | `phone` |
| `age` | `age` |
| `gender` `'Male'`/`'Female'` | `gender` `'MALE'`/`'FEMALE'`/`'OTHER'` |
| `bloodGroup` `'A+'`, `'AB-'` etc | `bloodGroup` `'A_POSITIVE'`, `'AB_NEGATIVE'` etc |
| `height` (number, cm) | `height` (number, cm) |
| `startingWeight` (number, kg) | `startingWeight` (number, kg) |
| `package` (number 30/60/90/180) | `packageDays` (number 30/60/90/180) |
| `trainingMode` `'Online'`/`'Offline'` | `trainingMode` `'ONLINE'`/`'OFFLINE'` |
| `loginCode` `'METHOD123456'` | `user.loginCode` (nullable — cleared after client setup) |
| `status` `'active'`/`'paused'`/`'completed'`/`'stopped'` | `clientStatus` `'ACTIVE'`/`'PAUSED'`/`'COMPLETED'`/`'STOPPED'` |
| `startDate` (DD/MM/YYYY string) | `startDate` (ISO 8601) |
| `endDate` (DD/MM/YYYY string) | `endDate` (ISO 8601) |
| `createdBy` (Firebase uid string) | `trainerId` (UUID) |
| `createdAt` (Firestore Timestamp) | `createdAt` (ISO 8601) |
| `stoppedAt` (Firestore Timestamp) | `stoppedAt` (ISO 8601) |
| `stoppedReason` | `stoppedReason` |
| `pauseHistory[].pausedAt/resumedAt` (Timestamp) | `pauseHistory[].pausedAt/resumedAt` (ISO 8601) |
| `currentPackageId` | `currentPackageId` (from `ClientProfile`) |
| `weightHistory[]` | (not part of MVP; leave empty array on normalized client) |

Two mapping helpers to build once and reuse:

```js
// src/services/mappers.js
export const GENDER_TO_API = {Male: 'MALE', Female: 'FEMALE', Other: 'OTHER'};
export const GENDER_FROM_API = {MALE: 'Male', FEMALE: 'Female', OTHER: 'Other'};
export const BLOOD_TO_API = {
  'A+': 'A_POSITIVE', 'A-': 'A_NEGATIVE',
  'B+': 'B_POSITIVE', 'B-': 'B_NEGATIVE',
  'AB+': 'AB_POSITIVE', 'AB-': 'AB_NEGATIVE',
  'O+': 'O_POSITIVE', 'O-': 'O_NEGATIVE',
};
export const BLOOD_FROM_API = Object.fromEntries(
  Object.entries(BLOOD_TO_API).map(([k, v]) => [v, k])
);
export const MODE_TO_API = {Online: 'ONLINE', Offline: 'OFFLINE'};
export const MODE_FROM_API = {ONLINE: 'Online', OFFLINE: 'Offline'};
export const STATUS_TO_API = {
  active: 'ACTIVE', paused: 'PAUSED', completed: 'COMPLETED', stopped: 'STOPPED',
};
export const STATUS_FROM_API = {
  ACTIVE: 'active', PAUSED: 'paused', COMPLETED: 'completed', STOPPED: 'stopped',
};

// ISO 8601 → DD/MM/YYYY (used to keep dayCalculator.js untouched)
export const isoToDDMMYYYY = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

// DD/MM/YYYY → ISO 8601 (start of day, local timezone, then UTC serialized)
export const ddmmyyyyToIso = (str) => {
  if (!str) return null;
  const [d, m, y] = str.split('/').map((n) => parseInt(n, 10));
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d).toISOString();
};

// Firebase-Timestamp-like shim so existing code that does
// `pause.pausedAt.toDate()` keeps working after we normalize ISO strings.
export const wrapIsoAsTimestamp = (iso) => {
  if (!iso) return null;
  const date = new Date(iso);
  return {
    toDate: () => date,
    toMillis: () => date.getTime(),
  };
};

// Normalize a backend client into the shape the app already expects.
export const normalizeClient = (raw) => {
  if (!raw) return null;
  return {
    id: raw.id,
    name: raw.name,
    mobile: raw.phone,
    age: raw.age,
    gender: GENDER_FROM_API[raw.gender] || raw.gender,
    bloodGroup: BLOOD_FROM_API[raw.bloodGroup] || raw.bloodGroup,
    height: raw.height,
    startingWeight: raw.startingWeight,
    package: raw.packageDays,
    trainingMode: MODE_FROM_API[raw.trainingMode] || raw.trainingMode,
    loginCode: raw.user?.loginCode || raw.loginCode || '',
    status: STATUS_FROM_API[raw.clientStatus] || 'active',
    startDate: isoToDDMMYYYY(raw.startDate),
    endDate: isoToDDMMYYYY(raw.endDate),
    createdBy: raw.trainerId,
    createdAt: wrapIsoAsTimestamp(raw.createdAt),
    stoppedAt: wrapIsoAsTimestamp(raw.stoppedAt),
    stoppedReason: raw.stoppedReason || null,
    pauseHistory: (raw.pauseHistory || []).map((p) => ({
      pausedAt: wrapIsoAsTimestamp(p.pausedAt),
      resumedAt: p.resumedAt ? wrapIsoAsTimestamp(p.resumedAt) : null,
      pausedDays: p.pausedDays,
    })),
    currentPackageId: raw.currentPackageId,
    weightHistory: raw.weightHistory || [],
  };
};
```

Now `clientService.js` becomes a thin REST layer that consumes/returns already-normalized shapes. Exports required (matching current usage):

- `createClient(clientData, createdByUsername, customStartDate)` — POST `/clients`. Ignore `createdByUsername` (backend takes it from JWT). Convert `customStartDate` from DD/MM/YYYY to ISO. Return `{success, clientId, loginCode, tempPassword, bmiAnalysis}`.
- `getAllClients()` — GET `/clients` (SUPER_ADMIN sees all; TRAINER sees own).
- `getClientsByTrainer(trainerId)` — GET `/clients?trainerId={id}`.
- `getClientsByStatus(statusLower)` — GET `/clients?clientStatus=${STATUS_TO_API[statusLower]}`.
- `getClientById(clientId)` — GET `/clients/:id`.
- `updateClient(clientId, updateData)` — PATCH `/clients/:id`. Translate fields (mobile→phone, package→packageDays, etc.) and enums before send. `startDate`/`endDate` sent as ISO. `status` sent as `clientStatus` uppercase.
- `pauseClient(clientId)` — PATCH `/clients/:id/pause`.
- `resumeClient(clientId)` — PATCH `/clients/:id/resume`.
- `stopClient(clientId, reason)` — PATCH `/clients/:id/stop` with `{reason}`.
- `renewClient(clientId, newPackage)` — PATCH `/clients/:id/renew` with `{newPackageDays: newPackage}`.
- `deleteClient(clientId)` — DELETE `/clients/:id`.
- `getClientCounts(_userId, _isSuperAdmin)` — GET `/clients/counts`. Backend already scopes by JWT role. Ignore the two args (kept for compat), return `{success, counts: {total, active, paused, completed, stopped}}` — backend returns lowercase keys already, safe to pass through.
- `searchClients(query)` — GET `/clients?search=${encodeURIComponent(query)}`.
- `checkAndUpdateClientStatus(clientId)` — REMOVE. The backend auto-computes `clientStatus` when it becomes completed based on `daysRemaining`. Do not call from the app anymore. If callers still exist post-migration, make it a no-op that returns `{success: true, updated: false}`.
- `recalculateClientEndDate(clientId)` — REMOVE. Backend keeps `endDate` correct. Make it a no-op returning `{success: true}` while callers are being removed.
- `generateLoginCode()` — REMOVE. Backend generates the login code.

Every response should go through `normalizeClient()` before being returned so downstream code keeps using DD/MM/YYYY strings and `toDate()`-capable timestamps unchanged.

**createClient special notes:**
- Do NOT send `packageHistory`, `pauseHistory`, `stoppedAt`, `stoppedReason` on create — backend initializes those.
- BMI: The old service computed BMI locally with `getCompleteBMIAnalysis` and returned it. Backend now returns `{score, category}` in the `bmi` field. Keep computing the FULL analysis client-side (target ranges, recommendations, colors) because backend only returns score+category. Call `getCompleteBMIAnalysis(weight, height, gender, age)` in `createClient` after the successful POST and return it as `bmiAnalysis` so `ClientFormModal` can render it unchanged.
- Response includes `credentials: {loginCode, tempPassword}`. Return BOTH from `createClient` so the caller can display both.
- POST body must be:

```js
{
  name, phone: mobile, age: Number(age),
  gender: GENDER_TO_API[gender],
  bloodGroup: BLOOD_TO_API[bloodGroup],
  height: Number(height),
  startingWeight: Number(startingWeight),
  trainingMode: MODE_TO_API[trainingMode],
  packageDays: Number(packageDuration), // 30/60/90/180
  startDate: ddmmyyyyToIso(startDate),
  // targetWeight, healthNotes, trainerId are optional and not currently used
}
```

### 3.5 `src/services/packageService.js` (full replacement)

Backend endpoints:
- `GET /clients/:id/packages` returns `ClientPackage[]` — each with `packageId`, `clientId`, `packageDays`, `trainingMode`, `startDate` (ISO), `endDate` (ISO), `status`, `completionRate`, `totalDaysCompleted`, `pauseHistory` (for archived), `createdAt`, `completedAt`, `stoppedAt`.
- `GET /clients/:id/packages/:packageId/activities` returns `DailyCheckIn[]`.

Exports to keep (unchanged public shape from callers' perspective):

- `getPackagesByClient(clientId)` — GET `/clients/:clientId/packages`. Normalize each package: ISO dates → DD/MM/YYYY, ISO timestamps → wrapped, `status` uppercase → lowercase.
- `getPackageById(packageId)` — REMOVE if unused after migration; otherwise implement via `getPackagesByClient` + client-side find (backend has no direct endpoint for a package by id in isolation).
- `getPackageActivities(packageId)` — needs a `clientId`; today's signature only takes `packageId`. Two options:
  - Option A (recommended): change the signature to `getPackageActivities(clientId, packageId)` and update the one caller in `ClientDetailScreen.js`.
  - Option B: cache a `packageId → clientId` map inside packageService when `getPackagesByClient` runs. Simpler for callers but stateful.
  Use Option A. Update the ClientDetailScreen accordingly.
- `getActivityByDay(packageId, dayNumber)` — REMOVE if unused, or filter client-side after `getPackageActivities`.
- `updatePackage(...)` — REMOVE. Client no longer mutates packages directly — pause/resume/stop/renew endpoints on `/clients/:id/*` handle everything server-side.
- `updatePackageStats(...)` — REMOVE. Backend computes on the fly.
- `deletePackage(...)` — REMOVE. Backend cascades on client delete.
- `getPackageOptions(clientId, currentPackageId)` — keep exactly the same public contract (returns `{success, options: [{label, value, packageData}]}`). Implementation still reformats the returned packages into dropdown options with month labels. The date-splitting logic already handles DD/MM/YYYY, so once we normalize dates in the service it needs no change.
- `isDatePaused(dateString, pauseHistory)` — keep as-is (uses parseDate on DD/MM/YYYY and `toDate()` on timestamps; wrapped timestamps expose `toDate()` so it still works).
- `calculateDayNumber(dateString, startDate, pauseHistory)` — keep as-is.

Normalized ClientPackage shape (returned from `getPackagesByClient`):
```js
{
  id: raw.packageId,
  packageId: raw.packageId,
  clientId: raw.clientId,
  packageDays: raw.packageDays,
  trainingMode: MODE_FROM_API[raw.trainingMode],
  startDate: isoToDDMMYYYY(raw.startDate),
  endDate: isoToDDMMYYYY(raw.endDate),
  status: STATUS_FROM_API[raw.status] || 'active',
  completionRate: raw.completionRate || 0,
  totalDaysCompleted: raw.totalDaysCompleted || 0,
  createdAt: wrapIsoAsTimestamp(raw.createdAt),
  completedAt: wrapIsoAsTimestamp(raw.completedAt),
  stoppedAt: wrapIsoAsTimestamp(raw.stoppedAt),
  stoppedReason: raw.stoppedReason || null,
  pauseHistory: (raw.pauseHistory || []).map((p) => ({
    pausedAt: wrapIsoAsTimestamp(p.pausedAt),
    resumedAt: p.resumedAt ? wrapIsoAsTimestamp(p.resumedAt) : null,
    pausedDays: p.pausedDays,
  })),
}
```

Normalized DailyCheckIn shape (returned from `getPackageActivities`):
```js
{
  id: raw.id,
  date: isoToDDMMYYYY(raw.date), // ISO → DD/MM/YYYY
  dayNumber: raw.dayNumber,
  status: (raw.status || 'PENDING').toLowerCase(), // 'PENDING'|'COMPLETED'|'PARTIAL' → lowercase
  responses: raw.responses || [], // pass-through; ensure {question, answer, note, completed, percentage} shape
  progress: raw.progress || null, // {percentage, ...}
  submittedAt: wrapIsoAsTimestamp(raw.submittedAt),
}
```

### 3.6 `src/services/dietChartService.js` (new)

Wraps the diet-chart endpoints for the new client-mode feature.

Endpoints:
- `POST /diet-charts` with body `{clientProfileId?, recipientName, meals, dailyGoals, supplements?, generalNotes}`.
- `GET /diet-charts/by-client/:clientId` — returns the chart for a specific client, or 404.
- `GET /diet-charts/:id` — fetch by chart id (if we cached one).
- `PATCH /diet-charts/:id` — update.

Exports:
- `getChartByClient(clientId)` — return `{success, chart}` where chart is null on 404.
- `createChart(payload)` — POST, returns `{success, chart}`.
- `updateChart(chartId, payload)` — PATCH, returns `{success, chart}`.

The payload shape (`meals`, `dailyGoals`, etc.) is documented in the top of this file — the shape stored today in local state is very close but not identical. Transformation needed:

App-side meal shape (from `DietChartBuilderScreen`):
```js
{
  id, // local uuid, not sent
  name, time,
  carbs: [{id, name, quantity}],
  proteins: [{id, name, quantity, proteinGrams}],
  others: [{id, name, quantity}],
  notes,
}
```

API meal shape:
```js
{
  name, time,
  carbItems: [{name, quantity}],
  proteinItems: [{name, quantity, proteinGrams}],
  otherItems: [{name, quantity}],
  notes,
}
```

App-side goals/notes are `[{id, text}]`; API takes `string[]`. Filter out empty entries before sending.

App-side supplements are `[{id, name, timing, note}]`; API takes `[{name, timing, note}]`.

Provide two helpers in this service:
```js
export const toApiChart = (formState) => ({
  recipientName: formState.clientName.trim(),
  clientProfileId: formState.clientProfileId || undefined,
  meals: formState.meals.map((m) => ({
    name: m.name,
    time: m.time,
    carbItems: m.carbs.map(({name, quantity}) => ({name, quantity})),
    proteinItems: m.proteins.map(({name, quantity, proteinGrams}) => ({
      name, quantity, proteinGrams,
    })),
    otherItems: m.others.map(({name, quantity}) => ({name, quantity})),
    notes: m.notes || '',
  })),
  dailyGoals: formState.dailyGoals.map((g) => g.text.trim()).filter(Boolean),
  supplements: (formState.supplements || []).map((s) => ({
    name: s.name, timing: s.timing, note: s.note,
  })),
  generalNotes: formState.generalNotes.map((n) => n.text.trim()).filter(Boolean),
});

export const fromApiChart = (chart) => ({
  chartId: chart.id,
  clientProfileId: chart.clientProfileId || null,
  clientName: chart.recipientName,
  meals: (chart.meals || []).map((m) => ({
    id: generateId(),
    name: m.name,
    time: m.time,
    carbs: (m.carbItems || []).map((i) => ({id: generateId(), ...i})),
    proteins: (m.proteinItems || []).map((i) => ({id: generateId(), ...i})),
    others: (m.otherItems || []).map((i) => ({id: generateId(), ...i})),
    notes: m.notes || '',
  })),
  dailyGoals: (chart.dailyGoals || []).map((text) => ({id: generateId(), text})),
  supplements: (chart.supplements || []).map((s) => ({id: generateId(), ...s})),
  generalNotes: (chart.generalNotes || []).map((text) => ({id: generateId(), text})),
});
```

Import `generateId` from `../constants/dietDefaults`.

---

## 4. AuthContext changes (`src/context/AuthContext.js`)

Full rewrite. New responsibilities:
1. On mount, read tokens from keychain. If present, call `GET /users/me` to hydrate `userProfile`. If not present (or /users/me returns 401), stay in the unauthenticated state.
2. Expose `signIn(email, password)` that calls `AuthService.signIn` and, on success, hydrates the profile via `GET /users/me`.
3. Expose `signOut()` that calls `AuthService.signOut()` and clears local state.
4. Replace the Firestore `onSnapshot` listener with a `setInterval` that calls `GET /users/me` every 60 seconds while the app is foregrounded. Use `AppState` from `react-native` to pause polling in background.
5. Register the `apiClient.setOnUnauthenticatedHandler` callback so 401 refresh failures force a global logout with the same "Account Deactivated / Account Deleted" alert semantics.
6. Detect status change ACTIVE → non-ACTIVE (for non-SUPER_ADMIN) via polling. Reuse the current alert text/behavior and Alert-stack guard exactly (`isAlertShowingRef`, `previousStatusRef`). Also detect 404 on `/users/me` (account deleted server-side) — show the "Account Deleted" alert.

New context values exposed:
- `user` — from `/users/me` (kept for legacy compatibility; `user.uid` should now map to `userProfile.id`).
- `userProfile` — same object as `user`; keep the two variables for backward compat with screens that read either.
- `loading` — true during initial hydration only.
- `error` — string or null.
- `signIn(email, password)` — new; screens (LoginScreen) call this instead of AuthService directly if you prefer. Optional convenience; keeping the direct AuthService call in LoginScreen is also fine as long as AuthContext refetches after success. Recommend: after LoginScreen's `AuthService.signIn` succeeds, it calls `authContext.hydrate()` (or a new `refreshUserProfile()`) which loads `/users/me`.
- `signOut()`
- `refreshUserProfile()`
- `isSuperAdmin()` — returns `userProfile?.role === 'SUPER_ADMIN'`.
- `isTrainer()` — returns `userProfile?.role === 'TRAINER'`.

Role mapping detail: backend `Role` enum values are `SUPER_ADMIN` and `TRAINER` (uppercase, underscore). Every current check that reads `'SuperAdmin'` / `'Trainer'` must change to `'SUPER_ADMIN'` / `'TRAINER'`, OR AuthContext can normalize the profile's `role` field to the old strings when saving to state (which minimizes touches). Recommendation: **normalize** — expose `userProfile.role` as `'SuperAdmin'` or `'Trainer'` so no other file needs to change. This is the smallest diff.

```js
const normalizeProfile = (raw) => ({
  ...raw,
  uid: raw.id, // legacy compat
  mobile: raw.phone, // legacy compat
  role: raw.role === 'SUPER_ADMIN' ? 'SuperAdmin' : 'Trainer',
  status: (raw.status || '').toLowerCase(), // 'ACTIVE' → 'active'
});
```

Skeleton:

```js
// src/context/AuthContext.js
import React, {createContext, useState, useEffect, useContext, useCallback, useRef} from 'react';
import {Alert, AppState} from 'react-native';
import * as AuthService from '../services/authService';
import * as TokenStorage from '../services/tokenStorage';
import {apiClient, setOnUnauthenticatedHandler} from '../services/apiClient';
import {PROFILE_POLL_INTERVAL_MS} from '../config/env';

const AuthContext = createContext();
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

const normalizeProfile = (raw) => ({
  ...raw,
  uid: raw.id,
  mobile: raw.phone,
  role: raw.role === 'SUPER_ADMIN' ? 'SuperAdmin' : 'Trainer',
  status: (raw.status || '').toLowerCase(),
});

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const previousStatusRef = useRef(null);
  const isAlertShowingRef = useRef(false);
  const pollRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  const showAccountDeactivated = useCallback(() => {
    if (isAlertShowingRef.current) return;
    isAlertShowingRef.current = true;
    Alert.alert(
      'Account Deactivated',
      'Your account has been deactivated by the administrator. Please contact support for assistance.',
      [{text: 'OK', onPress: async () => {
        isAlertShowingRef.current = false;
        await AuthService.signOut();
        setUser(null); setUserProfile(null); previousStatusRef.current = null;
      }}],
      {onDismiss: () => { isAlertShowingRef.current = false; }},
    );
  }, []);

  const showAccountDeleted = useCallback(() => {
    if (isAlertShowingRef.current) return;
    isAlertShowingRef.current = true;
    Alert.alert(
      'Account Deleted',
      'Your account has been deleted. Please contact administrator for assistance.',
      [{text: 'OK', onPress: async () => {
        isAlertShowingRef.current = false;
        await AuthService.signOut();
        setUser(null); setUserProfile(null); previousStatusRef.current = null;
      }}],
      {onDismiss: () => { isAlertShowingRef.current = false; }},
    );
  }, []);

  const hydrate = useCallback(async () => {
    try {
      const {data} = await apiClient.get('/users/me');
      const profile = normalizeProfile(data);

      // Detect ACTIVE → non-ACTIVE transition (skip on initial load)
      if (
        previousStatusRef.current === 'active' &&
        profile.status !== 'active' &&
        profile.role !== 'SuperAdmin'
      ) {
        showAccountDeactivated();
        return;
      }
      previousStatusRef.current = profile.status;
      setUser(profile);
      setUserProfile(profile);
    } catch (err) {
      if (err?.response?.status === 404) {
        showAccountDeleted();
      } else if (err?.response?.status === 401) {
        // interceptor already handled refresh failure
      } else {
        setError(err.message);
      }
    }
  }, [showAccountDeactivated, showAccountDeleted]);

  // Initial load: check keychain, hydrate if tokens exist
  useEffect(() => {
    setOnUnauthenticatedHandler(() => {
      setUser(null); setUserProfile(null); previousStatusRef.current = null;
    });

    (async () => {
      const tokens = await TokenStorage.loadTokens();
      if (tokens?.accessToken) {
        await hydrate();
      }
      setLoading(false);
    })();
  }, [hydrate]);

  // Poll /users/me every 60s while foregrounded (replaces onSnapshot)
  useEffect(() => {
    if (!user?.uid) return undefined;

    const start = () => {
      if (pollRef.current) return;
      pollRef.current = setInterval(() => { hydrate(); }, PROFILE_POLL_INTERVAL_MS);
    };
    const stop = () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };

    start();
    const sub = AppState.addEventListener('change', (next) => {
      if (appStateRef.current.match(/inactive|background/) && next === 'active') {
        hydrate(); // fetch immediately on foreground
        start();
      } else if (next.match(/inactive|background/)) {
        stop();
      }
      appStateRef.current = next;
    });

    return () => { stop(); sub.remove(); };
  }, [user?.uid, hydrate]);

  const signOut = useCallback(async () => {
    await AuthService.signOut();
    setUser(null); setUserProfile(null); setError(null);
    previousStatusRef.current = null;
    return {success: true};
  }, []);

  const isSuperAdmin = useCallback(() => userProfile?.role === 'SuperAdmin', [userProfile?.role]);
  const isTrainer = useCallback(() => userProfile?.role === 'Trainer', [userProfile?.role]);

  return (
    <AuthContext.Provider value={{user, userProfile, loading, error, isSuperAdmin, isTrainer, signOut, refreshUserProfile: hydrate}}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## 5. Screen-by-screen changes

### 5.1 `src/screens/LoginScreen.js`

Current: calls `AuthService.signIn(email, password)`, relies on `onAuthStateChanged` in AuthContext to auto-navigate. `handleForgotPassword` calls `AuthService.resetPassword(email)`.

New:
- Same `handleLogin` flow. After `AuthService.signIn` succeeds, call `authContext.refreshUserProfile()` so AuthContext hydrates the profile. Navigation switch happens automatically once `userProfile` is set (the app's top-level navigator already switches based on `user` presence).
- `handleForgotPassword` unchanged — still calls `AuthService.resetPassword(email)`. Backend endpoint is `POST /auth/forgot-password { email }` and always returns 200. UI copy stays exactly the same.
- Add `useAuth` import to get `refreshUserProfile`.

Field changes: none.
UI changes: none.

### 5.2 `src/screens/HomeScreen.js`

Current: fetches trainer count via `AuthService.getAllTrainers()`, fetches client counts via `ClientService.getAllClients()` + `checkAndUpdateClientStatus()` per active client + `getClientCounts(user.uid, isAdmin())`.

New:
- Remove the entire `checkAndUpdateClientStatus` loop AND the `recalculateClientEndDate` loop — both are backend responsibilities now. This simplifies `fetchClientCounts` significantly.
- Replace `ClientService.getClientCounts(user.uid, isAdmin())` with `ClientService.getClientCounts()` (arguments ignored — backend scopes by JWT). Return shape identical: `{total, active, paused, completed, stopped}`.
- Replace `AuthService.getAllTrainers()` call. Same public API on the service, no changes here.
- `user?.uid` still exists on `userProfile` (aliased in AuthContext).

Field/UI changes: none.

### 5.3 `src/screens/ClientsScreen.js`

Current: loads all clients OR clients-by-trainer, then filters client-side. Runs a background `checkClientStatuses` loop.

New:
- Remove the `checkClientStatuses` loop entirely — it becomes dead code.
- Prefer server-side filtering. When status filter changes and it isn't `all`, pass `clientStatus=<STATUS_TO_API[status]>` in the query. Similarly, when a specific trainer filter is chosen, pass `trainerId`.
- Simplest safe change: keep the current pattern (fetch all + filter locally) so the UX is unchanged and pagination/scroll behavior identical. The backend `GET /clients` endpoint is fast enough for our data volume. Only difference: after the service normalizes the response, `client.status` is lowercase and `client.mobile`/`client.loginCode` are present — the existing filter code keeps working unchanged.
- Remove the sort-in-memory fallback — backend already returns newest first.
- `client.loginCode` may be `null` (if the client has completed setup and has an email now). Current code does `client.loginCode.toLowerCase()` which will crash. Guard with `(client.loginCode || '').toLowerCase()`.

Field/UI changes:
- Status display already uses `client.status` and applies `textTransform: 'capitalize'` — works with normalized lowercase, so no visual change.
- `route.params.filterStatus` uses lowercase (`'active'`, `'paused'`, `'all'`) — keep as is. When calling backend with server-side filtering, translate on the fly.

### 5.4 `src/screens/ClientDetailScreen.js`

Current: loads a client, loads packages, loads activities for the selected package, handles pause/resume/stop/renew/delete.

New:
- All service function calls keep the same names and signatures EXCEPT `getPackageActivities` which needs a `clientId` parameter (Section 3.5). Update the two call sites:
  - `loadActivities`: pass `clientId` alongside `packageId`.
  - `onRefresh`: pass `clientId`.
- `handleRenewConfirm(packageDays, startDate)` — `startDate` was passed but ignored today because `renewClient` didn't accept it. Backend `PATCH /clients/:id/renew` accepts `{newPackageDays, startDate?}`. If you want to support custom renew start dates in the future, plumb it through; for now, drop the second arg call site to match today's behavior (renew always uses today).
- All UI unchanged.
- `client.weightHistory` is currently rendered — backend does not send it. `normalizeClient` sets it to `[]`, so the recent-weight block silently falls back to `'N/A'`. This matches current behavior for clients without weight history. Do not remove the block.
- Delete client: backend cascades package/activity cleanup — no need for the old package-by-package delete loop.

### 5.5 `src/screens/TrainersScreen.js`

Current: `AuthService.getAllTrainers()`, then renders each trainer with `trainer.createdAt.toDate().toLocaleDateString()`.

New:
- `getAllTrainers()` now returns trainers with `createdAt` as an ISO string (not a Firestore Timestamp). Change:
```js
Added {new Date(trainer.createdAt.toDate()).toLocaleDateString()}
```
to:
```js
Added {new Date(trainer.createdAt).toLocaleDateString()}
```
- Status coloring: `trainer.status === 'active'` check — service normalizes `'ACTIVE'` → `'active'`, so keep as is.
- Everything else (search, edit, delete, activate/deactivate) unchanged.

Note on `handleTrainerPress` in the current code: it uses `handleToggleStatus` and `handleDeleteTrainer` before they are defined (via useCallback). This works because the function references are captured by closure. This is not a migration concern, but leave it as-is to keep churn minimal.

### 5.6 `src/screens/ProfileScreen.js`

Current: reads `userProfile.email`, `userProfile.mobile`, `userProfile.name`, `userProfile.role`, `userProfile.status`. `ChangePasswordModal` calls `AuthService.changePassword(currentPassword, newPassword)`.

New:
- No changes to the screen itself — AuthContext already normalizes `mobile`, `role` (`'Trainer'` / `'SuperAdmin'` display strings), and `status` (`'active'` etc.).
- `AuthService.changePassword` implementation now calls `PATCH /auth/update-password`. Existing UI, validation, and error handling stay identical.
- Sign-out flow unchanged.

### 5.7 `src/screens/DietChartBuilderScreen.js`

See Section 6 for the full new-feature spec.

### 5.8 `src/components/AddTrainerModal.js`

Current: calls `AuthService.createTrainer(name, email, mobile, user.uid)`, on success shows a success modal with logo + email + password + share PNG.

New:
- Drop the fourth argument (`user.uid`) from `AuthService.createTrainer` — backend takes creator from JWT.
- The `password` shown in the credentials PNG is now `result.password` (which is `tempPassword` from backend response). It looks like a random alphanumeric string (backend generates 8 chars) instead of `Method{6-digits}`. This is a visible change but it is expected and correct — trainers still share the same way.
- Info box text remains valid: "A password reset email will be sent to the trainer. They can use it to set their own password before logging in." — the backend does NOT auto-send this email on trainer creation today. Update the copy to: "Share these credentials with the trainer. They can log in and change their password from the app." (Do not claim an email is sent unless backend actually sends one.)
- Everything else unchanged.

### 5.9 `src/components/EditTrainerModal.js`

Current: calls `AuthService.updateTrainer(trainer.uid, name, email, mobile)`.

New:
- No caller changes. Service maps `mobile` → `phone` internally.
- Helper text "Changing email won't update login credentials" — this is now misleading. On the backend, `email` IS the trainer's login. Update the helper text to: "Changing email will change the trainer's login email." Keep the field editable.

### 5.10 `src/components/ClientFormModal.js`

Current create flow:
1. Local BMI computed via `getCompleteBMIAnalysis`.
2. `ClientService.createClient(clientData, createdByUid, formattedStartDate)`.
3. On success, opens Success Modal with logo, loginCode, mobile, BMI analysis, share button.

New create flow:
1. Same local validation and BMI computation.
2. `ClientService.createClient(clientData, undefined, formattedStartDate)` — second arg ignored by new service.
3. Response now returns `{success, clientId, loginCode, tempPassword, bmiAnalysis}`. Store `tempPassword` in `createdClientData` alongside `loginCode`.
4. Success modal: add a new row inside the `loginCredentialsBox` for `Temp Password`. UI addition (SAME styling as loginCode column):

```
Login Code:          Mobile:
METHOD482931         +91XXXXXXXXXX
Temp Password:
Ab3Xz9Kp            (styled with FONTS.bold and same color)
```

Keep the credentials PNG capture — it will now include the password too. Update the share message copy to reference "your login code and temporary password" so clients know to use both.

Current edit flow:
1. Populates form from client, calls `ClientService.updateClient(clientId, updateData)` where `updateData` includes `status` recomputed via `getClientDayAnalysis`.

New edit flow:
1. Do NOT recompute `status` client-side. Backend owns status calculation for `ACTIVE ↔ COMPLETED` transitions on date changes. Remove the `newStatus` computation block. Send the update without a `status` field.
2. Field mappings applied in the service (mobile→phone, package→packageDays, enum uppercasing, ISO date conversion).

Field/UI changes:
- Add `tempPassword` display in success modal (new row in credentials box).
- Delete the client-side status recalculation on edit.

### 5.11 `src/components/StopModal.js`

Current: takes `reason` from user, calls `onConfirm(reason.trim())` which triggers `ClientService.stopClient(clientId, reason)`.

New: no changes. Service maps to `PATCH /clients/:id/stop { reason }`.

### 5.12 `src/components/RenewalModal.js`

Current: shows previous package info, stoppedReason, stoppedAt with `.toDate()` call.

New:
- `client.stoppedAt` is now a wrapped-timestamp object with a `.toDate()` method (see `wrapIsoAsTimestamp`), so the existing `.toDate()` call still works.
- `handleConfirm` still calls `onConfirm(parseInt(selectedPackage, 10))`. Service maps to `PATCH /clients/:id/renew { newPackageDays }`.
- No UI changes.

### 5.13 `src/components/clients/PackageSelector.js`

No changes. Consumes `packages` array from parent, which is now built from normalized data (dates already in DD/MM/YYYY format).

### 5.14 `src/components/clients/ClientActivityCalendar.js`

Consumes `client.startDate/endDate` (DD/MM/YYYY strings — unchanged after normalization) and `pauseHistory` entries with `.toDate()`-capable timestamps. Works with normalized data as-is. No changes.

### 5.15 `src/components/clients/ActivityDetailsModal.js`

Consumes an `activity` object. Fields used:
- `activity.responses[]` — passed through from backend as-is; ensure the backend returns `responses` with `{question, answer, note, completed, percentage}` fields. If field names differ (they should not per the DailyCheckIn shape), map inside `packageService.getPackageActivities`.
- `activity.progress?.percentage` — pass-through.
- `activity.submittedAt` — call site uses `.toDate ? .toDate() : new Date(...)`. Normalized as `wrapIsoAsTimestamp` so `.toDate()` works.
- `activity.status` — 'completed'|'partial'|'pending' lowercased by normalizer.

No changes to this component.

### 5.16 `src/navigation/BottomTabNavigator.js`

Current: `useAuth().isSuperAdmin()` returns boolean based on Firestore `role === 'SuperAdmin'`.

New: AuthContext normalizes `role` to `'SuperAdmin'` or `'Trainer'` (see Section 4). No change to this file.

---

## 6. Diet chart builder new feature

### 6.1 UI additions

At the top of `DietChartBuilderScreen`, above the "Client Name" section, add a mode toggle (SegmentedControl-like using two `TouchableOpacity` pills that match the app's visual language). Two modes:

- **Standalone** (default, selected on screen mount) — behavior identical to today. No API calls on Generate & Share. The `clientName` field is a free text `TextInput`.
- **Client** — replaces the `clientName` TextInput with a searchable client dropdown (reuse the existing `Dropdown` component from `src/components/Dropdown.js` if it supports search, or use `react-native-element-dropdown` which is already used in `PackageSelector`). Show client name in the label after selection. `recipientName` (the value sent to backend) auto-fills from `client.name` but stays editable via a small edit affordance below the dropdown (a plain `TextInput` labeled "Recipient Name (editable)").

### 6.2 State

Add state variables:
```js
const [mode, setMode] = useState('standalone'); // 'standalone' | 'client'
const [selectedClientId, setSelectedClientId] = useState(null);
const [clientOptions, setClientOptions] = useState([]); // [{label, value}]
const [existingChartId, setExistingChartId] = useState(null); // if set, PATCH; else POST
const [isLoadingChart, setIsLoadingChart] = useState(false);
```

### 6.3 Client list fetch

On mode change to `client` (once), fetch clients via `ClientService.getAllClients()`. Map to dropdown options:
```js
const options = clients
  .filter((c) => c.status !== 'stopped' && c.status !== 'completed') // optional: only show reachable clients
  .map((c) => ({label: c.name, value: c.id, phone: c.mobile}));
```
Trainers see their own clients (backend scopes automatically), SUPER_ADMIN sees all.

### 6.4 On client select

```js
const handleClientSelect = async (clientId) => {
  setSelectedClientId(clientId);
  const client = clients.find((c) => c.id === clientId);
  setClientName(client.name); // auto-fill recipient name

  setIsLoadingChart(true);
  const res = await DietChartService.getChartByClient(clientId);
  if (res.success && res.chart) {
    // Pre-fill entire form from existing chart
    const form = DietChartService.fromApiChart(res.chart);
    setExistingChartId(form.chartId);
    setClientName(form.clientName);
    setMeals(form.meals);
    setDailyGoals(form.dailyGoals);
    setSupplements(form.supplements);
    setShowSupplements(form.supplements.length > 0);
    setGeneralNotes(form.generalNotes);
  } else {
    setExistingChartId(null);
    // Keep the current form state (default meals + daily goals + general notes)
  }
  setIsLoadingChart(false);
};
```

### 6.5 Mode switch cleanup

When switching from `client` back to `standalone`, reset chart-related state:
```js
setSelectedClientId(null);
setExistingChartId(null);
// Do NOT reset the form — user can convert a filled form between modes.
```

### 6.6 Generate & Share behavior by mode

Extend `handleGenerateAndShare`:

```js
if (mode === 'client') {
  if (!selectedClientId) {
    Alert.alert('Select Client', 'Please select a client first.');
    return;
  }
  const payload = DietChartService.toApiChart({
    clientName, meals, dailyGoals,
    supplements: showSupplements ? supplements : [],
    generalNotes,
    clientProfileId: selectedClientId,
  });
  const res = existingChartId
    ? await DietChartService.updateChart(existingChartId, payload)
    : await DietChartService.createChart(payload);
  if (!res.success) {
    Alert.alert('Error', res.error || 'Failed to save diet chart.');
    return;
  }
  setExistingChartId(res.chart.id);
}

// ALWAYS proceed to preview + share, regardless of mode
navigation.navigate('DietChartPreview', {dietData: {
  clientName: clientName.trim(),
  date, // DD-MM-YY like today
  meals,
  dailyGoals,
  supplements: showSupplements ? supplements : [],
  generalNotes,
}});
```

### 6.7 Validation in client mode

- `clientName` still required (validated normally).
- If mode === 'client' and no `selectedClientId`, block generation with an Alert.

### 6.8 UI note

The Clear All button in client mode should ALSO reset `selectedClientId` and `existingChartId`. Keep `mode` unchanged.

---

## 7. Data format reference

### 7.1 Response wrapping

Every backend success response: `{success: true, data: <payload>, timestamp: '...'}`.
The response interceptor in `apiClient.js` strips this so callers use `response.data` (the payload).

Every error response: `{statusCode, timestamp, path, message}`. Read `err.response.data.message` in catch blocks (already handled by `extractError`).

### 7.2 Enum uppercase reference

| Field | Backend value | App display value |
|---|---|---|
| `role` | `'SUPER_ADMIN'` \| `'TRAINER'` | `'SuperAdmin'` \| `'Trainer'` (normalized in AuthContext) |
| `gender` | `'MALE'` \| `'FEMALE'` \| `'OTHER'` | `'Male'` \| `'Female'` (normalized in service) |
| `bloodGroup` | `'A_POSITIVE'` etc | `'A+'` etc (normalized in service) |
| `trainingMode` | `'ONLINE'` \| `'OFFLINE'` | `'Online'` \| `'Offline'` (normalized in service) |
| `clientStatus` | `'ACTIVE'` etc | `'active'` etc (normalized in service) |
| TrainerProfile `status` | `'ACTIVE'` \| `'INACTIVE'` \| `'SUSPENDED'` | `'active'` \| `'inactive'` \| `'suspended'` (normalized in service) |
| DailyCheckIn `status` | `'PENDING'` \| `'COMPLETED'` \| `'PARTIAL'` | `'pending'` \| `'completed'` \| `'partial'` (normalized in service) |
| `packageDays` | `30` \| `60` \| `90` \| `180` | same |

### 7.3 Date handling

Backend: ISO 8601 strings for every date/timestamp field.
App: existing code uses DD/MM/YYYY for `startDate`/`endDate` and `.toDate()` Timestamp objects for everything else. The service normalization layer does the translation in both directions so no other code needs to change.

The one place where the app builds a date to send to backend is `ClientFormModal` (`formattedStartDate`). The service `createClient`/`updateClient` converts it via `ddmmyyyyToIso`.

### 7.4 Field name normalization summary

Applied in services on read, reversed on write:
- `phone` ↔ `mobile`
- `packageDays` ↔ `package`
- `clientStatus` ↔ `status` (client only)
- `trainerId` ↔ `createdBy`
- `id` ↔ `uid` (users/trainers only)

---

## 8. Migration order (recommended)

Do the migration in this order so the app is buildable and testable at every step. Do not skip steps.

1. **Install packages** (Section 2.1) and remove Firestore/Auth packages (Section 2.2). Verify iOS pods install cleanly. Verify Android builds.
2. **Create `src/config/env.js`** and `src/services/tokenStorage.js`, `src/services/apiClient.js`. These are pure infrastructure — no callers yet.
3. **Create `src/services/mappers.js`** with the enum tables and `normalizeClient` / `normalizeTrainer` helpers.
4. **Replace `src/services/authService.js`** in full. Do not update callers yet — the exported function names and return shapes are identical, so nothing else needs to change.
5. **Replace `src/services/clientService.js`** in full. Same principle: same exports, same return shapes. Delete dead exports (`generateLoginCode`, `checkAndUpdateClientStatus`, `recalculateClientEndDate`) — grep for callers and replace with no-op or remove entirely.
6. **Replace `src/services/packageService.js`** in full. Update `getPackageActivities` signature and its callers in `ClientDetailScreen.js`.
7. **Create `src/services/dietChartService.js`** — no callers yet, no risk.
8. **Rewrite `src/context/AuthContext.js`** using the spec in Section 4. The app can now sign in, hydrate, and sign out via REST.
9. **Update `src/screens/LoginScreen.js`** to call `refreshUserProfile()` after successful sign-in. Test the full login flow end to end.
10. **Update `src/screens/TrainersScreen.js`** — the one line that reads `trainer.createdAt.toDate()` needs to become `new Date(trainer.createdAt)`. Test trainer list.
11. **Update `src/screens/HomeScreen.js`** — remove the `recalculateClientEndDate` and `checkAndUpdateClientStatus` loops. Test dashboard.
12. **Update `src/screens/ClientsScreen.js`** — remove `checkClientStatuses`, guard `client.loginCode?.toLowerCase()`. Test list, filters, search.
13. **Update `src/screens/ClientDetailScreen.js`** — update `getPackageActivities` call to pass `clientId`. Test overview, activities, pause, resume, stop, renew, delete.
14. **Update `src/components/ClientFormModal.js`** — display `tempPassword` in success modal, remove client-side status recomputation on edit. Test create + edit.
15. **Update `src/components/AddTrainerModal.js`** — drop the fourth arg to `createTrainer`, update info-box copy. Test trainer creation.
16. **Update `src/components/EditTrainerModal.js`** — update helper text copy. Test trainer edit.
17. **Update `src/components/ClientFormModal.js`** — verify BMI computation still shows correctly. Regression test.
18. **Update `src/screens/ProfileScreen.js`** — verify change password works. Regression test.
19. **Implement diet chart client mode** (Section 6) in `DietChartBuilderScreen.js`. Test both modes end to end.
20. **Wire up FCM token refresh** — `PATCH /auth/fcm-token { fcmToken }` should be called once after successful login and whenever `messaging().onTokenRefresh` fires. Add to AuthContext post-hydrate. Do NOT block login on this — call it best-effort.
21. **Verify all screens render correctly** with real backend data. Confirm no lingering imports from `@react-native-firebase/auth` or `@react-native-firebase/firestore`. Run `grep -r "firestore\|firebase/auth" src/` — should return zero non-messaging hits.
22. **Verify prod BASE_URL** in `src/config/env.js` before creating the release build.
23. **Rebuild**: `xcodebuild -workspace MethodOnlineTracker.xcworkspace -scheme MethodOnlineTracker -configuration Release -destination 'platform=iOS,name=Nismal'\''s iPhone'` (this step is done by the user, not by the implementer).

---

## 9. Files to touch (final checklist)

Grouped by kind. Every file in this list must be touched during the migration. Any file NOT in this list must not be modified.

**New files:**
- `src/config/env.js`
- `src/services/tokenStorage.js`
- `src/services/apiClient.js`
- `src/services/mappers.js`
- `src/services/dietChartService.js`

**Full rewrites:**
- `src/services/authService.js`
- `src/services/clientService.js`
- `src/services/packageService.js`
- `src/context/AuthContext.js`

**Targeted edits:**
- `src/screens/LoginScreen.js` — call `refreshUserProfile()` post-signin
- `src/screens/HomeScreen.js` — remove endDate recalc + auto-complete loops
- `src/screens/ClientsScreen.js` — remove auto-complete loop, guard nullable `loginCode`
- `src/screens/ClientDetailScreen.js` — pass `clientId` into `getPackageActivities` calls
- `src/screens/TrainersScreen.js` — `createdAt` is ISO string, not Timestamp
- `src/screens/ProfileScreen.js` — no functional change (verify only)
- `src/screens/DietChartBuilderScreen.js` — add mode toggle + client picker + create/update flow
- `src/components/AddTrainerModal.js` — drop 4th arg, update info-box copy
- `src/components/EditTrainerModal.js` — update helper text
- `src/components/ClientFormModal.js` — display `tempPassword` in success modal, delete edit-time status recomputation
- `src/components/StopModal.js` — no change (verify only)
- `src/components/RenewalModal.js` — no change (verify only)
- `src/components/clients/PackageSelector.js` — no change (verify only)
- `src/components/clients/ClientActivityCalendar.js` — no change (verify only)
- `src/components/clients/ActivityDetailsModal.js` — no change (verify only)
- `src/navigation/BottomTabNavigator.js` — no change (verify only)

**Files that should NOT change:**
- `src/utils/dayCalculator.js`
- `src/utils/bmiCalculator.js`
- `src/constants/theme.js`
- `src/constants/formOptions.js` (STATUS_COLORS keys stay lowercase because we normalize)
- `src/constants/dietDefaults.js`
- `src/theme/*`
- Everything under `assets/`
- All other components in `src/components/` and `src/components/diet/`

---

## 10. Gotchas and edge cases

- **Login code login**: The backend supports both `email + password` and `loginCode + password` for `/auth/login`. This trainer app must always send `{email, password}`. Never send `loginCode` — that's for the client app.
- **`mustChangePassword` on login**: Trainer accounts never have this flag set. If the backend ever returns it for a trainer, treat as an error and surface a clear message. Do not attempt setup flow in this app.
- **Empty `loginCode` on clients**: Once a client completes account setup (in the client app), `user.loginCode` is cleared. When rendering, show `loginCode || 'Setup complete'` in the ClientDetailScreen "Login Code" field, OR simply hide the field when null. Recommendation: show `client.loginCode || '-'` to keep the layout stable.
- **`user.email` on clients**: Once setup, backend sends `user.email`. Not currently displayed in the trainer app; leave alone.
- **Trainer `phone` uniqueness**: Backend may enforce phone uniqueness across trainers. Surface backend error message verbatim on 409/400 responses (already handled by `extractError`).
- **Time zones**: `ddmmyyyyToIso` builds the date at local midnight and calls `.toISOString()` which converts to UTC. This can shift the DAY for users east of UTC. Since the app's dayCalculator uses DD/MM/YYYY strings and only compares day boundaries, this is fine on the READ path (backend returns ISO, `isoToDDMMYYYY` uses local timezone). Ensure the WRITE path uses the same convention — always parse DD/MM/YYYY as local and serialize as ISO so the read/write roundtrip is stable.
- **FCM token**: When implementing token upload (`PATCH /auth/fcm-token`), await `messaging().getToken()` after `requestPermission()` on iOS. Do not call this during login — do it after `hydrate()` succeeds inside AuthContext.
- **Refresh token race**: The `refreshPromise` singleton in `apiClient.js` prevents parallel refresh attempts. Do not remove it.
- **Interceptor logout**: When the interceptor triggers `onUnauthenticatedCallback`, the AuthContext clears state which causes the root navigator to switch back to `LoginScreen`. Do not additionally call `Alert.alert` from the interceptor — a silent logout is correct UX for token expiry.
- **`checkAndUpdateClientStatus` callers**: In the current codebase these live in `HomeScreen.js` and `ClientsScreen.js`. Delete them cleanly rather than making the service a no-op — no need to keep dead calls.
- **Renew from stopped**: `RenewalModal` reads `client.stoppedAt` and calls `.toDate()`. `wrapIsoAsTimestamp` provides `.toDate()`. If `stoppedAt` is null, the surrounding conditional already prevents the call.
- **Diet chart PATCH**: When updating an existing chart, the backend expects the same schema as POST (all fields optional). The `toApiChart` helper always builds the full payload — send it whole; no partial updates needed.
- **Diet chart standalone mode**: Do NOT accidentally attach a `clientProfileId` in standalone mode. The `toApiChart` helper only sets it when passed (client mode only sets it). Verify this via the payload before send.

---

End of migration document.
