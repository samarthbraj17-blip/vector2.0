
const chat = document.getElementById("chat");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");

// =====================================
// VECTOR MESSAGE SYSTEM
// =====================================

function addMessage(message, sender = "bot") {
  const div = document.createElement("div");
  div.className = "message " + sender;
  div.textContent = message;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return div;
}

// =====================================
// TEXT PROCESSING
// =====================================

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const stopWords = new Set([
  "the", "and", "for", "with", "from", "that",
  "this", "what", "when", "where", "which",
  "who", "why", "how", "can", "could", "would",
  "should", "does", "do", "did", "is", "are",
  "was", "were", "a", "an", "to", "of", "in",
  "on", "at", "it", "my", "your", "me", "please"
]);

function getKeywords(text) {
  return normalize(text)
    .split(" ")
    .filter(word =>
      word.length > 2 && !stopWords.has(word)
    );
}

function similarity(a, b) {
  const wordsA = new Set(getKeywords(a));
  const wordsB = new Set(getKeywords(b));

  if (!wordsA.size || !wordsB.size) return 0;

  let matches = 0;

  for (const word of wordsA) {
    if (wordsB.has(word)) matches++;
  }

  return matches / Math.max(wordsA.size, wordsB.size);
}

// =====================================
// OFFLINE KNOWLEDGE DATABASE
// =====================================

function findKnowledge(question) {
  const database = window.VECTOR_KNOWLEDGE || [];

  let bestMatch = null;
  let bestScore = 0;

  for (const item of database) {
    const storedQuestion = normalize(item.question || "");

    if (storedQuestion === normalize(question)) {
      return item;
    }

    const score = similarity(question, storedQuestion);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  return bestScore >= 0.65 ? bestMatch : null;
}

// =====================================
// PLANT PROPAGATION
// =====================================

function understandPlantQuestion(question) {
  const q = normalize(question);

  const mentionsLeaf = /\b(leaf|leaves)\b/.test(q);
  const mentionsPlant = /\bplant\b/.test(q);

  const mentionsGrowing = [
    "convert", "grow", "turn", "make", "create",
    "propagate", "reproduce", "root", "new plant"
  ].some(word => q.includes(word));

  if (mentionsLeaf && mentionsPlant && mentionsGrowing) {
    return `You can grow a new plant from a leaf using LEAF PROPAGATION!

However, this works only with certain plant species.

1. Choose a healthy leaf.
2. Remove it using clean scissors.
3. Place the leaf or its stem in suitable moist soil.
4. Keep the soil slightly moist.
5. Provide bright, indirect sunlight.
6. Wait for roots and new shoots.

Examples:
- African violet
- Begonia
- Snake plant

Different plants need different methods.

Tell me the plant's name for specific instructions.`;
  }

  return null;
}

// =====================================
// CALCULATOR
// =====================================

function calculate(question) {
  const match = question.match(
    /(-?\d+(?:\.\d+)?)\s*([+\-*/%])\s*(-?\d+(?:\.\d+)?)/
  );

  if (!match) return null;

  const a = Number(match[1]);
  const b = Number(match[3]);

  switch (match[2]) {
    case "+":
      return a + b;

    case "-":
      return a - b;

    case "*":
      return a * b;

    case "/":
      return b === 0
        ? "Cannot divide by zero."
        : a / b;

    case "%":
      return b === 0
        ? "Cannot divide by zero."
        : a % b;

    default:
      return null;
  }
}

// =====================================
// CHROME COMMAND CONNECTION
// =====================================

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

// =====================================
// QWEN LOCAL AI BRAIN
// =====================================

async function askVECTORAI(question) {
  const response = await sendCommand("VECTOR_AI", {
    question: question
  });

  if (!response) {
    throw new Error("No response from VECTOR background service.");
  }

  if (!response.success) {
    throw new Error(response.error || "AI connection failed.");
  }

  return response.answer;
}

// =====================================
// TEST AI CONNECTION
// =====================================

async function testAI() {
  return await sendCommand("VECTOR_TEST_AI");
}

// =====================================
// DISPLAY ONLINE SOURCES
// =====================================

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
    snippet.textContent =
      result.snippet || "Open the source to read more.";

    snippet.style.fontSize = "13px";

    const source = document.createElement("small");
    source.textContent = "Source: " +
      (result.source || "Website");

    item.appendChild(title);
    item.appendChild(snippet);
    item.appendChild(source);

    if (result.url) {
      try {
        const url = new URL(result.url);

        if (
          url.protocol === "https:" ||
          url.protocol === "http:"
        ) {
          const link = document.createElement("a");
          link.href = url.href;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = " Open source";
          item.appendChild(link);
        }
      } catch (error) {
        // Ignore invalid links.
      }
    }

    div.appendChild(item);
  });

  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// =====================================
