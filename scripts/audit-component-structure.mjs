import { writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { structureCoverage } from './lib/component-structure-contract.mjs';

const coverage = structureCoverage();
coverage.sourceHashes = Object.fromEntries([
  'src/builder/componentCatalog.js', 'src/builder/componentDocument.js', 'src/builder/componentOperations.js',
  'src/builder/ComponentPreview.jsx', 'src/builder/screenLayout.js', 'src/builder/navigationRows.js', 'src/builder/buttonModals.js',
  'src/builder/ComponentEditor.jsx', 'src/builder/componentEditor.css',
].map((path) => [path, createHash('sha256').update(readFileSync(new URL(`../${path}`, import.meta.url))).digest('hex')]));
writeFileSync(new URL('../docs/component-structure-coverage.json', import.meta.url), `${JSON.stringify(coverage, null, 2)}\n`);
const failures = coverage.templates.filter((template) => template.issues.length);
console.log(JSON.stringify({ referenceComponents: coverage.reference.length, nativeTypes: coverage.nativeTypes.length, templates: coverage.templates.length, nodes: coverage.templates.reduce((total, template) => total + template.nodes, 0), internalFailures: failures, referenceAlignment: coverage.referenceAlignment, sourceTypeGaps: coverage.observedSourceComparison.filter((source) => source.missingTypes.length).map(({id, missingTypes}) => ({id, missingTypes})) }, null, 2));
if (coverage.reference.some((entry) => !entry.available) || failures.length) process.exitCode = 1;
