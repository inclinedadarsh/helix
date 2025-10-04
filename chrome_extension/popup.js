// Constants
const API_ENDPOINT = "http://127.0.0.1:8000/upload-single-link";
const STORAGE_KEY = "githubUsername";

document.addEventListener("DOMContentLoaded", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Get elements
  const usernameSetup = document.getElementById("usernameSetup");
  const mainFunctionality = document.getElementById("mainFunctionality");
  const usernameInput = document.getElementById("usernameInput");
  const saveUsernameBtn = document.getElementById("saveUsernameBtn");
  const usernameStatus = document.getElementById("usernameStatus");
  const currentUsername = document.getElementById("currentUsername");
  const editUsernameBtn = document.getElementById("editUsernameBtn");
  const urlInput = document.getElementById("urlInput");
  const saveBtn = document.getElementById("saveBtn");
  const status = document.getElementById("status");

  // Check if username exists in chrome storage
  const result = await chrome.storage.local.get([STORAGE_KEY]);
  const savedUsername = result[STORAGE_KEY];

  if (!savedUsername || savedUsername.trim() === "") {
    // Show username setup state
    showUsernameSetup();
  } else {
    // Show main functionality state
    showMainFunctionality(savedUsername);
  }

  function showUsernameSetup() {
    usernameSetup.classList.add("active");
    mainFunctionality.classList.remove("active");
  }

  function showMainFunctionality(username) {
    usernameSetup.classList.remove("active");
    mainFunctionality.classList.add("active");
    currentUsername.textContent = username;
    urlInput.value = tab.url;
  }

  // Username setup functionality
  saveUsernameBtn.addEventListener("click", async () => {
    const username = usernameInput.value.trim();

    if (!username) {
      usernameStatus.textContent = "Please enter a username";
      usernameStatus.className = "status error";
      return;
    }

    saveUsernameBtn.disabled = true;
    saveUsernameBtn.textContent = "Saving...";
    usernameStatus.textContent = "";

    try {
      // Save username to chrome storage
      await chrome.storage.local.set({ [STORAGE_KEY]: username });

      // Show success and switch to main functionality
      usernameStatus.textContent = "Username saved successfully!";
      usernameStatus.className = "status success";

      setTimeout(() => {
        showMainFunctionality(username);
      }, 1000);

    } catch (err) {
      console.error("Error saving username:", err);
      usernameStatus.textContent = "Failed to save username";
      usernameStatus.className = "status error";
    }

    setTimeout(() => {
      saveUsernameBtn.disabled = false;
      saveUsernameBtn.textContent = "Save Username";
    }, 2000);
  });

  // Edit username functionality
  editUsernameBtn.addEventListener("click", () => {
    usernameInput.value = currentUsername.textContent;
    showUsernameSetup();
  });

  // Allow Enter key to save username
  usernameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      saveUsernameBtn.click();
    }
  });

  // Save page functionality
  saveBtn.addEventListener("click", async () => {
    if (saveBtn.classList.contains("loading")) return;

    const result = await chrome.storage.local.get([STORAGE_KEY]);
    const username = result[STORAGE_KEY];
    if (!username) {
      status.textContent = "Please set up your username first";
      status.className = "status error";
      return;
    }

    saveBtn.classList.add("loading");
    saveBtn.textContent = "Saving...";
    status.textContent = "";

    try {
      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          link: tab.url,
          username: username
        }),
      });

      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      console.log("Saved:", data);

      saveBtn.textContent = "Saved!";
      status.textContent = "Page saved successfully.";
      status.className = "status success";
    } catch (err) {
      console.error("Error:", err);
      saveBtn.textContent = "Error";
      status.textContent = "Failed to save page.";
      status.className = "status error";
    }

    setTimeout(() => {
      saveBtn.classList.remove("loading");
      saveBtn.textContent = "Save";
    }, 2000);
  });
});
