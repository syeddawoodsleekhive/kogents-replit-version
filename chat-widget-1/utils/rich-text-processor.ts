// URL detection and auto-linking utilities
const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
const PHONE_REGEX = /(\+?1[-.\s]?)?([0-9]{3})[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g

export interface LinkInfo {
  type: "url" | "email" | "phone"
  text: string
  href: string
  start: number
  end: number
}

export interface ProcessedText {
  originalText: string
  processedText: string
  links: LinkInfo[]
  hasLinks: boolean
}

/**
 * Detect and extract links from text
 */
export function detectLinks(text: string): LinkInfo[] {
  const links: LinkInfo[] = []

  // Find URLs
  let match
  while ((match = URL_REGEX.exec(text)) !== null) {
    links.push({
      type: "url",
      text: match[0],
      href: match[0],
      start: match.index,
      end: match.index + match[0].length,
    })
  }

  // Find emails
  URL_REGEX.lastIndex = 0 // Reset regex
  while ((match = EMAIL_REGEX.exec(text)) !== null) {
    links.push({
      type: "email",
      text: match[0],
      href: `mailto:${match[0]}`,
      start: match.index,
      end: match.index + match[0].length,
    })
  }

  // Find phone numbers
  EMAIL_REGEX.lastIndex = 0 // Reset regex
  while ((match = PHONE_REGEX.exec(text)) !== null) {
    links.push({
      type: "phone",
      text: match[0],
      href: `tel:${match[0].replace(/\D/g, "")}`,
      start: match.index,
      end: match.index + match[0].length,
    })
  }

  // Sort by position to avoid overlap issues
  return links.sort((a, b) => a.start - b.start)
}

/**
 * Convert URLs, emails, and phone numbers to clickable links
 */
export function autoLinkText(text: string): string {
  if (!text) return text

  let processedText = text

  // Auto-link URLs
  processedText = processedText.replace(URL_REGEX, (url) => {
    const href = url.startsWith("http") ? url : `https://${url}`
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">${url}</a>`
  })

  // Auto-link emails
  processedText = processedText.replace(EMAIL_REGEX, (email) => {
    return `<a href="mailto:${email}" class="text-blue-600 hover:text-blue-800 underline">${email}</a>`
  })

  // Auto-link phone numbers
  processedText = processedText.replace(PHONE_REGEX, (phone) => {
    const cleanPhone = phone.replace(/\D/g, "")
    return `<a href="tel:${cleanPhone}" class="text-blue-600 hover:text-blue-800 underline">${phone}</a>`
  })

  return processedText
}

/**
 * Process text for rich formatting while preserving line breaks
 */
export function processRichText(text: string): ProcessedText {
  if (!text) {
    return {
      originalText: text,
      processedText: text,
      links: [],
      hasLinks: false,
    }
  }

  const links = detectLinks(text)
  const processedText = autoLinkText(text)

  // Preserve line breaks by converting to <br> tags
  const finalText = processedText.replace(/\n/g, "<br>")

  return {
    originalText: text,
    processedText: finalText,
    links,
    hasLinks: links.length > 0,
  }
}

/**
 * Sanitize pasted content while preserving basic formatting
 */
export function sanitizePastedContent(html: string): string {
  // Create a temporary div to parse HTML
  const temp = document.createElement("div")
  temp.innerHTML = html

  // Remove dangerous elements and attributes
  const allowedTags = ["p", "br", "strong", "b", "em", "i", "u"]
  const walker = document.createTreeWalker(temp, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (node) => {
      const element = node as Element
      if (!allowedTags.includes(element.tagName.toLowerCase())) {
        return NodeFilter.FILTER_REJECT
      }
      return NodeFilter.FILTER_ACCEPT
    },
  })

  const nodesToRemove: Node[] = []
  let node
  while ((node = walker.nextNode())) {
    const element = node as Element
    // Remove all attributes for security
    while (element.attributes.length > 0) {
      element.removeAttribute(element.attributes[0].name)
    }
  }

  // Get clean text content with preserved line breaks
  let cleanText = temp.textContent || temp.innerText || ""

  // Preserve paragraph breaks as double line breaks
  cleanText = cleanText.replace(/\n\s*\n/g, "\n\n")

  return cleanText.trim()
}

/**
 * Smart paste handler that preserves formatting appropriately
 */
export function handleSmartPaste(clipboardData: DataTransfer): string {
  const html = clipboardData.getData("text/html")
  const plainText = clipboardData.getData("text/plain")

  if (html && html.trim()) {
    // Process HTML content
    return sanitizePastedContent(html)
  }

  // Fall back to plain text
  return plainText || ""
}
