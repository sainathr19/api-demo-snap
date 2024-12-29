export type ApiResponse = {
  status: 'Ok' | 'Error';
  error?: string;
};

export type FetchNonceResponse = ApiResponse & {
  result: string;
};

export type Quote = {
  quotes: {
    [key: string]: number;
  };
  input_token_price: number;
  output_token_price: number;
};

export type FetchQuoteResponse = ApiResponse & {
  result: Quote;
};

export type SwapState = {
  inAmount?: string;
  refundAddress?: string;
  quote?: Quote;
  errors?: {
    [key: string]: string;
  };
};

export interface BlockNumberResponse {
  [key: string]: number;
}

export type OrderCountResponse = APIResponse & {
  result: number;
};

export type AdditionalData = {
  additional_data: {
    strategy_id: string;
    sig: string;
    input_token_price: number;
    output_token_price: number;
    deadline: number;
    bitcoin_optional_recipient?: string;
    [key: string]: any;
  };
};

export type AdditionalDataWithStrategyId = {
  additional_data: {
    strategy_id: string;
    bitcoin_optional_recipient?: string;
    [key: string]: any;
  };
};

export type CreateOrderReqWithStrategyId = CreateOrderRequest &
  AdditionalDataWithStrategyId;

export type CreateOrderRequest = {
  source_chain: string;
  destination_chain: string;
  source_asset: string;
  destination_asset: string;
  initiator_source_address: string;
  initiator_destination_address: string;
  source_amount: string; // BigDecimal as string
  destination_amount: string; // BigDecimal as string
  fee: string; // BigDecimal as string
  nonce: string; // BigDecimal as string
  min_destination_confirmations: number;
  timelock: number;
  secret_hash: string;
};

export type CreateOrderRequestWithAdditionalData = CreateOrderRequest &
  AdditionalData;

export type CreateOrder = CreateOrderRequestWithAdditionalData & {
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  create_id: string;
  block_number: string;
};

export const Chains = {
  bitcoin: 'bitcoin',
  bitcoin_testnet: 'bitcoin_testnet',
  bitcoin_regtest: 'bitcoin_regtest',
  ethereum: 'ethereum',
  base: 'base',
  arbitrum: 'arbitrum',
  ethereum_sepolia: 'ethereum_sepolia',
  arbitrum_localnet: 'arbitrum_localnet',
  arbitrum_sepolia: 'arbitrum_sepolia',
  ethereum_localnet: 'ethereum_localnet',
  base_sepolia: 'base_sepolia',
  bera_testnet: 'bera_testnet',
  citrea_testnet: 'citrea_testnet',
} as const;

export type Chain = keyof typeof Chains;

export type Swap = {
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  swap_id: string;
  chain: Chain;
  asset: string;
  initiator: string;
  redeemer: string;
  timelock: number;
  filled_amount: string;
  amount: string;
  secret_hash: string;
  secret: string;
  initiate_tx_hash: string;
  redeem_tx_hash: string;
  refund_tx_hash: string;
  initiate_block_number: string | null;
  redeem_block_number: string | null;
  refund_block_number: string | null;
  required_confirmations: number;
};

export type MatchedOrder = {
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  source_swap: Swap;
  destination_swap: Swap;
  create_order: CreateOrder;
};

export type APIResponse = {
  status: 'Ok' | 'Error';
  error?: string;
};

export type FetchOrderResponse = APIResponse & {
  result: MatchedOrder;
};

export type CreateOrderRequestWithAdditinalData = CreateOrderRequest &
  AdditionalData;

export type CreateOrderResponse = APIResponse & {
  result: string; // swap_id
};

export type AttestedQuoteResponse = APIResponse & {
  result: CreateOrderRequest & AdditionalData;
};

export enum OrderStatus {
  Created = 'Created',
  Matched = 'Matched',
  InitiateDetected = 'InitiateDetected',
  Initiated = 'Initiated',
  CounterPartyInitiateDetected = 'CounterPartyInitiateDetected',
  CounterPartyInitiated = 'CounterPartyInitiated',
  RedeemDetected = 'RedeemDetected',
  Redeemed = 'Redeemed',
  CounterPartyRedeemDetected = 'CounterPartyRedeemDetected',
  CounterPartyRedeemed = 'CounterPartyRedeemed',
  Completed = 'Completed',
  CounterPartySwapExpired = 'CounterPartySwapExpired',
  Expired = 'Expired',
  RefundDetected = 'RefundDetected',
  Refunded = 'Refunded',
  CounterPartyRefundDetected = 'CounterPartyRefundDetected',
  CounterPartyRefunded = 'CounterPartyRefunded',
  Cancelled = 'Cancelled',
  DeadLineExceeded = 'DeadLineExceeded',
}

export enum SwapStatus {
  Idle = 'Idle',
  InitiateDetected = 'InitiateDetected',
  Initiated = 'Initiated',
  RedeemDetected = 'RedeemDetected',
  Redeemed = 'Redeemed',
  RefundDetected = 'RefundDetected',
  Refunded = 'Refunded',
  Expired = 'Expired',
}

export type RedeemRequest = {
  order_id: string;
  secret: string;
  perform_on: 'Source' | 'Destination';
};

export type RedeemResponse = APIResponse & {
  result: string;
};

export type SwapFormState = {
  in_amount: string;
  refund_address: string;
};

export type OrderState = {
  orderId: string;
  orderSecret: string;
  interfaceId: string;
};

export type SwapFormErrors = {
  inAmount?: string;
  refundAddress?: string;
  createError?: string;
};

export interface CreateOrderParams {
  inAmount: string;
  quote: Quote;
  refundAddress: string;
}

export type CreateOrderRes = {
  orderId: string;
  secret: string;
};
