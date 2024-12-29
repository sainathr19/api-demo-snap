import { OrderState } from '../lib/types';

class StateManager {
  private static instance: StateManager;

  private constructor() {}

  static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  async getState(): Promise<OrderState | null> {
    return (await snap.request({
      method: 'snap_manageState',
      params: { operation: 'get' },
    })) as OrderState;
  }

  async setState(state: Partial<OrderState>): Promise<void> {
    await snap.request({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: state,
      },
    });
  }

  async updateState(interfaceId: string): Promise<void> {
    const currentState = await this.getState();
    await snap.request({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: {
          ...currentState,
          interfaceId,
        },
      },
    });
  }

  async clearState(): Promise<void> {
    await snap.request({
      method: 'snap_manageState',
      params: { operation: 'clear' },
    });
  }
}

export default StateManager;
