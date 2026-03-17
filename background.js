const OFFSCREEN_DOCUMENT_PATH = "offscreen.html";

const MENU_ITEMS = [
  {
    id: "save-picture-as-png",
    title: "Save Picture as PNG",
    format: "png",
    extension: "png"
  },
  {
    id: "save-picture-as-jpeg",
    title: "Save Picture as JPEG",
    format: "jpeg",
    extension: "jpeg"
  },
  {
    id: "save-picture-as-webp",
    title: "Save Picture as WebP",
    format: "webp",
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

  await ensureOffscreenDocument();

  const response = await sendMessageToOffscreen({
    type: "convert-picture",
    srcUrl,
    format: menuItem.format
  });

  if (!response?.dataUrl) {
    throw new Error("The converted picture data was empty.");
  }

  await downloadFile({
    url: response.dataUrl,
    filename: buildDownloadFilename(srcUrl, menuItem.extension),
    saveAs: true,
    conflictAction: "uniquify"
  });
}

// Reuse one hidden converter document so repeated saves do not race creation.
async function ensureOffscreenDocument() {
  if (await hasOffscreenDocument()) {
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
}

async function hasOffscreenDocument() {
  const offscreenUrl = chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH);

  if (typeof chrome.runtime.getContexts === "function") {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ["OFFSCREEN_DOCUMENT"],
      documentUrls: [offscreenUrl]
    });

    return contexts.length > 0;
  }

  const matchedClients = await self.clients.matchAll();

  return matchedClients.some((client) => client.url === offscreenUrl);
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

function sendMessageToOffscreen(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (response?.error) {
        reject(new Error(response.error));
        return;
      }

      resolve(response);
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
