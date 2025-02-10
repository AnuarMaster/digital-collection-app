// Vercel serverless function to call Tatum API and record the item hash on blockchain

// Note: In Node.js 18+ (which Vercel supports), 'fetch' is globally available.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { hash } = req.body;
  if (!hash) {
    res.status(400).json({ error: 'Missing hash in request body.' });
    return;
  }

  // Retrieve your Tatum API key from environment variables
  const tatumApiKey = process.env.TATUM_API_KEY;
  if (!tatumApiKey) {
    res.status(500).json({ error: 'Tatum API key is not set.' });
    return;
  }

  // Define the Tatum API endpoint to record the hash.
  // (Replace with the correct endpoint and payload as per Tatum documentation.)
  const TATUM_RECORD_ENDPOINT = 'https://api.tatum.io/v3/anchoring';

  try {
    const tatumResponse = await fetch(TATUM_RECORD_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': tatumApiKey
      },
      // The payload here is an example; adjust fields as required by Tatum.
      body: JSON.stringify({
        data: hash
        // You might need to include additional parameters here such as:
        // - Blockchain chain identifier
        // - Sender/receiver addresses
        // - Private key (stored securely, never on client side)
      })
    });

    const tatumData = await tatumResponse.json();

    // Forward the response from Tatum back to the client
    res.status(200).json(tatumData);
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
}
