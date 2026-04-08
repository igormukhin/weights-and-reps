# Quickstart & Validation: Exercise List Edit Mode

**Date**: 2026-04-08  
**Branch**: `004-exercise-edit-mode`

## Run the App

```bash
npm run dev
# Opens at http://localhost:5173
```

## Manual Test Checklist

Test on a ≤375px viewport (Chrome DevTools → iPhone SE or similar).

### Browse Mode (default)

- [ ] Load the exercise list — confirm only exercise names are visible (no pencil, no eye-off, no drag handle, no + FAB)
- [ ] App bar shows title "Weights & Reps" and an "Edit" button (alongside sign-out)
- [ ] Tapping an exercise name navigates to the detail page

### Enter Edit Mode

- [ ] Tap "Edit" in the app bar
- [ ] App bar title changes to "Edit Exercises"
- [ ] Button label changes to "Done"
- [ ] Drag handles appear on all exercise rows
- [ ] Pencil (rename) button appears on all exercise rows
- [ ] Eye-off (remove/hide) button appears on all exercise rows
- [ ] Add (+) FAB appears (bottom right)

### Edit Mode — Actions

- [ ] Drag an exercise to a new position — reorder is saved
- [ ] Tap pencil — rename dialog opens and works
- [ ] Tap eye-off — hide/remove dialog opens and works
- [ ] Tap "+" FAB — add exercise dialog opens and works
- [ ] Tap an exercise **name** — nothing happens (no navigation)

### Exit Edit Mode

- [ ] Tap "Done"
- [ ] App bar title reverts to "Weights & Reps"
- [ ] Button label reverts to "Edit"
- [ ] All management controls are hidden again
- [ ] Tapping an exercise name navigates normally

### Navigation Reset

- [ ] Enter edit mode, then navigate to an exercise detail page
- [ ] Press back — exercise list loads in **browse** mode (not edit mode)

### Empty State

- [ ] Remove all exercises (or test with a new account with no exercises)
- [ ] In browse mode: empty state message guides user to tap "Edit" to add first exercise
- [ ] In edit mode: add (+) FAB is visible
