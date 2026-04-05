# Save Picture As…

[![Buy Me a Coffee](https://img.shields.io/badge/Support-Buy%20Me%20a%20Coffee-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/matthewgaksch)
![Chrome](https://img.shields.io/badge/Chrome-Extension-blue)
![Edge](https://img.shields.io/badge/Edge-Extension-blue)
![Chromium](https://img.shields.io/badge/Chromium-Compatible-lightgrey)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)

A fast, privacy-friendly browser extension that lets you save pictures as **PNG, JPEG, or WebP** — directly from the right-click menu.

---

## 🚀 Install

[link-chrome]: https://chromewebstore.google.com/detail/save-picture-as/mafcbifdngfjabbmllfapnodmafpijpm "Chrome Web Store"
[link-edge]: https://microsoftedge.microsoft.com/addons/detail/save-picture-as/ndnaijongmaianoggepapofmiemjnmmc "Microsoft Edge Add-ons"

[<img src="https://raw.githubusercontent.com/alrra/browser-logos/main/src/chrome/chrome.svg" width="48" alt="Chrome" valign="middle">][link-chrome]
[<img valign="middle" src="https://img.shields.io/chrome-web-store/v/mafcbifdngfjabbmllfapnodmafpijpm.svg?label=%20">][link-chrome]
**Chrome Web Store**

[<img src="https://raw.githubusercontent.com/alrra/browser-logos/main/src/edge/edge.svg" width="48" alt="Edge" valign="middle">][link-edge]
[<img valign="middle" src="https://img.shields.io/chrome-web-store/v/mafcbifdngfjabbmllfapnodmafpijpm.svg?label=%20">][link-edge]
**Microsoft Edge Add-ons**

Supports all Chromium-based browsers (Chrome, Edge, Brave, Vivaldi, Arc).

---

## ✨ Features

- Right-click to save pictures in different formats
- Supports **PNG, JPEG, WebP**
- Adjustable quality for JPEG and WebP
- Quick presets:
  - **High (92%)**
  - **Balanced (80%)**
  - **Small (60%)**
- Smart transparency handling for JPEG
- Clean, minimal popup UI
- Fully local processing (no uploads)
- Fast and lightweight

---

## 💡 Why

Most image-saving tools either:
- reduce quality, or  
- rely on external services  

**Save Picture As** keeps everything:
- local  
- fast  
- private  

No uploads. No tracking. Just works.

---

## 🖼 Screenshots

### Popup UI – Adjust quality and presets
![Popup Screenshot](./screenshots/popup.png)

### Context Menu – Save as PNG, JPEG, or WebP
![Context Menu Screenshot](./screenshots/context-menu.png)

---

## 🛠 Installation (Manual)

1. Open `chrome://extensions/`
2. Enable **Developer Mode**
3. Click **Load unpacked**
4. Select this folder

---

## 📦 Usage

- Right-click any picture
- Choose:
  - **Save Picture as PNG**
  - **Save Picture as JPEG**
  - **Save Picture as WebP**
- Optionally adjust quality via the popup

---

## 🔒 Privacy

Save Picture As **does not collect, store, or transmit any personal data.**

- All processing happens locally
- No uploads
- No tracking
- No analytics
- No third-party services

Permissions are used strictly for functionality:

- `contextMenus` → add right-click options  
- `downloads` → save files  
- `offscreen` → canvas-based conversion  
- `storage` → save quality preferences  
- Host permissions → fetch selected image only  

---

## ⚙️ Development

- Manifest V3  
- Vanilla JavaScript  
- Offscreen document (canvas processing)  
- Lightweight popup UI  

---

## ❤️ Support

If you like this project:

- ⭐ Star the repo  
- ☕ Support: https://buymeacoffee.com/matthewgaksch  

---

## 📄 License

MIT License

---

This project is an independent implementation and is not affiliated with or endorsed by any browser vendors.

---

Made with ❤️ by Matthew Gaksch
