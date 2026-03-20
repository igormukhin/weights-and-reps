# Quickstart: Weights and Reps — Development Setup

**Branch**: `001-training-tracker-app` | **Date**: 2026-03-20

---

## Prerequisites

- Node.js ≥ 18 and npm ≥ 9
- A Firebase project with **Firestore** and **Authentication** enabled
- Google sign-in enabled in Firebase Console → Authentication → Sign-in methods

---

## 1. Install dependencies

```bash
npm install
```

---

## 2. Configure Firebase environment

Create a `.env.local` file at the project root (this file is gitignored):

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

These values are found in Firebase Console → Project Settings → Your apps → Web app
config.

---

## 3. Deploy Firestore security rules

```bash
firebase deploy --only firestore:rules
```

The rules file is at `firestore.rules` in the repository root. See
[`contracts/firestore-schema.md`](contracts/firestore-schema.md) for the rule content.

---

## 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in a browser.

---

## 5. Verify the setup

1. The app opens on the login screen.
2. Clicking "Sign in with Google" completes authentication and redirects to the
   exercises screen.
3. The exercises screen is empty for a new account — a prompt to add the first
   exercise is shown.
4. Add an exercise, open it, enter weight and reps — the save indicator shows
   "saving" then "saved" within 2 seconds.

---

## Build for production

```bash
npm run build
```

Output is in `dist/`. Deploy to Firebase Hosting:

```bash
firebase deploy --only hosting
```

---

## Key files reference

| File | Purpose |
|------|---------|
| `src/services/auth.ts` | Google sign-in / sign-out |
| `src/services/exercises.ts` | Firestore exercise CRUD + ordering |
| `src/services/sessions.ts` | Firestore session read/write |
| `src/composables/useExercises.ts` | Exercise list logic + drag-to-reorder |
| `src/composables/useSession.ts` | Set editing + 2s auto-save debounce |
| `src/stores/auth.ts` | Pinia: current user state |
| `src/stores/exercises.ts` | Pinia: exercise list state |
| `firestore.rules` | Firestore security rules |
| `.env.local` | Firebase credentials (gitignored — never commit) |
