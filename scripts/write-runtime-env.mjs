import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');

loadEnv({ path: path.join(rootDir, '.env.local') });
loadEnv({ path: path.join(rootDir, '.env') });

const runtimeEnvPath = path.join(rootDir, 'apps', 'angular-app', 'public', 'env.js');
const apiUrl = process.env.API_URL || 'http://localhost:3100';

const runtimeEnv = `window.__env = Object.assign({}, window.__env, {
  API_URL: ${JSON.stringify(apiUrl)}
});
`;

fs.writeFileSync(runtimeEnvPath, runtimeEnv, 'utf8');
console.log(`Wrote runtime env to ${runtimeEnvPath}`);
