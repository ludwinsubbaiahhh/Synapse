const DEFAULT_ENDPOINT = "http://localhost:3000/api/save";
const LOCALHOST_HOSTS = ["http://localhost", "http://127.0.0.1"];
const LOCALHOST_PORTS = [3000, 3001, 3002, 3003];

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(["synapseEndpoint"], (value) => {
    if (!value.synapseEndpoint) {
      chrome.storage.sync.set({ synapseEndpoint: DEFAULT_ENDPOINT });
    }
  });
});

async function getStoredEndpoint() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["synapseEndpoint"], (value) => {
      const endpoint = value.synapseEndpoint;
      if (typeof endpoint === "string" && endpoint.trim().length > 0) {
        resolve(endpoint.trim());
      } else {
        resolve(DEFAULT_ENDPOINT);
      }
    });
  });
}

function buildCandidateEndpoints(initialEndpoint) {
  const candidates = [];
  if (initialEndpoint) {
    candidates.push(initialEndpoint);
  }
  for (const host of LOCALHOST_HOSTS) {
    for (const port of LOCALHOST_PORTS) {
      candidates.push(`${host}:${port}/api/save`);
    }
  }
  candidates.push(DEFAULT_ENDPOINT);
  return Array.from(new Set(candidates));
}

async function tryPost(endpoint, payload) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    const error = new Error(
      `Synapse capture failed (${response.status}): ${text}`,
    );
    error.code = "HTTP_ERROR";
    throw error;
  }

  return response.json();
}

async function postCapture(payload) {
  const storedEndpoint = await getStoredEndpoint();
  const candidates = buildCandidateEndpoints(storedEndpoint);
  let lastError = null;

  for (const endpoint of candidates) {
    try {
      const data = await tryPost(endpoint, payload);
      if (endpoint !== storedEndpoint) {
        chrome.storage.sync.set({ synapseEndpoint: endpoint });
      }
      return data;
    } catch (error) {
      lastError = error;

      if (error instanceof Error && error.code === "HTTP_ERROR") {
        throw error;
      }

      if (
        error instanceof TypeError &&
        error.message?.toLowerCase().includes("failed to fetch")
      ) {
        continue;
      }

      throw error;
    }
  }

  throw (
    lastError ??
    new Error(
      "Synapse capture failed: could not reach the Synapse API endpoint.",
    )
  );
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "SYNAPSE_CAPTURE") {
    return;
  }

  (async () => {
    try {
      const data = await postCapture(message.payload);
      sendResponse({ ok: true, data });
    } catch (error) {
      console.error("[Synapse] capture error", error);
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  })();

  return true;
});