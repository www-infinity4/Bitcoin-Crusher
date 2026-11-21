const fs = require('fs');
const assert = require('assert');

// Load the specification markdown
const specPath = 'docs/CARD_SYSTEM_SPEC.md';
const specContent = fs.readFileSync(specPath, 'utf8');

// Helper to check for a heading
function hasHeading(heading) {
  const regex = new RegExp(`^##\\s+${heading}\\b`, 'm');
  return regex.test(specContent);
}

// Verify that all required card sections exist
const requiredHeadings = [
  'Ticker Card',
  'Ledger Lore Card',
  'Artifact Appraisal Card',
  'Gravity Well Card',
];

for (const heading of requiredHeadings) {
  assert.ok(
    hasHeading(heading),
    `Specification must contain heading "## ${heading}"`
  );
}

// Extract JSON schema snippets (```json ... ``` blocks)
const jsonBlocks = [];
const jsonRegex = /```json\n([\s\S]*?)\n```/g;
let match;
while ((match = jsonRegex.exec(specContent)) !== null) {
  jsonBlocks.push(match[1]);
}

assert.ok(
  jsonBlocks.length >= requiredHeadings.length,
  'Specification must contain a JSON schema snippet for each card type'
);

// Validate each JSON snippet contains required keys
for (const block of jsonBlocks) {
  let parsed;
  try {
    parsed = JSON.parse(block);
  } catch (e) {
    assert.fail(`Invalid JSON schema snippet: ${e.message}`);
  }
  const requiredKeys = ['component', 'dataSource', 'defaultBehavior'];
  for (const key of requiredKeys) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(parsed, key),
      `Schema must contain key "${key}"`
    );
  }
}

console.log('All specification checks passed.');
