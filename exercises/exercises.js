// exercises.js - Centralized exercise data
const exercises = {
  "Chest": {
    "Beginner": [{ name: "Elevated Push-Ups", video: "/resources/inclinepushups.mp4", equipment: ["Chair/Box/Bench"] }],
    "Medium": [{ name: "Push-Ups", video: "/resources/pushupsAngle2.mp4", equipment: ["None"] }, { name: "Decline Push-Ups", video: "/resources/declinepushups.mp4", equipment: ["Chair/Box/Bench"] }],
    "Hard": [],
    "Expert/Advanced": [{ name: "One-Legged Skier Push-Ups", video: "/resources/onelegskierpushups.mp4", equipment: ["None"] }]
  },
  "Legs": {
    "Beginner": [{ name: "Squats", video: "/resources/squats.mp4", equipment: ["None"] }, { name: "3-Way Lunges", video: "/resources/3wayLungesAngle2.mp4", equipment: ["None"] }, { name: "Box Step-Ups", video: "/resources/altstepups.mp4", equipment: ["Chair/Box/Bench"] }],
    "Medium": [{ name: "Alternating Split Squats", video: "/resources/splitSquats.mp4", equipment: ["None"] }, { name: "Frog Hops", video: "/resources/frogHops.mp4", equipment: ["None"] }, { name: "Squat Jumps", video: "/resources/squatJumps.mp4", equipment: ["None"] }],
    "Hard": [{ name: "180° Squat Jumps", video: "/resources/180JumpSquats.mp4", equipment: ["None"] }, { name: "Ninja Tuck Jumps", video: "/resources/ninjaTuckJumps.mp4", equipment: ["None"] }, { name: "Prisoner Squat Jumps", video: "/resources/prisonerSquatJumps.mp4", equipment: ["None"] }, { name: "3-Point Alternating Hops", video: "/resources/3pointAltHops.mp4", equipment: ["None"] }, { name: "Box Jumps", video: "/resources/boxjumps.mp4", equipment: ["Chair/Box/Bench"] }],
    "Expert/Advanced": [{ name: "Prisoner Ninja Tuck Jumps", video: "/resources/prisonerNinjaTuckJumps.mp4", equipment: ["None"] }, { name: "Triple Skyfalls", video: "/resources/3xskyfalls.mp4", equipment: ["None"] }]
  },
  "Legs, No Cardio": {
    "Beginner": [{ name: "Reverse Lunge to High Knee", video: "/resources/reverseLungeHighKneeAngle2.mp4", equipment: ["None"] }],
    "Medium": [{ name: "Bulgarian Split Squats", video: "/resources/bulgsplitsquat.mp4", equipment: ["Chair/Box/Bench"] }],
    "Hard": [],
    "Expert/Advanced": []
  },
  "Shoulders": {
    "Beginner": [],
    "Medium": [{ name: "Pike Push-Ups", video: "/resources/pikePushups.mp4", equipment: ["None"] }],
    "Hard": [{ name: "Kneeling Spider-Man Push-Ups", video: "/resources/kneelingSpidermanPushups.mp4", equipment: ["None"] }],
    "Expert/Advanced": [{ name: "Spider-Man Push-Ups", video: "/resources/spidermanPushups.mp4", equipment: ["None"] }]
  },
  "Triceps": {
    "Beginner": [{ name: "Bench Dips", video: "/resources/benchDipsAngle1.mp4", equipment: ["Chair/Box/Bench"] }],
    "Medium": [], //to be added later: "Diamond Cutter Push-Ups"
    "Hard": [],
    "Expert/Advanced": []
  },
  "Glutes": {
    "Beginner": [{ name: "Bridges", video: "/resources/bridgesAngle2.mp4", equipment: ["None"] }, { name: "Hip Bucks", video: "/resources/hipBucks.mp4", equipment: ["None"] }],
    "Medium": [{ name: "Single Leg Hip Bucks", video: "/resources/singleLegHipBucks.mp4", equipment: ["None"] }],
    "Hard": [],
    "Expert/Advanced": []
  },
  "Core": {
    "Beginner": [{ name: "Bear Taps", video: "/resources/bearTapsAngle2.mp4", equipment: ["None"] }, { name: "Walking Marches", video: "/resources/walkingMarches.mp4", equipment: ["None"] }],
    "Medium": [{ name: "Jackknives - Level 1", video: "/resources/jackknivesLevel1.mp4", equipment: ["None"] }, { name: "Russian V-Twists", video: "/resources/russianVTwistsAngle1.mp4", equipment: ["None"] }, { name: "Spider-Man Lunges", video: "/resources/spidermanLungesAngle2.mp4", equipment: ["None"] }],
    "Hard": [{ name: "Bicycle Crunches", video: "/resources/bicycleCrunchesAngle2.mp4", equipment: ["None"] }, { name: "Jackknives - Level 2", video: "/resources/jackknivesLevel2.mp4", equipment: ["None"] }, { name: "Mountain Climbers", video: "/resources/mountainClimbers.mp4", equipment: ["None"] }, { name: "Plank Elbow to Knee Taps", video: "/resources/plankElbowToKneeTaps.mp4", equipment: ["None"] }, { name: "Side Kickthroughs", video: "/resources/sideKickthroughs.mp4", equipment: ["None"] }],
    "Expert/Advanced": [{ name: "Twisting Piston Push-Ups", video: "/resources/twistingPistonPushUps.mp4", equipment: ["None"] }]
  },
  "Core, No Cardio": {
    "Beginner": [{ name: "Ab-Roller", video: "/resources/abRollerAngle1.mp4", equipment: ["Ab Roller"] }, { name: "Bird Dogs", video: "/resources/birdDogs.mp4", equipment: ["None"] }, { name: "Good Mornings", video: "/resources/goodMorningsAngle2.mp4", equipment: ["None"] }, { name: "Swipers", video: "/resources/swipersAngle2.mp4", equipment: ["None"] }],
    "Medium": [{ name: "Plank Elbow Ups", video: "/resources/plankElbowUps.mp4", equipment: ["None"] }, { name: "Shoulder Taps", video: "/resources/shoulderTapsAngle1.mp4", equipment: ["None"] }],
    "Hard": [],
    "Expert/Advanced": []
  },
  "Cardio": {
    "Beginner": [{ name: "Jump/Air Rope", video: "/resources/jumprope.mp4", equipment: ["None"] }, { name: "Shadow Boxing", video: "/resources/shadowboxing.mp4", equipment: ["None"] }, { name: "Toe Taps", video: "/resources/toeTaps.mp4", equipment: ["None"] }],
    "Medium": [{ name: "High Knees", video: "/resources/highknees.mp4", equipment: ["None"] }, { name: "Jumping Jacks", video: "/resources/jumpingjacks.mp4", equipment: ["None"] }, { name: "Skier Hops", video: "/resources/skierhops.mp4", equipment: ["None"] }],
    "Hard": [],
    "Expert/Advanced": []
  },
  "Morning Stretches": {
    "Beginner": [
      { name: "Cat-Cow Stretch", video: "/resources/cat-cow.mp4", equipment: ["None"] },
      { name: "World's Greatest Stretch", video: null, equipment: ["None"] },
      { name: "Thread the Needle", video: "/resources/ThreadTheNeedle.mp4", equipment: ["None"] },
      { name: "Seated Forward Fold", video: "/resources/seatedForwardFold.mp4", equipment: ["None"] },
      { name: "Hip Flexor Lunge Stretch", video: "hipFlexorLungeStretch.mp4", equipment: ["None"] },
      { name: "Thoracic Spine Extension", video: "/resources/thoracicSpineExtension.mp4", equipment: ["None"] },
      { name: "Neck Side Stretch", video: "/resources/neckSideStretch.mp4", equipment: ["None"] },
      { name: "Cross-Body Shoulder Stretch", video: "/resources/crossBodyShoulderStretch.mp4", equipment: ["None"] }
    ],
    "Medium": [],
    "Hard": [],
    "Expert/Advanced": []
  },
  "Evening Recovery": {
    "Beginner": [
      { name: "Supine Spinal Twist", video: null, equipment: ["None"] },
      { name: "Happy Baby", video: null, equipment: ["None"] },
      { name: "Figure-4 Hip Stretch", video: null, equipment: ["None"] },
      { name: "Lying Quad Stretch", video: null, equipment: ["None"] },
      { name: "Butterfly Stretch", video: null, equipment: ["None"] },
      { name: "Child's Pose", video: null, equipment: ["None"] },
      { name: "Neck Rolls", video: null, equipment: ["None"] },
      { name: "Standing Side Bend", video: null, equipment: ["None"] }
    ],
    "Medium": [],
    "Hard": [],
    "Expert/Advanced": []
  },
  "Cool Down": {
    "Beginner": [
      { name: "Standing Quad Stretch", video: null, equipment: ["None"] },
      { name: "Standing Hamstring Stretch", video: null, equipment: ["None"] },
      { name: "Standing Calf Stretch", video: null, equipment: ["None"] },
      { name: "Hip Flexor Stretch", video: null, equipment: ["None"] },
      { name: "Doorway Chest Opener", video: null, equipment: ["None"] },
      { name: "Overhead Tricep Stretch", video: null, equipment: ["None"] },
      { name: "Wrist Flexor Stretch", video: null, equipment: ["None"] },
      { name: "Deep Belly Breathing", video: null, equipment: ["None"] }
    ],
    "Medium": [],
    "Hard": [],
    "Expert/Advanced": []
  },
  "Warm-Up: Hips": {
    "Beginner": [
      { name: "Hip Circles", video: null, equipment: ["None"] },
      { name: "Fire Hydrants", video: null, equipment: ["None"] },
      { name: "Lateral Lunge Stretch", video: null, equipment: ["None"] },
      { name: "Hip 90/90 Rotations", video: null, equipment: ["None"] },
      { name: "Pigeon Pose Prep", video: null, equipment: ["None"] },
      { name: "Deep Squat Hold", video: null, equipment: ["None"] },
      { name: "Clamshells", video: null, equipment: ["None"] },
      { name: "Standing Hip Swings", video: null, equipment: ["None"] }
    ],
    "Medium": [],
    "Hard": [],
    "Expert/Advanced": []
  },
  "Warm-Up: Full Body": {
    "Beginner": [
      { name: "Arm Circles", video: null, equipment: ["None"] },
      { name: "Leg Swings", video: null, equipment: ["None"] },
      { name: "Trunk Rotations", video: null, equipment: ["None"] },
      { name: "Inchworm Walk-Outs", video: null, equipment: ["None"] },
      { name: "Slow High Knees", video: null, equipment: ["None"] },
      { name: "Ankle Circles", video: null, equipment: ["None"] },
      { name: "Wrist Circles", video: null, equipment: ["None"] },
      { name: "Neck Rotations", video: null, equipment: ["None"] }
    ],
    "Medium": [],
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
