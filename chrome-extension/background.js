
chrome.runtime.onInstalled.addListener(() => {
  console.log("VECTOR Chrome Assistant installed!");

  chrome.sidePanel.setPanelBehavior({
    openPanelOnActionClick: true
  });
});

// Open a website
async function openWebsite(url) {
  try {
    const parsed = new URL(url);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Only HTTP and HTTPS websites are allowed.");
    }

    const tab = await chrome.tabs.create({
      url: parsed.href,
      active: true
    });

    return { success: true, tabId: tab.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Search Google
async function searchGoogle(query) {
  const url =
    "https://www.google.com/search?q=" +
    encodeURIComponent(query);

  return openWebsite(url);
}

// Get all Chrome tabs
async function getTabs() {
  const tabs = await chrome.tabs.query({});

  return tabs.map(tab => ({
    id: tab.id,
    title: tab.title,
    url: tab.url,
    active: tab.active
  }));
}

// Get active tab
async function getActiveTab() {
  const tabs = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  });

  return tabs.length ? tabs[0] : null;
}

// Read text from the active webpage
async function readPage() {
  try {
    const tab = await getActiveTab();

    if (!tab || !tab.id) {
      throw new Error("No active tab found.");
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.body.innerText
    });

    return {
      success: true,
      text: results[0].result.slice(0, 15000)
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Handle VECTOR commands
chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {

    const handleCommand = async () => {
      switch (message.type) {

        case "VECTOR_OPEN_URL":
          return await openWebsite(message.url);

        case "VECTOR_SEARCH":
          return await searchGoogle(message.query);

        case "VECTOR_GET_TABS":
          return await getTabs();

        case "VECTOR_GET_ACTIVE_TAB":
          return await getActiveTab();

        case "VECTOR_SWITCH_TAB":
          await chrome.tabs.update(message.tabId, {
            active: true
          });
          return { success: true };

        case "VECTOR_CLOSE_TAB":
          await chrome.tabs.remove(message.tabId);
          return { success: true };

        case "VECTOR_READ_PAGE":
          return await readPage();

        default:
          return {
            success: false,
            error: "Unknown VECTOR command."
          };
      }
    };

    handleCommand()
      .then(sendResponse)
      .catch(error => sendResponse({
        success: false,
        error: error.message
      }));

    return true;
  }
);

console.log("VECTOR background system ready!");
