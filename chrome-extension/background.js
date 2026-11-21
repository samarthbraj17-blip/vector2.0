
chrome.runtime.onInstalled.addListener(() => {
  console.log("VECTOR installed!");

  chrome.sidePanel.setPanelBehavior({
    openPanelOnActionClick: true
  });
});

// OPEN WEBSITE
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

// FETCH JSON SAFELY
async function fetchJSON(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: { "Accept": "application/json" }
  });

  if (!response.ok) {
    throw new Error("Request failed: " + response.status);
  }

  return response.json();
}

// WIKIPEDIA SEARCH
async function searchWikipedia(query) {
  const searchURL =
    "https://en.wikipedia.org/w/api.php" +
    "?action=query&list=search" +
    "&srsearch=" + encodeURIComponent(query) +
    "&srlimit=5&format=json";

  const searchData = await fetchJSON(searchURL);

  const pages = searchData.query?.search || [];

  if (!pages.length) return [];

  const pageIds = pages.map(page => page.pageid).join("|");

  const extractURL =
    "https://en.wikipedia.org/w/api.php" +
    "?action=query&prop=extracts" +
    "&explaintext=1&exintro=1" +
    "&pageids=" + pageIds +
    "&format=json";

  const extractData = await fetchJSON(extractURL);

  return pages.map(page => {
    const article =
      extractData.query?.pages?.[page.pageid];

    return {
      title: page.title,
      snippet: article?.extract ||
        page.snippet.replace(/<[^>]*>/g, ""),
      url:
        "https://en.wikipedia.org/?curid=" +
        page.pageid,
      source: "Wikipedia"
    };
  });
}

// DUCKDUCKGO INSTANT ANSWERS
async function searchDuckDuckGo(query) {
  const url =
    "https://api.duckduckgo.com/" +
    "?q=" + encodeURIComponent(query) +
    "&format=json&no_html=1&skip_disambig=1";

  const data = await fetchJSON(url);

  const results = [];

  if (data.AbstractText) {
    results.push({
      title: data.Heading || "Quick answer",
      snippet: data.AbstractText,
      url: data.AbstractURL || "https://duckduckgo.com/",
      source: "DuckDuckGo"
    });
  }

  if (data.Answer) {
    results.push({
      title: "Instant answer",
      snippet: data.Answer,
      url: data.AnswerURL || "https://duckduckgo.com/",
      source: "DuckDuckGo"
    });
  }

  function collectTopics(topics) {
    for (const item of topics || []) {
      if (item.Topics) {
        collectTopics(item.Topics);
      } else if (item.Text) {
        results.push({
          title: item.FirstURL || "Related information",
          snippet: item.Text,
          url: item.FirstURL || "https://duckduckgo.com/",
          source: "DuckDuckGo"
        });
      }

      if (results.length >= 5) break;
    }
  }

  collectTopics(data.RelatedTopics);

  return results.slice(0, 5);
}

// MULTI-SOURCE ONLINE SEARCH
async function searchWeb(query) {
  const results = [];
  const errors = [];

  // Try Wikipedia
  try {
    const wikiResults = await searchWikipedia(query);
    results.push(...wikiResults);
  } catch (error) {
    errors.push("Wikipedia: " + error.message);
  }

  // Try DuckDuckGo
  try {
    const ddgResults = await searchDuckDuckGo(query);
    results.push(...ddgResults);
  } catch (error) {
    errors.push("DuckDuckGo: " + error.message);
  }

  // Remove duplicate links
  const uniqueResults = [];
  const seen = new Set();

  for (const result of results) {
    if (!seen.has(result.url)) {
      seen.add(result.url);
      uniqueResults.push(result);
    }
  }

  return {
    success: uniqueResults.length > 0,
    results: uniqueResults.slice(0, 8),
    errors: errors
  };
}

// GET OPEN TABS
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

// HANDLE VECTOR COMMANDS
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

console.log("VECTOR multi-source search ready!");
