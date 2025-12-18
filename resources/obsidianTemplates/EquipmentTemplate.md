---
type: equipment
equipment-name: Linked Equipment Name
---
# Linked Equipment Name Goes Here

## Exercises Using This Equipment
```dataview
TABLE WITHOUT ID
  file.link as "Exercise",
  focus as "Focus",
  weight as "Weight"
FROM "Fitness Things/Exercises"
WHERE contains(equipment, this.file.link)
SORT weight ASC
```
