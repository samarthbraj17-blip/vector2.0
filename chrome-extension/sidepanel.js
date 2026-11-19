

const chat = document.getElementById("chat");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");

function addMessage(message, sender = "bot") {
  const div = document.createElement("div");
  div.className = "message " + sender;
  div.textContent = message;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return div;
}

function normalize(text) {
  return text.toLowerCase().replace(/[^\w\s]/g, " ").trim();
}

function similarity(a, b) {
  const wordsA = new Set(normalize(a).split(/\s+/).filter(w => w.length > 2));
  const wordsB = new Set(normalize(b).split(/\s+/).filter(w => w.length > 2));

  if (!wordsA.size || !wordsB.size) return 0;

  let matches = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) matches++;
  }

  return matches / Math.max(wordsA.size, wordsB.size);
}

function findKnowledge(question) {
  const database = window.VECTOR_KNOWLEDGE || [];
  let bestMatch = null;
  let bestScore = 0;

  for (const item of database) {
    const score = Math.max(
      similarity(question, item.question || ""),
      similarity(question, item.category || "")
    );

    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  return bestScore >= 0.35 ? bestMatch : null;
}

function calculate(question) {
  const match = question.match(/(-?\d+(?:\.\d+)?)\s*([+\-*/%])\s*(-?\d+(?:\.\d+)?)/);

  if (!match) return null;

  const a = Number(match[1]);
  const operator = match[2];
  const b = Number(match[3]);

  if (operator === "+") return a + b;
  if (operator === "-") return a - b;
  if (operator === "*") return a * b;
  if (operator === "/") return b === 0 ? "Cannot divide by zero." : a / b;
  if (operator === "%") return b === 0 ? "Cannot divide by zero." : a % b;

  return null;
}

function sendCommand(type, data = {}) {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type, ...data }, response => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
      } else {
        resolve(response);
      }
    });
  });
}

function parseSearchResults(html) {
  const documentHTML = new DOMParser().parseFromString(html, "text/html");
  const entries = [...documentHTML.querySelectorAll(".result")];

  return entries.slice(0, 5).map(entry => {
    const link = entry.querySelector("a.result__a");
    const snippet = entry.querySelector(".result__snippet");

    if (!link) return null;

    let url = link.getAttribute("href") || "";

    try {
      const parsed = new URL(url, "https://duckduckgo.com");

      if (parsed.searchParams.has("uddg")) {
        url = parsed.searchParams.get("uddg");
      } else {
        url = parsed.href;
      }
    } catch {
      return null;
    }

    if (!url.startsWith("https://") && !url.startsWith("http://")) {
      return null;
    }

    return {
      title: link.textContent.trim(),
      url,
      snippet: snippet ? snippet.textContent.trim() : ""
    };
  }).filter(Boolean);
}

function showSearchResults(results) {
  const div = document.createElement("div");
  div.className = "message bot";

  const heading = document.createElement("p");
  heading.textContent = "I found these online results:";
  div.appendChild(heading);

  results.forEach((result, index) => {
    const item = document.createElement("div");
    item.style.marginTop = "12px";

    const link = document.createElement("a");
    link.href = result.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = (index + 1) + ". " + result.title;

    const snippet = document.createElement("p");
    snippet.textContent = result.snippet || result.url;
    snippet.style.fontSize = "13px";

    item.appendChild(link);
    item.appendChild(snippet);
    div.appendChild(item);
  });

  const note = document.createElement("p");
  note.textContent = "These are search results and website excerpts, not a fully AI-generated answer.";
  note.style.fontSize = "12px";
  div.appendChild(note);

  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

async function onlineSearch(question) {
  const response = await sendCommand("VECTOR_WEB_SEARCH", {
    query: question
  });

  if (!response || !response.success) {
    return "I couldn't connect to online search. Check your internet connection and try again.";
  }

  const results = parseSearchResults(response.html || "");

  if (!results.length) {
    return "I couldn't find readable search results. Try rephrasing your question.";
  }

  showSearchResults(results);
  return null;
}

async function answerQuestion(question) {
  const q = normalize(question);

  if (/^(hi|hello|hey|good morning|good evening)$/.test(q)) {
    return "Hello! I am VECTOR. What would you like to know?";
  }

  if (q.includes("who are you") || q.includes("your name")) {
    return "I am VECTOR — your personal browser assistant.";
  }

  if (q.includes("what time")) {
    return "The current time is " + new Date().toLocaleTimeString() + ".";
  }

  if (q.includes("what date") || q.includes("today date")) {
    return "Today's date is " + new Date().toLocaleDateString() + ".";
  }

  if (q.startsWith("open ")) {
    const site = q.replace("open ", "").trim();

    const websites = {
      youtube: "https://www.youtube.com",
      google: "https://www.google.com",
      github: "https://github.com",
      wikipedia: "https://www.wikipedia.org",
      chatgpt: "https://chatgpt.com"
    };

    if (websites[site]) {
      const result = await sendCommand("VECTOR_OPEN_URL", {
        url: websites[site]
      });

      return result.success ? "Opening " + site + "." : "I couldn't open that website.";
    }

    return "I don't have that website saved. Try saying: Search " + site;
  }

  if (q.startsWith("search ")) {
    const searchTerm = question.substring(7).trim();
    await sendCommand("VECTOR_SEARCH", { query: searchTerm });
    return "Searching Google for: " + searchTerm;
  }

  if (q.includes("show tabs") || q === "tabs" || q.includes("list tabs")) {
    const tabs = await sendCommand("VECTOR_GET_TABS");

    if (!Array.isArray(tabs) || !tabs.length) {
      return "I couldn't find any open tabs.";
    }

    return "Your open tabs:\n" + tabs.map((tab, i) =>
      (i + 1) + ". " + (tab.title || "Untitled tab")
    ).join("\n");
  }

  if (q.includes("read this page") || q.includes("read current page")) {
    const page = await sendCommand("VECTOR_READ_PAGE");

    if (!page || !page.success) {
      return "I couldn't read this page. Some browser pages cannot be accessed.";
    }

    return "Here is the text from the current page:\n\n" + page.text.slice(0, 4000);
  }

  if (q.startsWith("calculate ") || q.startsWith("what is ")) {
    const result = calculate(question);

    if (result !== null) {
      return "The answer is " + result;
    }
  } else {
    const result = calculate(question);

    if (result !== null) {
      return "The answer is " + result;
    }
  }

  const knowledge = findKnowledge(question);

  if (knowledge) {
    return knowledge.answer;
  }

  // If the offline database has no answer, search online.
  const result = await onlineSearch(question);

  if (result) return result;

  return null;
}

async function processCommand() {
  const question = userInput.value.trim();

  if (!question) return;

  addMessage(question, "user");
  userInput.value = "";

  const thinking = addMessage("Searching for an answer...", "bot");

  try {
    const answer = await answerQuestion(question);

    if (answer !== null) {
      thinking.textContent = answer;
    } else {
      thinking.remove();
    }
  } catch (error) {
    thinking.textContent = "Something went wrong: " + error.message;
  }

  chat.scrollTop = chat.scrollHeight;
}

sendButton.addEventListener("click", processCommand);

userInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    processCommand();
  }
});

document.querySelectorAll("[data-command]").forEach(button => {
  button.addEventListener("click", async () => {
    const command = button.dataset.command;

    if (command === "tabs") {
      userInput.value = "Show tabs";
    } else if (command === "page") {
      userInput.value = "Read this page";
    }

    await processCommand();
  });
});

console.log("VECTOR online assistant ready!");
