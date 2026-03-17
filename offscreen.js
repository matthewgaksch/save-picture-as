const DEFAULT_QUALITY = 0.92;

const MIME_TYPES = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp"
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "convert-picture") {
    return undefined;
  }

  convertPicture(message)
    .then((dataUrl) => {
      sendResponse({ dataUrl });
    })
    .catch((error) => {
      console.error("[Save Picture As]", error);
      sendResponse({ error: error.message });
    });

  return true;
});

async function convertPicture({ srcUrl, format }) {
  const mimeType = MIME_TYPES[format];

  if (!mimeType) {
    throw new Error(`Unsupported picture format: ${format}`);
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
      willReadFrequently: format === "jpeg"
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
      format === "jpeg" &&
      hasTransparency(sourceContext, bitmap.width, bitmap.height)
    ) {
      outputContext.fillStyle = "#ffffff";
      outputContext.fillRect(0, 0, bitmap.width, bitmap.height);
    }

    outputContext.drawImage(sourceCanvas, 0, 0);

    const quality = format === "png" ? undefined : DEFAULT_QUALITY;
    const convertedBlob = await canvasToBlob(outputCanvas, mimeType, quality);

    return blobToDataUrl(convertedBlob);
  } finally {
    bitmap.close();
  }
}

async function fetchSourceBlob(srcUrl) {
  const response = await fetch(srcUrl);

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
