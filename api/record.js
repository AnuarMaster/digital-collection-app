// api/record.js
import { ethers } from "ethers";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { hash } = req.body;
  if (!hash) {
    res.status(400).json({ error: "Missing hash in request body." });
    return;
  }

  // Retrieve sensitive configuration from environment variables.
  const tatumApiKey = process.env.TATUM_API_KEY;
  if (!tatumApiKey) {
    res.status(500).json({ error: "Tatum API key is not set." });
    return;
  }

  const fromAddress = process.env.ETH_FROM_ADDRESS;
  const toAddress = process.env.ETH_TO_ADDRESS;
  const privateKey = process.env.ETH_PRIVATE_KEY;
  if (!fromAddress || !toAddress || !privateKey) {
    res.status(500).json({ error: "Ethereum configuration is incomplete." });
    return;
  }

  try {
    // Connect to the Sepolia testnet via Tatum’s gateway.
    const provider = new ethers.providers.JsonRpcProvider("https://ethereum-sepolia.gateway.tatum.io");

    // Create a wallet instance using the private key.
    const wallet = new ethers.Wallet(privateKey, provider);

    // Get the current transaction count (nonce) for the sender.
    const nonce = await provider.getTransactionCount(fromAddress, "latest");

    // Build the transaction payload.
    const tx = {
      from: fromAddress,
      to: toAddress,
      nonce: nonce,
      value: ethers.utils.parseEther("0"), // No ETH is transferred.
      gasLimit: 21000,                     // Basic gas limit.
      gasPrice: ethers.utils.parseUnits("20", "gwei"), // Example gas price.
      data: ethers.utils.hexlify(ethers.utils.toUtf8Bytes(hash)),
      chainId: 11155111                    // Sepolia testnet chain ID.
    };

    // Sign the transaction.
    const signedTx = await wallet.signTransaction(tx);

    // Broadcast the signed transaction via Tatum’s broadcast endpoint.
    const TATUM_BROADCAST_URL = "https://api.tatum.io/v3/ethereum/broadcast";
    const response = await fetch(TATUM_BROADCAST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": tatumApiKey,
        "x-testnet-type": "ethereum-sepolia"
      },
      body: JSON.stringify({ txData: signedTx })
    });

    // Get the response as text.
    const responseText = await response.text();

    // Try to parse the response as JSON.
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      // If parsing fails, use the raw text in an error field.
      responseData = { error: responseText };
    }

    // If the HTTP status code indicates an error, forward that status.
    if (!response.ok) {
      res.status(response.status).json(responseData);
    } else {
      res.status(200).json(responseData);
    }
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
}
