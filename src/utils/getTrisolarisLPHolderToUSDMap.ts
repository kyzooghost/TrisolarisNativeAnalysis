import { Contract } from 'ethers';
import { getTokenholderToBalanceMap, convertUniswapLPBalanceToUSD } from './';
import TLP_ABI from '../abis/TLP.json';
import { AURORA_PROVIDER } from '../constants';

export async function getTrisolarisLPHolderToUSDMap(lp_address: string): Promise<Map<string, number>> {
  const lp_contract = new Contract(lp_address, TLP_ABI, AURORA_PROVIDER);
  const LPHolderToBalanceMap = await getTokenholderToBalanceMap(lp_contract);
  console.log("LPHolderToBalanceMap :", LPHolderToBalanceMap)
  return await convertUniswapLPBalanceToUSD(LPHolderToBalanceMap, lp_contract);
}
