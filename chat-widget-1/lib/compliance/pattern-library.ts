// Comprehensive regex patterns for compliance detection

export const COMPLIANCE_PATTERNS = {
  // Personal Identifiable Information (PII)
  SSN: {
    pattern: /\b(?:\d{3}-?\d{2}-?\d{4}|\d{9})\b/g,
    description: "Social Security Number",
    frameworks: ["GDPR", "CCPA", "HIPAA"],
  },

  CREDIT_CARD: {
    pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
    description: "Credit Card Number",
    frameworks: ["PCI_DSS", "GDPR", "CCPA"],
  },

  EMAIL: {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    description: "Email Address",
    frameworks: ["GDPR", "CCPA", "HIPAA"],
  },

  PHONE: {
    pattern: /\b(?:\+?1[-.\s]?)?([0-9]{3})[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
    description: "Phone Number",
    frameworks: ["GDPR", "CCPA", "HIPAA"],
  },

  // Medical Information (HIPAA)
  MEDICAL_RECORD: {
    pattern: /\b(?:MRN|MR#|Medical Record|Patient ID)[\s:]*([A-Z0-9]{6,12})\b/gi,
    description: "Medical Record Number",
    frameworks: ["HIPAA"],
  },

  INSURANCE_ID: {
    pattern: /\b(?:Insurance|Policy|Member)[\s#:]*([A-Z0-9]{8,15})\b/gi,
    description: "Insurance Policy Number",
    frameworks: ["HIPAA", "PCI_DSS"],
  },

  // Financial Information (PCI DSS)
  BANK_ACCOUNT: {
    pattern: /\b(?:Account|Acct)[\s#:]*([0-9]{8,17})\b/gi,
    description: "Bank Account Number",
    frameworks: ["PCI_DSS", "GDPR"],
  },

  ROUTING_NUMBER: {
    pattern: /\b(?:Routing|ABA|RTN)[\s#:]*([0-9]{9})\b/gi,
    description: "Bank Routing Number",
    frameworks: ["PCI_DSS"],
  },

  // Government IDs
  PASSPORT: {
    pattern: /\b(?:Passport|PP)[\s#:]*([A-Z0-9]{6,9})\b/gi,
    description: "Passport Number",
    frameworks: ["GDPR", "CCPA"],
  },

  DRIVERS_LICENSE: {
    pattern: /\b(?:DL|Driver|License)[\s#:]*([A-Z0-9]{8,15})\b/gi,
    description: "Driver License Number",
    frameworks: ["GDPR", "CCPA"],
  },

  // Security Classifications (NIST)
  CLASSIFIED: {
    pattern: /\b(?:TOP SECRET|SECRET|CONFIDENTIAL|RESTRICTED|CLASSIFIED)\b/gi,
    description: "Security Classification",
    frameworks: ["NIST", "SOC2"],
  },

  // Biometric Data
  BIOMETRIC: {
    pattern: /\b(?:fingerprint|retina|iris|facial recognition|biometric|DNA)\b/gi,
    description: "Biometric Information",
    frameworks: ["GDPR", "CCPA", "HIPAA"],
  },

  // Location Data
  GPS_COORDINATES: {
    pattern: /\b(?:lat|latitude|lng|longitude)[\s:]*(-?\d+\.?\d*)\b/gi,
    description: "GPS Coordinates",
    frameworks: ["GDPR", "CCPA"],
  },

  // Legal Privilege
  ATTORNEY_CLIENT: {
    pattern: /\b(?:attorney-client|legal privilege|confidential communication|work product)\b/gi,
    description: "Attorney-Client Privileged Information",
    frameworks: ["SOC2", "NIST"],
  },
}

export function validateCreditCard(number: string): boolean {
  // Luhn algorithm validation
  const digits = number.replace(/\D/g, "")
  if (digits.length < 13 || digits.length > 19) return false

  let sum = 0
  let isEven = false

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = Number.parseInt(digits[i])

    if (isEven) {
      digit *= 2
      if (digit > 9) digit -= 9
    }

    sum += digit
    isEven = !isEven
  }

  return sum % 10 === 0
}

export function validateSSN(ssn: string): boolean {
  const cleaned = ssn.replace(/\D/g, "")
  if (cleaned.length !== 9) return false

  // Invalid SSN patterns
  const invalid = [
    "000000000",
    "111111111",
    "222222222",
    "333333333",
    "444444444",
    "555555555",
    "666666666",
    "777777777",
    "888888888",
    "999999999",
  ]

  return !invalid.includes(cleaned)
}
