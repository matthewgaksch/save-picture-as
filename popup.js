const DEFAULT_SETTINGS = {
  jpegQuality: 0.92,
  webpQuality: 0.9
};

const jpegQualityInput = document.getElementById("jpeg-quality");
const webpQualityInput = document.getElementById("webp-quality");
const jpegQualityValue = document.getElementById("jpeg-quality-value");
const webpQualityValue = document.getElementById("webp-quality-value");
const touchedSettings = {
  jpegQuality: false,
  webpQuality: false
};

initializePopup().catch((error) => {
  console.error("[Save Picture As]", error);
});

async function initializePopup() {
  registerSliderListeners();
  applySettingsToUi(DEFAULT_SETTINGS);

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

  applyStoredSettings(settings);
}

function registerSliderListeners() {
  jpegQualityInput.addEventListener("input", () => {
    handleSliderInput("jpegQuality", jpegQualityInput);
  });

  jpegQualityInput.addEventListener("change", () => {
    saveSetting("jpegQuality", jpegQualityInput.value).catch(logError);
  });

  webpQualityInput.addEventListener("input", () => {
    handleSliderInput("webpQuality", webpQualityInput);
  });

  webpQualityInput.addEventListener("change", () => {
    saveSetting("webpQuality", webpQualityInput.value).catch(logError);
  });
}

function handleSliderInput(key, input) {
  touchedSettings[key] = true;
  updateSettingValue(
    key,
    normalizeQuality(input.value, DEFAULT_SETTINGS[key])
  );
}

async function saveSetting(key, value) {
  const quality = normalizeQuality(value, DEFAULT_SETTINGS[key]);

  updateSettingValue(key, quality);
  await chrome.storage.sync.set({
    [key]: quality
  });
}

function applySettingsToUi(settings) {
  updateSettingValue("jpegQuality", settings.jpegQuality);
  updateSettingValue("webpQuality", settings.webpQuality);
}

function applyStoredSettings(settings) {
  if (!touchedSettings.jpegQuality) {
    updateSettingValue("jpegQuality", settings.jpegQuality);
  }

  if (!touchedSettings.webpQuality) {
    updateSettingValue("webpQuality", settings.webpQuality);
  }
}

function updateSettingValue(key, quality) {
  const percentage = formatPercentage(quality);
  const input =
    key === "jpegQuality" ? jpegQualityInput : webpQualityInput;
  const valueLabel =
    key === "jpegQuality" ? jpegQualityValue : webpQualityValue;

  input.value = String(quality);
  input.style.setProperty("--slider-progress", formatSliderProgress(input));
  valueLabel.textContent = percentage;
}

function formatPercentage(value) {
  return `${Math.round(value * 100)}%`;
}

function formatSliderProgress(input) {
  const min = Number(input.min);
  const max = Number(input.max);
  const value = Number(input.value);

  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    return "0%";
  }

  const progress = ((value - min) / (max - min)) * 100;

  return `${Math.min(100, Math.max(0, progress))}%`;
}

function normalizeQuality(value, fallback) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(1, Math.max(0.1, numericValue));
}

function logError(error) {
  console.error("[Save Picture As]", error);
}
