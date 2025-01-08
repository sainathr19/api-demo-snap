import { API } from '../utils/api';
import { CreateOrderParams, CreateOrderRes } from '../interface';
import { BitcoinWallet } from '../wallets/bitcoin';
import { fetchUserOrderCount } from './utils/getOrderCount';
import { computeSecretHash } from './utils/computeSecretHash';
import { xOnlyPubkey } from '../wallets/utils';
import { decimalToBase } from '../utils';

const ASSETS = {
  fromChain: 'bitcoin_testnet',
  toChain: 'ethereum_sepolia',
  fromAsset: 'primary',
  toAsset: '0x3c6a17b8cd92976d1d91e491c93c98cd81998265',
};

const GARDEN_API_KEY = 'AAAAAGlfR.......r4mmJGU9110c';
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
  evmAddress,
}: CreateOrderParams): Promise<CreateOrderRes> {
  const bitcoinWallet = await BitcoinWallet.getInstance();
  try {
    const [strategy, quoteAmount] = Object.entries(quote.quotes)[0]!;

    const orderCount = await fetchUserOrderCount(evmAddress);

    const { secret, secretHash } = await computeSecretHash(
      orderCount + 1,
      evmAddress,
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
      initiator_destination_address: evmAddress,
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
        'api-key': `${GARDEN_API_KEY}`,
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
          'api-key': `${GARDEN_API_KEY}`,
          Origin: 'https://snap.garden.com',
        },
        body: JSON.stringify(createOrderReq),
      },
    ).then((res) => res.json());

    if (createOrderRes.status === 'Error') {
      throw new Error(createOrderRes.error);
    }

    return {
      orderId: createOrderRes.result,
      secret,
    };
  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Error initiating swap',
    );
  }
}
