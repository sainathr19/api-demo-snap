import { PersistedData } from '../interface';
import { BitcoinWalletState, OrderState } from '../interface';

class DataStore {
  private static instance: DataStore;

  static getInstance(): DataStore {
    if (!DataStore.instance) {
      DataStore.instance = new DataStore();
    }
    return DataStore.instance;
  }

  async getState(): Promise<PersistedData | null> {
    return (await snap.request({
      method: 'snap_manageState',
      params: { operation: 'get' },
    })) as PersistedData;
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

export default DataStore;
