import { filterTransferWallets } from './servicePrimeTransferUtils';

import type { IDBWallet } from '../../dbs/local/types';

function createWallet({
  id,
  isKeyless = false,
}: {
  id: string;
  isKeyless?: boolean;
}) {
  return {
    id,
    isKeyless,
  } as IDBWallet;
}

describe('filterTransferWallets', () => {
  it('filters out keyless wallets from default transfer payloads', () => {
    const wallets = filterTransferWallets({
      wallets: [
        createWallet({ id: 'hd-1' }),
        createWallet({ id: 'keyless-1', isKeyless: true }),
        createWallet({ id: 'hd-bot--parent-1--0' }),
      ],
    });

    expect(wallets.map((wallet) => wallet.id)).toEqual([
      'hd-1',
      'hd-bot--parent-1--0',
    ]);
  });

  it('keeps only the requested wallet ids for scoped transfers', () => {
    const wallets = filterTransferWallets({
      wallets: [
        createWallet({ id: 'hd-1' }),
        createWallet({ id: 'hd-bot--parent-1--0' }),
        createWallet({ id: 'hd-bot--parent-1--1' }),
      ],
      walletIds: ['hd-bot--parent-1--1'],
    });

    expect(wallets.map((wallet) => wallet.id)).toEqual(['hd-bot--parent-1--1']);
  });
});
