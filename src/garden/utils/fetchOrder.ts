import { API } from "../../utils/api";
import { FetchOrderResponse } from "../../interface";

export const fetchOrder = async (orderId: string) => {
  try {
    const response = await fetch(
      `${API().orderbook}/orders/id/matched/${orderId}`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: FetchOrderResponse = await response.json();

    if(data.error){
      throw new Error(data.error);
    }
    return data.result;
  } catch (error) {
    console.error('Failed to fetch order details:', error);
    throw new Error(error instanceof Error ? error.message : "Failed to fetch order data")
  }
};