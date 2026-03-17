console.log("Offscreen loaded");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Offscreen raw message:", message, sender);

  if (message?.type !== "convert") {
    return;
  }

  (async () => {
    try {
      console.log("Offscreen received convert message");
      const dataUrl = await convertPicture(message);
      console.log("Offscreen sending response");
      sendResponse({ dataUrl });
    } catch (error) {
      console.error("[Save Picture As]", error);
      sendResponse({
        error: error?.message || "Conversion failed"
      });
    }
  })();

  // Keep the message channel open while the offscreen conversion finishes.
  return true;
});

async function convertPicture({ srcUrl, mimeType, settings = {} }) {
  if (!isSupportedMimeType(mimeType)) {
    throw new Error(`Unsupported picture format: ${mimeType}`);
  }

  const sourceBlob = await fetchSourceBlob(srcUrl);
  const bitmap = await createImageBitmap(sourceBlob);

  try {
    if (!bitmap.width || !bitmap.height) {
      throw new Error("The selected picture has invalid dimensions.");
    }

    const sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = bitmap.width;
    sourceCanvas.height = bitmap.height;

    const sourceContext = sourceCanvas.getContext("2d", {
      willReadFrequently: mimeType === "image/jpeg"
    });

    if (!sourceContext) {
      throw new Error("Could not create the source canvas.");
    }

    sourceContext.drawImage(bitmap, 0, 0);

    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = bitmap.width;
    outputCanvas.height = bitmap.height;

    const outputContext = outputCanvas.getContext("2d");

    if (!outputContext) {
      throw new Error("Could not create the output canvas.");
    }

    // JPEG cannot store transparency, so transparent pixels are flattened to white.
    if (
      mimeType === "image/jpeg" &&
      hasTransparency(sourceContext, bitmap.width, bitmap.height)
    ) {
      outputContext.fillStyle = "#ffffff";
      outputContext.fillRect(0, 0, bitmap.width, bitmap.height);
    }

    outputContext.drawImage(sourceCanvas, 0, 0);

    const quality = getOutputQuality(mimeType, settings);
    const convertedBlob = await canvasToBlob(outputCanvas, mimeType, quality);

    return blobToDataUrl(convertedBlob);
  } finally {
    bitmap.close();
  }
}

function getOutputQuality(mimeType, settings) {
  if (mimeType === "image/jpeg") {
    return normalizeQuality(settings?.jpegQuality, 0.92);
  }

  if (mimeType === "image/webp") {
    return normalizeQuality(settings?.webpQuality, 0.9);
  }

  return undefined;
}

function isSupportedMimeType(mimeType) {
  return (
    mimeType === "image/png" ||
    mimeType === "image/jpeg" ||
    mimeType === "image/webp"
  );
}

async function fetchSourceBlob(srcUrl) {
  const response = await fetch(srcUrl, {
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error(
      `Could not fetch the selected picture (${response.status} ${response.statusText}).`
    );
  }

  return response.blob();
}

function hasTransparency(context, width, height) {
  const { data } = context.getImageData(0, 0, width, height);

  for (let index = 3; index < data.length; index += 4) {
    if (data[index] < 255) {
      return true;
    }
  }

  return false;
}

function normalizeQuality(value, fallback) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(1, Math.max(0, numericValue));
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not create the converted picture."));
          return;
        }

        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(reader.error || new Error("Could not serialize the picture."));
    };

    reader.onloadend = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Could not serialize the picture."));
        return;
      }

      resolve(reader.result);
    };

    reader.readAsDataURL(blob);
  });
}
