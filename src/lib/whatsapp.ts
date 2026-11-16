/**
 * Normalizes an Egyptian mobile phone number to international digit format (201xxxxxxxxx)
 * suitable for wa.me links.
 */
export function normalizeEgyptPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")

  if (digits.startsWith("0020")) {
    return digits.slice(2)
  }
  if (digits.startsWith("20") && digits.length === 12) {
    return digits
  }
  if (digits.startsWith("01") && digits.length === 11) {
    return `2${digits}`
  }
  if (digits.startsWith("1") && digits.length === 10) {
    return `20${digits}`
  }
  return digits
}

/**
 * Normalizes an Egyptian mobile phone number to local 11-digit format (01xxxxxxxxx).
 */
export function normalizeLocalEgyptPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.startsWith("0020") && digits.length === 14) {
    return `0${digits.slice(4)}`
  }
  if (digits.startsWith("20") && digits.length === 12) {
    return `0${digits.slice(2)}`
  }
  if (digits.startsWith("1") && digits.length === 10) {
    return `0${digits}`
  }
  return digits
}

/**
 * Builds an encoded WhatsApp click-to-chat URL.
 */
export function buildWhatsAppLink(phone: string, message?: string): string {
  const normalized = normalizeEgyptPhone(phone)
  if (!normalized) return "https://wa.me"
  if (message && message.trim().length > 0) {
    return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
  }
  return `https://wa.me/${normalized}`
}

