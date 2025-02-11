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

  // Retrieve your Tatum API key from environment variables.
  const tatumApiKey = process.env.TATUM_API_KEY;
  if (!tatumApiKey) {
    res.status(500).json({ error: "Tatum API key is not set." });
    return;
  }

  // Test credentials (for demonstration only)
  const fromAddress = "0xf8c8Ce17E33fAe0730c8C279427281C4A7D47e5c"; // Sender address with 0.05 ETH
  const toAddress = "0xA81c57B9f269b584523967B89fD390373Da6E37D";   // Receiver address (0 ETH)
  const privateKey = "df5c402faa5164a90215e565164ed689efa222c7af942dd6d3f4b95cc001e089";

  try {
    // Create a provider that connects to Sepolia via Tatum's gateway.
    const provider = new ethers.providers.JsonRpcProvider("https://ethereum-sepolia.gateway.tatum.io");

    // Create a wallet instance using the provided private key.
    const wallet = new ethers.Wallet(privateKey, provider);

    // Get the current transaction count (nonce) for the sender address.
    const nonce = await provider.getTransactionCount(fromAddress, "latest");

    // Build the transaction.
    // This transaction sends 0 ETH and embeds the provided hash in the data field.
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

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
}
