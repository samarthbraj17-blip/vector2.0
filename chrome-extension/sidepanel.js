
const chat = document.getElementById("chat");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");

// DISPLAY MESSAGES
function addMessage(message, sender = "bot") {
  const div = document.createElement("div");
  div.className = "message " + sender;
  div.textContent = message;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return div;
}

// TEXT NORMALIZATION
function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// SIMPLE WORD MATCHING
function similarity(a, b) {
  const wordsA = new Set(
    normalize(a).split(" ").filter(w => w.length > 2)
  );

  const wordsB = new Set(
    normalize(b).split(" ").filter(w => w.length > 2)
  );

  if (!wordsA.size || !wordsB.size) return 0;

  let matches = 0;

  for (const word of wordsA) {
    if (wordsB.has(word)) matches++;
  }

  return matches / Math.max(wordsA.size, wordsB.size);
}

// SEARCH OFFLINE KNOWLEDGE
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

// CALCULATOR
function calculate(question) {
  const match = question.match(
    /(-?\d+(?:\.\d+)?)\s*([+\-*/%])\s*(-?\d+(?:\.\d+)?)/
  );

  if (!match) return null;

  const a = Number(match[1]);
  const operator = match[2];
  const b = Number(match[3]);

  switch (operator) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "/":
      return b === 0 ? "Cannot divide by zero." : a / b;
    case "%":
      return b === 0 ? "Cannot divide by zero." : a % b;
    default:
      return null;
  }
}

// SEND COMMAND TO BACKGROUND.JS
function sendCommand(type, data = {}) {
  return new Promise(resolve => {
    chrome.runtime.sendMessage(
      { type, ...data },
      response => {
        if (chrome.runtime.lastError) {
          resolve({
            success: false,
            error: chrome.runtime.lastError.message
          });
        } else {
          resolve(response);
        }
      }
    );
  });
}

// PARSE DUCKDUCKGO RESULTS
function parseSearchResults(html) {
  const page = new DOMParser().parseFromString(
    html,
    "text/html"
  );

  const links = [
    ...page.querySelectorAll(
      "a.result__a, a.result-link, a[data-testid='result-title-a']"
    )
  ];

  const results = [];

  for (const link of links) {
    let url = link.getAttribute("href") || "";

    try {
      const parsed = new URL(url, "https://duckduckgo.com");

      if (parsed.searchParams.has("uddg")) {
        url = parsed.searchParams.get("uddg");
      } else {
        url = parsed.href;
      }
    } catch {
      continue;
    }

    if (
      !url.startsWith("https://") &&
      !url.startsWith("http://")
    ) {
      continue;
    }

    const title = link.textContent.trim();

    if (!title) continue;

    const container =
      link.closest(".result") ||
      link.closest(".web-result") ||
      link.parentElement?.parentElement;

    const snippetElement = container?.querySelector(
      ".result__snippet, .result-snippet, .result__body"
    );

    results.push({
      title: title,
      url: url,
      snippet: snippetElement
        ? snippetElement.textContent.trim()
        : ""
    });

    if (results.length >= 5) break;
  }

  return results;
}

// DISPLAY CLICKABLE SEARCH RESULTS
function showSearchResults(results) {
  const div = document.createElement("div");
  div.className = "message bot";

  const heading = document.createElement("p");
  heading.textContent = "VECTOR found these online results:";
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
    snippet.textContent =
      result.snippet || result.url;
    snippet.style.fontSize = "13px";

    item.appendChild(link);
    item.appendChild(snippet);
    div.appendChild(item);
  });

  const note = document.createElement("p");
  note.textContent =
    "Open a result to read the full information. These are website search results, not AI-generated answers.";
  note.style.fontSize = "12px";

  div.appendChild(note);
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// ONLINE SEARCH
async function onlineSearch(question) {
  const response = await sendCommand(
    "VECTOR_WEB_SEARCH",
    { query: question }
  );

  if (!response || !response.success) {
    return "Online search failed. Please check your internet connection. " +
      (response?.error || "");
  }

  const html = response.html || "";
  const results = parseSearchResults(html);

  if (results.length === 0) {
    return "The search website did not return readable results. " +
      "Please try again or rephrase your question.";
  }

  showSearchResults(results);
  return null;
}

