const DOCK_ID = "synapse-dock";
const TOAST_ID = "synapse-toast";

const state = {
  selectionText: "",
  selectionRange: null,
  dockDragging: false,
  dragOffset: { x: 0, y: 0 },
};

const createToast = () => {
  const toast = document.createElement("div");
  toast.id = TOAST_ID;
  toast.style.position = "fixed";
  toast.style.left = "50%";
  toast.style.bottom = "32px";
  toast.style.transform = "translateX(-50%)";
  toast.style.background = "#111827";
  toast.style.color = "#ffffff";
  toast.style.padding = "10px 18px";
  toast.style.borderRadius = "999px";
  toast.style.boxShadow = "0 10px 25px rgba(15, 23, 42, 0.25)";
  toast.style.fontSize = "13px";
  toast.style.fontWeight = "600";
  toast.style.opacity = "0";
  toast.style.pointerEvents = "none";
  toast.style.transition = "opacity 0.2s ease";
  toast.style.zIndex = "2147483647";
  toast.textContent = "";
  document.body.appendChild(toast);
  return toast;
};

const toast = createToast();

const showToast = (message, isError = false) => {
  toast.textContent = message;
  toast.style.background = isError ? "#b91c1c" : "#111827";
  toast.style.opacity = "1";
  window.setTimeout(() => {
    toast.style.opacity = "0";
  }, 2200);
};

const createDock = () => {
  const dock = document.createElement("div");
  dock.id = DOCK_ID;
  dock.style.position = "fixed";
  dock.style.bottom = "24px";
  dock.style.right = "24px";
  dock.style.zIndex = "2147483646";
  dock.style.display = "flex";
  dock.style.flexDirection = "column";
  dock.style.gap = "8px";
  dock.style.padding = "14px";
  dock.style.borderRadius = "16px";
  dock.style.background = "rgba(15, 23, 42, 0.85)";
  dock.style.backdropFilter = "blur(12px)";
  dock.style.boxShadow = "0 25px 45px rgba(15, 23, 42, 0.35)";
  dock.style.color = "#f8fafc";
  dock.style.userSelect = "none";
  dock.style.cursor = "grab";

  const header = document.createElement("div");
  header.textContent = "Synapse";
  header.style.fontSize = "13px";
  header.style.fontWeight = "600";
  header.style.letterSpacing = "0.04em";
  header.style.textTransform = "uppercase";
  dock.appendChild(header);

  const actions = document.createElement("div");
  actions.style.display = "flex";
  actions.style.flexDirection = "column";
  actions.style.gap = "6px";
  dock.appendChild(actions);

  const createActionButton = (label) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.style.border = "none";
    button.style.borderRadius = "10px";
    button.style.padding = "8px 12px";
    button.style.fontSize = "13px";
    button.style.fontWeight = "600";
    button.style.background = "rgba(248, 250, 252, 0.12)";
    button.style.color = "#f8fafc";
    button.style.cursor = "pointer";
    button.style.transition = "background 0.18s ease, opacity 0.18s ease";
    button.addEventListener("mouseenter", () => {
      if (!button.disabled) {
        button.style.background = "rgba(248, 250, 252, 0.22)";
      }
    });
    button.addEventListener("mouseleave", () => {
      if (!button.disabled) {
        button.style.background = "rgba(248, 250, 252, 0.12)";
      }
    });
    return button;
  };

  const highlightButton = createActionButton("Save highlight");
  highlightButton.dataset.action = "highlight";
  actions.appendChild(highlightButton);

  const pageButton = createActionButton("Save page");
  pageButton.dataset.action = "page";
  pageButton.style.background = "rgba(248, 250, 252, 0.18)";
  actions.appendChild(pageButton);

  const todoButton = createActionButton("Save to-do list");
  todoButton.dataset.action = "todo";
  actions.appendChild(todoButton);

  document.body.appendChild(dock);

  return { dock, highlightButton, pageButton, todoButton };
};

const { dock, highlightButton, pageButton, todoButton } = createDock();

