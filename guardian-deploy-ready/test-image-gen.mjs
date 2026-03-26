import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const forgeApiUrl = process.env.BUILT_IN_FORGE_API_URL;
const forgeApiKey = process.env.BUILT_IN_FORGE_API_KEY;

console.log('Forge URL:', forgeApiUrl ? 'SET' : 'MISSING');
console.log('Forge Key:', forgeApiKey ? 'SET (length: ' + forgeApiKey.length + ')' : 'MISSING');

if (!forgeApiUrl || !forgeApiKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const baseUrl = forgeApiUrl.endsWith('/') ? forgeApiUrl : `${forgeApiUrl}/`;
const fullUrl = new URL('images.v1.ImageService/GenerateImage', baseUrl).toString();

console.log('Full URL:', fullUrl);
console.log('Sending request...');

try {
  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'connect-protocol-version': '1',
      authorization: `Bearer ${forgeApiKey}`,
    },
    body: JSON.stringify({
      prompt: 'Simple test: a blue metallic cube on a dark background, engineering style',
      original_images: [],
    }),
  });

  console.log('Response status:', response.status, response.statusText);
  
  if (!response.ok) {
    const detail = await response.text();
    console.error('Error detail:', detail);
  } else {
    const result = await response.json();
    console.log('Has b64Json:', !!result?.image?.b64Json);
    console.log('b64Json length:', result?.image?.b64Json?.length || 0);
    console.log('mimeType:', result?.image?.mimeType);
    console.log('SUCCESS - Image generation works!');
  }
} catch (e) {
  console.error('Fetch error:', e.message);
}
