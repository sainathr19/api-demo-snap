import type { SnapConfig } from '@metamask/snaps-cli';
import { resolve } from 'path';

const config: SnapConfig = {
  bundler: 'webpack',
  input: resolve(__dirname, 'src/index.ts'),
  server: {
    port: 5000,
  },
  polyfills: true,
  experimental : {
    wasm : true
  }

};

export default config;
