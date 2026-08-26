/**
 * sseManager.js
 * Manages Server-Sent Events clients for real-time dashboard updates
 */

const clients = new Set();

/**
 * Add a new SSE client response object
 */
function addClient(res) {
  clients.add(res);
  console.log(`[SSE] Client connected. Total: ${clients.size}`);
}

/**
 * Remove an SSE client
 */
function removeClient(res) {
  clients.delete(res);
  console.log(`[SSE] Client disconnected. Total: ${clients.size}`);
}

/**
 * Broadcast an event to all connected SSE clients
 */
function broadcast(eventName, data) {
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    try {
      res.write(payload);
    } catch (err) {
      clients.delete(res);
    }
  }
}

module.exports = { addClient, removeClient, broadcast };
