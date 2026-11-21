
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
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a, b) {
  const wordsA = new Set(normalize(a).split(" ").filter(w => w.length > 2));
  const wordsB = new Set(normalize(b).split(" ").filter(w => w.length > 2));

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
  const match = question.match(
    /(-?\d+(?:\.\d+)?)\s*([+\-*/%])\s*(-?\d+(?:\.\d+)?)/
  );

  if (!match) return null;

  const a = Number(match[1]);
  const b = Number(match[3]);

  switch (match[2]) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/": return b === 0 ? "Cannot divide by zero." : a / b;
    case "%": return b === 0 ? "Cannot divide by zero." : a % b;
    default: return null;
  }
}

function sendCommand(type, data = {}) {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type, ...data }, response => {
      if (chrome.runtime.lastError) {
        resolve({
          success: false,
          error: chrome.runtime.lastError.message
        });
      } else {
        resolve(response);
      }
    });
  });
}

// DISPLAY ONLINE RESULTS
function showSearchResults(results) {
  const div = document.createElement("div");
  div.className = "message bot";

  const heading = document.createElement("p");
  heading.textContent = "VECTOR found these sources:";
  div.appendChild(heading);

  results.forEach((result, index) => {
    const item = document.createElement("div");
    item.style.marginTop = "12px";

    const title = document.createElement("strong");
    title.textContent = (index + 1) + ". " + result.title;

    const snippet = document.createElement("p");
    snippet.textContent = result.snippet || "Open the source to read more.";
    snippet.style.fontSize = "13px";

    const source = document.createElement("small");
    source.textContent = "Source: " + (result.source || "Website");

    const link = document.createElement("a");
    link.href = result.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = " Open source";

    item.appendChild(title);
    item.appendChild(snippet);
    item.appendChild(source);
    item.appendChild(link);
    div.appendChild(item);
  });

  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// ONLINE SEARCH
async function onlineSearch(question) {
  const response = await sendCommand("VECTOR_WEB_SEARCH", {
    query: question
  });

  if (!response || !response.success) {
    const errors = response?.errors || [];
    return "I couldn't find online results. " +
      (errors.join(" | ") || response?.error || "Please try again.");
  }

  if (!response.results || response.results.length === 0) {
    return "No results were found. Try asking in a different way.";
  }

  showSearchResults(response.results);
  return null;
}

// MAIN QUESTION HANDLER
async function answerQuestion(question) {
  const q = normalize(question);

  if (/^(hi|hello|hey|good morning|good evening)$/.test(q)) {
    return "Hello! I am VECTOR. What would you like to know?";
  }

  if (q.includes("who are you") || q.includes("your name")) {
    return "I am VECTOR, your personal browser assistant.";
  }

  if (q.includes("what time")) {
    return "The current time is " + new Date().toLocaleTimeString();
  }

  if (q.includes("what date") || q.includes("today date")) {
    return "Today's date is " + new Date().toLocaleDateString();
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

    if (!websites[site]) {
      return "I don't have that website saved. Try Search " + site;
    }

    const result = await sendCommand("VECTOR_OPEN_URL", {
      url: websites[site]
    });

    return result?.success
      ? "Opening " + site + "."
      : "I couldn't open that website.";
  }

  // GOOGLE SEARCH COMMAND
  if (q.startsWith("search ")) {
    const result = await sendCommand("VECTOR_SEARCH", {
      query: question.substring(7).trim()
    });

    return result?.success
      ? "Opening Google search."
      : "Google search could not be opened.";
  }

  // SHOW TABS
  if (q.includes("show tabs") || q === "tabs" || q.includes("list tabs")) {
    const tabs = await sendCommand("VECTOR_GET_TABS");

    if (!Array.isArray(tabs)) return "I couldn't retrieve your tabs.";

    return "Your open tabs:\n" +
      tabs.map((tab, i) =>
        (i + 1) + ". " + (tab.title || "Untitled tab")
      ).join("\n");
  }

  // READ CURRENT PAGE
  if (q.includes("read this page") || q.includes("read current page")) {
    const page = await sendCommand("VECTOR_READ_PAGE");

    if (!page?.success) {
      return "I couldn't read this page: " + (page?.error || "");
    }

    return "Current page text:\n\n" + (page.text || "").slice(0, 4000);
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

  // ONLINE SOURCES
  return await onlineSearch(question);
}

// PROCESS QUESTION
async function processCommand() {
  const question = userInput.value.trim();
  if (!question) return;

  addMessage(question, "user");
  userInput.value = "";
  sendButton.disabled = true;

  const thinking = addMessage("VECTOR is searching its information sources...", "bot");

  try {
    const answer = await answerQuestion(question);

    if (answer !== null) {
      thinking.textContent = answer;
    } else {
      thinking.remove();
    }
  } catch (error) {
    thinking.textContent = "Error: " + error.message;
  }

  sendButton.disabled = false;
  userInput.focus();
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
    if (button.dataset.command === "tabs") {
      userInput.value = "Show tabs";
    } else if (button.dataset.command === "page") {
      userInput.value = "Read this page";
    }

    await processCommand();
  });
});

console.log("VECTOR multi-source assistant ready!");
