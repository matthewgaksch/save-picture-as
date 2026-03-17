# Save Picture As…

A simple, privacy-friendly Chrome extension to save pictures as PNG, JPEG, or WebP.

## Features

- Right-click to save pictures in different formats
- Supports PNG, JPEG, WebP
- Smart transparency handling
- Adjustable quality (JPEG/WebP)
- Fully local processing

## Privacy

All picture conversion happens locally in your browser. No data is collected or transmitted.

## Installation

1. Open `chrome://extensions`
2. Enable Developer Mode
3. Click `Load unpacked`
4. Select this folder

## Permissions

- `contextMenus` -> add right-click menu
- `downloads` -> save converted files
- `offscreen` -> run hidden local canvas conversion

The extension also requests host access for `http://*/*` and `https://*/*` so it can fetch the original picture data for local conversion.

## Development

- Manifest V3
- Vanilla JavaScript
- Offscreen document for canvas processing
