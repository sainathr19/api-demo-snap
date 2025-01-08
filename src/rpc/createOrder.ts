import DataStore from '../utils/dataStore';
import { createOrder } from '../garden/createOrder';
import { Quote , RpcResponse } from '../interface';

export interface CreateSwapParams {
  inAmount: string;
  quote: Quote;
  evmAddress: string;
}
export const createGardenSwap = async (
  params: CreateSwapParams,
): Promise<RpcResponse> => {
  const { evmAddress, inAmount, quote } = params;
  try {
    const dataStore = DataStore.getInstance();

    const { orderId, secret } = await createOrder({
      inAmount,
      quote,
      evmAddress,
    });

    await dataStore.setOrderState({
      orderId,
      orderSecret: secret,
    });
    return { result: orderId, status: 'Ok' };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown Error Creating Order';
    return {
      status: 'Error',
      error: message,
    };
  }
};
