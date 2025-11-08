"use strict";

const BUTTON_ID = "synapse-save-bubble";
const TOAST_ID = "synapse-toast";

let currentSelection = "";

function ensureToast() {
  let toast = document.getElementById(TOAST_ID);
  if (toast) return toast;

  toast = document.createElement("div");
  toast.id = TOAST_ID;
  Object.assign(toast.style, {
    position: "fixed",
    left: "50%",
    bottom: "24px",
    transform: "translateX(-50%)",
    background: "#111827",
    color: "#ffffff",
    padding: "8px 16px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "600",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.25)",
    opacity: "0",
    pointerEvents: "none",
    transition: "opacity 0.2s ease",
    zIndex: "2147483647",
  });

  document.body.appendChild(toast);
  return toast;
}

function showToast(message, isError = false) {
  const toast = ensureToast();
  toast.textContent = message;
  toast.style.background = isError ? "#b91c1c" : "#111827";
  toast.style.opacity = "1";
  window.setTimeout(() => {
    toast.style.opacity = "0";
  }, 2200);
}

function ensureButton() {
  let button = document.getElementById(BUTTON_ID);
  if (button) return button;

  button = document.createElement("button");
  button.id = BUTTON_ID;
  button.type = "button";
  button.textContent = "Save to Synapse";

  Object.assign(button.style, {
    position: "absolute",
    zIndex: "2147483646",
    padding: "8px 12px",
    borderRadius: "999px",
    border: "none",
    fontSize: "12px",
    fontWeight: "600",
    background: "#111827",
    color: "#ffffff",
    cursor: "pointer",
    boxShadow: "0 10px 20px rgba(15, 23, 42, 0.25)",
    transform: "translate(-50%, -140%) scale(0.9)",
    opacity: "0",
    transition: "opacity 0.15s ease, transform 0.15s ease",
    pointerEvents: "none",
    whiteSpace: "nowrap",
  });

  button.addEventListener("mouseenter", () => {
    button.style.transform = "translate(-50%, -140%) scale(1)";
  });
  button.addEventListener("mouseleave", () => {
    button.style.transform = "translate(-50%, -140%) scale(0.98)";
  });

  button.addEventListener("click", handleSave);

  document.body.appendChild(button);
  return button;
}

function hideButton() {
  const button = document.getElementById(BUTTON_ID);
  if (!button) return;
  button.style.opacity = "0";
  button.style.pointerEvents = "none";
}

function updateButtonPosition() {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) {
    currentSelection = "";
    hideButton();
    return;
  }

  const text = selection.toString().trim();
  if (!text) {
    currentSelection = "";
    hideButton();
    return;
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  const button = ensureButton();

  currentSelection = text;
  Object.assign(button.style, {
    left: `${rect.left + rect.width / 2 + window.scrollX}px`,
    top: `${rect.top + window.scrollY}px`,
    opacity: "1",
    pointerEvents: "auto",
    transform: "translate(-50%, -140%) scale(1)",
  });
}

function buildPayload() {
  if (!currentSelection) return null;
  return {
    title: document.title,
    url: window.location.href,
    selectedText: currentSelection,
    metadata: {
      highlight: {
        context: currentSelection.slice(0, 280),
      },
    },
    context: { action: "highlight", source: window.location.hostname },
    capturedAt: new Date().toISOString(),
  };
}

function handleSave() {
  const payload = buildPayload();
  if (!payload) {
    showToast("Select some text first", true);
    return;
  }

  chrome.runtime.sendMessage(
    { type: "SYNAPSE_CAPTURE", payload },
    (response) => {
      if (chrome.runtime.lastError) {
        showToast(chrome.runtime.lastError.message, true);
        return;
      }

      if (!response?.ok) {
        showToast(response?.error ?? "Failed to save to Synapse", true);
        return;
      }

      showToast("Saved to Synapse ✅");
      hideButton();
    },
  );
}

document.addEventListener("selectionchange", () => {
  window.setTimeout(updateButtonPosition, 80);
});
document.addEventListener("mouseup", () => {
  window.setTimeout(updateButtonPosition, 80);
});
document.addEventListener("keydown", () => {
  window.setTimeout(updateButtonPosition, 80);
});

ensureButton();

