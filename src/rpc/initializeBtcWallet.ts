import { RpcResponse, RpcResponseError, RpcResponseOk } from '../interface';
import { PATH } from '../wallets/bitcoin/constants';
import { getHDNode } from '../wallets/getHDNode';
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from '@bitcoin-js/tiny-secp256k1-asmjs';
import ECPairFactory from 'ecpair';
import DataStore from '../utils/dataStore';


bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);
const dataStore = DataStore.getInstance();

export const initializeBtcWallet = async (): Promise<RpcResponse> => {
  try {
    const state = await dataStore.getState();
    if (state?.bitcoinWallet) {
      return RpcResponseOk(state.bitcoinWallet);
    }

    const node = await getHDNode(PATH);

    // Extract private key from HDNode
    const privateKey = node.privateKey?.toString('hex');
    if (!privateKey) {
      throw new Error('Failed to extract private key from HDNode');
    }

    // Create ECPair from private key
    const network = bitcoin.networks.testnet;
    const keyPair = ECPair.fromPrivateKey(Buffer.from(privateKey, 'hex'), {
      network,
    });

    // Extract public key as a hexadecimal string
    const publicKey = Buffer.from(keyPair.publicKey).toString('hex');

    // Generate SegWit address
    const { address } = bitcoin.payments.p2wpkh({
      pubkey: Buffer.from(keyPair.publicKey),
      network,
    });

    // Ensure all components are valid
    if (!publicKey || !address) {
      throw new Error('Failed to derive public key or address');
    }

    await dataStore.setBitcoinWallet({ privateKey, publicKey, address });
    return RpcResponseOk({ publicKey, address });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Initialization Error';
    return RpcResponseError(message);
  }
};
