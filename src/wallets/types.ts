
export interface SLIP10Node {
    /**
     * The 0-indexed path depth of this node.
     */
    readonly depth: number;
  
    /**
     * The fingerprint of the master node, i.e., the node at depth 0. May be
     * undefined if this node was created from an extended key.
     */
    readonly masterFingerprint?: number;
  
    /**
     * The fingerprint of the parent key, or 0 if this is a master node.
     */
    readonly parentFingerprint: number;
  
    /**
     * The index of the node, or 0 if this is a master node.
     */
    readonly index: number;
  
    /**
     * The private key of this node.
     */
    readonly privateKey: string;
  
    /**
     * The public key of this node.
     */
    readonly publicKey: string;
  
    /**
     * The chain code of this node.
     */
    readonly chainCode: string;
  
    /**
     * The name of the curve used by the node.
     */
    readonly curve: 'ed25519' | 'secp256k1';
  }

  export enum ScriptType {
    P2PKH = 'P2PKH',
    P2SH_P2WPKH = 'P2SH-P2WPKH',
    P2WPKH = 'P2WPKH',
  }
  
  export enum BitcoinNetwork {
    Main = 'main',
    Test = 'test',
  }

  export type CRYPTO_CURVES = "secp256k1" | "ed25519" | "ed25519Bip32"