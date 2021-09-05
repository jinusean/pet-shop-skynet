# Pet Shop

This project makes use of `@truffle/hdwallet-provider` & `truffle` for contract migrations.


## Install Dependencies
```
npm installa
```

## Build/Deploy Contracts (migrations)
1. Create local .env file
```
cp .env.example .env
```
2. Update`.env` with account address and private key. These values can be found in Metamask.

4. Run migrations
```
npm run migrate
```
## Start UI

```
npm run dev
```