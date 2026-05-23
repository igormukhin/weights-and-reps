# weights-and-reps Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-08

## Active Technologies
- TypeScript 5.x (strict mode) + Vue 3 (Composition API), Vuetify 3, Pinia, Firebase SDK v10+ (002-exercise-detail-redesign)
- Firestore — `users/{uid}/exercises/{exerciseId}/exerciseLogs/{YYYY-MM-DD}` (002-exercise-detail-redesign)
- Firestore — `users/{uid}/exercises/{exerciseId}/exerciseLogs/{YYYY-MM-DD}` (embedded `sets[]` array) (003-set-bump-label)
- TypeScript 5.x (strict mode) + Vue 3 (Composition API), Vuetify 3, vuedraggable (004-exercise-edit-mode)
- N/A (no data model changes) (004-exercise-edit-mode)
- TypeScript 5.6 (strict mode) + Vue 3, Vuetify 3, Vite 6, Firebase SDK v10, Playwright (new), firebase-tools (new, dev) (005-e2e-test-setup)
- Firebase Firestore via emulator in tests (005-e2e-test-setup)

- TypeScript 5.x (strict mode) + Vue 3 (Composition API), Vuetify 3, Vue Router 4, Pinia, (001-training-tracker-app)

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

## Code Style

TypeScript 5.x (strict mode): Follow standard conventions

## Recent Changes
- 005-e2e-test-setup: Added TypeScript 5.6 (strict mode) + Vue 3, Vuetify 3, Vite 6, Firebase SDK v10, Playwright (new), firebase-tools (new, dev)
- 005-e2e-test-setup: Added [if applicable, e.g., PostgreSQL, CoreData, files or N/A]
- 004-exercise-edit-mode: Added TypeScript 5.x (strict mode) + Vue 3 (Composition API), Vuetify 3, vuedraggable


<!-- MANUAL ADDITIONS START -->
## Persistent Git Instructions
- **Git Commits:** Never stage or commit changes to the Git repository unless specifically and explicitly requested by the user. Do not perform proactive Git commits on follow-up tasks.
<!-- MANUAL ADDITIONS END -->

## Agent skills

### Issue tracker

Issues live in GitHub Issues (`igormukhin/weights-and-reps`). See `docs/agents/issue-tracker.md`.

### Triage labels

Uses the five default label names (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo — one `CONTEXT.md` + `docs/adr/` at the root (`CONTEXT.md` exists; `docs/adr/` not yet created). See `docs/agents/domain.md`.
