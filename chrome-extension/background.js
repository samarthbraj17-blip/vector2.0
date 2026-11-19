

chrome.runtime.onInstalled.addListener(() => {
  console.log("VECTOR installed!");

  chrome.sidePanel.setPanelBehavior({
    openPanelOnActionClick: true
  });
});

async function openWebsite(url) {
  try {
    const parsed = new URL(url);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Invalid website address.");
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

async function searchGoogle(query) {
  return openWebsite(
    "https://www.google.com/search?q=" +
    encodeURIComponent(query)
  );
}

// FREE ONLINE WEB SEARCH
async function searchWeb(query) {
  try {
    const url =
      "https://html.duckduckgo.com/html/?q=" +
      encodeURIComponent(query);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "text/html"
      }
    });

    if (!response.ok) {
      throw new Error("Search service returned " + response.status);
    }

    const html = await response.text();

    return {
      success: true,
      html: html
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function getTabs() {
  const tabs = await chrome.tabs.query({});

  return tabs.map(tab => ({
    id: tab.id,
    title: tab.title,
    url: tab.url,
    active: tab.active
  }));
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  });

  return tabs.length ? tabs[0] : null;
}

async function readPage() {
  try {
    const tab = await getActiveTab();

    if (!tab || !tab.id) {
      throw new Error("No active tab.");
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.body.innerText
    });

    return {
      success: true,
      text: (results[0].result || "").slice(0, 15000)
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {

    const handleCommand = async () => {
      switch (message.type) {

        case "VECTOR_OPEN_URL":
          return openWebsite(message.url);

        case "VECTOR_SEARCH":
          return searchGoogle(message.query);

        case "VECTOR_WEB_SEARCH":
          return searchWeb(message.query);

        case "VECTOR_GET_TABS":
          return getTabs();

        case "VECTOR_GET_ACTIVE_TAB":
          return getActiveTab();

        case "VECTOR_SWITCH_TAB":
          await chrome.tabs.update(message.tabId, {
            active: true
          });
          return { success: true };

        case "VECTOR_CLOSE_TAB":
          await chrome.tabs.remove(message.tabId);
          return { success: true };

        case "VECTOR_READ_PAGE":
          return readPage();

        default:
          return {
            success: false,
            error: "Unknown command."
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

console.log("VECTOR online search engine ready!");
