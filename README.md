# Pet Shop

This project makes use of `@truffle/hdwallet-provider` & `truffle` for contract migrations.


## Install Dependencies
```
yarn
```

## Build/Deploy Contracts (migrations)
1. Create local .env file
```
cp .env.example .env
```
2. Update`.env` with account address and private key. These values can be found in Metamask.

4. Run migrations
```
yarn migrate
```
## Start UI
1. Update `NETWORK_ID` in `.env` with the networks key in the newly compiled contract's network property.
2. Run app
```
yarn dev
```