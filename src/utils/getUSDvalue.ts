import axios from 'axios';
import { Contract, BigNumber, utils } from 'ethers';
const { formatUnits } = utils;

enum Platform {
  ethereum = 'ethereum',
  polygon = 'polygon-pos',
  aurora = 'aurora',
}

export async function convertBalanceKeyToUSDValue(
  map: Map<string, BigNumber>,
  contract: Contract
): Promise<Map<string, number>> {
  const [totalSupply, totalSupplyUSDValue, decimals] = await Promise.all([
    contract.totalSupply(),
    getUSDValueOfLPTokenTotalSupply(contract),
    contract.decimals(),
  ]);

  const holder_to_tlp_usd_value_map = new Map<string, number>();

  for (const [key, value] of map) {
    const formattedTLPBalance = parseFloat(formatUnits(value, decimals));
    const formattedTotalSupply = parseFloat(formatUnits(totalSupply, decimals));
    holder_to_tlp_usd_value_map.set(key, (formattedTLPBalance * totalSupplyUSDValue) / formattedTotalSupply);
  }

  return holder_to_tlp_usd_value_map;
}

async function fetchCoingeckoTokenPrice(token_address: string, platform: Platform) {
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
    return price ? price : -1;
  } catch (e) {
    console.log(`fetchCoingeckoTokenPrice, cannot fetch for ${token_address}`);
    console.error(e);
    return undefined;
  }
}

// Gets USD value of total supply of an LP token
async function getUSDValueOfLPTokenTotalSupply(lp_contract: Contract) {
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

async function getUSDValueOfERC20BalanceOfHolder(holder: string, token_address: string, provider: ) {
  try {
    const erc20_contract = new ethers.Contract(token_address, SLP, provider);
    const { chainId } = erc20_contract.provider._network;

    const [balance, decimals, priceInUSD] = await Promise.all([
      erc20_contract.balanceOf(holder),
      erc20_contract.decimals(),
      fetchCoingeckoTokenPrice(token_address, PLATFORM[chainId]),
    ]);

    const formattedBalance = formatUnits(balance, decimals);
    const valueInUSD = parseFloat(formattedBalance) * priceInUSD;
    return valueInUSD;
  } catch (e) {
    console.log(
      `getUSDValueOfERC20BalanceOfHolder, cannot get USD value of ${token_address} holdings for holder ${holder}`
    );
    console.error(e);
    return undefined;
  }
}
