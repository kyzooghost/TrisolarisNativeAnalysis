import { BigNumber, Contract } from 'ethers';
import MasterChefV1_ABI from '../abis/MasterChefV1.json';
import MasterChefV2_ABI from '../abis/MasterChefV2.json';
import { AURORA_PROVIDER } from '../constants';
import { logger, fetchEvents } from './';
import { ZERO } from '../constants';

const MASTERCHEFV1_ADDRESS = "0x1f1Ed214bef5E83D8f5d0eB5D7011EB965D0D79B"
const MASTERCHEFV2_ADDRESS = "0x3838956710bcc9D122Dd23863a0549ca8D5675D6"

const MASTERCHEFV1_CONTRACT = new Contract(MASTERCHEFV1_ADDRESS, MasterChefV1_ABI, AURORA_PROVIDER)
const MASTERCHEFV2_CONTRACT = new Contract(MASTERCHEFV2_ADDRESS, MasterChefV2_ABI, AURORA_PROVIDER)

// Accurate representation of Masterchef pools on 12 July 2022
const MASTERCHEFV1_POOLS = [
    "0x63da4DB6Ef4e7C62168aB03982399F9588fCd198",
    "0x20F8AeFB5697B77E0BB835A8518BE70775cdA1b0",
    "0x03B666f3488a7992b2385B12dF7f35156d7b29cD",
    "0x2fe064B6c7D274082aa5d2624709bC9AE7D16C77",
    "0xbc8A244e8fb683ec1Fd6f88F3cc6E565082174Eb",
    "0x84b123875F0F36B966d0B6Ca14b31121bd9676AD",
    "0x5eeC60F348cB1D661E4A5122CF4638c7DB7A886e",
    "0x9990a658F71248cc507Ea62946f0EB7728491B70"
]

const MASTERCHEFV2_POOLS = [
    '0x5eeC60F348cB1D661E4A5122CF4638c7DB7A886e',
    '0xd1654a7713617d41A8C9530Fb9B948d00e162194',
    '0xdF8CbF89ad9b7dAFdd3e37acEc539eEcC8c47914',
    '0xa9eded3E339b9cd92bB6DEF5c5379d678131fF90',
    '0x61C9E05d1Cdb1b70856c7a2c53fA9c220830633c',
    '0x6443532841a5279cb04420E61Cf855cBEb70dc8C',
    '0x7be4a49AA41B34db70e539d4Ae43c7fBDf839DfA',
    '0x3dC236Ea01459F57EFc737A12BA3Bb5F3BFfD071',
    '0x48887cEEA1b8AD328d5254BeF774Be91B90FaA09',
    '0xd62f9ec4C4d323A0C111d5e78b77eA33A2AA862f',
    '0xdDAdf88b007B95fEb42DDbd110034C9a8e9746F2',
    '0x5913f644A10d98c79F2e0b609988640187256373',
    '0x47924Ae4968832984F4091EEC537dfF5c38948a4',
    '0xb419ff9221039Bdca7bb92A131DD9CF7DEb9b8e5',
    '0xFBc4C42159A5575a772BebA7E3BF91DB508E127a',
    '0x7B273238C6DD0453C160f305df35c350a123E505',
    '0x6277f94a69Df5df0Bc58b25917B9ECEFBf1b846A',
    '0xadAbA7E2bf88Bd10ACb782302A568294566236dC',
    '0x5EB99863f7eFE88c447Bc9D52AA800421b1de6c9',
    '0x5E74D85311fe2409c341Ce49Ce432BB950D221DE',
    '0xbe753E99D0dBd12FB39edF9b884eBF3B1B09f26C',
    '0xbC0e71aE3Ef51ae62103E003A9Be2ffDe8421700',
    '0xbceA13f9125b0E3B66e979FedBCbf7A4AfBa6fd1',
    '0xBBf3D4281F10E537d5b13CA80bE22362310b2bf9',
    '0x1e0e812FBcd3EB75D8562AD6F310Ed94D258D008',
    '0x20F8AeFB5697B77E0BB835A8518BE70775cdA1b0',
    '0x03B666f3488a7992b2385B12dF7f35156d7b29cD',
    '0x29C160d2EF4790F9A23B813e7544D99E539c28Ba',
    '0x87BCC091d0A7F9352728100268Ac8D25729113bB',
    '0x6a29e635BCaB8aBeE1491059728e3D6D11d6A114',
    '0x120e713AD36eCBff171FC8B7cf19FA8B6f6Ba50C',
    '0x71dBEB011EAC90C51b42854A77C45C1E53242698',
    '0xffb69779f14E851A8c550Bf5bB1933c44BBDE129'
]

