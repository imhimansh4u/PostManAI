// utils/sanitizeHeaders.js
const SENSITIVE_HEADERS = [
  "authorization", "cookie", "set-cookie",
  "x-api-key", "api-key", "x-auth-token", "proxy-authorization",
];

export const sanitizeHeaders = (headers = {}) => {
  const sanitized = {};
  for (const [key, value] of Object.entries(headers)) {
    if (SENSITIVE_HEADERS.includes(key.toLowerCase())) {
      const preview = typeof value === "string" ? value.slice(0, 6) : "";
      sanitized[key] = `${preview}*** (redacted)`;
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};