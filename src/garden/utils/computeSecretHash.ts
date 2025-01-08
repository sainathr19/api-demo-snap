/**
 * Generates a secret and its hash for the swap.
 * Uses the current epoch time as the secret and hashes it.
 * @param nonce - Unique number for this swap
 * @param address - User's Ethereum address
 */
export const computeSecretHash = async (nonce: number, address: string) => {
  const secret = Math.floor(Date.now() / 1000).toString(16);

  const secretBytes = new Uint8Array(
    secret.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || [],
  );

  const secretHashBuffer = await crypto.subtle.digest('SHA-256', secretBytes);
  const secretHashArray = Array.from(new Uint8Array(secretHashBuffer));

  const secretHash = secretHashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const trim0x = (hex: string) => (hex.startsWith('0x') ? hex.slice(2) : hex);

  return {
    secret: trim0x(secret),
    secretHash: trim0x(secretHash),
  };
};
