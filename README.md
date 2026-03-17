# Save Picture As…

A simple, privacy-friendly Chrome extension to save pictures as PNG, JPEG, or WebP — fast, local, and private.

## Features

- Right-click to save pictures in different formats
- Supports **PNG, JPEG, WebP**
- Adjustable quality for JPEG and WebP
- Quick presets: **High (92%)**, **Balanced (80%)**, **Small (60%)**
- Smart transparency handling for JPEG
- Clean, minimal popup UI
- Fully local processing (no uploads)
- Fast and lightweight

## Screenshots

### Popup UI
![Popup Screenshot](./screenshots/popup.png)

### Context Menu
![Context Menu Screenshot](./screenshots/context-menu.png)

## Installation

1. Open `chrome://extensions/`
2. Enable **Developer Mode**
3. Click **Load unpacked**
4. Select this folder

## Usage

- Right-click on any picture
- Choose:
  - **Save Picture as PNG**
  - **Save Picture as JPEG**
  - **Save Picture as WebP**
- Optionally adjust quality via the extension popup

## Privacy

All picture conversion happens locally in your browser.

- No data is uploaded  
- No tracking  
- No external servers

## Permissions

- `contextMenus` → add right-click menu
- `downloads` → save converted files
- `offscreen` → run hidden local canvas conversion
- `storage` → save popup quality preferences

The extension also requests host access for `http://*/*` and `https://*/*` so it can fetch the original picture data for local conversion.

## Development

- Manifest V3
- Vanilla JavaScript
- Offscreen document for canvas processing
- Popup UI for quality settings

## License

MIT License

---

This project is an independent implementation and is not affiliated with or endorsed by any other browser extensions.

---

Made by Matthew Gaksch
