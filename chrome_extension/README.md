# Helix Chrome Extension 

## 📖 Contents

1. [Purpose](#1-purpose)
2. [Repository Structure](#2-repository-structure)
3. [Features](#3-features)
4. [Installation and Setup](#4-installation-and-setup)

---

### 1. Purpose

![Helix Logo](./assets/helix_logo.png) 

The Helix Chrome Extension is designed to ensure seamless and passive knowledge acquisition. It allows users to capture context from any web page and instantly pipe it into their Helix Memory Library.

* **Key Function:** One-click saving of the current page's URL and title (or selected content) to the Helix backend service.

---

### 2. Repository Structure

Based on the files shown in the directory, here is an explanation of each component:

| File/Folder | Type | Purpose |
| :--- | :--- | :--- |
| **`icons/`** | Directory | Contains all icon assets (e.g., PNGs/SVGs) used by the browser extension for the toolbar, badge, and manifest. |
| **`content.js`** | JavaScript | The script that runs in the context of every web page. It handles interactions with the page content (e.g., getting the current URL, title, or selected text) and communicating with the background script. |
| **`helix-logo.svg`** | SVG Asset | The scalable vector graphic file for the Helix logo, likely used in the popup or icons folder. |
| **`manifest.json`** | Configuration | The single, required entry point for the extension. It defines the extension's name, version, permissions, background scripts, content scripts, and UI elements (like the popup). |
| **`pencil.svg`** | SVG Asset | An additional asset, likely used for the extension's action button or a visual cue within the popup UI. |
| **`popup.html`** | HTML UI | Defines the structure and appearance of the small window that appears when the user clicks the extension icon in the browser toolbar. |
| **`popup.js`** | JavaScript | The script that controls the logic and behavior of the `popup.html`. It handles user button clicks and sends messages to the background script to initiate the saving process. |

---

### 3. Features

The Helix Chrome Extension is focused on simplicity and efficiency to ensure rapid, non-disruptive knowledge ingestion.

* **One-Click Context Capture:** Save the active tab's URL and title to the Helix memory library with a single click on the toolbar icon.
* **Popup Confirmation:** A simple `popup.html` interface provides quick confirmation or a brief status message after content is captured.
* **Background Communication:** Utilizes `content.js` and `popup.js` to securely send data to the Helix backend via the extension's background service.
* **Lightweight Design:** Contains minimal UI and logic, ensuring the extension is fast, does not interfere with browsing performance, and only uses resources when actively clicked.

---

### 4. Installation and Setup

Since the Chrome Extension is designed to work with the local Helix service, it must be loaded manually as an unpacked extension in your browser's Developer Mode.

#### Prerequisites

* The main Helix services (`service/` and `helix-mcp/`) must be running locally.
* Google Chrome or a Chromium-based browser (Brave, Edge, etc.) must be installed.

#### Steps to Load the Extension

1.  **Open Extension Management:** In your Chrome browser, navigate to the extensions page by typing:
    ```
    chrome://extensions/
    ```
2.  **Enable Developer Mode:** In the top-right corner of the extensions page, toggle **Developer mode** to ON.
3.  **Load Unpacked:** Click the **Load unpacked** button that appears.
4.  **Select Directory:** Navigate to and select the entire `chrome_extension/` directory within your Helix repository.

The Helix logo should now appear in your browser's toolbar, indicating the extension is active and ready to use.

