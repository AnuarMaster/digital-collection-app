// api/record.js
// Vercel serverless function to broadcast a signed Ethereum transaction
// that includes your hash in the data field using Tatum's Ethereum mainnet gateway.

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

  // For demonstration purposes, we assume you have these environment variables set:
  // - ETH_FROM_ADDRESS: the sender address
  // - ETH_TO_ADDRESS: the recipient address (could be your own address for anchoring)
  // - ETH_PRIVATE_KEY: the private key used to sign the transaction (handle securely!)
  const fromAddress = process.env.ETH_FROM_ADDRESS;
  const toAddress = process.env.ETH_TO_ADDRESS;
  const privateKey = process.env.ETH_PRIVATE_KEY; // NEVER expose this key publicly

  if (!fromAddress || !toAddress || !privateKey) {
    res.status(500).json({ error: 'Ethereum configuration is incomplete.' });
    return;
  }

  // Construct the transaction payload.
  // This example creates a simple transaction with no value transfer.
  // It embeds the hash in the data field.
  const txPayload = {
    from: fromAddress,
    to: toAddress,
    value: '0',               // No Ether is transferred
    gasLimit: '21000',        // Basic gas limit (adjust as needed)
    gasPrice: '20000000000',  // Example gas price (20 Gwei)
    data: hash,               // Embed your hash here (as hex or a string)
    chainId: 1                // Ethereum mainnet chain ID
  };

  // IMPORTANT: In production, you must sign the transaction using your private key.
  // The signing process involves constructing the raw transaction, signing it, and
  // serializing it into a hex string.
  // For this example, we assume you have a function signTransaction that does this.
  // Replace the following line with your actual signing implementation.
  const signedTx = await signTransaction(txPayload, privateKey);
  // The signedTx should be a hex string (e.g., "0x...")

  // Broadcast the signed transaction using Tatum's Ethereum mainnet gateway
  const TATUM_ETH_MAINNET_URL = 'https://ethereum-mainnet.gateway.tatum.io';

  try {
    const tatumResponse = await fetch(TATUM_ETH_MAINNET_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': tatumApiKey
      },
      body: JSON.stringify({
        txData: signedTx // Tatum expects the signed transaction in the "txData" field
      })
    });

    const tatumData = await tatumResponse.json();
    res.status(200).json(tatumData);
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
}

/**
 * Dummy transaction signing function.
 * In a real-world application, you should use a robust library (such as ethers.js or web3.js)
 * to create, sign, and serialize your transaction.
 *
 * @param {Object} txPayload - The transaction payload.
 * @param {string} privateKey - The private key used to sign the transaction.
 * @returns {Promise<string>} - A promise that resolves to a signed transaction hex string.
 */
async function signTransaction(txPayload, privateKey) {
  // Example using ethers.js (make sure to add ethers to your dependencies)
  // const { ethers } = require('ethers');
  // const wallet = new ethers.Wallet(privateKey);
  // const tx = {
  //   to: txPayload.to,
  //   value: ethers.BigNumber.from(txPayload.value),
  //   gasLimit: ethers.BigNumber.from(txPayload.gasLimit),
  //   gasPrice: ethers.BigNumber.from(txPayload.gasPrice),
  //   data: txPayload.data,
  //   nonce: await provider.getTransactionCount(txPayload.from, "latest"),
  //   chainId: txPayload.chainId
  // };
  // const signedTx = await wallet.signTransaction(tx);
  // return signedTx;

  // For demonstration, we'll throw an error.
  throw new Error("Transaction signing not implemented. Please implement signTransaction using ethers.js or web3.js.");
}
