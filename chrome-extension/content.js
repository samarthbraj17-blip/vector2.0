
// VECTOR webpage assistant

console.log("VECTOR content assistant loaded!");

function getPageInformation() {
  return {
    title: document.title,
    url: location.href,
    description:
      document.querySelector('meta[name="description"]')
        ?.content || "",
    text: document.body.innerText.slice(0, 20000)
  };
}

function findPageText(searchTerm) {
  const text = document.body.innerText;
  const term = searchTerm.toLowerCase();

  const index = text.toLowerCase().indexOf(term);

  if (index === -1) {
    return "I couldn't find that text on this webpage.";
  }

  return text.slice(
    Math.max(0, index - 150),
    Math.min(text.length, index + 500)
  );
}

function getLinks() {
  return Array.from(document.querySelectorAll("a"))
    .filter(link => link.innerText.trim())
    .slice(0, 50)
    .map(link => ({
      text: link.innerText.trim(),
      url: link.href
    }));
}

chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {

    if (message.type === "VECTOR_PAGE_INFO") {
      sendResponse(getPageInformation());
    }

    if (message.type === "VECTOR_FIND_TEXT") {
      sendResponse({
        result: findPageText(message.query || "")
      });
    }

    if (message.type === "VECTOR_GET_LINKS") {
      sendResponse({
        links: getLinks()
      });
    }

    return true;
  }
);
