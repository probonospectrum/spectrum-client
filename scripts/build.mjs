import { spawnSync } from 'node:child_process';

const branchName = process.env.VERCEL_GIT_COMMIT_REF;
const configuration = branchName === 'stg' ? 'stg' : 'production';

const apiUrl =
  configuration === 'stg'
    ? 'spectrum-server-2qne.onrender.com'
    : 'spectrum-server-2qne.onrender.com';

const command = process.execPath;

const args = [
  'node_modules/@angular/cli/bin/ng.js',
  'build',
  `--configuration=${configuration}`,
  `--define=API_URL=${JSON.stringify(apiUrl.replace(/\/+$/, ''))}`,
];

console.log(`Branch: ${branchName}`);
console.log(`Configuration: ${configuration}`);
console.log(`API_URL: ${apiUrl}`);

const result = spawnSync(command, args, {
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error.message);
}

process.exit(result.status ?? 1);