import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const secretPatterns = [
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['AWS access key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ['GitHub token', /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b/],
  ['Supabase secret key', /\bsb_secret_[A-Za-z0-9_-]{20,}\b/],
  ['JWT', /\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b/],
  [
    'Sentry credential DSN',
    /https:\/\/[A-Fa-f0-9]{16,}@[A-Za-z0-9.-]*sentry\.io\/\d+/,
  ],
];

const isForbiddenEnvironmentFile = (path) => {
  const name = basename(path);
  return name.startsWith('.env') && !name.endsWith('.example');
};

export const findSecretFindings = (files) => {
  const findings = [];

  for (const file of files) {
    if (isForbiddenEnvironmentFile(file.path)) {
      findings.push({ path: file.path, kind: 'tracked environment file' });
      continue;
    }

    for (const [kind, pattern] of secretPatterns) {
      if (pattern.test(file.content)) {
        findings.push({ path: file.path, kind });
      }
    }
  }

  return findings;
};

const main = () => {
  const tracked = execFileSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
    {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    },
  )
    .split('\0')
    .filter((path) => path.length > 0 && existsSync(path));
  const files = tracked.map((path) => ({
    path,
    content: readFileSync(path, 'utf8'),
  }));
  const findings = findSecretFindings(files);

  if (findings.length > 0) {
    console.error('Potential tracked secret material found:');
    for (const finding of findings) {
      console.error(`- ${finding.path}: ${finding.kind}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Secret scan passed for ${tracked.length} repository files.`);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
