export const trimHexPrefix = (key: string) =>
  key.startsWith('0x') ? key.substring(2) : key;

/**
 * Given a hex string or a buffer, return the x-only pubkey. (removes y coordinate the prefix)
 */
export function xOnlyPubkey(pubkey: Buffer | string): Buffer {
  if (typeof pubkey === 'string') pubkey = Buffer.from(pubkey, 'hex');
  return pubkey.length === 32 ? pubkey : pubkey.subarray(1, 33);
}

export function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}
