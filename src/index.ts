import { getTrisolarisLPHolderToUSDMap, getTokenholderToBalanceMap, getMasterchefStakers } from './utils';
import { TLP_ADDRESS_LIST } from './constants';

async function main() {
  console.time('script_run_time');
  // return await getTrisolarisLPHolderToUSDMap(TLP_ADDRESS_LIST[0]);
  return await getMasterchefStakers('0x20F8AeFB5697B77E0BB835A8518BE70775cdA1b0');
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
