const API_ENDPOINT = "http://localhost:5000/api/save";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "SYNAPSE_CAPTURE") {
    return;
  }

  (async () => {
    try {
      const response = await fetch(API_ENDPOINT, {
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
      sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  })();

  return true;
});

