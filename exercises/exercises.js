// exercises.js - Centralized exercise data
const exercises = {
  "Chest": {
    "Beginner": [],
    "Medium": [{ name: "Push-Ups", video: "/resources/pushupsAngle2.mp4" }],
    "Hard": [],
    "Expert/Advanced": [{ name: "One-Legged Skier Push-Ups", video: "/resources/onelegskierpushups.mp4" }]
  },
  "Legs": {
    "Beginner": [{ name: "Squats", video: "/resources/squats.mp4" }, { name: "3-Way Lunges", video: "/resources/3wayLungesAngle2.mp4" }],
    "Medium": [{ name: "Alternating Split Squats", video: "/resources/splitSquats.mp4" }, { name: "Frog Hops", video: "/resources/frogHops.mp4" }, { name: "Squat Jumps", video: "/resources/squatJumps.mp4" }],
    "Hard": [{ name: "180° Squat Jumps", video: "/resources/180JumpSquats.mp4" }, { name: "Ninja Tuck Jumps", video: "/resources/ninjaTuckJumps.mp4" }, { name: "Prisoner Squat Jumps", video: "/resources/prisonerSquatJumps.mp4" }, { name: "3-Point Alternating Hops", video: "/resources/3pointAltHops.mp4" }],
    "Expert/Advanced": [{ name: "Prisoner Ninja Tuck Jumps", video: "/resources/prisonerNinjaTuckJumps.mp4" }, { name: "Triple Skyfalls", video: "/resources/3xskyfalls.mp4" }]
  },
  "Legs, No Cardio": {
    "Beginner": [{ name: "Reverse Lunge to High Knee", video: "/resources/reverseLungeHighKneeAngle2.mp4" }],
    "Medium": [],
    "Hard": [],
    "Expert/Advanced": []
  },
  "Shoulders": {
    "Beginner": [],
    "Medium": [{ name: "Pike Push-Ups", video: "/resources/pikePushups.mp4" }],
    "Hard": [{ name: "Kneeling Spider-Man Push-Ups", video: "/resources/kneelingSpidermanPushups.mp4" }],
    "Expert/Advanced": [{ name: "Spider-Man Push-Ups", video: "/resources/spidermanPushups.mp4" }]
  },
  "Triceps": {
    "Beginner": [{ name: "Bench Dips", video: "/resources/benchDipsAngle1.mp4" }],
    "Medium": [], //to be added later: "Diamond Cutter Push-Ups"
    "Hard": [],
    "Expert/Advanced": []
  },
  "Glutes": {
    "Beginner": [{ name: "Bridges", video: "/resources/bridgesAngle2.mp4" }, { name: "Hip Bucks", video: "/resources/hipBucks.mp4" }],
    "Medium": [{ name: "Single Leg Hip Bucks", video: "/resources/singleLegHipBucks.mp4" }],
    "Hard": [],
    "Expert/Advanced": []
  },
  "Core": {
    "Beginner": [{ name: "Bear Taps", video: "/resources/bearTapsAngle2.mp4" }, { name: "Walking Marches", video: "/resources/walkingMarches.mp4" }],
    "Medium": [{ name: "Jackknives - Level 1", video: "/resources/jackknivesLevel1.mp4" }, { name: "Russian V-Twists", video: "/resources/russianVTwistsAngle1.mp4" }, { name: "Spider-Man Lunges", video: "/resources/spidermanLungesAngle2.mp4" }],
    "Hard": [{ name: "Bicycle Crunches", video: "/resources/bicycleCrunchesAngle2.mp4" }, { name: "Jackknives - Level 2", video: "/resources/jackknivesLevel2.mp4" }, { name: "Mountain Climbers", video: "/resources/mountainClimbers.mp4" }, { name: "Plank Elbow to Knee Taps", video: "/resources/plankElbowToKneeTaps.mp4" }, { name: "Side Kickthroughs", video: "/resources/sideKickthroughs.mp4" }],
    "Expert/Advanced": [{ name: "Twisting Piston Push-Ups", video: "/resources/twistingPistonPushUps.mp4"}]
  },
  "Core, No Cardio": {
    "Beginner": [{ name: "Ab-Roller", video: "/resources/abRollerAngle1.mp4" }, { name: "Bird Dogs", video: "/resources/birdDogs.mp4" }, { name: "Good Mornings", video: "/resources/goodMorningsAngle2.mp4" }, { name: "Swipers", video: "/resources/swipersAngle2.mp4" }],
    "Medium": [{ name: "Plank Elbow Ups", video: "/resources/plankElbowUps.mp4" }, { name: "Shoulder Taps", video: "/resources/shoulderTapsAngle1.mp4" }],
    "Hard": [],
    "Expert/Advanced": []
  },
  "Cardio": {
    "Beginner": [{ name: "Jump/Air Rope", video: "/resources/jumprope.mp4" }, { name: "Shadow Boxing", video: "/resources/shadowboxing.mp4" }, { name: "Toe Taps", video: "/resources/toeTaps.mp4" }],
    "Medium": [{ name: "High Knees", video: "/resources/highknees.mp4" }, { name: "Jumping Jacks", video: "/resources/jumpingjacks.mp4" }, { name: "Skier Hops", video: "/resources/skierhops.mp4" }],
    "Hard": [],
    "Expert/Advanced": []
  }
};

// Export the exercises object so it can be imported by other files
// This works for both ES6 modules and older script tag imports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = exercises;
} else {
  window.exercises = exercises;
}