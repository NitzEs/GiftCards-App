// Server-side only — never import this from client components

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

function getKeyMaterial(): Buffer {
  const keyHex = process.env.CARD_ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error('CARD_ENCRYPTION_KEY must be a 64-char hex string (256-bit)');
  }
  return Buffer.from(keyHex, 'hex');
}

async function importKey(): Promise<CryptoKey> {
  const keyMaterial = getKeyMaterial();
  // Copy into a fresh ArrayBuffer to satisfy SubtleCrypto's BufferSource type
  const keyAb = new Uint8Array(keyMaterial).buffer as ArrayBuffer;
  return crypto.subtle.importKey('raw', keyAb, { name: ALGORITHM, length: KEY_LENGTH }, false, [
    'encrypt',
    'decrypt',
  ]);
}

export async function encryptCardNumber(plaintext: string): Promise<string> {
  const key = await importKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, encoded);
  const ivB64 = Buffer.from(iv).toString('base64');
  const ctB64 = Buffer.from(ciphertext).toString('base64');
  return `${ivB64}:${ctB64}`;
}

export async function decryptCardNumber(encrypted: string): Promise<string> {
  const [ivB64, ctB64] = encrypted.split(':');
  if (!ivB64 || !ctB64) throw new Error('Invalid encrypted format');
  const key = await importKey();
  const iv = new Uint8Array(Buffer.from(ivB64, 'base64'));
  const ciphertext = new Uint8Array(Buffer.from(ctB64, 'base64'));
  const decrypted = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, ciphertext);
  return new TextDecoder().decode(decrypted);
}
