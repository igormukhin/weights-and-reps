# Weights & Reps

A personal strength training tracker. Users log sets for individual exercises each day and use past data as a reference when training.

## Language

**ExerciseLog**:
The record of all sets performed for one exercise on one calendar date.
_Avoid_: Session, training session, workout log

**Past ExerciseLog**:
An ExerciseLog for a given Exercise on a date before today.
_Avoid_: Previous exercise log, historical log

**Set**:
One group of repetitions at a given weight within an ExerciseLog. Weight is in kilograms; negative values indicate assisted resistance (convention, not a distinct type).
_Avoid_: row, entry, rep group

**Max Weight**:
The highest weight among the Sets in one ExerciseLog. It ignores repetitions and BumpIt; for assisted exercises, less assistance counts as higher weight.
_Avoid_: PR, one-rep max, best set

**BumpIt**:
A manual reminder flag on a Set indicating the user intends to increase the weight the next time they train this exercise.
_Avoid_: BumpSignal, weight reminder

**Exercise**:
A named strength movement a user tracks over time. Can be archived when no longer in use.
_Avoid_: lift, movement, workout

**ExerciseCategory**:
A named grouping of exercises. Stored as a separate field (`category`) on the exercise; not a separate top-level collection.
_Avoid_: ExerciseGroup, group, muscle group

**Exercise List**:
The home screen showing all exercises grouped by ExerciseCategory.
_Avoid_: Home, Dashboard, Library

**Exercise List Editor**:
The screen for managing the exercise list — adding, reordering, and archiving exercises.
_Avoid_: Edit mode, Exercise Manager, Edit Exercises screen

**Exercise Screen**:
The per-exercise screen that hosts either Overview mode or Logging mode depending on whether an ExerciseLog exists for today.
_Avoid_: Exercise Detail, Training Screen, Exercise Log Screen

**Overview mode**:
The Exercise Screen state when no ExerciseLog exists for today. Shows history, past logs, and (future) progress charts for the exercise.
_Avoid_: Review mode, read-only mode, standby

**Logging mode**:
The Exercise Screen state when an ExerciseLog exists for today. The user is actively entering or editing today's sets.
_Avoid_: Edit mode, active mode, session mode

## Relationships

- An **Exercise** has zero or more **ExerciseLogs** (one per training day)
- An **ExerciseLog** contains one or more **Sets**
- A **Set** may carry a **BumpIt** flag
- An **Exercise** belongs to at most one **ExerciseCategory** (defined by its `category` field)
- The **last ExerciseLog** is the most recent **Past ExerciseLog** for a given Exercise — shown read-only as a reference when logging today

## Example dialogue

> **Dev:** "When a user taps 'Pump it!' on an Exercise in Overview mode, what happens?"
> **Domain expert:** "We create a new ExerciseLog for today, pre-filled with the Sets from the last ExerciseLog, and switch to Logging mode."
> **Dev:** "If a Set in the last ExerciseLog has a BumpIt flag, do we automatically increase the weight in the new log?"
> **Domain expert:** "No — BumpIt is a manual reminder only. The user sees the 🆙 marker and decides to increase the weight themselves."
> **Dev:** "Can an archived Exercise still have ExerciseLogs?"
> **Domain expert:** "Yes — archiving only hides the Exercise from the active list. Its historical ExerciseLogs remain intact."
