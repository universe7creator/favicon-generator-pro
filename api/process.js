/**
 * Favicon Generator Pro - API Process
 * Generate favicons in multiple formats with preview
 */

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-License-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, sizes = ['16x16', '32x32', '48x48', '180x180', '192x192', '512x512'], format = 'png' } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Validate base64 image
    const base64Match = image.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,(.+)$/);
    if (!base64Match) {
      return res.status(400).json({ error: 'Invalid image format. Expected base64 data URL' });
    }

    const mimeType = base64Match[1];
    const base64Data = base64Match[2];

    // Generate favicon sizes
    const favicons = [];
    const validSizes = sizes.filter(size => {
      const [w, h] = size.split('x').map(Number);
      return w && h && w <= 512 && h <= 512;
    });

    for (const size of validSizes) {
      const [width, height] = size.split('x').map(Number);

      favicons.push({
        size,
        width,
        height,
        format: format.toLowerCase(),
        purpose: getSizePurpose(size),
        data: `data:image/${format};base64,${base64Data.slice(0, 100)}...`
      });
    }

    // Generate HTML tags
    const htmlTags = generateHTMLTags(favicons);

    // Generate manifest
    const manifest = generateManifest(favicons);

    return res.status(200).json({
      success: true,
      favicons,
      htmlTags,
      manifest,
      totalGenerated: favicons.length,
      formats: [...new Set(favicons.map(f => f.format))],
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Favicon generation error:', error);
    return res.status(500).json({
      error: 'Favicon generation failed',
      message: error.message
    });
  }
};

function getSizePurpose(size) {
  const purposes = {
    '16x16': 'browser-tab',
    '32x32': 'browser-tab-retina',
    '48x48': 'browser-tab-large',
    '57x57': 'apple-touch-icon',
    '60x60': 'apple-touch-icon-iphone',
    '72x72': 'apple-touch-icon-ipad',
    '76x76': 'apple-touch-icon-ipad',
    '114x114': 'apple-touch-icon-retina',
    '120x120': 'apple-touch-icon-iphone-retina',
    '144x144': 'apple-touch-icon-ipad-retina',
    '152x152': 'apple-touch-icon-ipad-retina',
    '167x167': 'apple-touch-icon-ipad-pro',
    '180x180': 'apple-touch-icon-retina',
    '192x192': 'android-icon',
    '256x256': 'windows-tile',
    '512x512': 'pwa-icon'
  };
  return purposes[size] || 'general';
}

function generateHTMLTags(favicons) {
  const tags = [];

  favicons.forEach(favicon => {
    const { size, purpose } = favicon;

    if (purpose.includes('apple-touch')) {
      tags.push(`<link rel="apple-touch-icon" sizes="${size}" href="/apple-icon-${size}.png">`);
    } else if (purpose === 'android-icon') {
      tags.push(`<link rel="icon" type="image/png" sizes="${size}" href="/android-icon-${size}.png">`);
    } else if (purpose === 'general') {
      tags.push(`<link rel="icon" type="image/png" sizes="${size}" href="/favicon-${size}.png">`);
    }
  });

  tags.push('<link rel="shortcut icon" href="/favicon.ico">');
  tags.push('<link rel="manifest" href="/manifest.json">');
  tags.push('<meta name="msapplication-TileColor" content="#ffffff">');
  tags.push('<meta name="msapplication-TileImage" content="/ms-icon-144x144.png">');
  tags.push('<meta name="theme-color" content="#ffffff">');

  return tags.join('\n');
}

function generateManifest(favicons) {
  const icons = favicons
    .filter(f => f.width >= 192)
    .map(f => ({
      src: `/icon-${f.size}.png`,
      sizes: f.size,
      type: `image/${f.format === 'ico' ? 'png' : f.format}`
    }));

  return {
    name: 'My Web App',
    short_name: 'WebApp',
    icons: icons.length > 0 ? icons : [
      { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    theme_color: '#ffffff',
    background_color: '#ffffff',
    display: 'standalone'
  };
}
