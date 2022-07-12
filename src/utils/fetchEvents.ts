import { Contract, Event, EventFilter } from 'ethers';
import { logger } from './'

// let serverRequests = 0;

// async function fetchEvents(
//   contract: Contract,
//   eventFilter: EventFilter,
//   startBlock: number,
//   endBlock: number,
// ): Promise<Array<Event>> {
//   if (endBlock == -1) endBlock = await contract.provider.getBlockNumber();

//   try {
//     console.log(
//       `attempt fetch eth_getLogs for blocks ${startBlock} to ${endBlock}, block range - ${endBlock - startBlock}`
//     );

//     // Don't let serverRequests exceed 2000
//     // while (serverRequests >= 2000) {
//     //   console.log('More than 2000 concurrent requests, waiting 20s');
//     //   await delay(20000);
//     // }

//     serverRequests += 1;
//     console.log(`current serverRequests: ${serverRequests}`);
//     const events = await contract.queryFilter(eventFilter, startBlock, endBlock);
//     serverRequests -= 1;

//     console.log(`resolved blocks ${startBlock} to ${endBlock}, block range - ${endBlock - startBlock}`);

//     return events;
//   } catch (e) {
//     let errorString = 'Unknown Error';
//     if (e instanceof Error) errorString = e.toString();

//     if (
//       !errorString.includes('10K') &&
//       !errorString.includes('1000 results') &&
//       !errorString.includes('statement timeout') &&
//       !errorString.includes('internal timeout')
//     ) {
//       logger.error('errorString: ', errorString);
//       logger.info(`final serverRequests: ${serverRequests}`);
//       logger.error(e);
//       throw e;
//     }

//     // log response size exceeded. recurse down
//     const midBlock = Math.floor((startBlock + endBlock) / 2);

//     // const left = await fetchEvents(contract, eventFilter, startBlock, midBlock)
//     // const right = await fetchEvents(contract, eventFilter, midBlock + 1, endBlock)

//     const [left, right] = await Promise.all([
//       fetchEvents(contract, eventFilter, startBlock, midBlock),
//       fetchEvents(contract, eventFilter, midBlock + 1, endBlock),
//     ]);

//     const res = left.concat(right);
//     return res;
//   }
// }

// returns a promise that resolves after a specified wait time
async function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  
  let unfulfilledServerRequests = 0;
  let currentServerRequests = 0;
  
export async function fetchEvents(
    contract: Contract, 
    eventName: EventFilter, 
    startBlock: number, 
    endBlock: number
): Promise<Array<Event>> 
{
if(endBlock == -1) endBlock = await contract.provider.getBlockNumber()
return _fetchEvents(contract, eventName, startBlock, endBlock, 0)
}

async function _fetchEvents(
    contract: Contract, 
    eventName: EventFilter, 
    startBlock: number, 
    endBlock: number, 
    depth: number
): Promise<Array<Event>>
{
return new Promise(async (resolve,reject) => {
    try {
    console.log(`attempt fetch eth_getLogs for blocks ${startBlock} to ${endBlock}, block range - ${endBlock - startBlock}`);
    unfulfilledServerRequests += 1;
    currentServerRequests += 1;
    console.log(`current unfulfilledServerRequests: ${unfulfilledServerRequests}`);
    console.log(`current currentServerRequests: ${currentServerRequests}`);
    var events = await contract.queryFilter(eventName, startBlock, endBlock)
    unfulfilledServerRequests -= 1;
    currentServerRequests -= 1;
    console.log(`resolved eth_getLogs for blocks ${startBlock} to ${endBlock}, block range - ${endBlock - startBlock}`);
    resolve(events)
    return
    } catch(e) {
    currentServerRequests -= 1;
    let errorString = 'Unknown Error';
    if (e instanceof Error) errorString = e.toString();

    if (
      !errorString.includes('10K') &&
      !errorString.includes('1000 results') &&
      !errorString.includes('statement timeout') &&
      !errorString.includes('internal timeout') &&
      !errorString.includes('missing response')
    ) {
      logger.error('errorString: ', errorString);
      logger.error(e);
      throw e;
    }

    // log response size exceeded. recurse down
    var midBlock = Math.floor((startBlock+endBlock)/2)
    let left: Array<Event> = []
    let right: Array<Event> = []

    if(depth < 8) {
        [left, right] = await Promise.all([ // parallel
        _fetchEvents(contract, eventName, startBlock, midBlock, depth+1),
        _fetchEvents(contract, eventName, midBlock+1, endBlock, depth+1),
        ])

    } else { // serial
        left = await _fetchEvents(contract, eventName, startBlock, midBlock, depth+1)
        right = await _fetchEvents(contract, eventName, midBlock+1, endBlock, depth+1)
    }

    var res = left.concat(right)
    resolve(res)
    }
})
}
  