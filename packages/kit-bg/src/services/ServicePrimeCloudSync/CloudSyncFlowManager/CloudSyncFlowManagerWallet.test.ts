import {
  BOT_WALLET_STATUS_ACTIVE,
  BOT_WALLET_STATUS_DEACTIVATED,
  WALLET_TYPE_HD,
} from '@onekeyhq/shared/src/consts/dbConsts';
import accountUtils from '@onekeyhq/shared/src/utils/accountUtils';

import simpleDb from '../../../dbs/simple/simpleDb';

import { CloudSyncFlowManagerWallet } from './CloudSyncFlowManagerWallet';

jest.mock('../../../dbs/simple/simpleDb', () => ({
  __esModule: true,
  default: {
    botWallet: {
      getBotWalletsForParent: jest.fn(),
      replaceMetadataForParent: jest.fn(),
    },
  },
}));

describe('CloudSyncFlowManagerWallet', () => {
  const botWalletDb = simpleDb.botWallet as unknown as {
    getBotWalletsForParent: jest.Mock;
    replaceMetadataForParent: jest.Mock;
  };
  const setWalletNameAndAvatar = jest.fn(async () => undefined);
  const manager = new CloudSyncFlowManagerWallet({
    backgroundApi: {
      serviceAccount: {
        setWalletNameAndAvatar,
      },
    } as any,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('buildSyncPayload includes botWallets for keyless wallet', async () => {
    botWalletDb.getBotWalletsForParent.mockResolvedValue([
      {
        walletId: 'hd-bot--hd-1--2',
        metadata: {
          index: 2,
          name: 'Bot #2',
          visible: true,
          status: BOT_WALLET_STATUS_DEACTIVATED,
          deactivatedAt: 123_456,
          createdAt: 654_321,
        },
      },
    ]);

    const payload = await manager.buildSyncPayload({
      target: {
        wallet: {
          id: 'hd-1',
          name: 'Keyless',
          avatarInfo: undefined,
          hash: 'wallet-hash',
          type: WALLET_TYPE_HD,
          passphraseState: '',
          isKeyless: true,
        },
        dbDevice: undefined,
      } as any,
    });

    expect(botWalletDb.getBotWalletsForParent).toHaveBeenCalledWith('hd-1');
    expect(payload).toMatchObject({
      name: 'Keyless',
      walletHash: 'wallet-hash',
      walletType: WALLET_TYPE_HD,
      botWallets: [
        {
          index: 2,
          name: 'Bot #2',
          visible: true,
          status: BOT_WALLET_STATUS_DEACTIVATED,
          deactivatedAt: 123_456,
          createdAt: 654_321,
          actualWalletId: 'hd-bot--hd-1--2',
        },
      ],
    });
  });

  test('buildSyncPayload does not query bot metadata for non-keyless wallet', async () => {
    const payload = await manager.buildSyncPayload({
      target: {
        wallet: {
          id: 'hd-2',
          name: 'Standard HD',
          avatarInfo: undefined,
          hash: 'wallet-hash-2',
          type: WALLET_TYPE_HD,
          passphraseState: '',
          isKeyless: false,
        },
        dbDevice: undefined,
      } as any,
    });

    expect(botWalletDb.getBotWalletsForParent).not.toHaveBeenCalled();
    expect(payload.botWallets).toBeUndefined();
  });

  test('syncToSceneEachItem replaces local bot metadata for synced keyless wallet', async () => {
    await manager.syncToSceneEachItem({
      target: {
        wallet: {
          id: 'hd-parent',
          name: 'Local Keyless',
          isKeyless: true,
        },
      } as any,
      payload: {
        name: 'Synced Keyless',
        avatar: undefined,
        walletHash: 'wallet-hash',
        hwDeviceId: undefined,
        passphraseState: '',
        walletType: WALLET_TYPE_HD,
        botWallets: [
          {
            index: 0,
            name: 'Bot #0',
            visible: false,
            status: BOT_WALLET_STATUS_ACTIVE,
            createdAt: 100,
          },
          {
            index: 1,
            name: 'Bot #1',
            visible: true,
            status: BOT_WALLET_STATUS_DEACTIVATED,
            deactivatedAt: 200,
            createdAt: 101,
          },
        ],
      },
    });

    expect(setWalletNameAndAvatar).toHaveBeenCalledWith({
      walletId: 'hd-parent',
      name: 'Synced Keyless',
      avatar: undefined,
      skipSaveLocalSyncItem: true,
      skipEmitEvent: true,
    });
    expect(botWalletDb.replaceMetadataForParent).toHaveBeenCalledWith(
      'hd-parent',
      [
        {
          walletId: accountUtils.buildBotWalletId({
            parentKeylessWalletId: 'hd-parent',
            index: 0,
          }),
          metadata: {
            index: 0,
            name: 'Bot #0',
            visible: false,
            status: BOT_WALLET_STATUS_ACTIVE,
            deactivatedAt: undefined,
            createdAt: 100,
          },
        },
        {
          walletId: accountUtils.buildBotWalletId({
            parentKeylessWalletId: 'hd-parent',
            index: 1,
          }),
          metadata: {
            index: 1,
            name: 'Bot #1',
            visible: true,
            status: BOT_WALLET_STATUS_DEACTIVATED,
            deactivatedAt: 200,
            createdAt: 101,
          },
        },
      ],
    );
  });
});
