const DEFAULT_SETTINGS = {
  jpegQuality: 0.92,
  webpQuality: 0.9
};

const jpegQualityInput = document.getElementById("jpeg-quality");
const webpQualityInput = document.getElementById("webp-quality");
const jpegQualityValue = document.getElementById("jpeg-quality-value");
const webpQualityValue = document.getElementById("webp-quality-value");
let storageWriteQueue = Promise.resolve();

initializePopup().catch((error) => {
  console.error("[Save Picture As]", error);
});

async function initializePopup() {
  const storedSettings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  const settings = {
    jpegQuality: normalizeQuality(
      storedSettings.jpegQuality,
      DEFAULT_SETTINGS.jpegQuality
    ),
    webpQuality: normalizeQuality(
      storedSettings.webpQuality,
      DEFAULT_SETTINGS.webpQuality
    )
  };

  applySettingsToUi(settings);

  jpegQualityInput.addEventListener("input", () => {
    saveSetting("jpegQuality", jpegQualityInput.value).catch(logError);
  });

  webpQualityInput.addEventListener("input", () => {
    saveSetting("webpQuality", webpQualityInput.value).catch(logError);
  });
}

async function saveSetting(key, value) {
  const quality = normalizeQuality(value, DEFAULT_SETTINGS[key]);

  updateSettingValue(key, quality);

  storageWriteQueue = storageWriteQueue
    .catch(() => undefined)
    .then(() =>
      chrome.storage.sync.set({
        [key]: quality
      })
    );

  await storageWriteQueue;
}

function applySettingsToUi(settings) {
  updateSettingValue("jpegQuality", settings.jpegQuality);
  updateSettingValue("webpQuality", settings.webpQuality);
}

function updateSettingValue(key, quality) {
  const percentage = formatPercentage(quality);

  if (key === "jpegQuality") {
    jpegQualityInput.value = String(quality);
    jpegQualityInput.style.setProperty(
      "--slider-progress",
      formatSliderProgress(quality)
    );
    jpegQualityValue.textContent = percentage;
    return;
  }

  webpQualityInput.value = String(quality);
  webpQualityInput.style.setProperty(
    "--slider-progress",
    formatSliderProgress(quality)
  );
  webpQualityValue.textContent = percentage;
}

function formatPercentage(value) {
  return `${Math.round(value * 100)}%`;
}

function formatSliderProgress(value) {
  return `${Math.round(value * 100)}%`;
}

function normalizeQuality(value, fallback) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(1, Math.max(0, numericValue));
}

function logError(error) {
  console.error("[Save Picture As]", error);
}
