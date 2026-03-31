export type IBotWalletNameBadge = {
  key: 'bot' | 'deactivated';
  label: string;
  tone: 'subdued' | 'caution';
};

export function getBotWalletNameBadges({
  isBotWallet,
  isBotWalletDeactivated,
}: {
  isBotWallet: boolean;
  isBotWalletDeactivated: boolean;
}): IBotWalletNameBadge[] {
  if (!isBotWallet) {
    return [];
  }

  const badges: IBotWalletNameBadge[] = [
    {
      key: 'bot',
      label: 'Bot',
      tone: 'subdued',
    },
  ];

  if (isBotWalletDeactivated) {
    badges.push({
      key: 'deactivated',
      label: '已停用',
      tone: 'caution',
    });
  }

  return badges;
}

export function shouldBlockBotWalletReceive({
  isBotWallet,
  isBotWalletDeactivated,
}: {
  isBotWallet: boolean;
  isBotWalletDeactivated: boolean;
}) {
  return isBotWallet && isBotWalletDeactivated;
}

export function shouldHideBotWalletExport({
  isBotWallet,
  isBotWalletDeactivated,
}: {
  isBotWallet: boolean;
  isBotWalletDeactivated: boolean;
}) {
  return isBotWallet && isBotWalletDeactivated;
}
