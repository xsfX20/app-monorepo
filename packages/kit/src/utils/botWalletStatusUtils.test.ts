import {
  getBotWalletNameBadges,
  shouldBlockBotWalletReceive,
  shouldHideBotWalletExport,
} from './botWalletStatusUtils';

describe('botWalletStatusUtils', () => {
  it('returns no badges for non-Bot wallets', () => {
    expect(
      getBotWalletNameBadges({
        isBotWallet: false,
        isBotWalletDeactivated: false,
      }),
    ).toEqual([]);
  });

  it('returns Bot and deactivated badges for deactivated Bot wallets', () => {
    expect(
      getBotWalletNameBadges({
        isBotWallet: true,
        isBotWalletDeactivated: true,
      }),
    ).toEqual([
      {
        key: 'bot',
        label: 'Bot',
        tone: 'subdued',
      },
      {
        key: 'deactivated',
        label: '已停用',
        tone: 'caution',
      },
    ]);
  });

  it('blocks receive and hides export only for deactivated Bot wallets', () => {
    expect(
      shouldBlockBotWalletReceive({
        isBotWallet: true,
        isBotWalletDeactivated: true,
      }),
    ).toBe(true);
    expect(
      shouldHideBotWalletExport({
        isBotWallet: true,
        isBotWalletDeactivated: true,
      }),
    ).toBe(true);

    expect(
      shouldBlockBotWalletReceive({
        isBotWallet: true,
        isBotWalletDeactivated: false,
      }),
    ).toBe(false);
    expect(
      shouldHideBotWalletExport({
        isBotWallet: false,
        isBotWalletDeactivated: true,
      }),
    ).toBe(false);
  });
});
