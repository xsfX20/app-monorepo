import type { IDBWallet } from '@onekeyhq/kit-bg/src/dbs/local/types';
import {
  BOT_WALLET_STATUS_ACTIVE,
  BOT_WALLET_STATUS_DEACTIVATED,
} from '@onekeyhq/shared/src/consts/dbConsts';

import {
  type IBotWalletEntry,
  buildBotWalletSections,
  getBotWalletListItemActions,
} from './botWalletManagerUtils';

function createEntry({
  walletId,
  index,
  status,
  visible = true,
}: {
  walletId: string;
  index: number;
  status:
    | typeof BOT_WALLET_STATUS_ACTIVE
    | typeof BOT_WALLET_STATUS_DEACTIVATED;
  visible?: boolean;
}): IBotWalletEntry {
  return {
    wallet: {
      id: walletId,
      name: `Wallet ${index}`,
      backuped: true,
    } as IDBWallet,
    metadata: {
      index,
      name: `Bot #${index + 1}`,
      visible,
      status,
      createdAt: 1_743_000_000_000 + index,
    },
  };
}

describe('botWalletManagerUtils', () => {
  it('builds active and deactivated sections in fixed order', () => {
    const sections = buildBotWalletSections([
      createEntry({
        walletId: 'bot--1',
        index: 0,
        status: BOT_WALLET_STATUS_ACTIVE,
      }),
      createEntry({
        walletId: 'bot--2',
        index: 1,
        status: BOT_WALLET_STATUS_DEACTIVATED,
      }),
      createEntry({
        walletId: 'bot--3',
        index: 2,
        status: BOT_WALLET_STATUS_ACTIVE,
      }),
    ]);

    expect(sections.map((section) => section.title)).toEqual([
      'Bot 钱包',
      '已停用',
    ]);
    expect(sections[0].data.map((entry) => entry.wallet.id)).toEqual([
      'bot--1',
      'bot--3',
    ]);
    expect(sections[1].data.map((entry) => entry.wallet.id)).toEqual([
      'bot--2',
    ]);
  });

  it('returns status-specific action visibility', () => {
    expect(getBotWalletListItemActions(BOT_WALLET_STATUS_ACTIVE)).toEqual([
      'export-mnemonic',
      'visibility',
      'deactivate',
    ]);
    expect(getBotWalletListItemActions(BOT_WALLET_STATUS_DEACTIVATED)).toEqual([
      'visibility',
      'reactivate',
    ]);
  });

  it('moves a wallet between sections when status changes', () => {
    const activeSections = buildBotWalletSections([
      createEntry({
        walletId: 'bot--1',
        index: 0,
        status: BOT_WALLET_STATUS_ACTIVE,
      }),
    ]);
    const deactivatedSections = buildBotWalletSections([
      createEntry({
        walletId: 'bot--1',
        index: 0,
        status: BOT_WALLET_STATUS_DEACTIVATED,
      }),
    ]);

    expect(activeSections).toHaveLength(1);
    expect(activeSections[0].title).toBe('Bot 钱包');
    expect(activeSections[0].data[0].wallet.id).toBe('bot--1');

    expect(deactivatedSections).toHaveLength(1);
    expect(deactivatedSections[0].title).toBe('已停用');
    expect(deactivatedSections[0].data[0].wallet.id).toBe('bot--1');
  });
});
