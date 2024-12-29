import {
  BlockNumberResponse,
  OrderStatus,
  Quote,
  SwapFormErrors,
  SwapFormState,
} from '../lib/types';
import HomePage from '../components/HomePage';
import SwapProgress from '../components/SwapProgress';
import { fetchBlockNumbers, fetchOrder } from './swapHandler';
import { parseStatus } from '../lib/utils';

class UIManager {
  private static instance: UIManager;

  private constructor() {}

  static getInstance(): UIManager {
    if (!UIManager.instance) {
      UIManager.instance = new UIManager();
    }
    return UIManager.instance;
  }

  async createHomePage(): Promise<string> {
    return await snap.request({
      method: 'snap_createInterface',
      params: {
        ui: <HomePage />,
      },
    })!;
  }

  async createProgressPage(orderId: string): Promise<string> {
    const blockNumbers = (await fetchBlockNumbers()) as BlockNumberResponse;
    const order = await fetchOrder(orderId);

    const status = parseStatus(order!, blockNumbers);
    const userCanRedeem = status == OrderStatus.CounterPartyInitiated;

    return await snap.request({
      method: 'snap_createInterface',
      params: {
        ui: (
          <SwapProgress
            order={order!}
            blockNumbers={blockNumbers}
            userCanRedeem={userCanRedeem}
          />
        ),
      },
    });
  }

  async updateHomePage(
    id: string,
    quote?: Quote,
    errors?: SwapFormErrors,
    formState?: SwapFormState,
  ): Promise<void> {
    await snap.request({
      method: 'snap_updateInterface',
      params: {
        id,
        ui: <HomePage />,
      },
    })!;
  }

  async updateProgressPage(orderId: string, interfaceId: string) {
    const blockNumbers = (await fetchBlockNumbers()) as Record<string, number>;
    const order = await fetchOrder(orderId);

    const status = parseStatus(order!, blockNumbers);
    const userCanRedeem = status == OrderStatus.CounterPartyInitiated;

    return await snap.request({
      method: 'snap_updateInterface',
      params: {
        id: interfaceId,
        ui: (
          <SwapProgress
            order={order!}
            blockNumbers={blockNumbers!}
            userCanRedeem={userCanRedeem}
          />
        ),
      },
    });
  }
}

export default UIManager;
