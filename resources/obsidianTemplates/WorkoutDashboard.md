# Recent Workouts
```dataview
TABLE WITHOUT ID
  date as "Date",
  workout as "Day",
  routine as "Routine",
  duration as "Duration (min)"
FROM "Fitness Things/Daily Logs"
SORT date DESC
LIMIT 10
```

---

## This Week's Workouts
```dataview
TABLE WITHOUT ID
  date as "Date",
  workout as "Day",
  routine as "Routine"
FROM "Fitness Things/Daily Logs"
WHERE date >= date(today) - dur(7 days)
SORT date DESC
```

---

## Workout Frequency by Routine
```dataviewjs
const workouts = dv.pages('"Fitness Things/Daily Logs"');
const routineCount = {};

for (let w of workouts) {
    if (w.routine) {
        const routineName = w.routine.path || w.routine;
        routineCount[routineName] = (routineCount[routineName] || 0) + 1;
    }
}

dv.table(["Routine", "Times Performed"], 
    Object.entries(routineCount)
        .sort((a, b) => b[1] - a[1])
        .map(([routine, count]) => [routine, count])
);
```

---

## Most Frequently Used Exercises
```dataviewjs
const exercises = {};
const dailyLogs = dv.pages('"Fitness Things/Daily Logs"');

for (let log of dailyLogs) {
    for (let link of log.file.outlinks) {
        // Only count links to exercise files
        const linkedPage = dv.page(link);
        if (linkedPage && linkedPage.type === "exercise") {
            const exName = link.path;
            exercises[exName] = (exercises[exName] || 0) + 1;
        }
    }
}

dv.table(["Exercise", "Times Performed"], 
    Object.entries(exercises)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([ex, count]) => [ex, count])
);
```

---

## Total Workouts
```dataview
LIST length(rows)
FROM "Fitness Things/Daily Logs"
```