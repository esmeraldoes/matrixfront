// export class PKCE {
//   private static readonly VERIFIER_LENGTH = 64; // OAuth 2.1 requires >=43 chars
  
//   static generateVerifier(): string {
//     const array = new Uint8Array(this.VERIFIER_LENGTH);
//     window.crypto.getRandomValues(array);
//     return Array.from(array)
//       .map(b => b.toString(16).padStart(2, '0'))
//       .join('');
//   }

//   static async generateChallenge(verifier: string): Promise<string> {
//     // OAuth 2.1 requires S256 method
//     const encoder = new TextEncoder();
//     const data = encoder.encode(verifier);
//     const digest = await window.crypto.subtle.digest('SHA-256', data);
    
//     return btoa(String.fromCharCode(...new Uint8Array(digest)))
//       .replace(/\+/g, '-')
//       .replace(/\//g, '_')
//       .replace(/=+$/, '');
//   }

//   static storeVerifier(verifier: string): void {
//     // Store in sessionStorage (short-lived)
//     sessionStorage.setItem('oauth_verifier', verifier);
//   }

//   static getVerifier(): string | null {
//     return sessionStorage.getItem('oauth_verifier');
//   }

//   static clearVerifier(): void {
//     sessionStorage.removeItem('oauth_verifier');
//   }
// }











// // src/utils/pkce.ts

// src/utils/pkce.ts

// export class PKCE {
//   private static STORAGE_KEY = 'pkce_code_verifier';

//   public static generateCodeVerifier(): string {
//     const array = new Uint32Array(56);
//     window.crypto.getRandomValues(array);

//     const codeVerifier = Array.from(array, dec =>
//       ('0' + dec.toString(16)).slice(-2)
//     ).join('').slice(0, 128);

//     sessionStorage.setItem(this.STORAGE_KEY, codeVerifier);
//     return codeVerifier;
//   }

//   public static getCodeVerifier(): string {
//     const verifier = sessionStorage.getItem(this.STORAGE_KEY);
//     if (!verifier) {
//       throw new Error('No PKCE code verifier found in storage');
//     }
//     return verifier;
//   }

//   public static clearCodeVerifier(): void {
//     sessionStorage.removeItem(this.STORAGE_KEY);
//   }
// }





// src/utils/pkceUtils.ts

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







