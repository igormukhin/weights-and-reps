# Exercise List View/Edit Route Separation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate the exercise list view mode and edit mode into independent routes and components, so future view mode changes never touch edit mode code.

**Architecture:** Add a flat `/exercises/edit` route backed by a new `ExercisesEditView.vue` that holds all current edit-mode logic verbatim. Strip `ExercisesView.vue` down to view-only. Replace the shared `ExerciseListItem.vue` with two focused components: `ExerciseListItemEdit.vue` (edit context, no mode prop) and `ExerciseListItemView.vue` (view context, minimal).

**Tech Stack:** Vue 3 (Composition API), Vuetify 3, Pinia, Vue Router 4, vuedraggable, TypeScript 5.x strict, Playwright (E2E)

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/views/ExercisesEditView.vue` | Edit mode page: draggable list, FAB, dialogs, Done→back |
| Modify | `src/views/ExercisesView.vue` | View mode only: computed list, Edit→push route |
| Create | `src/components/exercises/ExerciseListItemEdit.vue` | Edit list item: drag handle, rename/hide buttons, no mode prop |
| Create | `src/components/exercises/ExerciseListItemView.vue` | View list item: name + tap-to-navigate, no edit UI |
| Delete | `src/components/exercises/ExerciseListItem.vue` | Replaced by the two above |
| Modify | `src/router/index.ts` | Add `/exercises/edit` route with `requiresAuth` |

---

### Task 1: Create ExerciseListItemEdit.vue

**Files:**
- Create: `src/components/exercises/ExerciseListItemEdit.vue`

- [ ] **Step 1: Create the file**

```vue
<template>
  <v-list-item
    class="exercise-item pa-0"
    :ripple="false"
  >
    <template #prepend>
      <v-icon class="drag-handle mr-1 text-medium-emphasis" :icon="mdiDrag" />
    </template>

    <v-list-item-title class="exercise-name">
      {{ exercise.name }}
    </v-list-item-title>

    <template #append>
      <v-btn
        :icon="mdiPencilOutline"
        size="small"
        variant="text"
        data-testid="rename-exercise-btn"
        @click.stop="showEdit = true"
      />
      <v-btn
        :icon="mdiEyeOffOutline"
        size="small"
        variant="text"
        data-testid="hide-exercise-btn"
        @click.stop="showHide = true"
      />
    </template>
  </v-list-item>

  <EditExerciseDialog
    v-if="showEdit"
    :exercise-id="exercise.id"
    :current-name="exercise.name"
    @close="showEdit = false"
  />

  <HideExerciseDialog
    v-if="showHide"
    :exercise-id="exercise.id"
    :exercise-name="exercise.name"
    @close="showHide = false"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { mdiDrag, mdiEyeOffOutline, mdiPencilOutline } from '@mdi/js'
import type { Exercise } from '@/types'
import EditExerciseDialog from './EditExerciseDialog.vue'
import HideExerciseDialog from './HideExerciseDialog.vue'

defineProps<{ exercise: Exercise }>()

const showEdit = ref(false)
const showHide = ref(false)
</script>

<style scoped>
.exercise-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  min-height: 52px;
}
.exercise-name {
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.drag-handle {
  cursor: grab;
}

.exercise-item :deep(.v-list-item__prepend) {
  padding-inline-end: 0;
}

.exercise-item :deep(.v-list-item__prepend) {
  --v-list-prepend-gap: 8px;
}

.exercise-item :deep(.v-list-item__append) {
  padding-inline-start: 0;
  gap: 0;
}

.exercise-item :deep(.v-list-item__append .v-btn) {
  width: 32px;
  height: 32px;
}
</style>
```

- [ ] **Step 2: Verify lint passes**

```bash
npm run lint
```

Expected: no errors.

---

### Task 2: Create ExerciseListItemView.vue

**Files:**
- Create: `src/components/exercises/ExerciseListItemView.vue`

- [ ] **Step 1: Create the file**

```vue
<template>
  <v-list-item
    class="exercise-item pa-0"
    :ripple="false"
    @click="router.push(`/exercises/${exercise.id}`)"
  >
    <v-list-item-title class="exercise-name">
      {{ exercise.name }}
    </v-list-item-title>
  </v-list-item>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Exercise } from '@/types'

