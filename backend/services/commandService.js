const { spawn } = require('child_process');

// Common FFmpeg paths on Railway/Nixpacks
const FFMPEG_PATHS = [
  'ffmpeg',
  '/usr/bin/ffmpeg',
  '/usr/local/bin/ffmpeg',
  '/nix/var/nix/profiles/default/bin/ffmpeg',
  '/root/.nix-profile/bin/ffmpeg',
];

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
      if (code === 0) return resolve({ stdout, stderr });
      reject(new Error(`${command} exited with code ${code}. ${stderr || stdout}`.trim()));
    });
  });
}

async function hasCommand(command, versionArg = '--version') {
  // If checking ffmpeg, try all known paths
  if (command === 'ffmpeg') {
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