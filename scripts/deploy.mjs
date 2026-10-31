import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Load .env.local if present
const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^([^=#\s]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim();
    }
  }
}

const TOKEN = process.env.VERCEL_TOKEN;
const TEAM_ID = process.env.VERCEL_TEAM_ID || 'team_frfEikpsmDlbqFw5rZyyrHkK';
const PROJECT_NAME = process.env.VERCEL_PROJECT_NAME || 'rafiqat-el-arousa';

if (!TOKEN) {
  console.error('Missing VERCEL_TOKEN in .env.local');
  process.exit(1);
}

const IGNORE_DIRS = new Set(['node_modules', 'dist', '.git', '.vercel']);
const IGNORE_FILES = new Set(['.env', '.env.local', '.DS_Store']);

function collectFiles(dir, baseDir = dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name) || IGNORE_FILES.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      results = results.concat(collectFiles(fullPath, baseDir));
    } else if (entry.isFile()) {
      const content = fs.readFileSync(fullPath);
      results.push({
        file: relPath,
        data: content.toString('base64'),
        encoding: 'base64',
      });
    }
  }
  return results;
}

async function main() {
  // 1. Sync with GitHub if there are changes
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
    if (status) {
      console.log('📦 Pushing latest updates to GitHub...');
      execSync('git add .', { stdio: 'inherit' });
      const msg = process.argv[2] || `Update deployment ${new Date().toISOString()}`;
      execSync(`git commit -m "${msg.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
    }
    execSync('git push origin main', { stdio: 'inherit' });
    console.log('✅ GitHub is up to date!');
  } catch (err) {
    console.warn('⚠️ Git push note:', err.message);
  }

  // 2. Deploy to Vercel Production
  console.log('🚀 Uploading files and deploying to Vercel Production...');
  const files = collectFiles(process.cwd());

  const res = await fetch(
    `https://api.vercel.com/v13/deployments?teamId=${encodeURIComponent(TEAM_ID)}&forceNew=1&skipAutoDetectionConfirmation=1`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: PROJECT_NAME,
        project: PROJECT_NAME,
        target: 'production',
        files,
        projectSettings: {
          framework: 'vite',
          buildCommand: 'npm run build',
          outputDirectory: 'dist',
          installCommand: 'npm install',
        },
      }),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    console.error('❌ Deployment failed:', JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log(`⏳ Deployment created: ${data.id} (status: ${data.readyState})`);

  // Poll until READY or ERROR
  let state = data.readyState;
  let finalData = data;
  while (state === 'QUEUED' || state === 'BUILDING' || state === 'INITIALIZING') {
    await new Promise((r) => setTimeout(r, 3000));
    const checkRes = await fetch(
      `https://api.vercel.com/v13/deployments/${data.id}?teamId=${encodeURIComponent(TEAM_ID)}`,
      {
        headers: { Authorization: `Bearer ${TOKEN}` },
      }
    );
    finalData = await checkRes.json();
    state = finalData.readyState;
    console.log(`   Status: ${state}...`);
  }

  if (state === 'READY') {
    const aliases = finalData.alias || [];
    const mainUrl = aliases.length > 0 ? `https://${aliases[0]}` : `https://${finalData.url}`;
    console.log(`🎉 Deployed successfully!`);
    console.log(`🔗 Production URL: ${mainUrl}`);
    console.log(`🔗 Deployment URL: https://${finalData.url}`);
  } else {
    console.error(`❌ Build ended with state: ${state}`);
    process.exit(1);
  }
}

main();
