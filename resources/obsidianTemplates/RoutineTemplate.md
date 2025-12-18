---
type: routine
routine: linked routine name
focus:
  - linked focus area(s)
body-type: Lower Body, Upper Body, Full Body, etc
estimated-duration: 60
tags:
---
# Linked Routine Name

## Focus Areas
- Linked Focus Area

## Exercises
1. Linked Exercise
## Duration
- Approximately 45-60 minutes

## Notes
- Details/thoughts about overall grouping of exercises in routine.

---

## Performance History
```dataview
TABLE WITHOUT ID
  date as "Date",
  workout as "Workout Day",
  routine-duration as "Duration (min)"
FROM "Fitness Things/Daily Logs"
WHERE routine = this.file.link
SORT date DESC
LIMIT 10
```