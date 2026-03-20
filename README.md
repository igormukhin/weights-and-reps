# Weights and Reps

Easy-to-use personal training tracker app. Historically tracks what exercises you did with what weights on which set with how many reps. Simplest possible, clean UI focused on the easy and quick input of tracked data during the training.

# Technologies

* HTML/TypeScript
* Vue JS
* Vuetifyjs UI
* Firebase
* Login with Google

# Screens

Kilogramms are used for weights.
Dates are in German format.

## Exercises

Main screen with exercises list. Users can add new exercises, edit names of existing ones or hide them.

When adding an exercise, the name must be unique (case-insensitive).

When editing an exercise name, the new name must be unique (case-insensitive).

When hiding an exercise, confirmation is required. Hidden exercises are marked as hidden in the database, but data not deleted. Hidden exercises are not shown in the list for now.

Tapping on an exercise shows its details.

## Exercise details

By default, the user sees the template for input of the exercise data. Each row shows fields for 3 sets. Additional sets can be added.

Each set row shows:
- set #
- last weight (not editable)
- last reps (not editable)
- new weight (editable)
- new reps (editable)

When you open a screen, if there is data for today, it is loaded in the "new" fields. The previous training is loaded into the "last" fields.

Tapping on an empty "new weight" field fills it with the last weight of the previous set. The field has additional arrows to change the number by tapping. The step is 2.5kg.

Tapping on an empty "new reps" field fills it with the last reps of the previous set. The field has additional arrows to change the number by tapping.

Data is saved 2 seconds after the last change.

At the top of the screen:
- Exercise name
- Date of the last training
