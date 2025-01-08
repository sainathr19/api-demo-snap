import { API } from "../utils/api";
import { RedeemRequest, RedeemResponse } from "../interface";

const GARDEN_API_KEY = 'AAAAAGlfR.......r4mmJGU9110c';

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
        'api-key' :`${GARDEN_API_KEY}`,
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