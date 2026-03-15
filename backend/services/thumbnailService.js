const { v4: uuidv4 } = require('uuid');
const { uploadSVG } = require('./cloudinaryService');

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapLines(text, maxLength) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxLength) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 4);
}

function buildSVG(title, prompt, accent) {
  const lines = wrapLines(title, 18);
  const subline = wrapLines(prompt || 'AI-generated content', 30)[0] || 'AI-generated content';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="1920" viewBox="0 0 1080 1920" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="120" y1="120" x2="960" y2="1800" gradientUnits="userSpaceOnUse">
      <stop stop-color="#0F172A"/>
      <stop offset="0.55" stop-color="#111827"/>
      <stop offset="1" stop-color="${escapeXml(accent)}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(820 360) rotate(120) scale(640 640)">
      <stop stop-color="${escapeXml(accent)}" stop-opacity="0.9"/>
      <stop offset="1" stop-color="${escapeXml(accent)}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="textGrad" x1="0" y1="0" x2="1" y2="0">
      <stop stop-color="#ffffff"/>
      <stop offset="1" stop-color="${escapeXml(accent)}"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1920" rx="0" fill="url(#bg)"/>
  <rect width="1080" height="1920" fill="url(#glow)"/>
  <rect x="60" y="60" width="960" height="1800" rx="32" fill="rgba(15,23,42,0.15)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>

  <!-- Brand badge -->
  <rect x="80" y="90" width="180" height="44" rx="22" fill="${escapeXml(accent)}" fill-opacity="0.2" stroke="${escapeXml(accent)}" stroke-opacity="0.4" stroke-width="1"/>
  <text x="170" y="119" fill="${escapeXml(accent)}" font-size="22" font-family="Arial, sans-serif" font-weight="800" text-anchor="middle">⚡ NEXA AI</text>

  <!-- Main title lines -->
  ${lines.map((line, i) => `
  <text x="80" y="${520 + i * 140}" fill="white" font-size="${i === 0 ? 108 : 100}" font-family="Arial, sans-serif" font-weight="900" letter-spacing="-2">${escapeXml(line)}</text>`).join('')}

  <!-- Divider -->
  <rect x="80" y="1100" width="400" height="3" rx="2" fill="${escapeXml(accent)}" fill-opacity="0.6"/>

  <!-- Subtext -->
  <text x="80" y="1170" fill="#CBD5E1" font-size="44" font-family="Arial, sans-serif">${escapeXml(subline)}</text>

  <!-- Bottom decoration -->
  <circle cx="900" cy="1600" r="200" fill="${escapeXml(accent)}" fill-opacity="0.06"/>
  <circle cx="900" cy="1600" r="140" fill="${escapeXml(accent)}" fill-opacity="0.06"/>
  <text x="900" y="1620" fill="${escapeXml(accent)}" font-size="90" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle" fill-opacity="0.3">N</text>
</svg>`;
}

async function generateThumbnailAsset({ prompt, title, accent = '#6366f1' }) {
  const safeTitle = title || prompt || 'Nexa Video';
  const publicId = `thumb-${uuidv4()}`;
  const svg = buildSVG(safeTitle, prompt, accent);

  // Upload SVG to Cloudinary (or get placeholder if not configured)
  const { url } = await uploadSVG(svg, publicId);

  return { url, publicId };
}

module.exports = { generateThumbnailAsset };
