---
type: focus-area
muscle-group:
region:
---
# Linked Focus Area Name Goes Here

## Description
- 

## Functions
- 

## Exercises Targeting This Area
```dataview
TABLE WITHOUT ID
  file.link as "Exercise",
  equipment as "Equipment"
FROM "Fitness Things/Exercises"
WHERE contains(focus, this.file.link)
SORT file.name ASC
```

## Recent Workouts
```dataview
TABLE WITHOUT ID
  date as "Date",
  workout as "Workout",
  routine as "Routine"
FROM "Fitness Things/Daily Logs"
WHERE contains(string(routine.focus), this.file.name)
SORT date DESC
LIMIT 5
```

## Notes
[Any training notes, injury considerations, etc.]