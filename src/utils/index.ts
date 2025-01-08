import {
    BlockNumberResponse,
    MatchedOrder,
    OrderStatus,
    Quote,
    Swap,
    SwapStatus,
  } from '../interface';
  
  export const with0x = (str: string) =>
    str.startsWith('0x') ? str : `0x${str}`;
  export const trim0x = (str: string) =>
    str.startsWith('0x') ? str.slice(2) : str;
  
  export const baseToDecimal = (
    baseUnits: number | string,
    decimals: number,
  ): number => {
    return Number((Number(baseUnits) / 10 ** decimals).toFixed(decimals));
  };
  
  export const decimalToBase = (
    decimalAmount: string | number,
    decimals: number,
  ): number => {
    return Math.round(parseFloat(decimalAmount.toString()) * 10 ** decimals);
  };
  
  export const getBestQuote = (quote: Quote) => {
    return Object.values(quote.quotes)[0]!;
  };
  
  export const calculateFee = (quote: Quote, amount: string) => {
    let inAmount = parseFloat(amount);
    let bestQuote = getBestQuote(quote);
  
    let inAmountUsd = inAmount * quote.input_token_price;
    let outAmount = baseToDecimal(bestQuote, 8);
    let outAmountUsd = outAmount * quote.output_token_price;
  
    let fee = inAmountUsd - outAmountUsd;
  
    return fee;
  };
  
  export const parseStatus = (
    order: MatchedOrder,
    blockNumbers: BlockNumberResponse,
  ) => {
    const { source_swap, destination_swap } = order;
    const sourceBlockNumber = blockNumbers[source_swap.chain]!;
    const destinationBlockNumber = blockNumbers[destination_swap.chain]!;
  
    return ParseOrderStatus(order, sourceBlockNumber, destinationBlockNumber);
  };
  
  export function truncate(str: string, length: number): string {
    return str.length > length * 2
      ? `${str.slice(0, length)}...${str.slice(str.length - length, str.length)}`
      : str;
  }
  
  export function getFormattedDate(CreatedAt: string): string {
    const date = new Date(CreatedAt);
  
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
  
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
  
    return `${day} ${month} ${year} | ${hours} : ${minutes}`;
  }
  
  export const ParseOrderStatus = (
    order: MatchedOrder,
    sourceChainCurrentBlockNumber: number,
    destChainCurrentBlockNumber: number,
  ): OrderStatus => {
    const sourceSwapStatus = ParseSwapStatus(
      order.source_swap,
      sourceChainCurrentBlockNumber,
    );
    const destSwapStatus = ParseSwapStatus(
      order.destination_swap,
      destChainCurrentBlockNumber,
    );
  
    //redeem check
    if (destSwapStatus === SwapStatus.RedeemDetected)
      return OrderStatus.RedeemDetected;
    if (destSwapStatus === SwapStatus.Redeemed) return OrderStatus.Redeemed;
  
    //source refund check
    if (sourceSwapStatus === SwapStatus.Refunded) return OrderStatus.Refunded;
    if (sourceSwapStatus === SwapStatus.RefundDetected)
      return OrderStatus.RefundDetected;
  
    //expiry check
    if (destSwapStatus === SwapStatus.Expired)
      return OrderStatus.CounterPartySwapExpired;
    if (sourceSwapStatus === SwapStatus.Expired) return OrderStatus.Expired;
  
    //dest refund check
    if (destSwapStatus === SwapStatus.Refunded)
      return OrderStatus.CounterPartyRefunded;
    if (destSwapStatus === SwapStatus.RefundDetected)
      return OrderStatus.CounterPartyRefundDetected;
  
    const attestedDeadlineUnixTime = Number(
      order.create_order.additional_data.deadline,
    );
  
    //initiate check
    if (destSwapStatus === SwapStatus.Initiated)
      return OrderStatus.CounterPartyInitiated;
    if (destSwapStatus === SwapStatus.InitiateDetected)
      return OrderStatus.CounterPartyInitiateDetected;
  
    // Should be confirmed 12 hours before the deadline
    if (isExpired(attestedDeadlineUnixTime, 12))
      return OrderStatus.DeadLineExceeded;
    if (sourceSwapStatus === SwapStatus.Initiated) return OrderStatus.Initiated;
  
    //should initiate before 1 hour of deadline in attested quote
    if (isExpired(attestedDeadlineUnixTime, 1))
      return OrderStatus.DeadLineExceeded;
    if (sourceSwapStatus === SwapStatus.InitiateDetected)
      return OrderStatus.InitiateDetected;
  
    if (sourceSwapStatus === SwapStatus.Redeemed)
      return OrderStatus.CounterPartyRedeemed;
    if (sourceSwapStatus === SwapStatus.RedeemDetected)
      return OrderStatus.CounterPartyRedeemDetected;
  
    return OrderStatus.Matched;
  };
  
  export const ParseSwapStatus = (swap: Swap, currentBlockNumber: number) => {
    //redeem check
    if (swap.redeem_tx_hash) {
      if (Number(swap.redeem_block_number)) return SwapStatus.Redeemed;
      return SwapStatus.RedeemDetected;
    }
  
    //refund check
    if (swap.refund_tx_hash) {
      if (Number(swap.refund_block_number)) return SwapStatus.Refunded;
      return SwapStatus.RefundDetected;
    }
  
    //expiry check
    if (Number(swap.initiate_block_number)) {
      const swapExpiryBlockNumber =
        Number(swap.initiate_block_number) + swap.timelock;
      if (currentBlockNumber > swapExpiryBlockNumber) return SwapStatus.Expired;
    }
  
    //initiate check
    if (swap.initiate_tx_hash) {
      if (Number(swap.initiate_block_number)) return SwapStatus.Initiated;
      return SwapStatus.InitiateDetected;
    }
  
    return SwapStatus.Idle;
  };
  
  export const isExpired = (unixTime: number, tillHours = 0): boolean => {
    const currentTime = Date.now();
    const expiryTime = unixTime * 1000 + tillHours * 3600000;
    return currentTime >= expiryTime;
  };
  
  export enum StatusLabel {
    Created = 'Awaiting Match',
    Matched = 'Awaiting Deposit',
    InitiateDetected = 'Awaiting Confirmation',
    Initiated = 'Deposit Confirmed',
    CounterPartyInitiateDetected = 'Confirming Counter Party Deposit',
    CounterPartyInitiated = 'Ready to Redeem',
    RedeemDetected = 'Confirming Redeem',
    Redeemed = 'Completed',
    CounterPartyRedeemDetected = 'Completing Swap',
    CounterPartyRedeemed = 'Awaiting Final Confirmation',
    Completed = 'Swap Completed',
    CounterPartySwapExpired = 'Counter Party Expired',
    Expired = 'Swap Expired',
    RefundDetected = 'Confirming Refund',
    Refunded = 'Refunded Successfully',
    CounterPartyRefundDetected = 'Counter Party Refunding',
    CounterPartyRefunded = 'Counter Party Refunded',
    Cancelled = 'Swap Cancelled',
    DeadLineExceeded = 'Deadline Exceeded',
    Pending = 'Pending',
  }
  
  export const getUserFriendlyStatus = (status: OrderStatus): string => {
    switch (status) {
      case OrderStatus.Created:
        return StatusLabel.Created;
      case OrderStatus.Matched:
        return StatusLabel.Matched;
      case OrderStatus.InitiateDetected:
        return StatusLabel.InitiateDetected;
      case OrderStatus.Initiated:
        return StatusLabel.Initiated;
      case OrderStatus.CounterPartyInitiateDetected:
        return StatusLabel.CounterPartyInitiateDetected;
      case OrderStatus.CounterPartyInitiated:
        return StatusLabel.CounterPartyInitiated;
      case OrderStatus.RedeemDetected:
        return StatusLabel.RedeemDetected;
      case OrderStatus.Redeemed:
        return StatusLabel.Redeemed;
      case OrderStatus.CounterPartyRedeemDetected:
        return StatusLabel.CounterPartyRedeemDetected;
      case OrderStatus.CounterPartyRedeemed:
        return StatusLabel.CounterPartyRedeemed;
      case OrderStatus.Completed:
        return StatusLabel.Completed;
      case OrderStatus.CounterPartySwapExpired:
        return StatusLabel.CounterPartySwapExpired;
      case OrderStatus.Expired:
        return StatusLabel.Expired;
      case OrderStatus.RefundDetected:
        return StatusLabel.RefundDetected;
      case OrderStatus.Refunded:
        return StatusLabel.Refunded;
      case OrderStatus.CounterPartyRefundDetected:
        return StatusLabel.CounterPartyRefundDetected;
      case OrderStatus.CounterPartyRefunded:
        return StatusLabel.CounterPartyRefunded;
      case OrderStatus.Cancelled:
        return StatusLabel.Cancelled;
      case OrderStatus.DeadLineExceeded:
        return StatusLabel.DeadLineExceeded;
      default:
        return StatusLabel.Pending;
    }
  };
  
  export const isCompletedOrRefunded = (status: OrderStatus): boolean => {
    const completedStatuses = new Set<OrderStatus>([
      OrderStatus.Completed,
      OrderStatus.Redeemed,
      OrderStatus.CounterPartyRedeemed,
      OrderStatus.Refunded,
      OrderStatus.CounterPartyRefunded,
      OrderStatus.Cancelled,
      OrderStatus.CounterPartySwapExpired,
      OrderStatus.Expired,
      OrderStatus.DeadLineExceeded,
    ]);
    return completedStatuses.has(status);
  };
  