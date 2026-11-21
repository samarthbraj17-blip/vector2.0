
chrome.runtime.onInstalled.addListener(() => {
  console.log("VECTOR installed!");

  chrome.sidePanel.setPanelBehavior({
    openPanelOnActionClick: true
  });
});

// OPEN A WEBSITE
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

// GOOGLE SEARCH
async function searchGoogle(query) {
  return openWebsite(
    "https://www.google.com/search?q=" +
    encodeURIComponent(query)
  );
}

// ONLINE SEARCH USING DUCKDUCKGO
async function searchWeb(query) {
  try {
    const body = new URLSearchParams();
    body.append("q", query);

    const response = await fetch(
      "https://html.duckduckgo.com/html/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "text/html"
        },
        body: body.toString()
      }
    );

    if (!response.ok) {
      throw new Error(
        "Search website returned status " + response.status
      );
    }

    const html = await response.text();

    if (!html || html.length < 500) {
      throw new Error("Search website returned an empty response.");
    }

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

// GET ALL OPEN TABS
async function getTabs() {
  const tabs = await chrome.tabs.query({});

  return tabs.map(tab => ({
    id: tab.id,
    title: tab.title,
    url: tab.url,
    active: tab.active
  }));
}

// GET ACTIVE TAB
async function getActiveTab() {
  const tabs = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  });

  return tabs.length ? tabs[0] : null;
}

// READ CURRENT PAGE
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

// RECEIVE VECTOR COMMANDS
chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {

    async function handleCommand() {
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
          await chrome.tabs.update(
            message.tabId,
            { active: true }
          );
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
    }

    handleCommand()
      .then(sendResponse)
      .catch(error => {
        sendResponse({
          success: false,
          error: error.message
        });
      });

    return true;
  }
);

console.log("VECTOR online search engine ready!");
