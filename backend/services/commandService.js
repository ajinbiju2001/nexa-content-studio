const { spawn } = require('child_process');
const { execSync } = require('child_process');

// Common FFmpeg paths on Railway/Nixpacks
const FFMPEG_PATHS = [
  'ffmpeg',
  '/usr/bin/ffmpeg',
  '/usr/local/bin/ffmpeg',
  '/nix/var/nix/profiles/default/bin/ffmpeg',
  '/root/.nix-profile/bin/ffmpeg',
  '/run/current-system/sw/bin/ffmpeg',
  '/usr/local/nixpkgs/bin/ffmpeg',
];

function findFFmpeg() {
  try {
    const path = execSync('which ffmpeg').toString().trim();
    if (path) {
      console.log(`[nexa] FFmpeg found at: ${path}`);
      return path;
    }
  } catch {
    try {
      const path = execSync('find /nix -name ffmpeg -type f 2>/dev/null | head -1').toString().trim();
      if (path) {
        console.log(`[nexa] FFmpeg found at: ${path}`);
        return path;
      }
    } catch {
      console.warn('[nexa] FFmpeg not found via search');
      return null;
    }
  }
  return null;
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd || process.cwd(),
      env: { ...process.env, ...(options.env || {}) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', chunk => { stdout += chunk.toString(); });
    child.stderr.on('data', chunk => { stderr += chunk.toString(); });
    child.on('error', reject);
    child.on('close', code => {
      // FFmpeg returns non-zero sometimes even on success
      // Check if output file was created instead
      if (code === 0 || code === null) {
        return resolve({ stdout, stderr });
      }
      // For ffmpeg, if stderr contains "muxing overhead" it succeeded
      if (stderr.includes('muxing overhead') || stderr.includes('video:')) {
        return resolve({ stdout, stderr });
      }
      reject(new Error(`${command} exited with code ${code}. ${stderr || stdout}`.trim()));
    });
  });
}

async function hasCommand(command, versionArg = '--version') {
  if (command === 'ffmpeg') {
    // Try dynamic search first
    const dynamic = findFFmpeg();
    if (dynamic) return true;

    // Try known paths
    for (const path of FFMPEG_PATHS) {
      try {
        await runCommand(path, [versionArg]);
        console.log(`[nexa] FFmpeg found at: ${path}`);
        return true;
      } catch {
        continue;
      }
    }
    console.warn('[nexa] FFmpeg not found in any known path');
    return false;
  }

  try {
    await runCommand(command, [versionArg]);
    return true;
  } catch {
    return false;
  }
}

async function getFFmpegPath() {
  // Try dynamic search first
  const dynamic = findFFmpeg();
  if (dynamic) return dynamic;

  // Try known paths
  for (const path of FFMPEG_PATHS) {
    try {
      await runCommand(path, ['--version']);
      return path;
    } catch {
      continue;
    }
  }
  return null;
}

module.exports = { runCommand, hasCommand, getFFmpegPath };