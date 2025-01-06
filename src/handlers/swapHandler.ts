import {
  BlockNumberResponse,
  CreateOrderParams,
  CreateOrderRes,
  FetchOrderResponse,
  FetchQuoteResponse,
  MatchedOrder,
  OrderCountResponse,
  RedeemRequest,
  RedeemResponse,
} from '../lib/types';
import { decimalToBase } from '../lib/utils';
import { API } from '../lib/api';
import { BitcoinWallet } from '../wallets/bitcoin';
import { xOnlyPubkey } from '../wallets/utils';
import { EVMWallet } from '../wallets/evm';
import { FetchOrdersResponse } from '../wallets/types';

const ASSETS = {
  fromChain: 'bitcoin_testnet',
  toChain: 'ethereum_sepolia',
  fromAsset: 'primary',
  toAsset: '0x3c6a17b8cd92976d1d91e491c93c98cd81998265',
};

// const userAddress = '0x....4Ec7';
// const initiatorSourceAddress = 'bfe...ade';
// const authToken = 'eyJ0eXAi..-6W_un98';


const authToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhZGRyZXNzIjoiMHg3QzI2MTYyYzVGMEM1OTg1MTA3NGVkNmJCZjI2ODc1NEY2YkU0RWM3IiwiZXhwIjoxNzM2MjQ1ODAwfQ.X_04nAf-Uy5SlNvZ-UWlp3tzjuyD-5WavIg5KCUjJmQ";
/**
 * Fetches a quote for a given amount of an asset.
 *
 * @param inAmount - The amount of the asset to fetch a quote for. Can be a number or a string.
 * @returns A promise that resolves to the quote result.
 * @throws Will throw an error if there is an error in the response data.
 */
export async function fetchQuote(inAmount: number | string) {
  const orderPair = `${ASSETS.fromChain}:${ASSETS.fromAsset}::${ASSETS.toChain}:${ASSETS.toAsset}`;
  try {
    const response = await fetch(
      `${API().quote}/quote?order_pair=${orderPair}&amount=${decimalToBase(
        inAmount,
        8,
      )}&exact_out=false`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const data: FetchQuoteResponse = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data.result;
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : 'Error Fetching Quote',
    );
  }
}

export async function fetchUserOrders(address: string): Promise<MatchedOrder[]> {
  if (!address) {
    throw new Error('Address is required to fetch user orders.');
  }
  try {
    const response = await fetch(
      `${API().orderbook}/orders/user/matched/${address}?per_page=6&pending=false`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    const data: FetchOrdersResponse = await response.json();
    return data.result.data;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Error Fetching User Orders',
    );
  }
}


/**
 * Initiates the redeem process for the order
 */
export const initiateRedeem = async (orderId: string, orderSecret: string) => {
  try {
    const redeemRequest: RedeemRequest = {
      order_id: orderId,
      secret: orderSecret,
      perform_on: 'Destination',
    };
    const response = await fetch(`${API().orderbook}/relayer/redeem`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(redeemRequest),
    });
    if (!response.ok) {
      const errorResponse = await response.json();
      throw new Error(errorResponse?.error || 'Failed to redeem');
    }
    const redeemResponse: RedeemResponse = await response.json();
    if (redeemResponse.status === 'Error') {
      throw new Error(redeemResponse.error);
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Error redeeming swap');
  }
};

/**
 * Fetches the latest block numbers from different chains
 */
export const fetchBlockNumbers = async () => {
  try {
    const response = await fetch(`${API().data.blockNumbers('testnet')}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: BlockNumberResponse = await response.json();
    return data;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Error fetching block numbers")
  }
};

export const fetchOrder = async (orderId: string) => {
  try {
    const response = await fetch(
      `${API().orderbook}/orders/id/matched/${orderId}`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: FetchOrderResponse = await response.json();

    if(data.error){
      throw new Error(data.error);
    }
    return data.result;
  } catch (error) {
    console.error('Failed to fetch order details:', error);
    throw new Error(error instanceof Error ? error.message : "Failed to fetch order data")
  }
};

/**
 * Retrieves the number of orders associated with a user's address
 * Used for nonce generation in order creation
 * @param address - User's wallet address
 */
async function fetchUserOrderCount(address: string): Promise<number> {
  const url = `${API().orderbook}/orders/user/count/${address}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(
        `Error fetching user order count: ${response.statusText}`,
      );
    }

    const data = (await response.json()) as OrderCountResponse;
    return data.result;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Error fetching user order count');
  }
}

/**
 * Generates a secret and its hash for the swap.
 * Uses the current epoch time as the secret and hashes it.
 * @param nonce - Unique number for this swap
 * @param address - User's Ethereum address
 */
const computeSecretHash = async (nonce: number, address: string) => {
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

/**
 * Creates an order for a swap transaction.
 *
 * @param {number} params.inAmount - The input amount for the swap.
 * @param {Quote} params.quote - The quote details for the swap.
 * @returns {Promise<CreateOrderRes>} - A promise that resolves to the created order response.
 * @throws {Error} - Throws an error if there is an issue creating the order or fetching the attested quote.
 */
export async function createOrder({
  inAmount,
  quote,
}: CreateOrderParams): Promise<CreateOrderRes> {
  const bitcoinWallet = await BitcoinWallet.getInstance();
  const evmWallet = await EVMWallet.getInstance();
  const walletAddress = evmWallet.getWalletAddress();
  try {
    const [strategy, quoteAmount] = Object.entries(quote.quotes)[0]!;

    const orderCount = await fetchUserOrderCount(walletAddress);

    const { secret, secretHash } = await computeSecretHash(
      orderCount + 1,
      walletAddress,
    );
    const pubKey = xOnlyPubkey(bitcoinWallet.getPublicKey()).toString('hex');
    const inAmountBase = decimalToBase(inAmount, 8);

    const order = {
      source_chain: ASSETS.fromChain,
      destination_chain: ASSETS.toChain,
      source_asset: ASSETS.fromAsset,
      destination_asset: ASSETS.toAsset,
      source_amount: inAmountBase.toString(),
      destination_amount: quoteAmount.toString(),
      initiator_source_address: pubKey,
      initiator_destination_address: walletAddress,
      secret_hash: secretHash,
      fee: '1',
      timelock: 288,
      nonce: (orderCount + 1).toString(),
      min_destination_confirmations: 0,
    };

    const attestedQuoteReq = {
      ...order,
      additional_data: {
        strategy_id: strategy,
        bitcoin_optional_recipient: bitcoinWallet.getWalletAddress(),
      },
    };

    const attestedQuoteRes = await fetch(`${API().quote}/quote/attested`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
        Origin: 'https://snap.garden.com',
      },
      body: JSON.stringify(attestedQuoteReq),
    }).then((res) => res.json());

    if (attestedQuoteRes.status === 'Error') {
      throw new Error('Error getting attested quote');
    }

    const createOrderReq = {
      ...order,
      additional_data: attestedQuoteRes.result.additional_data,
    };

    const createOrderRes = await fetch(
      `${API().orderbook}/relayer/create-order`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
          Origin: 'https://snap.garden.com',
        },
        body: JSON.stringify(createOrderReq),
      },
    ).then((res) => res.json());

    if (createOrderRes.status === 'Error') {
      throw new Error(createOrderRes.error);
    }

    return {
      orderId : createOrderRes.result,
      secret,
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Error intiating swap');
  }
}
