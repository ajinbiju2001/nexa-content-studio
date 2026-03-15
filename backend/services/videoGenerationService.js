const fs = require('fs');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

const { generateShortScript } = require('./openaiService');
const { generateThumbnailAsset } = require('./thumbnailService');
const { insertVideo } = require('./supabaseService');
const { runCommand, hasCommand, getFFmpegPath } = require('./commandService');

// ─── Audio generation ─────────────────────────────────────────────────────────

async function createNarrationAudio({ script, voice }) {
  const tmpFile = path.join(os.tmpdir(), `nexa-audio-${uuidv4()}`);
  const scriptText = String(script || '').replace(/\s+/g, ' ').trim();
  const ffmpegPath = await getFFmpegPath() || 'ffmpeg';
  const mp3File = `${tmpFile}.mp3`;
  const m4aFile = `${tmpFile}.m4a`;

  // Try edge-tts-node
 try {
  const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
  const tts = new MsEdgeTTS();
  const voiceName = voice === 'male'
    ? 'en-US-GuyNeural'
    : 'en-US-JennyNeural';

  await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const readable = tts.toStream(scriptText);

  await new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(mp3File);
    readable.pipe(writeStream);
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });

  await runCommand(ffmpegPath, ['-y', '-i', mp3File, '-c:a', 'aac', m4aFile]);
  console.log('[nexa] Audio done (msedge-tts)');
  return { filePath: m4aFile, provider: 'edge-tts' };
} catch (err) {
  console.warn('[nexa] msedge-tts failed:', err.message);
}

  // Beep tone fallback
  const outFile = `${tmpFile}.m4a`;
  await runCommand(ffmpegPath, [
    '-y', '-f', 'lavfi',
    '-i', 'sine=frequency=220:duration=30',
    '-c:a', 'aac', outFile,
  ]);
  return { filePath: outFile, provider: 'ffmpeg-tone' };
}

// ─── Video rendering ──────────────────────────────────────────────────────────

async function renderVideoFile({ title, audioPath, duration = 30 }) {
  if (!await hasCommand('ffmpeg')) {
    return { filePath: null, warning: 'FFmpeg not installed. Video render skipped.' };
  }

  const tmpOut = path.join(os.tmpdir(), `nexa-video-${uuidv4()}.mp4`);
  const ffmpegPath = await getFFmpegPath() || 'ffmpeg';

  const args = audioPath
    ? [
        '-y', '-f', 'lavfi',
        '-i', 'color=c=#111827:s=1080x1920:r=30',
        '-i', audioPath,
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-tune', 'stillimage',
        '-crf', '28',
        '-t', String(duration),
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        '-shortest',
        tmpOut,
      ]
    : [
        '-y', '-f', 'lavfi',
        '-i', 'color=c=#111827:s=1080x1920:r=30',
        '-f', 'lavfi',
        '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '28',
        '-t', String(duration),
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        '-shortest',
        tmpOut,
      ];

  await runCommand(ffmpegPath, args);
  return { filePath: tmpOut, warning: null };
}

// ─── Cleanup temp files ───────────────────────────────────────────────────────

function cleanupFiles(...filePaths) {
  for (const f of filePaths) {
    if (f) {
      try { fs.unlinkSync(f); } catch { /* ignore */ }
    }
  }
}

// ─── Category inference ───────────────────────────────────────────────────────

function inferCategory(mode, style) {
  if (mode === 'cartoon' || style === 'cartoon') return 'Cartoon Story';
  if (mode === 'custom') return 'Custom Ideas';
  if (mode === 'bulk') return 'AI Tools';
  return 'AI Tools';
}

// ─── Main video project generator ────────────────────────────────────────────

async function generateVideoProject(input) {
  const {
    videoIdea,
    title,
    style = 'stock',
    voice = 'female',
    channel = 'AI Tools Shorts',
    mode = 'ai',
    duration = 30,
  } = input;

  const id = uuidv4();
  const resolvedTitle = (title || videoIdea || 'Nexa Video').trim();
  const warnings = [];

  console.log(`[nexa] Starting video generation: "${resolvedTitle}"`);

  // 1. Generate script
  const scriptResult = await generateShortScript(videoIdea);
  if (scriptResult.warning) warnings.push(scriptResult.warning);
  console.log(`[nexa] Script done (${scriptResult.provider})`);

  // 2. Generate thumbnail
  const accent = style === 'cartoon' ? '#a855f7' : '#6366f1';
  const thumbnail = await generateThumbnailAsset({ prompt: videoIdea, title: resolvedTitle, accent });
  console.log(`[nexa] Thumbnail done: ${thumbnail.url}`);

  // 3. Generate audio
  const narration = await createNarrationAudio({ script: scriptResult.script, voice });
  console.log(`[nexa] Audio done (${narration.provider})`);

  // 4. Render video
  const renderedVideo = await renderVideoFile({ title: resolvedTitle, audioPath: narration.filePath, duration });
  if (renderedVideo.warning) warnings.push(renderedVideo.warning);

  // 5. Save video locally
  let videoUrl = null;
  if (renderedVideo.filePath) {
    try {
      const videosDir = path.join(process.cwd(), 'uploads', 'videos');
      if (!fs.existsSync(videosDir)) {
        fs.mkdirSync(videosDir, { recursive: true });
      }
      const videoFileName = `video-${id}.mp4`;
      const videoSavePath = path.join(videosDir, videoFileName);
      fs.copyFileSync(renderedVideo.filePath, videoSavePath);

      const backendUrl = process.env.RAILWAY_PUBLIC_DOMAIN
        ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
        : 'http://localhost:4000';

      videoUrl = `${backendUrl}/uploads/videos/${videoFileName}`;
      console.log(`[nexa] Video saved: ${videoUrl}`);
    } catch (err) {
      warnings.push(`Video save failed: ${err.message}`);
      console.error('[nexa] Video save error:', err.message);
    }
  }

  // 6. Cleanup temp files
  cleanupFiles(narration.filePath, renderedVideo.filePath);

  // 7. Save to Supabase
  const metadata = {
    id,
    title: resolvedTitle,
    category: inferCategory(mode, style),
    channel,
    created_at: new Date().toISOString(),
    video_url: videoUrl,
    thumbnail_url: thumbnail.url,
    script: scriptResult.script,
    provider: scriptResult.provider,
    status: videoUrl ? 'ready' : 'partial',
    warnings,
  };

  await insertVideo(metadata);
  console.log(`[nexa] Project saved (status: ${metadata.status})`);

  return metadata;
}

module.exports = { generateVideoProject };