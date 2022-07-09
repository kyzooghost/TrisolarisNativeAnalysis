import TLP_ABI from './abis/TLP.json';
import { ethers } from 'ethers';
import { AURORA_PROVIDER } from './constants';
import { getTokenholderToBalanceMap } from './utils';
const contract = new ethers.Contract('0x501acE9c35E60f03A2af4d484f49F9B1EFde9f40', TLP_ABI, AURORA_PROVIDER);

async function main() {
  console.time('script_run_time');
  console.log(await getTokenholderToBalanceMap(contract));
}

main()
  .then((resp) => {
    console.log(resp);
    console.log('SUCCESS!');
    console.timeEnd('script_run_time');
  })
  .catch((e) => {
    console.error(e);
    console.log('FAILED!');
    console.timeEnd('script_run_time');
  });
