---
type: exercise
exercise:
focus:
equipment:
tags:
---
# Exercise Name Goes Here

## Form Cues
- 
## Variations
### Variation 1
- Description
### Variation 2
- Description
---

## Performance History
```dataview
TABLE WITHOUT ID
  date as "Date",
  workout as "Workout",
  routine as "Routine"
FROM "Fitness Things/Daily Logs"
WHERE contains(file.outlinks, this.file.link)
SORT date DESC
```