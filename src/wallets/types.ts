import { MatchedOrder } from "../lib/types";

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
  
  export interface GetPublicExtendedKeyRequest {
    method: 'btc_getPublicExtendedKey';
    params: {
      network: BitcoinNetwork;
      scriptType: ScriptType;
    };
  }
  
  export interface GetAllXpubsRequest {
    method: 'btc_getAllXpubs';
    params: Record<string, never>
  }
  
  export interface SignPsbt {
    method: 'btc_signPsbt';
    params: {
      psbt: string;
      network: BitcoinNetwork;
      scriptType: ScriptType;
    };
  }

  export enum KeyOptions {
    Password = 'password',
    Credential = 'credential',
    PubKey = 'pubkey',
  }
  
  export interface GetMasterFingerprint {
    method: 'btc_getMasterFingerprint';
  }
  
  export interface ManageNetwork {
    method: 'btc_network';
    params: {
      action: 'get' | 'set';
      network?: BitcoinNetwork;
    };
  }
  
  export interface SaveLNDataToSnap {
    method: 'btc_saveLNDataToSnap';
    params: {
      walletId: string;
      credential: string;
      password: string;
    };
  }
  
  export interface GetLNDataFromSnap {
    method: 'btc_getLNDataFromSnap';
    params: {
      key: KeyOptions;
      walletId?: string;
      type?: 'get' | 'refresh'
    };
  }
  
  export interface SignLNInvoice {
    method: 'btc_signLNInvoice';
    params: {
      invoice: string;
    };
  }
  
  export interface SignMessage {
    method: 'btc_signMessage';
    params: {
      message: string;
      protocol: 'ecdsa' | 'bip322'
      derivationPath?: string;
    };
  }
  
  export type MetamaskBTCRpcRequest =
    | GetAllXpubsRequest
    | GetPublicExtendedKeyRequest
    | SignPsbt
    | GetMasterFingerprint
    | ManageNetwork
    | SaveLNDataToSnap
    | GetLNDataFromSnap
    | SignLNInvoice
    | SignMessage;
  

  export type BTCMethodCallback = (
    originString: string,
    requestObject: MetamaskBTCRpcRequest,
  ) => Promise<unknown>;

  export interface Snap {
    registerRpcMessageHandler: (fn: BTCMethodCallback) => unknown;
    request<T>(options: {
      method: string;
      params?: unknown[] | Record<string, any>;
    }): Promise<T>;
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

  export interface FetchOrdersResponse {
    status: "Ok" | "Error";
    result: {
      data: MatchedOrder[];
      total_pages: number;
      total_items: number;
      per_page: number;
      page: number;
    };
  }