// ONLINE SEARCH
// =====================================

async function onlineSearch(question) {
  const response = await sendCommand(
    "VECTOR_WEB_SEARCH",
    { query: question }
  );

  if (!response || !response.success) {
    return "I couldn't find online results. " +
      (response?.error || "Please try again.");
  }

  if (!response.results?.length) {
    return "No useful online results found.";
  }

  showSearchResults(response.results);

  return "I found some sources. Check them for more information.";
}

// =====================================
// MAIN QUESTION HANDLER
// =====================================

async function answerQuestion(question) {
  const q = normalize(question);

  // GREETINGS

  if (/^(hi|hello|hey|good morning|good evening)$/.test(q)) {
    return "Hello! I am VECTOR. What would you like to know?";
  }

  // IDENTITY

  if (
    q.includes("who are you") ||
    q.includes("your name")
  ) {
    return "I am VECTOR, your personal AI browser assistant, powered by Qwen 2.5.";
  }

  // TIME

  if (q.includes("what time")) {
    return "The current time is " +
      new Date().toLocaleTimeString();
  }

  // DATE

  if (
    q.includes("what date") ||
    q.includes("today date")
  ) {
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

    if (!websites[site]) {
      return "I don't have that website saved. Try Search " + site;
    }

    const result = await sendCommand(
      "VECTOR_OPEN_URL",
      { url: websites[site] }
    );

    return result?.success
      ? "Opening " + site + "."
      : "I couldn't open that website.";
  }

  // GOOGLE SEARCH

  if (q.startsWith("search ")) {
    const result = await sendCommand(
      "VECTOR_SEARCH",
      {
        query: question.substring(7).trim()
      }
    );

    return result?.success
      ? "Opening Google search."
      : "Google search could not be opened.";
  }

  // SHOW TABS

  if (
    q.includes("show tabs") ||
    q === "tabs" ||
    q.includes("list tabs")
  ) {
    const tabs = await sendCommand("VECTOR_GET_TABS");

    if (!Array.isArray(tabs)) {
      return "I couldn't retrieve your tabs.";
    }

    return "Your open tabs:\n" +
      tabs.map((tab, i) =>
        (i + 1) + ". " +
        (tab.title || "Untitled tab")
      ).join("\n");
  }

  // READ CURRENT PAGE

  if (
    q.includes("read this page") ||
    q.includes("read current page")
  ) {
    const page = await sendCommand("VECTOR_READ_PAGE");

    if (!page?.success) {
      return "I couldn't read this page: " +
        (page?.error || "");
    }

    return "Current page text:\n\n" +
      (page.text || "").slice(0, 4000);
  }

  // CALCULATOR

  const mathAnswer = calculate(question);

  if (mathAnswer !== null) {
    return "The answer is " + mathAnswer;
  }

  // PLANT UNDERSTANDING

  const plantAnswer = understandPlantQuestion(question);

  if (plantAnswer) {
    return plantAnswer;
  }

  // OFFLINE DATABASE

  const knowledge = findKnowledge(question);

  if (knowledge) {
    return knowledge.answer;
  }

  // QWEN AI BRAIN

  try {
    return await askVECTORAI(question);
  } catch (error) {
    console.error("VECTOR AI error:", error);

    // FALLBACK TO ONLINE SEARCH

    return await onlineSearch(question);
  }
}

// =====================================
// PROCESS QUESTION
// =====================================

async function processCommand() {
  const question = userInput.value.trim();

  if (!question || sendButton.disabled) return;

  addMessage(question, "user");

  userInput.value = "";
  sendButton.disabled = true;

  const thinking = addMessage(
    "VECTOR is thinking...",
    "bot"
  );

  try {
    const answer = await answerQuestion(question);

    thinking.textContent = answer;

  } catch (error) {
    thinking.textContent =
      "Something went wrong: " + error.message;

  } finally {
    sendButton.disabled = false;
    userInput.focus();
    chat.scrollTop = chat.scrollHeight;
  }
}

// =====================================
// SEND BUTTON
// =====================================

sendButton.addEventListener(
  "click",
  processCommand
);

// =====================================
// ENTER KEY
// =====================================

userInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    processCommand();
  }
});

// =====================================
// QUICK BUTTONS
// =====================================

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

// =====================================
// VECTOR STARTUP
// =====================================

async function initializeVECTOR() {
  const result = await testAI();

  if (result?.success) {
    console.log("VECTOR connected to Ollama!");
    console.log("Available models:", result.models);
  } else {
    console.warn(
      "VECTOR AI is offline:",
      result?.error
    );
  }
}

initializeVECTOR();

console.log("VECTOR AI assistant ready!");