// ANSWER QUESTIONS AND COMMANDS
async function answerQuestion(question) {
  const q = normalize(question);

  // GREETINGS
  if (/^(hi|hello|hey|good morning|good evening)$/.test(q)) {
    return "Hello! I am VECTOR. What would you like to know?";
  }

  // IDENTITY
  if (q.includes("who are you") || q.includes("your name")) {
    return "I am VECTOR, your personal AI browser assistant.";
  }

  // TIME
  if (q.includes("what time")) {
    return "The current time is " +
      new Date().toLocaleTimeString();
  }

  // DATE
  if (q.includes("what date") || q.includes("today date")) {
    return "Today's date is " +
      new Date().toLocaleDateString();
  }

  // OPEN WEBSITES
  if (q.startsWith("open ")) {
    const site = q.substring(5).trim();

    const websites = {
      youtube: "https://www.youtube.com",
      google: "https://www.google.com",
      github: "https://github.com",
      wikipedia: "https://www.wikipedia.org",
      chatgpt: "https://chatgpt.com"
    };

    if (websites[site]) {
      const result = await sendCommand(
        "VECTOR_OPEN_URL",
        { url: websites[site] }
      );

      return result?.success
        ? "Opening " + site + "."
        : "I couldn't open that website.";
    }

    return "I don't have that website saved. Try Search " + site;
  }

  // GOOGLE SEARCH COMMAND
  if (q.startsWith("search ")) {
    const searchTerm = question.substring(7).trim();

    const result = await sendCommand(
      "VECTOR_SEARCH",
      { query: searchTerm }
    );

    return result?.success
      ? "Searching Google for " + searchTerm
      : "I couldn't open Google search.";
  }

  // SHOW OPEN TABS
  if (
    q.includes("show tabs") ||
    q === "tabs" ||
    q.includes("list tabs")
  ) {
    const tabs = await sendCommand("VECTOR_GET_TABS");

    if (!Array.isArray(tabs) || !tabs.length) {
      return "I couldn't find any open tabs.";
    }

    return "Your open tabs:\n" +
      tabs.map((tab, i) =>
        (i + 1) + ". " + (tab.title || "Untitled tab")
      ).join("\n");
  }

  // READ CURRENT PAGE
  if (
    q.includes("read this page") ||
    q.includes("read current page")
  ) {
    const page = await sendCommand("VECTOR_READ_PAGE");

    if (!page?.success) {
      return "I couldn't read this page. Some browser pages cannot be accessed.";
    }

    return "Here is the text from the current page:\n\n" +
      (page.text || "").slice(0, 4000);
  }

  // CALCULATOR
  const mathAnswer = calculate(question);

  if (mathAnswer !== null) {
    return "The answer is " + mathAnswer;
  }

  // OFFLINE DATABASE
  const knowledge = findKnowledge(question);

  if (knowledge) {
    return knowledge.answer;
  }

  // AUTOMATIC ONLINE SEARCH
  return await onlineSearch(question);
}

// PROCESS USER MESSAGE
async function processCommand() {
  const question = userInput.value.trim();

  if (!question) return;

  addMessage(question, "user");
  userInput.value = "";
  sendButton.disabled = true;

  const thinking = addMessage(
    "VECTOR is searching...",
    "bot"
  );

  try {
    const answer = await answerQuestion(question);

    if (answer !== null) {
      thinking.textContent = answer;
    } else {
      thinking.remove();
    }
  } catch (error) {
    thinking.textContent =
      "Something went wrong: " + error.message;
  }

  sendButton.disabled = false;
  userInput.focus();
  chat.scrollTop = chat.scrollHeight;
}

// SEND BUTTON
sendButton.addEventListener(
  "click",
  processCommand
);

// ENTER KEY
userInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    processCommand();
  }
});

// QUICK COMMAND BUTTONS
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
