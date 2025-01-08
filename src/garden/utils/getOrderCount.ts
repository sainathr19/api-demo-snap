import { API } from '../../utils/api';
import { OrderCountResponse } from '../../interface';

/**
 * Retrieves the number of orders associated with a user's address
 * Used for nonce generation in order creation
 * @param address - User's wallet address
 */
export async function fetchUserOrderCount(address: string): Promise<number> {
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
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Error fetching user order count',
    );
  }
}
