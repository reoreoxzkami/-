const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';
const ZEROSCOPE_V2_VERSION = '9f74767394504e53a280f8f4f1f02be2f8b8f7f6d67f0e4f2f81f061f39d218e';
const MAX_POLL_ATTEMPTS = 90;
const POLL_INTERVAL_MS = 3000;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function replicateRequest(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const apiError = data.detail || data.error || `Replicate API error (${response.status})`;
    throw new Error(apiError);
  }

  return data;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'REPLICATE_API_TOKEN is not set on server.' });
  }

  try {
    const { prompt, resolution = '576x320', seconds = 3, seed } = req.body || {};

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const duration = Math.max(1, Math.min(8, Number(seconds) || 3));
    const [width, height] = resolution.split('x').map((value) => Number(value));

    if (!width || !height) {
      return res.status(400).json({ error: 'Invalid resolution format.' });
    }

    const input = {
      prompt,
      width,
      height,
      num_frames: duration * 8,
      num_inference_steps: 50,
      fps: 8,
    };

    if (seed !== undefined && seed !== null && seed !== '') {
      input.seed = Number(seed);
    }

    let prediction = await replicateRequest(REPLICATE_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: ZEROSCOPE_V2_VERSION,
        input,
      }),
    });

    for (let i = 0; i < MAX_POLL_ATTEMPTS; i += 1) {
      if (prediction.status === 'succeeded') {
        const output = prediction.output;
        const videoUrl = Array.isArray(output) ? output[0] : output;
        return res.status(200).json({ videoUrl, predictionId: prediction.id });
      }

      if (prediction.status === 'failed' || prediction.status === 'canceled') {
        return res.status(500).json({
          error: prediction.error || `Prediction ended with status: ${prediction.status}`,
        });
      }

      await wait(POLL_INTERVAL_MS);

      prediction = await replicateRequest(`${REPLICATE_API_URL}/${prediction.id}`, {
        method: 'GET',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });
    }

    return res.status(504).json({ error: 'Timeout while waiting for video generation.' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unexpected server error.' });
  }
};
