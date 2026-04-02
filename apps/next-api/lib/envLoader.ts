import fs from 'fs';
import path from 'path';

/**
 * Loads the root local.properties file and populates process.env.
 * This allows a single master configuration file for the entire monorepo.
 */
export function loadMasterConfig() {
  try {
    // Navigate up from apps/next-api/lib to the project root
    const rootPath = path.resolve(process.cwd(), '../../local.properties');
    if (!fs.existsSync(rootPath)) {
      console.warn(`[Config] Master config not found at ${rootPath}`);
      return;
    }

    const content = fs.readFileSync(rootPath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').trim();
      
      if (key && value) {
        // Only set if not already set by system environment (Vercel)
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = value;
        }
      }
    });

    console.log(`[Config] Master configuration loaded from local.properties`);
  } catch (err) {
    console.error('[Config] Failed to load master configuration', err);
  }
}

// Auto-execute on import
loadMasterConfig();
