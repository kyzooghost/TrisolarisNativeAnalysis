```bash
curl --location --request POST 'https://mainnet.aurora.dev/' \
--header 'Content-Type: application/json' \
--data-raw '{
    "jsonrpc":"2.0",
    "method":"eth_blockNumber",
    "params":[],
    "id":43
}'
```