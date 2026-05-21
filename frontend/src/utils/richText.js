export function stripHtmlTags(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeRichHtml(value) {
  const input = String(value || "");

  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return input
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/\son\w+="[^"]*"/gi, "")
      .replace(/\son\w+='[^']*'/gi, "")
      .replace(/javascript:/gi, "");
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(input, "text/html");
  const allowedTags = new Set([
    "P",
    "BR",
    "STRONG",
    "EM",
    "U",
    "UL",
    "OL",
    "LI",
    "A",
    "H2",
    "H3",
    "BLOCKQUOTE",
  ]);

  Array.from(doc.body.querySelectorAll("*")).forEach((node) => {
    if (!allowedTags.has(node.tagName)) {
      const fragment = document.createDocumentFragment();
      while (node.firstChild) {
        fragment.appendChild(node.firstChild);
      }
      node.replaceWith(fragment);
      return;
    }

    Array.from(node.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = attr.value || "";

      if (name.startsWith("on")) {
        node.removeAttribute(attr.name);
        return;
      }

      if (node.tagName === "A" && name === "href") {
        if (/^\s*javascript:/i.test(value)) {
          node.removeAttribute(attr.name);
        } else {
          node.setAttribute("target", "_blank");
          node.setAttribute("rel", "noreferrer noopener");
        }
        return;
      }

      if (name !== "href") {
        node.removeAttribute(attr.name);
      }
    });
  });

  return doc.body.innerHTML.trim();
}
