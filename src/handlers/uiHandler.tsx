import { BlockNumberResponse } from '../lib/types';
import HomePage from '../components/HomePage';
import SwapProgress from '../components/SwapProgress';
import { fetchBlockNumbers, fetchOrder } from './swapHandler';
import { BitcoinWallet } from '../wallets/bitcoin';
class UIManager {
  private static instance: UIManager;

  static getInstance(): UIManager {
    if (!UIManager.instance) {
      UIManager.instance = new UIManager();
    }
    return UIManager.instance;
  }

  async createHomePage(): Promise<string> {
    const bitcoinWallet = await BitcoinWallet.getInstance();
    const btcAddress = bitcoinWallet.getWalletAddress();
    const btcBalance = await bitcoinWallet.getBalance()

    return await snap.request({
      method: 'snap_createInterface',
      params: {
        ui: <HomePage btcAddress={btcAddress}  btcBalance={btcBalance}/>,
        context: {
          btcAddress,
        },
      },
    })!;
  }

  async createProgressPage(orderId: string): Promise<string> {
    const blockNumbers = await fetchBlockNumbers();
    const order = await fetchOrder(orderId);

    return await snap.request({
      method: 'snap_createInterface',
      params: {
        ui: <SwapProgress order={order} blockNumbers={blockNumbers} />,
      },
    });
  }

  async updateInterface(id: string, ui: JSX.Element, context?: any) {
    await snap.request({
      method: 'snap_updateInterface',
      params: { id, ui, context },
    });
  }
}

export default UIManager;
