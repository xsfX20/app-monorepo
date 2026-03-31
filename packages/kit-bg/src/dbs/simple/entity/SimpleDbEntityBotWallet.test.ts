import { BOT_WALLET_STATUS_ACTIVE } from '@onekeyhq/shared/src/consts/dbConsts';

import { SimpleDbEntityBotWallet } from './SimpleDbEntityBotWallet';

describe('SimpleDbEntityBotWallet.replaceMetadataForParent', () => {
  test('replaces only the specified parent wallet metadata', async () => {
    const entity = new SimpleDbEntityBotWallet();
    const existingMap = {
      'hd-bot--hd-parent--0': {
        index: 0,
        name: 'Old Bot',
        visible: false,
        status: BOT_WALLET_STATUS_ACTIVE,
        createdAt: 1,
      },
      'hd-bot--hd-other--1': {
        index: 1,
        name: 'Other Parent Bot',
        visible: true,
        status: BOT_WALLET_STATUS_ACTIVE,
        createdAt: 2,
      },
    };
    const getRawData = jest
      .spyOn(entity, 'getRawData')
      .mockResolvedValue(existingMap as any);
    const setRawData = jest
      .spyOn(entity, 'setRawData')
      .mockResolvedValue(existingMap as any);

    await entity.replaceMetadataForParent('hd-parent', [
      {
        metadata: {
          index: 2,
          name: 'New Bot',
          visible: true,
          status: BOT_WALLET_STATUS_ACTIVE,
          createdAt: 3,
        },
      },
    ]);

    expect(getRawData).toHaveBeenCalled();
    expect(setRawData).toHaveBeenCalledWith({
      'hd-bot--hd-other--1': {
        index: 1,
        name: 'Other Parent Bot',
        visible: true,
        status: BOT_WALLET_STATUS_ACTIVE,
        createdAt: 2,
      },
      'hd-bot--hd-parent--2': {
        index: 2,
        name: 'New Bot',
        visible: true,
        status: BOT_WALLET_STATUS_ACTIVE,
        createdAt: 3,
      },
    });
  });
});
