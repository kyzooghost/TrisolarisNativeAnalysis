import axios from 'axios';
import { Contract, BigNumber, utils, ethers } from 'ethers';
import TLP_ABI from '../abis/TLP.json';
import { logger } from './';
const { formatUnits } = utils;

enum Platform {
  ethereum = 'ethereum',
  polygon = 'polygon-pos',
  aurora = 'aurora',
}

const PLATFORM: { [chainID: number]: Platform } = {
  [1]: Platform.ethereum,
  [137]: Platform.polygon,
  [1313161554]: Platform.aurora,
};

/**
 * Given the TokenholderToBalance mapping for an LP token, returns same mapping with LP balance values converted to USD value
 * @param map TokenholderToBalance mapping for an LP token, obtained from getTokenholderToBalanceMap() call
 * @param contract: UniswapV2 LP contract object
 */
export async function convertUniswapLPBalanceToUSD(
  map: Map<string, BigNumber>,
  contract: Contract
): Promise<Map<string, number>> {
  const [totalSupply, totalSupplyUSDValue, decimals] = await Promise.all([
    contract.totalSupply(),
    getUSDValueOfUniswapLPTokenTotalSupply(contract),
    contract.decimals(),
  ]);

  const holder_to_tlp_usd_value_map = new Map<string, number>();

  for (const [key, value] of map) {
    const formattedTLPBalance = parseFloat(formatUnits(value, decimals));
    const formattedTotalSupply = parseFloat(formatUnits(totalSupply, decimals));
    holder_to_tlp_usd_value_map.set(key, (totalSupplyUSDValue * formattedTLPBalance) / formattedTotalSupply);
  }

  return holder_to_tlp_usd_value_map;
}

/**
 * Gets USD value of total supply of a UniswapV2 LP token
 * Fetches USD value of token0 + token1 balance
 * @param lp_contract UniswapV2 LP contract object
 */
async function getUSDValueOfUniswapLPTokenTotalSupply(lp_contract: Contract) {
  const [token0_address, token1_address] = await Promise.all([lp_contract.token0(), lp_contract.token1()]);
  const { provider } = lp_contract;
  const [usdValueOfToken0InLP, usdValueOfToken1InLP] = await Promise.all([
    getUSDValueOfERC20BalanceOfHolder(lp_contract.address, token0_address, provider),
    getUSDValueOfERC20BalanceOfHolder(lp_contract.address, token1_address, provider),
  ]);

  let totalUsdValueInLP = 0;

  if (usdValueOfToken0InLP) {
    totalUsdValueInLP += usdValueOfToken0InLP;
  }
  if (usdValueOfToken1InLP) {
    totalUsdValueInLP += usdValueOfToken1InLP;
  }

  return totalUsdValueInLP;
}

/**
 * Gets USD value of the balance of a single ERC20 token for a given holder
 * @param holder EVM address of tokenholder
 * @param token_address EVM address of ERC20 token
 * @param provider ethers.providers.Provider type, required to query network
 */
async function getUSDValueOfERC20BalanceOfHolder(
  holder: string,
  token_address: string,
  provider: ethers.providers.Provider
): Promise<number> {
  try {
    const erc20_contract = new Contract(token_address, TLP_ABI, provider);

    const network = await erc20_contract.provider.getNetwork();
    const { chainId } = network;

    const [balance, decimals, priceInUSD] = await Promise.all([
      erc20_contract.balanceOf(holder),
      erc20_contract.decimals(),
      fetchCoingeckoTokenPrice(token_address, PLATFORM[chainId]),
    ]);

    const formattedBalance = formatUnits(balance, decimals);
    const valueInUSD = parseFloat(formattedBalance) * priceInUSD;
    return valueInUSD;
  } catch (e) {
    logger.error(
      `getUSDValueOfERC20BalanceOfHolder, cannot get USD value of ${token_address} holdings for holder ${holder}`
    );
    logger.error(e);
    return 0;
  }
}

/**
 * Fetch coingecko price for a given token
 * @param token_address EVM address of ERC20 token
 * @param platform Network of ERC20 token
 */
async function fetchCoingeckoTokenPrice(token_address: string, platform: Platform): Promise<number> {
  try {
    const addr = token_address.toLowerCase();
    const url = `https://api.coingecko.com/api/v3/simple/token_price/${platform}?contract_addresses=${token_address}&vs_currencies=usd`;
    const data = await axios({
      url: url,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const price = data.data[addr].usd;
    return price ? price : 0;
  } catch (e) {
    logger.error(`fetchCoingeckoTokenPrice, cannot fetch for ${token_address}`);
    logger.error(e);
    return 0;
  }
}
