import { marked } from "marked";
import DOMPurify from "dompurify";

const renderer = {
  link({ href, title, text }: { href: string; title?: string | null; text: string }) {
    const t = title ? ` title="${title}"` : "";
    return `<a href="${href}" target="_blank" rel="noopener noreferrer"${t}>${text}</a>`;
  }
};

export const renderMarkdown = (content: string) => {
  marked.use({ renderer });
  const dirty = marked.parse(content.replace(/\n/g, "  \n"));
  return DOMPurify.sanitize(dirty as string, { ADD_ATTR: ["target"] });
};
