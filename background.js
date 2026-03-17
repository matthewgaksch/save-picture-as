const OFFSCREEN_DOCUMENT_PATH = "offscreen.html";
const DEFAULT_SETTINGS = {
  jpegQuality: 0.92,
  webpQuality: 0.9
};

const MENU_ITEMS = [
  {
    id: "save-picture-as-png",
    title: "Save Picture as PNG",
    mimeType: "image/png",
    extension: "png"
  },
  {
    id: "save-picture-as-jpeg",
    title: "Save Picture as JPEG",
    mimeType: "image/jpeg",
    extension: "jpeg"
  },
  {
    id: "save-picture-as-webp",
    title: "Save Picture as WebP",
    mimeType: "image/webp",
    extension: "webp"
  }
];

const MENU_ITEMS_BY_ID = new Map(
  MENU_ITEMS.map((menuItem) => [menuItem.id, menuItem])
);

let creatingOffscreenDocument = null;

chrome.runtime.onInstalled.addListener(() => {
  setupContextMenus().catch(logError);
});

chrome.runtime.onStartup.addListener(() => {
  setupContextMenus().catch(logError);
});

chrome.contextMenus.onClicked.addListener((info) => {
  const menuItem = MENU_ITEMS_BY_ID.get(info.menuItemId);

  if (!menuItem || !info.srcUrl) {
    return;
  }

  handleSavePicture(info.srcUrl, menuItem).catch(logError);
});

async function setupContextMenus() {
  await removeAllContextMenus();

  for (const menuItem of MENU_ITEMS) {
    await createContextMenu(menuItem);
  }
}

async function handleSavePicture(srcUrl, menuItem) {
  if (srcUrl.startsWith("blob:")) {
    throw new Error(
      "This page uses a temporary picture URL that Chrome extensions cannot fetch directly."
    );
  }

  const settings = await getQualitySettings();
  await ensureOffscreenDocument();

  const message = {
    type: "convert",
    srcUrl,
    mimeType: menuItem.mimeType,
    settings
  };

  // Always include the latest stored quality settings with each conversion request.
  console.log("Background sending convert message", message);
  const response = await sendMessageToOffscreen(message);

  if (!response?.dataUrl) {
    console.error("Conversion failed:", response);
    throw new Error("The converted picture data was empty.");
  }

  await downloadFile({
    url: response.dataUrl,
    filename: buildDownloadFilename(srcUrl, menuItem.extension),
    saveAs: true,
    conflictAction: "uniquify"
  });
}

async function getQualitySettings() {
  const storedSettings = await chrome.storage.sync.get(DEFAULT_SETTINGS);

  return {
    jpegQuality: normalizeQuality(
      storedSettings.jpegQuality,
      DEFAULT_SETTINGS.jpegQuality
    ),
    webpQuality: normalizeQuality(
      storedSettings.webpQuality,
      DEFAULT_SETTINGS.webpQuality
    )
  };
}

// Reuse one hidden converter document so repeated saves do not race creation.
async function ensureOffscreenDocument() {
  if (await hasOffscreenDocument()) {
    console.log("Runtime contexts:", await getOffscreenContexts());
    return;
  }

  if (!creatingOffscreenDocument) {
    creatingOffscreenDocument = chrome.offscreen.createDocument({
      url: OFFSCREEN_DOCUMENT_PATH,
      reasons: [chrome.offscreen.Reason.BLOBS],
      justification: "Convert pictures locally with canvas before download."
    });
  }

  try {
    await creatingOffscreenDocument;
  } finally {
    creatingOffscreenDocument = null;
  }

  console.log("Runtime contexts:", await getOffscreenContexts());
}

async function hasOffscreenDocument() {
  if (typeof chrome.runtime.getContexts === "function") {
    const contexts = await getOffscreenContexts();

    return contexts.length > 0;
  }

  const offscreenUrl = chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH);
  const matchedClients = await self.clients.matchAll();

  return matchedClients.some((client) => client.url === offscreenUrl);
}

async function getOffscreenContexts() {
  const offscreenUrl = chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH);

  if (typeof chrome.runtime.getContexts !== "function") {
    return [];
  }

  return chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [offscreenUrl]
  });
}

function buildDownloadFilename(srcUrl, extension) {
  const fallbackName = "picture";

  if (srcUrl.startsWith("data:")) {
    return `${fallbackName}.${extension}`;
  }

  let lastSegment = fallbackName;

  try {
    const url = new URL(srcUrl);
    const pathParts = url.pathname.split("/").filter(Boolean);

    if (pathParts.length > 0) {
      lastSegment = safeDecodeURIComponent(pathParts[pathParts.length - 1]);
    }
  } catch (error) {
    logError(error);
  }

  const baseName = sanitizeFilenamePart(stripFileExtension(lastSegment));

  return `${baseName || fallbackName}.${extension}`;
}

function stripFileExtension(filename) {
  const lastDotIndex = filename.lastIndexOf(".");

  if (lastDotIndex <= 0) {
    return filename;
  }

  return filename.slice(0, lastDotIndex);
}

function sanitizeFilenamePart(value) {
  return value
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/[. ]+$/g, "")
    .trim();
}

function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
}

function normalizeQuality(value, fallback) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(1, Math.max(0, numericValue));
}

function removeAllContextMenus() {
  return new Promise((resolve, reject) => {
    chrome.contextMenus.removeAll(() => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve();
    });
  });
}

function createContextMenu(menuItem) {
  return new Promise((resolve, reject) => {
    chrome.contextMenus.create(
      {
        id: menuItem.id,
        title: menuItem.title,
        contexts: ["image"]
      },
      () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        resolve();
      }
    );
  });
}

async function sendMessageToOffscreen(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (response?.error) {
        reject(new Error(response.error));
      } else {
        resolve(response);
      }
    });
  });
}

function downloadFile(options) {
  return new Promise((resolve, reject) => {
    chrome.downloads.download(options, (downloadId) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(downloadId);
    });
  });
}

function logError(error) {
  console.error("[Save Picture As]", error);
}
