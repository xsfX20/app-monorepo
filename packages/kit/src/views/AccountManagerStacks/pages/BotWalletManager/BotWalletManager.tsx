import { useCallback, useEffect, useState } from 'react';

import {
  Button,
  Dialog,
  Empty,
  Input,
  Page,
  SectionList,
  SizableText,
  Spinner,
  Stack,
  Switch,
  XStack,
  YStack,
} from '@onekeyhq/components';
import backgroundApiProxy from '@onekeyhq/kit/src/background/instance/backgroundApiProxy';
import useAppNavigation from '@onekeyhq/kit/src/hooks/useAppNavigation';
import { useAppRoute } from '@onekeyhq/kit/src/hooks/useAppRoute';
import { BOT_WALLET_STATUS_DEACTIVATED } from '@onekeyhq/shared/src/consts/dbConsts';
import { EModalRoutes } from '@onekeyhq/shared/src/routes';
import type {
  EAccountManagerStacksRoutes,
  IAccountManagerStacksParamList,
} from '@onekeyhq/shared/src/routes/accountManagerStacks';
import { EPrimePages } from '@onekeyhq/shared/src/routes/prime';

import {
  type IBotWalletEntry,
  type IBotWalletSection,
  buildBotWalletSections,
  getBotWalletListItemActions,
} from './botWalletManagerUtils';

function BotWalletListItem({
  entry,
  onRefresh,
}: {
  entry: IBotWalletEntry;
  onRefresh: () => void;
}) {
  const { wallet, metadata } = entry;
  const navigation = useAppNavigation();
  const isDeactivated = metadata.status === BOT_WALLET_STATUS_DEACTIVATED;
  const visibleActions = getBotWalletListItemActions(metadata.status);
  const canExportMnemonic = visibleActions.includes('export-mnemonic');
  const canToggleVisibility = visibleActions.includes('visibility');
  const canDeactivate = visibleActions.includes('deactivate');
  const canReactivate = visibleActions.includes('reactivate');

  const handleVisibilityToggle = useCallback(
    async (val: boolean) => {
      await backgroundApiProxy.serviceAccount.updateBotWalletVisibility({
        walletId: wallet.id,
        visible: val,
      });
      onRefresh();
    },
    [wallet.id, onRefresh],
  );

  const handleDeactivate = useCallback(() => {
    Dialog.confirm({
      title: '确认停用该 Bot 钱包？',
      description:
        '⚠️ 停用后，该钱包将不再提供收款功能。如果已将助记词导出至外部程序，建议尽快将资产转移至其他安全钱包。',
      onConfirmText: '确认停用',
      onConfirm: async () => {
        await backgroundApiProxy.serviceAccount.deactivateBotWallet({
          walletId: wallet.id,
        });
        onRefresh();
      },
    });
  }, [wallet.id, onRefresh]);

  const handleReactivate = useCallback(() => {
    Dialog.confirm({
      title: '确认重新激活？',
      description: '该钱包曾因安全原因被停用，确认重新启用？',
      onConfirmText: '确认激活',
      onConfirm: async () => {
        await backgroundApiProxy.serviceAccount.reactivateBotWallet({
          walletId: wallet.id,
        });
        onRefresh();
      },
    });
  }, [wallet.id, onRefresh]);

  const handleExportMnemonic = useCallback(() => {
    Dialog.confirm({
      title: '导出 Bot 助记词',
      description:
        'Bot 钱包的助记词将被导出到外部环境使用。其安全性取决于你的运行环境，与 Keyless 主钱包的安全等级不同。Bot 钱包丢失不会影响你的 Keyless 主钱包资产。',
      onConfirmText: '继续',
      onConfirm: () => {
        navigation.pushModal(EModalRoutes.PrimeModal, {
          screen: EPrimePages.PrimeTransfer,
          params: {
            botWalletId: wallet.id,
          },
        });
      },
    });
  }, [navigation, wallet.id]);

  return (
    <XStack
      px="$4"
      py="$3"
      alignItems="center"
      justifyContent="space-between"
      borderBottomWidth="$px"
      borderBottomColor="$borderSubdued"
    >
      <YStack flex={1} mr="$3">
        <XStack alignItems="center" gap="$2">
          <SizableText size="$bodyLgMedium">{metadata.name}</SizableText>
          {isDeactivated ? (
            <Stack
              px="$1.5"
              py="$0.5"
              borderRadius="$1"
              backgroundColor="$bgCautionSubdued"
            >
              <SizableText size="$bodySm" color="$textCaution">
                已停用
              </SizableText>
            </Stack>
          ) : null}
        </XStack>
        <SizableText size="$bodySm" color="$textSubdued">
          Index: {metadata.index}
        </SizableText>
      </YStack>

      <XStack
        alignItems="center"
        gap="$3"
        flexWrap="wrap"
        justifyContent="flex-end"
      >
        {canExportMnemonic ? (
          <Button
            size="small"
            variant="tertiary"
            onPress={handleExportMnemonic}
          >
            导出助记词
          </Button>
        ) : null}

        {canToggleVisibility ? (
          <XStack alignItems="center" gap="$1.5">
            <SizableText size="$bodySmMedium" color="$textSubdued">
              主列表
            </SizableText>
            <Switch
              size="small"
              value={metadata.visible}
              onChange={handleVisibilityToggle}
            />
          </XStack>
        ) : null}

        {canDeactivate ? (
          <Button size="small" variant="tertiary" onPress={handleDeactivate}>
            停用
          </Button>
        ) : null}

        {canReactivate ? (
          <Button size="small" variant="tertiary" onPress={handleReactivate}>
            激活
          </Button>
        ) : null}
      </XStack>
    </XStack>
  );
}

