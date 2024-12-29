import {
  OnCronjobHandler,
  OnUserInputHandler,
  UserInputEventType,
  type OnHomePageHandler,
  type OnRpcRequestHandler,
} from '@metamask/snaps-sdk';
import {
  OrderState,
  OrderStatus,
  type Quote,
  type SwapFormErrors,
  type SwapFormState,
} from './lib/types';
import {
  createOrder,
  fetchBlockNumbers,
  fetchOrder,
  fetchQuote,
  initiateRedeem,
} from './handlers/swapHandler';
import SwapProgress from './components/SwapProgress';
import HomePage from './components/HomePage';
import { parseStatus } from './lib/utils';
import StateManager from './handlers/stateHandler';
import UIManager from './handlers/uiHandler';
import SwapSuccess from './components/SwapSuccess';

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
  const state = await stateManager.getState();
  console.log(state);
  // If no pending orders, show the home page
  if (!state || !state.orderId) {
    console.info('No pending orders Found');
    const interfaceId = await uiManager.createHomePage();
    return { id: interfaceId };
  }

  // If there is a pending order, show the order progress

  const orderId = state.orderId as string;
  const interfaceId = await uiManager.createProgressPage(orderId);
  await stateManager.setState({ interfaceId });

  return { id: interfaceId };
};

export const onCronjob: OnCronjobHandler = async ({ request }) => {
  switch (request.method) {
    case 'checkOrderStatus':
      const state = await stateManager.getState();

      if (!state?.orderId) {
        console.log('No pending orders Found');
        return;
      }
      await uiManager.updateProgressPage(state.orderId, state.interfaceId);

    default:
      throw new Error('Method not found.');
  }
};

export const onUserInput: OnUserInputHandler = async ({
  event,
  id,
  context,
}) => {
  switch (event.type) {
    case UserInputEventType.InputChangeEvent:
      switch (event.name) {
        case 'in_amount': {
          const inAmount = event.value as string;
          if (inAmount) {
            try {
              const quote: Quote = await fetchQuote(inAmount);
              await snap.request({
                method: 'snap_updateInterface',
                params: {
                  id,
                  ui: <HomePage quote={quote} inAmount={inAmount} />,
                  context: {
                    quote: quote,
                  },
                },
              });
            } catch (error) {
              console.error('Error fetching quote:', error);
            }
          } else {
            await snap.request({
              method: 'snap_updateInterface',
              params: {
                id,
                ui: <HomePage />,
              },
            });
          }
          break;
        }
        default:
          break;
      }
    case UserInputEventType.ButtonClickEvent:
      switch (event.name) {
        case 'initiate_swap':
          const state = await snap.request({
            method: 'snap_getInterfaceState',
            params: { id },
          });

          const swapForm = state['swap_form']! as SwapFormState;
          const errors = validateInputs(swapForm);
          const quote: Quote =
            (context?.quote as Quote) || (await fetchQuote(swapForm.in_amount));

          if (errors.inAmount || errors.refundAddress) {
            await snap.request({
              method: 'snap_updateInterface',
              params: {
                id,
                ui: (
                  <HomePage
                    errors={errors}
                    inAmount={swapForm.in_amount}
                    refundAddress={swapForm.refund_address}
                    quote={quote}
                  />
                ),
              },
            });
            break;
          }

          try {
            let { orderId, secret } = await createOrder({
              inAmount: swapForm.in_amount,
              quote,
              refundAddress: swapForm.refund_address,
            });

            const newState: OrderState = {
              orderId,
              orderSecret: secret,
              interfaceId: id,
            };
            await stateManager.setState(newState);

            const blockNumbers = (await fetchBlockNumbers()) as Record<
              string,
              number
            >;
            const order = await fetchOrder(orderId);

            const status = parseStatus(order!, blockNumbers);
            const userCanRedeem = status == OrderStatus.CounterPartyInitiated;

            await snap.request({
              method: 'snap_updateInterface',
              params: {
                id,
                ui: (
                  <SwapProgress
                    order={order!}
                    blockNumbers={blockNumbers!}
                    userCanRedeem={userCanRedeem}
                  />
                ),
              },
            });
            break;
          } catch (err: any) {
            errors.createError = err as string;
            await snap.request({
              method: 'snap_updateInterface',
              params: {
                id,
                ui: (
                  <HomePage
                    errors={errors}
                    inAmount={swapForm.in_amount}
                    refundAddress={swapForm.refund_address}
                    quote={quote}
                  />
                ),
              },
            });
          }
        case 'redeem':
          const orderState = await stateManager.getState();

          if (!orderState) return;

          const { orderId, orderSecret } = orderState;

          try {
            await initiateRedeem(orderId, orderSecret);
            await stateManager.clearState();

            await snap.request({
              method: 'snap_updateInterface',
              params: {
                id,
                ui: <SwapSuccess />,
              },
            });
          } catch (err) {
            console.error('Error Redeeming:', err);
          }
          break;
      }
  }
};

export function validateInputs(formState: SwapFormState): SwapFormErrors {
  let errors: SwapFormErrors = {};

  // Validate input amount
  if (!formState.in_amount) {
    errors.inAmount = 'Amount is required';
  } else {
    let inAmount = parseFloat(formState.in_amount);
    if (isNaN(inAmount) || inAmount < 0.01 || inAmount > 5) {
      errors.inAmount =
        (errors.inAmount ? errors.inAmount + '. ' : '') +
        'Amount should be in the range of 0.01 - 5.';
    }
  }

  // Validate refund address
  if (!formState.refund_address) {
    errors.refundAddress = 'Recovery address is required';
  } else if (!formState.refund_address.startsWith('tb')) {
    errors.refundAddress =
      (errors.refundAddress ? errors.refundAddress + '. ' : '') +
      'Invalid Bitcoin Address';
  }

  return errors;
}
