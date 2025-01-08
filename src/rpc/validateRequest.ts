import { JsonRpcParams, JsonRpcRequest } from '@metamask/snaps-sdk';
import { GardenSwapRpcRequest } from '../interface';

export const validateRequest = (
  req: JsonRpcRequest<JsonRpcParams>,
): req is GardenSwapRpcRequest => {
  return (
    req &&
    typeof req === 'object' &&
    'method' in req &&
    ['get_walletStatus', 'initialize_btcWallet', 'garden_createOrder'].includes(
      req.method,
    )
  );
};
