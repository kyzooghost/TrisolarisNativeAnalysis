import {ethers, Contract, Event, EventFilter, BigNumber } from "ethers"
import { ZERO, ZERO_ADDRESS } from "../constants"

async function getAuroraHoldersMapping(
  contract: Contract
): Promise<Map<string, BigNumber>> {
    const holders_map = new Map<string, BigNumber>()

    // Get all Transfer events
    let filter = contract.filters.Transfer()

    // Obtain all blocks
    const events = await fetchEvents(contract, filter, 0, -1)
  
    // need to sort by blockNumber as first precedence
    // then sort by transactionIndex
    events.sort(function (a, b) {
        if (a.blockNumber == b.blockNumber) {
            return (a.transactionIndex - b.transactionIndex)
        } else {
            return (a.blockNumber - b.blockNumber)
        }
    })

    // Loop through every event
    for (const event of events) {
        if (event.args) {
          const { from, to, value } = event.args

          try {
              // Exclude 0 value transactions
              if (value.eq(ZERO)) {continue;}
  
              if (from != ZERO_ADDRESS) {
                // Subtract value from 'from'
                let from_balance = holders_map.get(from);
                if (!from_balance) {from_balance = ZERO}
                const new_from_balance = from_balance.sub(value)
                holders_map.set(from, new_from_balance)
              }

              // Add `value` to existing `to` balance
              let to_balance = holders_map.get(to);
              if (!to_balance) {to_balance = ZERO}
              const new_to_balance = to_balance.add(value)
              holders_map.set(to, new_to_balance)
              
          } catch(e) {
              // Catch block for troubleshooting and finding troublesome transactions
              console.log(event)
              console.log("------")
              console.error(e)
          }

          
        }
    }

    // Iterate through mapping and remove zero balance addresses
    for (let [key, value] of holders_map) {
        if (value.eq(ZERO)) {
            holders_map.delete(key)
        } 
    }

    // Delete zero address
    holders_map.delete(ZERO_ADDRESS)

    return holders_map
}

async function fetchEvents(
  contract: Contract, 
  eventFilter: EventFilter, 
  startBlock:  number, 
  endBlock: number
): Promise<Array<Event>> {
  return new Promise(async (resolve,reject) => {
    if(endBlock == -1) endBlock = await contract.provider.getBlockNumber()
    
    try {
      const events = await contract.queryFilter(eventFilter, startBlock, endBlock)
      resolve(events)
      return
    } catch(e) {
      let errorString = 'Unknown Error'
      if (e instanceof Error) errorString = e.toString();
      
      if(!errorString.includes("10K") && 
         !errorString.includes("1000 results") && 
         !errorString.includes("statement timeout")
        ) {
        reject(e)
        return
      }
      
      // log response size exceeded. recurse down
      const midBlock = Math.floor((startBlock + endBlock)/2)
      const [left, right] = await Promise.all([
        fetchEvents(contract, eventFilter, startBlock, midBlock),
        fetchEvents(contract, eventFilter, midBlock+1, endBlock),
      ])
      const res = left.concat(right)
      resolve(res)
    }
  })
}