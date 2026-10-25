import { publishParameterReference } from './publish-parameter-reference.mjs';

await import('./generate-icon-catalog.mjs');
await import('./generate-custom-example.mjs');
await import('./generate-parameter-reference.mjs');
await publishParameterReference(new URL('../docs/', import.meta.url), new URL('../public/docs/', import.meta.url));