const setButtonDisabled = (button, disabled) => {
  button.disabled = disabled;
  button.style.opacity = disabled ? "0.45" : "1";
  button.style.cursor = disabled ? "not-allowed" : "pointer";
};

const updateSelectionState = () => {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) {
    state.selectionText = "";
    state.selectionRange = null;
    setButtonDisabled(highlightButton, true);
    setButtonDisabled(todoButton, true);
    return;
  }

  const text = selection.toString().trim();
  if (!text) {
    state.selectionText = "";
    state.selectionRange = null;
    setButtonDisabled(highlightButton, true);
    setButtonDisabled(todoButton, true);
    return;
  }

  state.selectionText = text;
  state.selectionRange = selection.getRangeAt(0).cloneRange();
  setButtonDisabled(highlightButton, false);
  setButtonDisabled(todoButton, false);
};

const getMetaContent = (property) => {
  return (
    document
      .querySelector(`meta[property="${property}"], meta[name="${property}"]`)
      ?.getAttribute("content") ?? ""
  );
};

const extractPriceFromString = (text) => {
  const match = text.match(
    /(?<currency>[$€£₹¥]|USD|EUR|GBP|INR|JPY|CAD|AUD)\s?(?<amount>\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?|\d+(?:[.,]\d{2})?)/i,
  );
  if (!match || !match.groups) return null;
  return {
    currency: match.groups.currency.toUpperCase(),
    amount: match.groups.amount.replace(/[^\d.,]/g, ""),
    display: match[0],
  };
};

const gatherProductMetadata = () => {
  const priceSelectors = [
    "#priceblock_ourprice",
    "#priceblock_dealprice",
    "#priceblock_saleprice",
    "[data-asin-price]",
    ".a-price .a-offscreen",
    ".priceToPay span.a-offscreen",
  ];

  const availabilitySelectors = [
    "#availability .a-color-success",
    "#availability .a-color-price",
    ".availability .a-color-success",
  ];

  const ratingSelectors = [
    "#acrPopover",
    ".reviewsMedleys .a-icon-alt",
    ".reviewCountTextLinkedHistogramNoUnderline",
  ];

  const priceElement = priceSelectors
    .map((selector) => document.querySelector(selector))
    .find(Boolean);
  const availabilityElement = availabilitySelectors
    .map((selector) => document.querySelector(selector))
    .find(Boolean);
  const ratingElement = ratingSelectors
    .map((selector) => document.querySelector(selector))
    .find(Boolean);

  const priceText =
    priceElement?.textContent?.trim() ||
    getMetaContent("product:price:amount") ||
    getMetaContent("og:price:amount");
  const price =
    (priceText && extractPriceFromString(priceText)) || undefined;

  const ratingText = ratingElement?.getAttribute("title") ?? ratingElement?.textContent ?? "";
  const ratingMatch = ratingText.match(/([\d.]+)\s*out of\s*5/);
  const ratingValue = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;

  const image =
    getMetaContent("og:image") ||
    document.querySelector("#landingImage, #imgTagWrapperId img")?.src ||
    "";

  if (!price && !availabilityElement && !ratingElement && !image) {
    return null;
  }

  return {
    price,
    availability: availabilityElement?.textContent?.trim() || undefined,
    rating: ratingValue
      ? {
          value: ratingValue,
          display: ratingText.trim(),
        }
      : undefined,
    image: image || undefined,
    merchant: window.location.hostname,
  };
};

const guessKindFromPage = (metadata) => {
  if (metadata?.product) {
    return "PRODUCT";
  }
  const articleHints = [
    "article",
    "blog",
    "news",
    "perplexity.ai",
    "substack",
  ];
  if (
    articleHints.some((hint) =>
      window.location.hostname.toLowerCase().includes(hint),
    )
  ) {
    return "ARTICLE";
  }
  if (getMetaContent("article:published_time")) {
    return "ARTICLE";
  }
  return "LINK";
};

