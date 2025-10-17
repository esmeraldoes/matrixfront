// Generate a secure random code verifier
export const generateCodeVerifier = (): string => {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return base64UrlEncode(array);
};

// Generate code challenge from verifier
export const generateCodeChallenge = async (verifier: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
};

// Base64 URL encoding
const base64UrlEncode = (arrayBuffer: Uint8Array): string => {
  return btoa(String.fromCharCode(...Array.from(arrayBuffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};







