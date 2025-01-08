import {
  OnCronjobHandler,
  type OnRpcRequestHandler,
} from '@metamask/snaps-sdk';
import { BitcoinWallet } from './wallets/bitcoin';
import { createGardenSwap } from './rpc/createOrder';
import { GardenSwapRpcRequest, RpcResponseError } from './interface';
import { validateRequest } from './rpc/validateRequest';
import { initializeBtcWallet } from './rpc/initializeBtcWallet';
import DataStore from './utils/dataStore';
import { checkAndRedeem } from './rpc/checkAndRedeem';

export type RpcRequest = {
  origin: string;
  request: GardenSwapRpcRequest;
};

export const onRpcRequest: OnRpcRequestHandler = async ({ request }) => {
  if (!validateRequest(request)) {
    return RpcResponseError('Invalid Request');
  }

  switch (request.method) {
    case 'initialize_btcWallet':
      return initializeBtcWallet();
    case 'get_walletStatus':
      return await BitcoinWallet.isInitialized();
    case 'garden_createOrder':
      return createGardenSwap(request.params);
    default:
      return RpcResponseError('Invalid Method');
  }
};

export const onCronjob: OnCronjobHandler = async ({ request }) => {
  const dataStore = DataStore.getInstance();
  switch (request.method) {
    case 'checkOrderStatus':
      const state = await dataStore.getState();
      if (!state?.pendingOrder) {
        console.log('No pending orders Found');
        return;
      }
      await checkAndRedeem(state.pendingOrder);

    default:
      throw new Error('Method not found.');
  }
};
