// When the form is submitted…
document.getElementById('itemForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  // Gather form data
  const title = document.getElementById('title').value.trim();
  const category = document.getElementById('category').value.trim();
  const description = document.getElementById('description').value.trim();

  // Create an item object (including a timestamp for uniqueness)
  const item = {
    title,
    category,
    description,
    timestamp: new Date().toISOString()
  };

  // Compute a SHA-256 hash for the item data (as a “digital fingerprint”)
  const hash = await computeHash(JSON.stringify(item));

  // Display the new item (with its hash) in the collection list
  addItemToList(item, hash);

  // Record the item hash on the blockchain via your API endpoint
  recordOnBlockchain(hash);

  // Clear the form inputs
  e.target.reset();
});

// Function to compute SHA-256 hash using the SubtleCrypto API
async function computeHash(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Function to add the item to the list on the page
function addItemToList(item, hash) {
  const li = document.createElement('li');
  li.textContent = `Title: ${item.title} | Category: ${item.category} | Hash: ${hash}`;
  document.getElementById('collectionList').appendChild(li);
}

// Function to call the Vercel API endpoint to record the hash on the blockchain
async function recordOnBlockchain(hash) {
  try {
    const response = await fetch('/api/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hash })
    });
    const data = await response.json();
    console.log('Blockchain record response:', data);
    // You could also update the UI with data.txId or similar info from Tatum
  } catch (error) {
    console.error('Error recording on blockchain:', error);
  }
}
