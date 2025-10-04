// Constants
const API_ENDPOINT = "http://127.0.0.1:8000/upload-single-link";
const BUTTON_ID = "url-saver-extension-btn";
const STORAGE_KEY = "githubUsername";

// Consistent button styling
const BUTTON_STYLES = {
  bg: "rgba(0,0,0,0.8)",
  hoverBg: "rgba(0,0,0,0.9)",
  color: "#fff",
  hoverColor: "#fff",
  border: "1px solid rgba(0,0,0,0.2)",
  radius: "6px",
};

function createSaveButton() {
  if (document.getElementById(BUTTON_ID)) return;

  const button = document.createElement("button");
  button.id = BUTTON_ID;
  button.textContent = "Save";

  button.style.cssText = `
    position:fixed;
    bottom:20px;
    right:20px;
    background:${BUTTON_STYLES.bg};
    color:${BUTTON_STYLES.color};
    border:${BUTTON_STYLES.border};
    border-radius:${BUTTON_STYLES.radius};
    padding:8px 16px;
    cursor:pointer;
    z-index:999999;
    font-size:14px;
    font-family:sans-serif;
    transition:all .2s ease;
    opacity:.8;
    font-weight:500;
  `;

  button.addEventListener("mouseenter", () => {
    button.style.background = BUTTON_STYLES.hoverBg;
    button.style.color = BUTTON_STYLES.hoverColor;
    button.style.opacity = "1";
  });
  button.addEventListener("mouseleave", () => {
    button.style.background = BUTTON_STYLES.bg;
    button.style.color = BUTTON_STYLES.color;
    button.style.opacity = ".8";
  });

  button.addEventListener("click", async () => {
    if (button.classList.contains("busy")) return;
    button.classList.add("busy");
    button.textContent = "Saving...";
    button.style.cursor = "wait";

    try {
      // Get username from storage
      const result = await chrome.storage.local.get([STORAGE_KEY]);
      const username = result[STORAGE_KEY];

      if (!username) {
        button.textContent = "No Username";
        setTimeout(() => {
          button.textContent = "Save";
          button.classList.remove("busy");
          button.style.cursor = "pointer";
        }, 2000);
        return;
      }

      const payload = {
        link: window.location.href,
        username: username
      };

      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log("URL saved:", data);

      button.textContent = "Saved!";
    } catch (err) {
      console.error("Error saving URL:", err);
      button.textContent = "Error";
    }

    setTimeout(() => {
      button.textContent = "Save";
      button.classList.remove("busy");
      button.style.cursor = "pointer";
    }, 2000);
  });

  document.body.appendChild(button);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", createSaveButton);
} else {
  createSaveButton();
}
