import { getAddress, signTransaction } from '@stellar/freighter-api';
import { rpc, Transaction } from '@stellar/stellar-sdk';

const rpcUrl =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ??
  'https://soroban-testnet.stellar.org';

export async function connectFreighter(): Promise<string> {
  const { address, error } = await getAddress();
  if (error || !address) {
    throw new Error(error?.message ?? 'Freighter is not connected');
  }
  return address;
}

export async function signAndSubmitPurchase(
  unsignedXdr: string,
  networkPassphrase: string,
  buyerAddress: string,
): Promise<string> {
  const signed = await signTransaction(unsignedXdr, {
    address: buyerAddress,
    networkPassphrase,
  });
  if (signed.error || !signed.signedTxXdr) {
    throw new Error(signed.error?.message ?? 'Transaction signing was rejected');
  }

  const transaction = new Transaction(signed.signedTxXdr, networkPassphrase);
  const response = await new rpc.Server(rpcUrl).sendTransaction(transaction);
  if (response.status === 'ERROR') {
    throw new Error(response.errorResult?.toString() ?? 'Transaction submission failed');
  }
  return response.hash;
}
