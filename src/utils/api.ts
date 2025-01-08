const GARDEN_TESTNET_CONFIG = {
  DATA_URL: 'https://prod-mainnet-virtual-balance-pr-5.onrender.com',
  ORDERBOOK_URL: 'https://evm-swapper-relay.onrender.com',
  QUOTE_URL: 'https://quote-knrp.onrender.com',
  PROXY: 'https://garden-api-proxy.172.210.31.187.sslip.io',
} as const;

const GARDEN_MAINNET_CONFIG = {
  DATA_URL: 'https://dummy.fi',
  ORDERBOOK_URL: 'https://dummy.fi',
  QUOTE_URL: 'https://dummy.fi',
  PROXY: 'https://dummy.fi',
} as const;

const isTestnet = true;

const GARDEN_CONFIG = isTestnet ? GARDEN_TESTNET_CONFIG : GARDEN_MAINNET_CONFIG;

export const API = () => {
  Object.entries(GARDEN_CONFIG).forEach(([key, value]) => {
    if (!value) throw new Error(`Missing ${key} in env`);
  });

  return {
    home: 'https://garden.finance',
    data: {
      data: GARDEN_CONFIG.DATA_URL,
      assets: GARDEN_CONFIG.DATA_URL + '/assets',
      blockNumbers: (network: 'mainnet' | 'testnet') =>
        GARDEN_CONFIG.DATA_URL + '/blocknumber/' + network,
    },
    orderbook: GARDEN_CONFIG.ORDERBOOK_URL,
    proxy: GARDEN_CONFIG.PROXY,
    quote: GARDEN_CONFIG.QUOTE_URL,
    mempool: {
      testnet: 'https://mempool.space/testnet4/api',
      mainnet: 'https://mempool.space/api',
    },
  };
};
