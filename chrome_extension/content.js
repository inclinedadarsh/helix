function detectSite() {
  const hostname = window.location.hostname;
  if (hostname.includes("github.com")) return "github";
  if (hostname.includes("youtube.com")) return "youtube";
  if (hostname.includes("linkedin.com")) return "linkedin";
  return "default";
}

function getSiteStyles(site) {
  return {
    github: {
      bg: "#21262d",
      hoverBg: "#30363d",
      color: "#8b949e",
      hoverColor: "#c9d1d9",
      border: "1px solid #30363d",
      radius: "6px",
    },
    youtube: {
      bg: "rgba(255,255,255,0.1)",
      hoverBg: "rgba(255,255,255,0.2)",
      color: "#aaa",
      hoverColor: "#fff",
      border: "1px solid rgba(255,255,255,0.1)",
      radius: "2px",
    },
    linkedin: {
      bg: "transparent",
      hoverBg: "rgba(0,0,0,0.08)",
      color: "#666",
      hoverColor: "#000",
      border: "1px solid #d0d0d0",
      radius: "2px",
    },
    default: {
      bg: "rgba(0,0,0,0.05)",
      hoverBg: "rgba(0,0,0,0.1)",
      color: "#666",
      hoverColor: "#333",
      border: "1px solid rgba(0,0,0,0.1)",
      radius: "4px",
    },
  }[site];
}

function createSaveButton() {
  if (document.getElementById("url-saver-extension-btn")) return;

  const site = detectSite();
  const styles = getSiteStyles(site);

  const button = document.createElement("button");
  button.id = "url-saver-extension-btn";
  button.textContent = "Save";

  button.style.cssText = `
    position:fixed;
    bottom:20px;
    right:20px;
    background:${styles.bg};
    color:${styles.color};
    border:${styles.border};
    border-radius:${styles.radius};
    padding:6px 12px;
    cursor:pointer;
    z-index:999999;
    font-size:13px;
    font-family:sans-serif;
    transition:all .2s ease;
    opacity:.7;
  `;

  button.addEventListener("mouseenter", () => {
    button.style.background = styles.hoverBg;
    button.style.color = styles.hoverColor;
    button.style.opacity = "1";
  });
  button.addEventListener("mouseleave", () => {
    button.style.background = styles.bg;
    button.style.color = styles.color;
    button.style.opacity = ".7";
  });

  button.addEventListener("click", async () => {
    if (button.classList.contains("busy")) return;
    button.classList.add("busy");
    button.textContent = "Saving...";
    button.style.cursor = "wait";

    try {
      // Get username from storage
      const result = await chrome.storage.local.get(['githubUsername']);
      const username = result.githubUsername;

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

      const res = await fetch("http://127.0.0.1:8000/upload-single-link", {
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
