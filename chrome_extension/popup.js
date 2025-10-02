document.addEventListener("DOMContentLoaded", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  document.getElementById("urlPreview").textContent = tab.url;

  const saveBtn = document.getElementById("saveBtn");
  const status = document.getElementById("status");

  saveBtn.addEventListener("click", async () => {
    if (saveBtn.classList.contains("loading")) return;

    saveBtn.classList.add("loading");
    saveBtn.textContent = "Saving...";
    status.textContent = "";

    try {
      const res = await fetch("http://127.0.0.1:8000/process-urls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: [tab.url] }),
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