defineProps<{ exercise: Exercise }>()

const router = useRouter()
</script>

<style scoped>
.exercise-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  min-height: 52px;
}
.exercise-name {
  cursor: pointer;
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
```

- [ ] **Step 2: Verify lint passes**

```bash
npm run lint
```

Expected: no errors.

---

### Task 3: Create ExercisesEditView.vue

**Files:**
- Create: `src/views/ExercisesEditView.vue`

- [ ] **Step 1: Create the file**

```vue
<template>
  <v-app-bar color="primary" density="comfortable">
    <v-app-bar-title>Edit Exercises</v-app-bar-title>
    <template #append>
      <v-btn variant="text" @click="router.back()">Done</v-btn>
      <v-btn :icon="mdiLogout" @click="handleSignOut" />
    </template>
  </v-app-bar>

  <v-main>
    <v-container>
      <div v-if="isLoading" class="d-flex justify-center mt-8">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <div v-else-if="exercises.length === 0" class="text-center mt-12">
        <v-icon size="64" color="medium-emphasis" :icon="mdiDumbbell" />
        <p class="text-h6 mt-4 text-medium-emphasis">No exercises yet</p>
        <p class="text-body-2 text-medium-emphasis">Tap the + button to add your first exercise</p>
      </div>

      <v-list v-else lines="one" class="pa-0">
        <draggable
          v-model="exercises"
          item-key="id"
          handle=".drag-handle"
          @end="onDragEnd"
        >
          <template #item="{ element }">
            <div>
              <ExerciseListItemEdit :exercise="element" />
            </div>
          </template>
        </draggable>
      </v-list>
    </v-container>
  </v-main>

  <v-btn
    color="primary"
    :icon="mdiPlus"
    size="large"
    position="fixed"
    location="bottom right"
    class="ma-4"
    data-testid="add-exercise-fab"
    @click="showAddDialog = true"
  />

  <AddExerciseDialog
    v-if="showAddDialog"
    @close="onAddDialogClose"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { mdiDumbbell, mdiLogout, mdiPlus } from '@mdi/js'
import { useRouter } from 'vue-router'
import draggable from 'vuedraggable'
import { useAuthStore } from '@/stores/auth'
import { useExercisesStore } from '@/stores/exercises'
import { useSessionStore } from '@/stores/session'
import { useExercises } from '@/composables/useExercises'
import { signOut } from '@/services/auth'
import ExerciseListItemEdit from '@/components/exercises/ExerciseListItemEdit.vue'
import AddExerciseDialog from '@/components/exercises/AddExerciseDialog.vue'

const authStore = useAuthStore()
const exercisesStore = useExercisesStore()
const sessionStore = useSessionStore()
const router = useRouter()

const uid = authStore.currentUser!.uid
const { reorder } = useExercises(uid)

const isLoading = computed(() => exercisesStore.isLoading)
const exercises = ref([...exercisesStore.exercises])
watch(() => exercisesStore.exercises, (val) => { exercises.value = [...val] })
const showAddDialog = ref(false)

onMounted(async () => {
  await exercisesStore.loadExercises(uid)
})

async function handleSignOut(): Promise<void> {
  await signOut()
  exercisesStore.clear()
  sessionStore.clear()
  router.push('/login')
}

async function onAddDialogClose(): Promise<void> {
  showAddDialog.value = false
  await exercisesStore.loadExercises(uid)
}

async function onDragEnd(event: { newIndex: number; oldIndex: number }): Promise<void> {
  if (event.newIndex === event.oldIndex) return
  await reorder(exercises.value)
}
</script>
```

- [ ] **Step 2: Verify lint passes**

```bash
npm run lint
```

Expected: no errors.

---

### Task 4: Update ExercisesView.vue

**Files:**
- Modify: `src/views/ExercisesView.vue`

- [ ] **Step 1: Replace the entire file content**

```vue
<template>
  <v-app-bar color="primary" density="comfortable">
    <v-app-bar-title>Weights &amp; Reps</v-app-bar-title>
    <template #append>
      <v-btn variant="text" @click="router.push('/exercises/edit')">Edit</v-btn>
      <v-btn :icon="mdiLogout" @click="handleSignOut" />
    </template>
  </v-app-bar>

  <v-main>
    <v-container>
      <div v-if="isLoading" class="d-flex justify-center mt-8">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <div v-else-if="exercises.length === 0" class="text-center mt-12">
        <v-icon size="64" color="medium-emphasis" :icon="mdiDumbbell" />
        <p class="text-h6 mt-4 text-medium-emphasis">No exercises yet</p>
        <p class="text-body-2 text-medium-emphasis">Tap Edit to add your first exercise</p>
      </div>

      <v-list v-else lines="one" class="pa-0">
        <ExerciseListItemView
          v-for="exercise in exercises"
          :key="exercise.id"
          :exercise="exercise"
        />
      </v-list>
    </v-container>
  </v-main>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { mdiDumbbell, mdiLogout } from '@mdi/js'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useExercisesStore } from '@/stores/exercises'
