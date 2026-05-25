# weights-and-reps Development Guidelines

## Active Technologies

- TypeScript 5.x (strict mode) + Vue 3 (Composition API), Vuetify 3, Pinia, Firebase SDK v10+

## Project Structure

```text
src/
├── components/exercises/   # Exercise list UI
├── components/exerciseLog/ # Set row UI
├── composables/            # useExercises, useExerciseLog
├── router/                 # Vue Router (auth guard)
├── services/               # Firebase auth, exercises, exerciseLogs
├── stores/                 # Pinia: auth, exercises
├── types/                  # TypeScript interfaces
└── views/                  # LoginView, ExercisesView, ExerciseDetailView
firestore.rules
```

## Commands

npm run dev     # Start dev server (Vite, port 5173)
npm run build   # Production build → dist/
npm run lint    # ESLint + TypeScript check

### Running E2E Tests
* **Port Conflict Check**: Firestore and Auth emulators use ports `8080` and `9099`. Check if ports are already bound (e.g. `lsof -i :8080`) and terminate blocking processes if necessary (e.g. `fuser -k 8080/tcp`).
* **Environment**: Local developer environments usually have the `.env.test` file already set up. Do not proactively copy or overwrite `.env.test` unless it is missing.
* **Run Command**: Always use the locally installed `firebase-tools` wrapper:
  ```bash
  npx firebase emulators:exec --only auth,firestore "npm run test:e2e"
  ```

## Code Style

TypeScript 5.x (strict mode): Follow standard conventions

## Agent Instructions

- **Git Commits:** Never stage or commit changes to the Git repository unless specifically and explicitly requested by the user. Do not perform proactive Git commits on follow-up tasks.

## Agent skills

### Domain docs

Single-context repo — one `CONTEXT.md` + `docs/adr/` at the root (`CONTEXT.md` exists; `docs/adr/` not yet created). See `docs/agents/domain.md`.
