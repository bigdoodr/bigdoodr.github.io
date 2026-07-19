#!/usr/bin/env node
/**
 * generate-exercises-js.js
 *
 * Regenerates exercises/exercises.js from exercises.json.
 *
 * exercises.json is the single source of truth (also consumed by the
 * companion iOS app). exercises.js is a derived, browser-friendly build
 * artifact consumed by exercises/Zone2Exercises.html. Never hand-edit
 * exercises.js directly — edit exercises.json and re-run this script.
 *
 * Usage:
 *   node scripts/generate-exercises-js.js
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const jsonPath = path.join(repoRoot, 'exercises.json');
const jsPath = path.join(repoRoot, 'exercises', 'exercises.js');

function esc(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function formatExercise(e) {
  const parts = [`name: "${esc(e.name)}"`, `video: "${e.videoPath}"`];
  const equipment = e.equipment || ['None'];
  parts.push(`equipment: [${equipment.map((x) => `"${esc(x)}"`).join(', ')}]`);
  if (e.singleSided) {
    parts.push('singleSided: true');
  }
  return `{ ${parts.join(', ')} }`;
}

function generate() {
  const raw = fs.readFileSync(jsonPath, 'utf8');
  const data = JSON.parse(raw);
  const focusAreas = data.focusAreas;
  const difficulties = data.difficulties;
  const ex = data.exercises;

  const lines = [];
  lines.push('// exercises.js - Centralized exercise data');
  lines.push('// AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY.');
  lines.push('// Source of truth is exercises.json (repo root).');
  lines.push('// Regenerate with: node scripts/generate-exercises-js.js');
  lines.push('const exercises = {');

  focusAreas.forEach((area, i) => {
    const areaData = ex[area] || {};
    lines.push(`  "${esc(area)}": {`);
    difficulties.forEach((diff, j) => {
      const items = areaData[diff] || [];
      const itemsStr = items.map(formatExercise).join(', ');
      const comma = j < difficulties.length - 1 ? ',' : '';
      lines.push(`    "${diff}": [${itemsStr}]${comma}`);
    });
    lines.push(i < focusAreas.length - 1 ? '  },' : '  }');
  });

  lines.push('};');
  lines.push('');
  lines.push('// Export the exercises object so it can be imported by other files');
  lines.push('// This works for both ES6 modules and older script tag imports');
  lines.push("if (typeof module !== 'undefined' && module.exports) {");
  lines.push('  module.exports = exercises;');
  lines.push('} else {');
  lines.push('  window.exercises = exercises;');
  lines.push('}');
  lines.push('');

  fs.writeFileSync(jsPath, lines.join('\n'));
  console.log(`Wrote ${jsPath}`);
}

generate();
