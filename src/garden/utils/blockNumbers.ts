import { API } from "../../utils/api";
import { BlockNumberResponse } from "../../interface";

/**
 * Fetches the latest block numbers from different chains
 */
export const fetchBlockNumbers = async () => {
  try {
    const response = await fetch(`${API().data.blockNumbers('testnet')}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: BlockNumberResponse = await response.json();
    return data;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Error fetching block numbers")
  }
};