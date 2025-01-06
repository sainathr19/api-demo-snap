export class EVMWallet {
  private static instance: EVMWallet;
  private address: string;

  private constructor(address: string) {
    this.address = address;
  }

  /**
   * Get or create an instance of the EVMWallet.
   * @returns EVMWallet instance.
   */
  public static async getInstance(): Promise<EVMWallet> {
    if (!EVMWallet.instance) {
      const accounts = await ethereum.request({
        "method": "eth_requestAccounts",
        "params": [],
       }) as string[];

       if(!accounts) throw new Error("Failed to access Accounts");
       const primaryAccount = accounts[0]!     
       EVMWallet.instance = new EVMWallet(primaryAccount);
    }
    return EVMWallet.instance;
  }

  /**
   * Get the wallet's address.
   * @returns Wallet address.
   */
  public getWalletAddress(): string {
    if (!this.address) {
      throw new Error('Wallet address not initialized');
    }
    return this.address;
  }
}