function BotWalletManager() {
  const route = useAppRoute<
    IAccountManagerStacksParamList,
    EAccountManagerStacksRoutes.BotWalletManager
  >();
  const { parentKeylessWalletId } = route.params;

  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<IBotWalletEntry[]>([]);

  const loadBotWallets = useCallback(async () => {
    setLoading(true);
    try {
      const result = await backgroundApiProxy.serviceAccount.getBotWallets({
        parentKeylessWalletId,
      });
      setEntries(result);
    } finally {
      setLoading(false);
    }
  }, [parentKeylessWalletId]);

  useEffect(() => {
    void loadBotWallets();
  }, [loadBotWallets]);

  const sections = buildBotWalletSections(entries);

  const handleCreate = useCallback(() => {
    let botName = '';
    Dialog.confirm({
      title: '创建 Bot 钱包',
      description:
        '为新的 Bot 钱包指定一个名称。Bot 钱包将从 Keyless 主钱包安全派生。',
      renderContent: (
        <Stack px="$4" py="$2">
          <Input
            placeholder="Bot 钱包名称"
            onChangeText={(text: string) => {
              botName = text;
            }}
          />
        </Stack>
      ),
      onConfirmText: '创建',
      onConfirm: async () => {
        await backgroundApiProxy.serviceAccount.createBotWallet({
          parentKeylessWalletId,
          name: botName || '',
        });
        await loadBotWallets();
      },
    });
  }, [parentKeylessWalletId, loadBotWallets]);

  let bodyContent = (
    <SectionList
      sections={sections}
      keyExtractor={(item) => (item as IBotWalletEntry).wallet.id}
      renderSectionHeader={({ section }: { section: IBotWalletSection }) => (
        <Stack px="$4" py="$2" backgroundColor="$bgSubdued">
          <SizableText size="$bodySmMedium" color="$textSubdued">
            {section.title}
          </SizableText>
        </Stack>
      )}
      renderItem={({ item }: { item: IBotWalletEntry }) => (
        <BotWalletListItem entry={item} onRefresh={loadBotWallets} />
      )}
    />
  );

  if (loading) {
    bodyContent = (
      <Stack flex={1} alignItems="center" justifyContent="center">
        <Spinner size="large" />
      </Stack>
    );
  } else if (entries.length === 0) {
    bodyContent = (
      <Empty
        title="暂无 Bot 钱包"
        description="创建 Bot 钱包以用于自动化操作"
      />
    );
  }

  return (
    <Page>
      <Page.Header title="Bot 钱包管理" />
      <Page.Body>{bodyContent}</Page.Body>
      <Page.Footer>
        <Button variant="primary" size="large" onPress={handleCreate} m="$4">
          + 创建 Bot 钱包
        </Button>
      </Page.Footer>
    </Page>
  );
}

export default BotWalletManager;
