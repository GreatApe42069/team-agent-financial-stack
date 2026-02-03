/**
 * On-chain integration for $OPENWORK token on Base
 * Queries real balances from the blockchain
 */

const OPENWORK_TOKEN = '0x299c30DD5974BF4D5bFE42C340CA40462816AB07';
const BASE_RPC = 'https://mainnet.base.org';

// JSON-RPC response types
interface RpcResponse {
  jsonrpc: string;
  id: number;
  result?: string;
  error?: { code: number; message: string };
}

// Minimal ERC20 ABI for balanceOf
const BALANCE_OF_SIGNATURE = '0x70a08231'; // balanceOf(address)

/**
 * Get $OPENWORK balance for a wallet address on Base
 */
export async function getOpenworkBalance(walletAddress: string): Promise<{ balance: string; balanceRaw: string; error?: string }> {
  try {
    // Pad address to 32 bytes
    const paddedAddress = walletAddress.toLowerCase().replace('0x', '').padStart(64, '0');
    const data = BALANCE_OF_SIGNATURE + paddedAddress;

    const response = await fetch(BASE_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [
          {
            to: OPENWORK_TOKEN,
            data: data,
          },
          'latest',
        ],
      }),
    });

    const result = (await response.json()) as RpcResponse;

    if (result.error) {
      return { balance: '0', balanceRaw: '0', error: result.error.message };
    }

    // Parse the hex balance (18 decimals)
    const balanceRaw = BigInt(result.result ?? '0x0');
    const balance = formatTokenAmount(balanceRaw, 18);

    return { balance, balanceRaw: balanceRaw.toString() };
  } catch (error) {
    console.error('getOpenworkBalance error:', error);
    return { balance: '0', balanceRaw: '0', error: String(error) };
  }
}

/**
 * Get ETH balance for gas estimation
 */
export async function getEthBalance(walletAddress: string): Promise<{ balance: string; balanceRaw: string; error?: string }> {
  try {
    const response = await fetch(BASE_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBalance',
        params: [walletAddress, 'latest'],
      }),
    });

    const result = (await response.json()) as RpcResponse;

    if (result.error) {
      return { balance: '0', balanceRaw: '0', error: result.error.message };
    }

    const balanceRaw = BigInt(result.result ?? '0x0');
    const balance = formatTokenAmount(balanceRaw, 18);

    return { balance, balanceRaw: balanceRaw.toString() };
  } catch (error) {
    console.error('getEthBalance error:', error);
    return { balance: '0', balanceRaw: '0', error: String(error) };
  }
}

/**
 * Verify an agent has sufficient $OPENWORK balance
 */
export async function verifyOpenworkBalance(walletAddress: string, requiredAmount: number): Promise<{ sufficient: boolean; balance: string; required: string }> {
  const { balance } = await getOpenworkBalance(walletAddress);
  const balanceNum = parseFloat(balance);
  
  return {
    sufficient: balanceNum >= requiredAmount,
    balance: balance,
    required: requiredAmount.toString(),
  };
}

/**
 * Format token amount from raw bigint to human-readable
 */
function formatTokenAmount(raw: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals);
  const whole = raw / divisor;
  const fraction = raw % divisor;
  
  // Pad fraction to full decimal places, then trim trailing zeros
  const fractionStr = fraction.toString().padStart(decimals, '0');
  const trimmedFraction = fractionStr.replace(/0+$/, '');
  
  if (trimmedFraction === '') {
    return whole.toString();
  }
  
  return `${whole}.${trimmedFraction}`;
}

/**
 * Contract addresses for reference
 */
export const CONTRACTS = {
  OPENWORK_TOKEN,
  MCV2_BOND: '0xc5a076cad94176c2996B32d8466Be1cE757FAa27',
  MCV2_TOKEN: '0xAa70bC79fD1cB4a6FBA717018351F0C3c64B79Df',
  MCV2_ZAP: '0x91523b39813F3F4E406ECe406D0bEAaA9dE251fa',
} as const;
