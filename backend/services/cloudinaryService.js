const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// Configure Cloudinary from env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

function isConfigured() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Upload a buffer to Cloudinary
 * @param {Buffer} buffer - file data
 * @param {object} options - cloudinary upload options
 * @returns {Promise<{url: string, publicId: string}>}
 */
function uploadBuffer(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: 'nexa',
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });
}

/**
 * Upload a string (SVG/text) as a raw file to Cloudinary
 */
async function uploadString(content, filename, options = {}) {
  const buffer = Buffer.from(content, 'utf8');
  return uploadBuffer(buffer, {
    public_id: filename,
    resource_type: 'raw',
    ...options,
  });
}

/**
 * Upload an SVG thumbnail string to Cloudinary
 */
async function uploadSVG(svgString, publicId) {
  if (!isConfigured()) {
    // Return a placeholder data URL if Cloudinary not configured
    console.warn('[nexa] Cloudinary not configured. Using placeholder thumbnail.');
    return {
      url: `https://placehold.co/1080x1920/111827/6366f1?text=Nexa+Video`,
      publicId: 'placeholder',
    };
  }

  const buffer = Buffer.from(svgString, 'utf8');
  return uploadBuffer(buffer, {
    public_id: publicId,
    resource_type: 'image',
    format: 'svg',
    folder: 'nexa/thumbnails',
  });
}

/**
 * Upload an MP4 video file (Buffer or path) to Cloudinary
 */
async function uploadVideo(buffer, publicId, format = 'mp4') {
  if (!isConfigured()) {
    console.warn('[nexa] Cloudinary not configured. Video upload skipped.');
    return { url: null, publicId: null };
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video',
        folder: 'nexa/videos',
        public_id: publicId,
        format: format,
        overwrite: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });
}

/**
 * Delete a file from Cloudinary by publicId
 */
async function deleteFile(publicId, resourceType = 'image') {
  if (!isConfigured()) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.warn(`[nexa] Cloudinary delete failed for ${publicId}: ${err.message}`);
  }
}

module.exports = {
  isConfigured,
  uploadSVG,
  uploadVideo,
  uploadString,
  uploadBuffer,
  deleteFile,
};
