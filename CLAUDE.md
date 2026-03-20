# weights-and-reps Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-20

## Active Technologies

- TypeScript 5.x (strict mode) + Vue 3 (Composition API), Vuetify 3, Vue Router 4, Pinia, (001-training-tracker-app)

## Project Structure

```text
src/
├── components/exercises/   # Exercise list UI
├── components/session/     # Set row UI
├── composables/            # useExercises, useSession
├── router/                 # Vue Router (auth guard)
├── services/               # Firebase auth, exercises, sessions
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

- 001-training-tracker-app: Added TypeScript 5.x (strict mode) + Vue 3 (Composition API), Vuetify 3, Vue Router 4, Pinia,

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
