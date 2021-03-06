import { Contract, Event, EventFilter, BigNumber } from 'ethers';
import { ZERO, ZERO_ADDRESS } from '../constants';
import { logger, fetchEvents } from './';

// Contract must inherit ERC20.sol
export async function getTokenholderToBalanceMap(contract: Contract): Promise<Map<string, BigNumber>> {
  const holders_map = new Map<string, BigNumber>();

  // Get all Transfer events
  const filter = contract.filters.Transfer();

  // Obtain all blocks
  const events = await fetchEvents(contract, filter, 0, -1);

  // need to sort by blockNumber as first precedence
  // then sort by transactionIndex
  events.sort(function (a, b) {
    if (a.blockNumber == b.blockNumber) {
      return a.transactionIndex - b.transactionIndex;
    } else {
      return a.blockNumber - b.blockNumber;
    }
  });

  // Loop through every event
  for (const event of events) {
    if (event.args) {
      const { from, to, value } = event.args;

      try {
        // Exclude 0 value transactions
        if (value.eq(ZERO)) {
          continue;
        }

        if (from != ZERO_ADDRESS) {
          // Subtract value from 'from'
          let from_balance = holders_map.get(from);
          if (!from_balance) {
            from_balance = ZERO;
          }
          const new_from_balance = from_balance.sub(value);
          holders_map.set(from, new_from_balance);
        }

        // Add `value` to existing `to` balance
        let to_balance = holders_map.get(to);
        if (!to_balance) {
          to_balance = ZERO;
        }
        const new_to_balance = to_balance.add(value);
        holders_map.set(to, new_to_balance);
      } catch (e) {
        // Catch block for troubleshooting and finding troublesome transactions
        console.log(event);
        console.log('------');
        console.error(e);
      }
    }
  }

  // Iterate through mapping and remove zero balance addresses
  for (const [key, value] of holders_map) {
    if (value.eq(ZERO)) {
      holders_map.delete(key);
    }
  }

  // Delete zero address
  holders_map.delete(ZERO_ADDRESS);
  logger.info(`Successfully fetched tokenholder to balance map for ${contract.address}`);
  return holders_map;
}