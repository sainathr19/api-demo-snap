import {
  OnCronjobHandler,
  OnInstallHandler,
  OnUserInputHandler,
  UserInputEventType,
  type OnHomePageHandler,
  type OnRpcRequestHandler,
} from '@metamask/snaps-sdk';
import {
  OrderState,
  OrderStatus,
  type SwapFormErrors,
  type SwapFormState,
} from './lib/types';
import {
  fetchBlockNumbers,
  fetchOrder,
  initiateRedeem,
} from './handlers/swapHandler';
import SwapProgress from './components/SwapProgress';
import { baseToDecimal, parseStatus } from './lib/utils';
import StateManager from './handlers/stateHandler';
import UIManager from './handlers/uiHandler';
import SwapSuccess from './components/SwapSuccess';
import {
  HandleHistoryClick,
  HandleInAmountChange,
  HandleInitiateSwap,
} from './handlers/inputHandler';
import { BitcoinWallet } from './wallets/bitcoin';
import HomePage from './components/HomePage';
import { EVMWallet } from './wallets/evm';

const stateManager = StateManager.getInstance();
const uiManager = UIManager.getInstance();

export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  switch (request.method) {
    case 'home':
      const interfaceId = await uiManager.createHomePage();
      return { id: interfaceId };
    default:
      throw new Error('Method not found.');
  }
};

export const onHomePage: OnHomePageHandler = async () => {
  let state = await stateManager.getState();
  let interfaceId;

  // If no pending orders, show the home page
  if (!state?.pendingOrder) {
    interfaceId = await uiManager.createHomePage();
  } else {
    // If there is a pending order, show the order progress
    const { orderId } = state.pendingOrder;
    interfaceId = await uiManager.createProgressPage(orderId);
    await stateManager.updateOrderInterfaceId(interfaceId);
  }

  return { id: interfaceId };
};

export const onCronjob: OnCronjobHandler = async ({ request }) => {
  switch (request.method) {
    case 'checkOrderStatus':
      const state = await stateManager.getState();
      
      console.log(state?.pendingOrder);
      if (!state?.pendingOrder) {
        console.log('No pending orders Found');
        return;
      }
      await UpdateOrderProgress(state.pendingOrder);

    default:
      throw new Error('Method not found.');
  }
};

export const onInstall: OnInstallHandler = async () => {
  // Request Permission to Ethereum Accounts
  await ethereum.request({
    "method": "eth_requestAccounts",
    "params": [],
   });
};

export const onUserInput: OnUserInputHandler = async ({
  event,
  id,
  context,
}) => {
  const bitcoinWallet = await BitcoinWallet.getInstance();
  const btcAddress = bitcoinWallet.getWalletAddress();
  const btcBalance = await bitcoinWallet.getBalance();
  switch (event.type) {
    case UserInputEventType.InputChangeEvent: {
      const inputName = event.name;
      switch (inputName) {
        case 'in_amount':
          const input = event.value as string;
          await HandleInAmountChange(context, id, input);
          break;

        default:
          console.warn(`Unhandled input change event: ${inputName}`);
          break;
      }
      break;
    }
    case UserInputEventType.ButtonClickEvent: {
      const buttonName = event.name;
      switch (buttonName) {
        case 'initiate_swap':
          await HandleInitiateSwap(context, id);
          break;

        case 'history':
          await HandleHistoryClick(id);
          break;

        case 'back': {
          await snap.request({
            method: 'snap_updateInterface',
            params: {
              id,
              ui: <HomePage btcAddress={btcAddress} btcBalance={btcBalance} />,
            },
          });
        }
        case 'copy_address':
          await navigator.clipboard.writeText(btcAddress);
        default:
          console.warn(`Unhandled button click event: ${buttonName}`);
          break;
      }
      break;
    }
    default: {
      console.warn(`Unhandled event type: ${event.type}`);
      break;
    }
  }
};

export const UpdateOrderProgress = async (pendingOrder: OrderState) => {
  const { orderId, orderSecret, interfaceId } = pendingOrder;
  const blockNumbers = (await fetchBlockNumbers()) as Record<string, number>;
  const order = await fetchOrder(orderId);

  const status = parseStatus(order, blockNumbers);

  if (status === OrderStatus.CounterPartyInitiated) {
    await initiateRedeem(orderId, orderSecret);
    await stateManager.clearPendingOrder();
    await snap.request({
      method: 'snap_notify',
      params: {
        type: 'native',
        message: 'Swap Successfull',
      },
    });
    await snap.request({
      method: 'snap_notify',
      params: {
        type: 'inApp',
        message: 'Swap Successfull',
      },
    });
    await uiManager.updateInterface(interfaceId, <SwapSuccess />);
    return;
  }
  await uiManager.updateInterface(
    interfaceId,
    <SwapProgress order={order} blockNumbers={blockNumbers} />,
  );
};

export function validateInputs(
  formState: SwapFormState,
  btcBalance: string,
): SwapFormErrors {
  let errors: SwapFormErrors = {};

  if (!formState.in_amount) {
    errors.inAmount = 'Amount is required';
  } else {
    let inAmount = parseFloat(formState.in_amount);
    if (isNaN(inAmount) || inAmount < 0.01 || inAmount > 5) {
      errors.inAmount =
        (errors.inAmount ? errors.inAmount + '. ' : '') +
        'Amount should be in the range of 0.01 - 5.';
    }
    if (inAmount > parseFloat(btcBalance)) {
      errors.inAmount =
        (errors.inAmount ? errors.inAmount + '. ' : '') +
        'Insufficient balance';
    }
  }
  return errors;
}
