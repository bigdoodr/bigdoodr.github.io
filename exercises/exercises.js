// exercises.js - Centralized exercise data
// AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY.
// Source of truth is exercises.json (repo root).
// Regenerate with: node scripts/generate-exercises-js.js
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
    "Medium": [],
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
    "Hard": [{ name: "Bicycle Crunches", video: "/resources/bicycleCrunchesAngle2.mp4", equipment: ["None"] }, { name: "Jackknives - Level 2", video: "/resources/jackknivesLevel2.mp4", equipment: ["None"] }, { name: "Mountain Climbers", video: "/resources/mountainClimbers.mp4", equipment: ["None"] }, { name: "Plank Elbow to Knee Taps", video: "/resources/plankElbowToKneeTaps.mp4", equipment: ["None"] }, { name: "Side Kickthroughs", video: "/resources/sideKickthroughs.mp4", equipment: ["None"] }, { name: "V-Sit Cross Punches", video: "/resources/vSitCrossPunches.mp4", equipment: ["None"] }],
    "Expert/Advanced": [{ name: "Twisting Piston Push-Ups", video: "/resources/twistingPistonPushUps.mp4", equipment: ["None"] }]
  },
  "Core, No Cardio": {
    "Beginner": [{ name: "Ab-Roller", video: "/resources/abRollerAngle1.mp4", equipment: ["Ab Roller"] }, { name: "Bird Dogs", video: "/resources/birdDogs.mp4", equipment: ["None"] }, { name: "Good Mornings", video: "/resources/goodMorningsAngle2.mp4", equipment: ["None"] }, { name: "Swipers", video: "/resources/swipersAngle2.mp4", equipment: ["None"] }],
    "Medium": [{ name: "Plank Elbow Ups", video: "/resources/plankElbowUps.mp4", equipment: ["None"] }, { name: "Shoulder Taps", video: "/resources/shoulderTapsAngle1.mp4", equipment: ["None"] }],
    "Hard": [{ name: "Crescent Tucks", video: "/resources/CrescentTucks.mp4", equipment: ["None"] }, { name: "Backward 7s", video: "/resources/Backward7s.mp4", equipment: ["None"] }, { name: "Side Cycles", video: "/resources/SideCyclesRight.mp4", equipment: ["None"], singleSided: true }, { name: "Mountain Hip Dips", video: "/resources/MountainHipDips.mp4", equipment: ["None"] }, { name: "Frog V-Ups", video: "/resources/FrogVUps.mp4", equipment: ["None"] }, { name: "Side Scissor Crunches", video: "/resources/ScissorCrunchLeft.mp4", equipment: ["None"], singleSided: true }, { name: "Corpse Crunch", video: "/resources/CorpseCrunch.mp4", equipment: ["None"] }],
    "Expert/Advanced": []
  },
  "Cardio": {
    "Beginner": [{ name: "Jump/Air Rope", video: "/resources/jumprope.mp4", equipment: ["None"] }, { name: "Shadow Boxing", video: "/resources/shadowboxing.mp4", equipment: ["None"] }, { name: "Toe Taps", video: "/resources/toeTaps.mp4", equipment: ["None"] }],
    "Medium": [{ name: "High Knees", video: "/resources/highknees.mp4", equipment: ["None"] }, { name: "Jumping Jacks", video: "/resources/jumpingjacks.mp4", equipment: ["None"] }, { name: "Skier Hops", video: "/resources/skierhops.mp4", equipment: ["None"] }],
    "Hard": [],
    "Expert/Advanced": []
  },
  "Morning Stretches": {
    "Beginner": [{ name: "Cat-Cow Stretch", video: "/resources/cat-cow.mp4", equipment: ["None"] }, { name: "World's Greatest Stretch", video: "/resources/spidermanLungesAngle2.mp4", equipment: ["None"] }, { name: "Thread the Needle", video: "/resources/ThreadTheNeedle.mp4", equipment: ["None"], singleSided: true }, { name: "Seated Forward Fold", video: "/resources/seatedForwardFold.mp4", equipment: ["None"] }, { name: "Hip Flexor Lunge Stretch", video: "/resources/hipFlexorLungeStretch.mp4", equipment: ["None"], singleSided: true }, { name: "Thoracic Spine Extension", video: "/resources/thoracicSpineExtension.mp4", equipment: ["None"] }, { name: "Neck Side Stretch", video: "/resources/neckSideStretch.mp4", equipment: ["None"], singleSided: true }, { name: "Cross-Body Shoulder Stretch", video: "/resources/crossBodyShoulderStretch.mp4", equipment: ["None"], singleSided: true }, { name: "Squat Fold", video: "/resources/SquatFold.mp4", equipment: ["None"] }, { name: "Side Bridge & Reach", video: "/resources/SideBridgeAndReach.mp4", equipment: ["None"], singleSided: true }, { name: "QL Pull Through", video: "/resources/QLPullThrough.mp4", equipment: ["None"], singleSided: true }, { name: "Hip Switch & Lean", video: "/resources/HipSwitchAndLean.mp4", equipment: ["None"], singleSided: true }, { name: "London Bridge", video: "/resources/LondonBridges.mp4", equipment: ["None"], singleSided: true }, { name: "Bridge and Reach Over", video: "/resources/BridgeAndReachOver.mp4", equipment: ["None"], singleSided: true }, { name: "QL Slide", video: "/resources/QLSlide.mp4", equipment: ["None"], singleSided: true }, { name: "Squat and Reach", video: "/resources/SquatAndReach.mp4", equipment: ["None"] }, { name: "Kneeling Lunge and Torso Twist", video: "/resources/KneelingLungeAndTorsoTwist.mp4", equipment: ["None"], singleSided: true }, { name: "Hip Hinge and Torso Bend", video: "/resources/HipHingeAndTorsoBend.mp4", equipment: ["None"] }],
    "Medium": [],
    "Hard": [],
    "Expert/Advanced": []
  },
  "Evening Recovery": {
    "Beginner": [{ name: "Supine Spinal Twist", video: "/resources/SupineSpinalTwist.mp4", equipment: ["None"], singleSided: true }, { name: "Happy Baby", video: "/resources/HappyBaby.mp4", equipment: ["None"] }, { name: "Figure-4 Hip Stretch", video: "/resources/Figure4.mp4", equipment: ["None"], singleSided: true }, { name: "Lying Quad Stretch", video: "/resources/LyingQuadStretch.mp4", equipment: ["None"], singleSided: true }, { name: "Butterfly Stretch", video: "/resources/Butterfly.mp4", equipment: ["None"] }, { name: "Child's Pose", video: "/resources/ChildsPose.mp4", equipment: ["None"] }, { name: "Neck Rolls", video: "/resources/NeckRolls.mp4", equipment: ["None"] }, { name: "Standing Side Bend", video: "/resources/SideBends.mp4", equipment: ["None"], singleSided: true }, { name: "Calf & Hamstring Wall Stretch", video: "/resources/StandingCalfStretch.mp4", equipment: ["None"], singleSided: true }, { name: "Raised Forearms Child's Pose", video: "/resources/RaisedForearmsChildsPose.mp4", equipment: ["None"] }, { name: "Modified Pigeon Pose", video: "/resources/ModifiedPigeonPose.mp4", equipment: ["None"], singleSided: true }],
    "Medium": [],
    "Hard": [],
    "Expert/Advanced": []
  },
  "Cool Down": {
    "Beginner": [{ name: "Standing Quad Stretch", video: "/resources/StandingQuadStretch.mp4", equipment: ["None"], singleSided: true }, { name: "Standing Hamstring Stretch", video: "/resources/StandingHamstringStretch.mp4", equipment: ["None"], singleSided: true }, { name: "Standing Calf Stretch", video: "/resources/StandingCalfStretch.mp4", equipment: ["None"], singleSided: true }, { name: "Hip Flexor Stretch", video: "/resources/hipFlexorLungeStretch.mp4", equipment: ["None"], singleSided: true }, { name: "Doorway Chest Opener", video: "/resources/DoorwayCactus.mp4", equipment: ["None"] }, { name: "Overhead Tricep Stretch", video: "/resources/OverheadTricepStretch.mp4", equipment: ["None"], singleSided: true }, { name: "Wrist Flexor Stretch", video: "/resources/WristFlexor.mp4", equipment: ["None"], singleSided: true }, { name: "Deep Belly Breathing", video: "/resources/DeepBellyBreathing.mp4", equipment: ["None"] }, { name: "Forward Fold", video: "/resources/ForwardFold.mp4", equipment: ["None"] }],
    "Medium": [],
    "Hard": [],
    "Expert/Advanced": []
  },
  "Warm-Up: Hips": {
    "Beginner": [{ name: "Hip Circles", video: "/resources/HipCirclesAngle1.mp4", equipment: ["None"] }, { name: "Fire Hydrants", video: "/resources/FireHydrant.mp4", equipment: ["None"], singleSided: true }, { name: "Lateral Lunge Stretch", video: "/resources/LateralLunges.mp4", equipment: ["None"], singleSided: true }, { name: "Hip 90/90 Rotations", video: "/resources/Hip9090Rotations.mp4", equipment: ["None"], singleSided: true }, { name: "Pigeon Pose", video: "/resources/PigeonPose.mp4", equipment: ["None"], singleSided: true }, { name: "Deep Squat Hold", video: "/resources/DeepSquatHold.mp4", equipment: ["None"] }, { name: "Clamshells", video: "/resources/Clamshells.mp4", equipment: ["None"], singleSided: true }, { name: "Standing Hip Swings", video: "/resources/StandingHipSwings.mp4", equipment: ["None"], singleSided: true }],
    "Medium": [],
    "Hard": [],
    "Expert/Advanced": []
  },
  "Warm-Up: Full Body": {
    "Beginner": [{ name: "Arm Circles", video: "/resources/ArmCircles.mp4", equipment: ["None"] }, { name: "Leg Swings", video: "/resources/LegSwings.mp4", equipment: ["None"], singleSided: true }, { name: "Trunk Rotations", video: "/resources/TrunkRotations.mp4", equipment: ["None"] }, { name: "Inchworm Walk-Outs", video: "/resources/Inchworms.mp4", equipment: ["None"] }, { name: "Slow High Knees", video: "/resources/SlowHighKnees.mp4", equipment: ["None"] }, { name: "Ankle Circles", video: "/resources/AnkleCircles.mp4", equipment: ["None"], singleSided: true }, { name: "Wrist Circles", video: "/resources/WristCircles.mp4", equipment: ["None"], singleSided: true }, { name: "Neck Rotations", video: "/resources/NeckRotations.mp4", equipment: ["None"] }],
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
