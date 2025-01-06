import { Json } from '@metamask/snaps-sdk';
import HomePage from '../components/HomePage';
import { BlockNumberResponse, OrderState, Quote, SwapFormErrors, SwapFormState } from '../lib/types';
import {
  createOrder,
  fetchBlockNumbers,
  fetchOrder,
  fetchQuote,
  fetchUserOrders,
} from './swapHandler';
import UIManager from './uiHandler';
import { BitcoinWallet } from '../wallets/bitcoin';
import SwapProgress from '../components/SwapProgress';
import StateManager from './stateHandler';
import { validateInputs } from '../index';
import SwapHistory from '../components/SwapHistory';
import { EVMWallet } from '../wallets/evm';

const uiManager = UIManager.getInstance();

export const HandleInAmountChange = async (context: Record<string, Json> | null,id: string , inAmount: string) => {

  if(!inAmount || parseFloat(inAmount)==0) return;
  const bitcoinWallet = await BitcoinWallet.getInstance();
  const btcBalance = await bitcoinWallet.getBalance()
  const btcAddress = context?.btcAddress as string;
  try {
    const quote: Quote = context?.quote as Quote || await fetchQuote(inAmount);
    await uiManager.updateInterface(
      id,
      <HomePage quote={quote} inAmount={inAmount} btcAddress={btcAddress} btcBalance={btcBalance} />,
    );
  } catch (err) {
    const errors: SwapFormErrors = {
      createError: err instanceof Error ? err.message : 'Error Fetching Quote',
    };
    await uiManager.updateInterface(
      id,
      <HomePage errors={errors} inAmount={inAmount}  btcAddress={btcAddress} btcBalance={btcBalance}/>,
    );
  }
};

export const HandleHistoryClick = async (id : string) => {
  const evmWallet = await EVMWallet.getInstance();
  const walletAddress = evmWallet.getWalletAddress();
  try{
    const userHistory = await fetchUserOrders(walletAddress)
    const blockNumbers = await fetchBlockNumbers();
    await uiManager.updateInterface(id,<SwapHistory orders={userHistory} blockNumbers={blockNumbers}/>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occured'
    await uiManager.updateInterface(id,<SwapHistory error={message}/>)
  }
}

export const HandleInitiateSwap = async (
  context: Record<string, Json> | null,
  id: string,
) => {
  const uiManager = UIManager.getInstance();
  const bitcoinWallet = await BitcoinWallet.getInstance();
  const stateManager = StateManager.getInstance();
  const state = await snap.request({
    method: 'snap_getInterfaceState',
    params: { id },
  });

  const swapForm = state['swap_form']! as SwapFormState;
  const btcAddress = bitcoinWallet.getWalletAddress();
  const btcBalance = await bitcoinWallet.getBalance();
  const errors = validateInputs(swapForm, btcBalance.toString());

  const quote: Quote =
    (context?.quote! as Quote) || (await fetchQuote(swapForm.in_amount));


  // Update the interface with the errors if there are any
  if (errors.inAmount) {
    await uiManager.updateInterface(
      id,
      <HomePage errors={errors} inAmount={swapForm.in_amount} quote={quote} btcAddress={btcAddress} btcBalance={btcBalance} />,
    );
    return;
  }

  // Show loading screen
  await uiManager.updateInterface(
    id,
    <HomePage inAmount={swapForm.in_amount} quote={quote} isLoading={true} btcAddress={btcAddress} btcBalance={btcBalance}/>,
  );

  try {
    let { orderId, secret } = await createOrder({
      inAmount: swapForm.in_amount,
      quote,
    });

    const blockNumbers = (await fetchBlockNumbers()) as BlockNumberResponse;

    let order;
    // Wait until Order is matched
    while (!order) {
      order = await fetchOrder(orderId);
    }

    const { amount, swap_id: depositAddress } = order.source_swap;
    const sendAmount = parseInt(amount);

    // Initiate tBTC Deposit 
    const txHash = await bitcoinWallet.send(sendAmount, depositAddress);

    const newState: OrderState = {
      orderId,
      orderSecret: secret,
      interfaceId: id,
      initiateTxHash: txHash,
    };

    // Store order details in persistant storage
    await stateManager.setOrderState(newState);

    // Update the UI with swap progress
    await uiManager.updateInterface(
      id,
      <SwapProgress order={order!} blockNumbers={blockNumbers} />,
    );
  } catch (err) {
    const errors: SwapFormErrors = {
      createError: err instanceof Error ? err.message : 'Error Initiating swap',
    };
    await uiManager.updateInterface(
      id,
      <HomePage errors={errors} inAmount={swapForm.in_amount} quote={quote} btcAddress={btcAddress} btcBalance={btcBalance}/>,
    );
  }
};
