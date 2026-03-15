const { getAllVideos, deleteVideo } = require('../services/supabaseService');
const { generateVideoProject } = require('../services/videoGenerationService');

async function generateVideo(req, res, next) {
  try {
    const { videoIdea, title, style, voice, channel, mode, duration } = req.body || {};

    if (!videoIdea || typeof videoIdea !== 'string' || !videoIdea.trim()) {
      return res.status(400).json({ error: 'videoIdea is required' });
    }

    const video = await generateVideoProject({
      videoIdea: videoIdea.trim(),
      title: (title || videoIdea).trim(),
      style, voice, channel, mode,
      duration: Number(duration) || 30,
    });

    return res.status(201).json({ video });
  } catch (error) {
    return next(error);
  }
}

async function listVideos(_req, res, next) {
  try {
    const videos = await getAllVideos();
    return res.json({ videos });
  } catch (error) {
    return next(error);
  }
}

async function deleteVideoById(req, res, next) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'id is required' });
    await deleteVideo(id);
    return res.json({ ok: true, id });
  } catch (error) {
    return next(error);
  }
}

module.exports = { generateVideo, listVideos, deleteVideoById };
