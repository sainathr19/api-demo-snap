import { initiateRedeem } from "../garden/initiateRedeem";
import { fetchBlockNumbers } from "../garden/utils/blockNumbers";
import { fetchOrder } from "../garden/utils/fetchOrder";
import { OrderState, OrderStatus } from "../interface";
import { parseStatus } from "../utils";
import DataStore from "../utils/dataStore";
import { sendNotifications } from "../utils/notify";
import { BitcoinWallet } from "../wallets/bitcoin";

export const checkAndRedeem = async (pendingOrder: OrderState) => {
    const { orderId, orderSecret } = pendingOrder;
    const bitcoinWallet = await BitcoinWallet.getInstance();
    const dataStore = DataStore.getInstance();
    const order = await fetchOrder(orderId);
    
    if(!order){
      console.log("Order not Matched");
      return;
    }
  
    const { amount, swap_id: depositAddress ,initiate_tx_hash } = order.source_swap;
    if(!initiate_tx_hash){
      const sendAmount = parseInt(amount);
      
      // Initiate tBTC Deposit
      const txHash = await bitcoinWallet.send(sendAmount, depositAddress);
      
      await dataStore.setOrderState({
        ...pendingOrder,
        initiateTxHash : txHash
      })
      return;
    }
  
    const blockNumbers = (await fetchBlockNumbers()) as Record<string, number>;
    const status = parseStatus(order,blockNumbers);
    
    if (status === OrderStatus.CounterPartyInitiated) {
      await initiateRedeem(orderId, orderSecret);
      await dataStore.clearPendingOrder();
      await sendNotifications();
      return;
    }
  
  }
  
  