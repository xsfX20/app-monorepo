import type { IDBWallet } from '../../dbs/local/types';

export function filterTransferWallets({
  wallets,
  walletIds,
}: {
  wallets: IDBWallet[];
  walletIds?: string[];
}) {
  const allowedWalletIds =
    walletIds && walletIds.length ? new Set(walletIds) : undefined;

  return wallets.filter(
    (wallet) =>
      !wallet.isKeyless &&
      (!allowedWalletIds || allowedWalletIds.has(wallet.id)),
  );
}