export async function getMasterchefStakers(lp_token_address: string): Promise<Map<string, BigNumber>> {
    let holder_to_balance_map = new Map<string, BigNumber>;
    
    // Get list of LP tokens which are being staked on Trisolaris MasterChef contracts

    // const [MASTERCHEFV1_POOL_LENGTH, MASTERCHEFV2_POOL_LENGTH] = await Promise.all([
    //     MASTERCHEFV1_CONTRACT.poolLength(),
    //     MASTERCHEFV2_CONTRACT.poolLength()
    // ])

    // const MASTERCHEFV1_POOL_PROMISES = []
    // const MASTERCHEFV2_POOL_PROMISES = []

    // for (let i = 0; i < MASTERCHEFV1_POOL_LENGTH.toNumber(); i++) {
    //     MASTERCHEFV1_POOL_PROMISES.push(MASTERCHEFV1_CONTRACT.poolInfo(i))
    // }

    // for (let i = 0; i < MASTERCHEFV2_POOL_LENGTH.toNumber(); i++) {
    //     MASTERCHEFV2_POOL_PROMISES.push(MASTERCHEFV2_CONTRACT.lpToken(i))
    // }

    // const MASTERCHEFV1_POOLS = await Promise.all(MASTERCHEFV1_POOL_PROMISES)
    // const MASTERCHEFV2_POOLS = await Promise.all(MASTERCHEFV2_POOL_PROMISES)

    // console.log(MASTERCHEFV1_POOLS)
    // console.log(MASTERCHEFV2_POOLS)

    const MASTERCHEFV1_POOL_INDEX = MASTERCHEFV1_POOLS.findIndex((element) => element == lp_token_address)
    const MASTERCHEFV2_POOL_INDEX = MASTERCHEFV2_POOLS.findIndex((element) => element == lp_token_address)

    if (MASTERCHEFV1_POOL_INDEX != -1) {
        // Process deposit events
        const deposit_filter = MASTERCHEFV1_CONTRACT.filters.Deposit(null, MASTERCHEFV1_POOL_INDEX, null)
        console.log("Fetching deposit events")
        const deposit_events = await fetchEvents(MASTERCHEFV1_CONTRACT, deposit_filter, 0, -1);
        console.log(`Fetched ${deposit_events.length} deposit events`)

        for (const event of deposit_events) {
            if (event.args){
                const { user, amount } = event.args
    
                try {
                    // Add amount
                    let tlp_balance = holder_to_balance_map.get(user);
                    if (!tlp_balance) {
                        tlp_balance = ZERO
                    }
                    const new_tlp_balance = tlp_balance.add(amount)
                    holder_to_balance_map.set(user, new_tlp_balance)

                } catch (e) {
                    // Catch block for troubleshooting and finding troublesome transactions
                    console.log(event)
                    console.error(e)
                    console.log("------")
                }
            }
        }

        // Process withdraw events
        const withdraw_filter = MASTERCHEFV1_CONTRACT.filters.Withdraw(null, MASTERCHEFV1_POOL_INDEX, null)
        console.log("Fetching withdraw events")
        const withdraw_events = await fetchEvents(MASTERCHEFV1_CONTRACT, withdraw_filter, 0, -1);
        console.log(`Fetched ${withdraw_events.length} withdraw events`)

        for (const event of withdraw_events) {
            if (event.args){
                const { user, amount } = event.args
    
                try {
                    // Subtract amount
                    let tlp_balance = holder_to_balance_map.get(user);
                    if (!tlp_balance) {
                        tlp_balance = ZERO
                    }
                    const new_tlp_balance = tlp_balance.sub(amount)
                    holder_to_balance_map.set(user, new_tlp_balance)

                } catch (e) {
                    // Catch block for troubleshooting and finding troublesome transactions
                    console.log(event)
                    console.error(e)
                    console.log("------")
                }
            }
        }
    }

    if (MASTERCHEFV2_POOL_INDEX != -1) {
        // Process deposit events
        const deposit_filter = MASTERCHEFV2_CONTRACT.filters.Deposit(null, MASTERCHEFV2_POOL_INDEX, null)
        console.log("Fetching deposit events")
        const deposit_events = await fetchEvents(MASTERCHEFV2_CONTRACT, deposit_filter, 0, -1);
        console.log(`Fetched ${deposit_events.length} deposit events`)

        for (const event of deposit_events) {
            if (event.args){
                const { user, amount } = event.args
    
                try {
                    // Add amount
                    let tlp_balance = holder_to_balance_map.get(user);
                    if (!tlp_balance) {
                        tlp_balance = ZERO
                    }
                    const new_tlp_balance = tlp_balance.add(amount)
                    holder_to_balance_map.set(user, new_tlp_balance)

                } catch (e) {
                    // Catch block for troubleshooting and finding troublesome transactions
                    console.log(event)
                    console.error(e)
                    console.log("------")
                }
            }
        }

        // Process withdraw events
        const withdraw_filter = MASTERCHEFV2_CONTRACT.filters.Withdraw(null, MASTERCHEFV2_POOL_INDEX, null)
        console.log("Fetching withdraw events")
        const withdraw_events = await fetchEvents(MASTERCHEFV2_CONTRACT, withdraw_filter, 0, -1);
        console.log(`Fetched ${withdraw_events.length} withdraw events`)

        for (const event of withdraw_events) {
            if (event.args){
                const { user, amount } = event.args
    
                try {
                    // Subtract amount
                    let tlp_balance = holder_to_balance_map.get(user);
                    if (!tlp_balance) {
                        tlp_balance = ZERO
                    }
                    const new_tlp_balance = tlp_balance.sub(amount)
                    holder_to_balance_map.set(user, new_tlp_balance)

                } catch (e) {
                    // Catch block for troubleshooting and finding troublesome transactions
                    console.log(event)
                    console.error(e)
                    console.log("------")
                }
            }
        }
    }

    for (const [key, value] of holder_to_balance_map.entries()) {
        if ( value.eq(ZERO) ) {
            holder_to_balance_map.delete(key)
        }
    }

    return holder_to_balance_map
}