import { useSessionStore } from '@/stores/session'
import { signOut } from '@/services/auth'
import ExerciseListItemView from '@/components/exercises/ExerciseListItemView.vue'

const authStore = useAuthStore()
const exercisesStore = useExercisesStore()
const sessionStore = useSessionStore()
const router = useRouter()

const uid = authStore.currentUser!.uid
const isLoading = computed(() => exercisesStore.isLoading)
const exercises = computed(() => exercisesStore.exercises)

onMounted(async () => {
  await exercisesStore.loadExercises(uid)
})

async function handleSignOut(): Promise<void> {
  await signOut()
  exercisesStore.clear()
  sessionStore.clear()
  router.push('/login')
}
</script>
```

- [ ] **Step 2: Verify lint passes**

```bash
npm run lint
```

Expected: no errors.

---

### Task 5: Add route and delete old component

**Files:**
- Modify: `src/router/index.ts`
- Delete: `src/components/exercises/ExerciseListItem.vue`

- [ ] **Step 1: Add the `/exercises/edit` route to `src/router/index.ts`**

Insert after the `/exercises` route entry:

```typescript
{
  path: '/exercises/edit',
  name: 'exercises-edit',
  component: () => import('@/views/ExercisesEditView.vue'),
  meta: { requiresAuth: true },
},
```

Full updated routes array:

```typescript
routes: [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
  },
  {
    path: '/exercises',
    name: 'exercises',
    component: () => import('@/views/ExercisesView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/exercises/edit',
    name: 'exercises-edit',
    component: () => import('@/views/ExercisesEditView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/exercises/:id',
    name: 'exercise-detail',
    component: () => import('@/views/ExerciseDetailView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/',
    redirect: '/exercises',
  },
],
```

- [ ] **Step 2: Delete the old shared component**

```bash
rm src/components/exercises/ExerciseListItem.vue
```

- [ ] **Step 3: Verify lint and build pass**

```bash
npm run lint && npm run build
```

Expected: no errors, `dist/` generated.

- [ ] **Step 4: Commit**

```bash
git add src/views/ExercisesView.vue src/views/ExercisesEditView.vue \
  src/components/exercises/ExerciseListItemEdit.vue \
  src/components/exercises/ExerciseListItemView.vue \
  src/router/index.ts
git rm src/components/exercises/ExerciseListItem.vue
git commit -m "refactor: separate exercise list view and edit into independent routes"
```

---

### Task 6: Verify E2E tests pass

**Files:** none changed

- [ ] **Step 1: Run E2E tests**

```bash
npm run test:e2e
```

Expected: all tests pass. The E2E tests click "Edit" (navigates to `/exercises/edit`), perform actions (rename, hide, reorder, add), then reload (returns to `/exercises`). Both routes expose `.exercise-name` and `.exercise-item` CSS classes, so all selectors remain valid.

If any test fails, check:
- `.exercise-name` class present in both `ExerciseListItemView.vue` and `ExerciseListItemEdit.vue` ✓
- `.exercise-item` class present in both ✓
- `.drag-handle` class present in `ExerciseListItemEdit.vue` ✓
- `data-testid="add-exercise-fab"` present in `ExercisesEditView.vue` ✓
- `data-testid="rename-exercise-btn"` and `data-testid="hide-exercise-btn"` present in `ExerciseListItemEdit.vue` ✓
