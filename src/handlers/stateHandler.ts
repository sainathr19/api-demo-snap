import { BitcoinWalletState, DataStore, OrderState } from '../lib/types';

class StateManager {
  private static instance: StateManager;

  private constructor() {}

  static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  async getState(): Promise<DataStore | null> {
    return (await snap.request({
      method: 'snap_manageState',
      params: { operation: 'get' },
    })) as DataStore;
  }
  async setOrderState(state: OrderState): Promise<void> {

    const currentState = await this.getState();
    await snap.request({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: {
          bitcoinWallet: currentState?.bitcoinWallet || null,
          pendingOrder: state,
        },
      },
    });
  }

  async setBitcoinWallet(state: BitcoinWalletState): Promise<void> {
    const currentState = await this.getState();
    await snap.request({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: {
          ...currentState,
          bitcoinWallet: state,
        },
      },
    });
  }

  async updateOrderInterfaceId(interfaceId: string): Promise<void> {
    const currentState = await this.getState();
    const pendingOrder = currentState?.pendingOrder;
    await snap.request({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: {
          ...currentState,
          pendingOrder: {
            ...pendingOrder,
            interfaceId,
          },
        },
      },
    });
  }

  async clearPendingOrder(): Promise<void> {
    const currentState = await this.getState();
  
    if (!currentState || !currentState.bitcoinWallet) {
      await snap.request({
        method: 'snap_manageState',
        params: {
          operation: 'clear',
        },
      });
      return;
    }

    const bitcoinWallet = currentState.bitcoinWallet;
    await snap.request({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: {
          bitcoinWallet,
          pendingOrder: null,
        },
      },
    });
  }
  
}

export default StateManager;
