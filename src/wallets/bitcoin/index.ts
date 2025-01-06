import * as bitcoin from 'bitcoinjs-lib';
import ECPairFactory from 'ecpair';
import * as ecc from '@bitcoin-js/tiny-secp256k1-asmjs';
import * as secp256k1 from 'secp256k1';
import { getHDNode } from '../getHDNode';
import { CRYPTO_CURVE, PATH } from './constants';
import StateManager from '../../handlers/stateHandler';

bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

export class BitcoinWallet {
  private static instance: BitcoinWallet;
  private privateKey: string;
  private publicKey: string;
  private address: string;

  private constructor(privateKey: string, publicKey: string, address: string) {
    this.privateKey = privateKey;
    this.publicKey = publicKey;
    this.address = address;
  }

  /**
   * Get or create an instance of the BitcoinWallet.
   * @returns BitcoinWallet instance.
   */
  public static async getInstance(): Promise<BitcoinWallet> {
    const stateManager = StateManager.getInstance();
    if (!BitcoinWallet.instance) {
      const state = await stateManager.getState();

      console.log(state?.bitcoinWallet);
      const { privateKey, publicKey, address } =
        state?.bitcoinWallet || (await BitcoinWallet.deriveWalletTestnet4());
      await stateManager.setBitcoinWallet({ privateKey, publicKey, address });
      BitcoinWallet.instance = new BitcoinWallet(
        privateKey,
        publicKey,
        address,
      );
    }
    return BitcoinWallet.instance;
  }

  /**
   * Derive wallet keys and address for Bitcoin Testnet4
   * @returns Object containing private key, public key, and wallet address
   */
  private static deriveWalletTestnet4 = async (): Promise<{
    privateKey: string;
    publicKey: string;
    address: string;
  }> => {
    const node = await getHDNode(PATH,CRYPTO_CURVE,"snap_getBip32Entropy");

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

    return { privateKey, publicKey, address };
  };

  /**
   * Get the wallet's address.
   * @returns Wallet address.
   */
  public getWalletAddress(): string {
    if (!this.address) {
      throw new Error('Wallet address not initialized');
    }
    return this.address;
  }

  /**
   * Get the wallet's public key.
   * @returns Public key.
   */
  public getPublicKey(): string {
    if (!this.publicKey) {
      throw new Error('Public key not initialized');
    }
    return this.publicKey;
  }

  private async getUTXOs(): Promise<
    { txid: string; vout: number; value: number }[]
  > {
    if (!this.address) {
      throw new Error('Wallet address not initialized');
    }

    const response = await fetch(
      `https://mempool.space/testnet4/api/address/${this.address}/utxo`,
    );
    return await response.json();
  }

  private async broadcastTransaction(txHex: string): Promise<string> {
    const response = await fetch('https://mempool.space/testnet4/api/tx', {
      method: 'POST',
      body: txHex,
    });

    if (!response.ok) {
      throw new Error('Failed to broadcast transaction');
    }

    // Just return the text response since it's the txid directly
    return await response.text();
  }

  /**
   * Get the wallet's balance in satoshis.
   * @returns Balance in satoshis.
   */
  public async getBalance(): Promise<number> {
    if (!this.address) {
      throw new Error('Wallet address not initialized');
    }

    const utxos = await this.getUTXOs();
    const balance = utxos.reduce((total, utxo) => total + utxo.value, 0);

    return balance; // Balance in satoshis
  }

  /**
   * Send Bitcoin to a specified address
   * @param amount - Amount in satoshis
   * @param toAddress - Recipient Bitcoin address
   * @returns Transaction ID
   */
  public async send(amount: number, toAddress: string): Promise<string> {

    console.log('send: Start');
    if (!this.privateKey || !this.address) {
      throw new Error('Wallet not initialized');
    }

    const network = bitcoin.networks.testnet;
    let keyPair = ECPair.fromPrivateKey(Buffer.from(this.privateKey!, 'hex'), {
      network,
    });

    // Create transaction
    const psbt = new bitcoin.Psbt({ network });
    psbt.setVersion(2);
    const utxos = await this.getUTXOs();

    const pubkeyBuffer = Buffer.from(keyPair.publicKey);
    let inputAmount = 0;
    for (const utxo of utxos) {
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
          script: bitcoin.payments.p2wpkh({
            pubkey: pubkeyBuffer,
            network,
          }).output!,
          value: utxo.value,
        },
        sequence: 0xfffffffd, // Enable RBF
      });

      inputAmount += utxo.value;
      if (inputAmount >= amount + 1000) break; // Add fee estimate
    }

    if (inputAmount < amount + 1000) {
      throw new Error('Insufficient funds');
    }

    // Add outputs
    psbt.addOutput({
      address: toAddress,
      value: amount,
    });

    // Add change output if needed
    const change = inputAmount - amount - 1000;
    if (change > 546) {
      // Dust threshold
      psbt.addOutput({
        address: this.address,
        value: change,
      });
    }

    for (let i = 0; i < psbt.inputCount; i++) {
      psbt.signInput(i, {
        publicKey: Buffer.from(keyPair.publicKey),
        sign: (hash: Buffer) => {
          return Buffer.from(
            secp256k1.ecdsaSign(hash, Buffer.from(this.privateKey!, 'hex'))
              .signature,
          );
        },
      });
    }
    psbt.finalizeAllInputs();

    const tx = psbt.extractTransaction();
    const txHex = tx.toHex();
    const txId = await this.broadcastTransaction(txHex);
    console.log('send: Transaction broadcasted', txId);
    return txId;
  }
}
