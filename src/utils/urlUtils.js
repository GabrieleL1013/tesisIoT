/**
 * Formats an external URL so that it always includes a valid protocol (e.g. https://).
 * Prevents browsers from treating external domain links (like 'x.com') as relative paths.
 * 
 * @param {string} url - The URL string to format.
 * @returns {string} The formatted absolute URL string.
 */
export const formatExternalUrl = (url) => {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';
  
  // If it already starts with a protocol or standard scheme, return as is
  if (/^(https?:\/\/|ftp:\/\/|mailto:|\/\/)/i.test(trimmed)) {
    return trimmed;
  }
  
  return `https://${trimmed}`;
};