const gatherPagePayload = () => {
  const product = gatherProductMetadata();
  const description =
    getMetaContent("og:description") ||
    getMetaContent("description") ||
    document.body.innerText.slice(0, 280);

  const metadata = {};
  if (product) {
    metadata.product = product;
  } else {
    metadata.article = {
      description,
      image: getMetaContent("og:image"),
    };
  }

  const kind = guessKindFromPage(metadata);

  return {
    kind,
    title: document.title,
    url: window.location.href,
    html: document.documentElement.outerHTML,
    metadata,
    capturedAt: new Date().toISOString(),
    context: { action: "page", source: window.location.hostname },
  };
};

const gatherHighlightPayload = () => {
  if (!state.selectionText) {
    return null;
  }

  return {
    kind: undefined,
    title: document.title,
    url: window.location.href,
    selectedText: state.selectionText,
    metadata: {
      highlight: {
        context: state.selectionText.slice(0, 280),
      },
    },
    capturedAt: new Date().toISOString(),
    context: { action: "highlight", source: window.location.hostname },
  };
};

const gatherTodoPayload = () => {
  if (!state.selectionText) {
    return null;
  }

  const items = state.selectionText
    .split(/\n+/)
    .map((line) => line.replace(/^\s*[-*•\u2022\[\]]\s*/, "").trim())
    .filter(Boolean);

  return {
    kind: "TODO",
    title: document.title,
    url: window.location.href,
    selectedText: state.selectionText,
    metadata: {
      todo: {
        items,
      },
    },
    capturedAt: new Date().toISOString(),
    context: { action: "todo", source: window.location.hostname },
  };
};

const sendPayload = (payload, successMessage) => {
  chrome.runtime.sendMessage(
    {
      type: "SYNAPSE_CAPTURE",
      payload,
    },
    (response) => {
      if (chrome.runtime.lastError) {
        showToast(
          "Synapse capture failed: " + chrome.runtime.lastError.message,
          true,
        );
        return;
      }
      if (response?.ok) {
        showToast(successMessage);
      } else {
        showToast(
          response?.error
            ? `Synapse error: ${response.error}`
            : "Failed to save to Synapse",
          true,
        );
      }
    },
  );
};

highlightButton.addEventListener("click", () => {
  const payload = gatherHighlightPayload();
  if (!payload) {
    showToast("Select some text first", true);
    return;
  }
  sendPayload(payload, "Highlight saved to Synapse ✅");
});

pageButton.addEventListener("click", () => {
  const payload = gatherPagePayload();
  sendPayload(payload, "Page sent to Synapse ✅");
});

todoButton.addEventListener("click", () => {
  const payload = gatherTodoPayload();
  if (!payload) {
    showToast("Highlight a list to capture to-dos", true);
    return;
  }
  sendPayload(payload, "Todo list saved to Synapse ✅");
});

document.addEventListener("selectionchange", () => {
  updateSelectionState();
});

document.addEventListener("mouseup", () => {
  updateSelectionState();
});

document.addEventListener("keyup", () => {
  updateSelectionState();
});

// Initialize button states
updateSelectionState();

const handlePointerDown = (event) => {
  if (event.target.tagName.toLowerCase() === "button") {
    return;
  }
  state.dockDragging = true;
  dock.style.cursor = "grabbing";
  const rect = dock.getBoundingClientRect();
  state.dragOffset = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
  event.preventDefault();
};

const handlePointerMove = (event) => {
  if (!state.dockDragging) return;
  const x = event.clientX - state.dragOffset.x;
  const y = event.clientY - state.dragOffset.y;
  dock.style.left = `${Math.min(
    Math.max(12, x),
    window.innerWidth - dock.offsetWidth - 12,
  )}px`;
  dock.style.top = `${Math.min(
    Math.max(12, y),
    window.innerHeight - dock.offsetHeight - 12,
  )}px`;
  dock.style.right = "auto";
  dock.style.bottom = "auto";
};

const handlePointerUp = () => {
  state.dockDragging = false;
  dock.style.cursor = "grab";
};

dock.addEventListener("mousedown", handlePointerDown);
document.addEventListener("mousemove", handlePointerMove);
document.addEventListener("mouseup", handlePointerUp);

