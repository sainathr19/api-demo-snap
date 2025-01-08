import { CRYPTO_CURVE } from "./bitcoin/constants";
import { SLIP10Node } from "./types";
import { trimHexPrefix } from "./utils";
import * as bip32 from 'bip32'; 
import * as bitcoin from 'bitcoinjs-lib';


/**
 * Get the HD Node
 * @param pathArray - Array of path components for derivation (e.g., ["m", 44', 1', 0', 0, 0])
 * @returns Derived BIP32 Node
 */
export const getHDNode = async (
    pathArray: string[],
): Promise<bip32.BIP32Interface> => {
    // Request entropy from the Snap
    const slip10Node = await snap.request({
        method : "snap_getBip32Entropy",
        params: {
            path: pathArray,
            curve: CRYPTO_CURVE,
        },
    }) as SLIP10Node;

    // Create BIP32 Node
    const privateKeyBuffer = Buffer.from(trimHexPrefix(slip10Node.privateKey), 'hex');
    const chainCodeBuffer = Buffer.from(trimHexPrefix(slip10Node.chainCode), 'hex');
    const mfp = slip10Node.masterFingerprint && slip10Node.masterFingerprint.toString(16).padStart(8, '0')
    const node = bip32.fromPrivateKey(
        privateKeyBuffer,
        chainCodeBuffer,
        bitcoin.networks.testnet // Hardcoded for Bitcoin Testnet4
    );

    // Manually set depth and index (not directly supported by bip32 library)
    //@ts-ignore
    node.__DEPTH = slip10Node.depth;
    //@ts-ignore
    node.__INDEX = slip10Node.index;

    return node;
};