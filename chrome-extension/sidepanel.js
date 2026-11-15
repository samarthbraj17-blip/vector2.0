
const chat = document.getElementById("chat");
const input = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");

function addMessage(message, sender = "bot") {
  const div = document.createElement("div");
  div.className = "message " + sender;
  div.textContent = message;
  chat.appendChild(div);
  div.scrollIntoView({ behavior: "smooth", block: "end" });
}

async function sendCommand(type, data = {}) {
  try {
    return await chrome.runtime.sendMessage({
      type,
      ...data
    });
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function processCommand(command) {
  const text = command.trim();
  const lower = text.toLowerCase();

  if (!text) return;

  addMessage(text, "user");

  // Open websites
  if (
    lower.startsWith("open ") ||
    lower.startsWith("go to ") ||
    lower.startsWith("visit ")
  ) {
    let site = text.replace(/^(open|go to|visit)\s+/i, "").trim();

    const websites = {
      "youtube": "https://www.youtube.com",
      "google": "https://www.google.com",
      "gmail": "https://mail.google.com",
      "wikipedia": "https://www.wikipedia.org",
      "github": "https://github.com",
      "chatgpt": "https://chatgpt.com",
      "facebook": "https://www.facebook.com",
      "instagram": "https://www.instagram.com"
    };

    const url = websites[site.toLowerCase()] ||
      (/^https?:\/\//i.test(site) ? site :
      /^[\w-]+(\.[\w-]+)+([/?#].*)?$/i.test(site)
        ? "https://" + site
        : null);

    if (!url) {
      addMessage("Please give me a valid website address.");
      return;
    }

    const result = await sendCommand("VECTOR_OPEN_URL", { url });

    addMessage(
      result.success
        ? "Opening " + site + " for you!"
        : "I couldn't open that website: " + result.error
    );
    return;
  }

  // Google search
  if (
    lower.startsWith("search ") ||
    lower.startsWith("google ")
  ) {
    const query = text.replace(/^(search|google)\s+/i, "");

    const result = await sendCommand("VECTOR_SEARCH", {
      query
    });

    addMessage(
      result.success
        ? "Searching Google for: " + query
        : "Search failed: " + result.error
    );
    return;
  }

  // Show all tabs
  if (
    lower.includes("show tabs") ||
    lower.includes("list tabs") ||
    lower.includes("all tabs")
  ) {
    const tabs = await sendCommand("VECTOR_GET_TABS");

    if (!Array.isArray(tabs)) {
      addMessage("I couldn't retrieve your tabs.");
      return;
    }

    if (tabs.length === 0) {
      addMessage("No open tabs found.");
      return;
    }

    let result = "Here are your open tabs:\n\n";

    tabs.forEach((tab, index) => {
      result += (index + 1) + ". " +
        (tab.title || "Untitled") +
        (tab.active ? " (ACTIVE)" : "") + "\n";
    });

    addMessage(result);
    return;
  }

  // Read current webpage
  if (
    lower.includes("read page") ||
    lower.includes("read this page") ||
    lower.includes("what is on this page") ||
    lower.includes("summarize this page")
  ) {
    addMessage("Reading the current webpage...");

    const result = await sendCommand("VECTOR_READ_PAGE");

    if (result && result.success) {
      addMessage(
        "Here is the webpage text:\n\n" +
        (result.text || "No readable text found.")
      );
    } else {
      addMessage(
        "I couldn't read this page. " +
        (result?.error || "")
      );
    }
    return;
  }

  // Close active tab
  if (
    lower === "close tab" ||
    lower === "close this tab"
  ) {
    const tab = await sendCommand("VECTOR_GET_ACTIVE_TAB");

    if (!tab || !tab.id) {
      addMessage("I couldn't find the active tab.");
      return;
    }

    const result = await sendCommand("VECTOR_CLOSE_TAB", {
      tabId: tab.id
    });

    addMessage(
      result.success
        ? "Active tab closed."
        : "I couldn't close the tab."
    );
    return;
  }

  // Switch to a tab by its number
  const switchMatch = lower.match(
    /^(?:switch to|go to) tab (\d+)$/
  );

  if (switchMatch) {
    const tabs = await sendCommand("VECTOR_GET_TABS");
    const index = Number(switchMatch[1]) - 1;

    if (!Array.isArray(tabs) || !tabs[index]) {
      addMessage("That tab number doesn't exist.");
      return;
    }

    const result = await sendCommand(
      "VECTOR_SWITCH_TAB",
      { tabId: tabs[index].id }
    );

    addMessage(
      result.success
        ? "Switched to tab " + (index + 1) + "."
        : "I couldn't switch tabs."
    );
    return;
  }

  addMessage(
    "I'm still learning! Try one of these commands:\n\n" +
    "• Open YouTube\n" +
    "• Open Google\n" +
    "• Search Arduino projects\n" +
    "• Show tabs\n" +
    "• Read this page\n" +
    "• Close tab\n" +
    "• Switch to tab 2"
  );
}

sendButton.addEventListener("click", () => {
  processCommand(input.value);
  input.value = "";
});

input.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    sendButton.click();
  }
});

// Quick command buttons
document.querySelectorAll("[data-command]").forEach(button => {
  button.addEventListener("click", () => {
    const command = button.dataset.command;

    if (command === "tabs") {
      processCommand("Show tabs");
    }

    if (command === "page") {
      processCommand("Read this page");
    }
  });
});

addMessage("VECTOR command system initialized. Ready!");
