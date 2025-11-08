const DEFAULT_API_ENDPOINT = "http://localhost:3000/api/save";

async function resolveApiEndpoint() {
  try {
    const result = await chrome.storage.sync.get(["synapseApiEndpoint"]);
    const stored = result?.synapseApiEndpoint;
    if (typeof stored === "string" && stored.trim().length > 0) {
      return stored.trim();
    }
  } catch (error) {
    console.warn("[Synapse] Failed to read stored API endpoint", error);
  }

  return DEFAULT_API_ENDPOINT;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "SYNAPSE_CAPTURE") {
    return;
  }

  (async () => {
    try {
      const endpoint = await resolveApiEndpoint();
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message.payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Synapse capture failed (${response.status}): ${errorBody}`,
        );
      }

      const data = await response.json();
      sendResponse({ ok: true, data });
    } catch (error) {
      console.error("[Synapse] Failed to save capture", error);
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  })();

  return true;
});

