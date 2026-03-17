const DEFAULT_SETTINGS = {
  jpegQuality: 0.92,
  webpQuality: 0.9
};
const SETTING_KEYS = ["jpegQuality", "webpQuality"];

const jpegQualityInput = document.getElementById("jpeg-quality");
const webpQualityInput = document.getElementById("webp-quality");
const jpegQualityValue = document.getElementById("jpeg-quality-value");
const webpQualityValue = document.getElementById("webp-quality-value");
const SETTING_INPUTS = {
  jpegQuality: jpegQualityInput,
  webpQuality: webpQualityInput
};
const SETTING_LABELS = {
  jpegQuality: jpegQualityValue,
  webpQuality: webpQualityValue
};
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
  for (const key of SETTING_KEYS) {
    const input = SETTING_INPUTS[key];

    input.addEventListener("input", () => {
      handleSliderInput(key, input);
    });

    input.addEventListener("change", () => {
      saveSetting(key, input.value).catch(logError);
    });
  }
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
  for (const key of SETTING_KEYS) {
    updateSettingValue(key, settings[key]);
  }
}

function applyStoredSettings(settings) {
  for (const key of SETTING_KEYS) {
    if (!touchedSettings[key]) {
      updateSettingValue(key, settings[key]);
    }
  }
}

function updateSettingValue(key, quality) {
  const percentage = formatPercentage(quality);
  const input = SETTING_INPUTS[key];
  const valueLabel = SETTING_LABELS[key];

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
