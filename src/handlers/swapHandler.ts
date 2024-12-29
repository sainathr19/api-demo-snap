import {
  BlockNumberResponse,
  CreateOrderParams,
  CreateOrderRes,
  FetchOrderResponse,
  FetchQuoteResponse,
  OrderCountResponse,
  RedeemRequest,
  RedeemResponse,
} from '../lib/types';
import { decimalToBase } from '../lib/utils';
import { API } from '../lib/api';

const ASSETS = {
  fromChain: 'bitcoin_testnet',
  toChain: 'ethereum_sepolia',
  fromAsset: 'primary',
  toAsset: '0x3c6a17b8cd92976d1d91e491c93c98cd81998265',
};

const userAddress = '0x....4Ec7';
const initiatorSourceAddress = 'bfe...ade';
const authToken = 'eyJ0eXAi..-6W_un98';

export async function fetchQuote(inAmount: number | string) {
  const orderPair = `${ASSETS.fromChain}:${ASSETS.fromAsset}::${ASSETS.toChain}:${ASSETS.toAsset}`;
  const response = await fetch(
    `${API().quote}?order_pair=${orderPair}&amount=${decimalToBase(
      inAmount,
      8,
    )}&exact_out=false`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    },
  );
  const data: FetchQuoteResponse = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data.result;
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
      throw new Error(redeemResponse.error || 'Failed to redeem');
    }
  } catch (error) {
    console.error('Failed to redeem:', error);
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
    console.error('Failed to fetch block numbers:', error);
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

    if (data.status === 'Ok') {
      return data.result;
    }
  } catch (error) {
    console.error('Failed to fetch order details:', error);
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
    console.error('Error fetching user order count:', error);
    return 0;
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

export async function createOrder({
  inAmount,
  quote,
  refundAddress,
}: CreateOrderParams): Promise<CreateOrderRes> {
  try {
    const [strategy, quoteAmount] = Object.entries(quote.quotes)[0]!;

    const orderCount = await fetchUserOrderCount(userAddress);

    console.log('User Order Count : ', orderCount);

    const { secret, secretHash } = await computeSecretHash(
      orderCount + 1,
      userAddress,
    );

    const inAmountBase = decimalToBase(inAmount, 8);

    const order = {
      source_chain: ASSETS.fromChain,
      destination_chain: ASSETS.toChain,
      source_asset: ASSETS.fromAsset,
      destination_asset: ASSETS.toAsset,
      source_amount: inAmountBase.toString(),
      destination_amount: quoteAmount.toString(),
      initiator_source_address: initiatorSourceAddress,
      initiator_destination_address: userAddress,
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
        bitcoin_optional_recipient: refundAddress,
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

    console.log('createOrder Response : ', createOrderRes);
    if (!createOrderRes || createOrderRes.status === 'Error') {
      throw new Error('Error creating swap order');
    }
    const orderId = createOrderRes.result;
    let res: CreateOrderRes = { orderId, secret };
    return res;
  } catch (error) {
    console.error('Error in createOrderFlow:', error);
    throw error;
  }
}
