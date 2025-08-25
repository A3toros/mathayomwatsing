const crypto = require('crypto');

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ success: false, message: 'Method not allowed' }) };
  }

  try {
    const cloudinaryUrl = process.env.CLOUDINARY_URL;
    if (!cloudinaryUrl) {
      return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'CLOUDINARY_URL not configured' }) };
    }

    // CLOUDINARY_URL format: cloudinary://<api_key>:<api_secret>@<cloud_name>
    const match = cloudinaryUrl.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
    if (!match) {
      return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'Invalid CLOUDINARY_URL format' }) };
    }
    const apiKey = match[1];
    const apiSecret = match[2];
    const cloudName = match[3];

    const { dataUrl, folder = 'matching_tests' } = JSON.parse(event.body || '{}');
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Invalid payload: dataUrl required' }) };
    }

    // Prepare upload params
    const timestamp = Math.floor(Date.now() / 1000);
    // Signature: sha1 of the params (alphabetical) joined with & and api_secret appended
    // We'll sign folder and timestamp
    const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(toSign).digest('hex');

    const form = new URLSearchParams();
    form.append('file', dataUrl);
    form.append('api_key', apiKey);
    form.append('timestamp', String(timestamp));
    form.append('folder', folder);
    form.append('signature', signature);

    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const uploadRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString()
    });

    const uploadJson = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok) {
      return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'Cloudinary upload failed', details: uploadJson }) };
    }

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, url: uploadJson.secure_url || uploadJson.url })
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'Upload error', error: err.message }) };
  }
};


