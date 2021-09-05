const { PolyjuiceHttpProvider } = require('@polyjuice-provider/web3')
const { PolyjuiceHDWalletProvider } = require('@polyjuice-provider/truffle')

const polyjuiceConfig = {
    rollupTypeHash: process.env.ROLLUP_TYPE_HASH,
    ethAccountLockCodeHash: process.env.ETH_ACCOUNT_LOCK_CODE_HASH,
    web3Url: process.env.WEB3_PROVIDER_URL
}
const getHttpProvider = () => {
  return new PolyjuiceHttpProvider(
    process.env.WEB3_PROVIDER_URL,
    polyjuiceConfig
  )
}

const getWalletProvider = () => {
  return new PolyjuiceHDWalletProvider(
    [
      {
        privateKeys: [process.env.ETH_PRIVATE_KEY],
        providerOrUrl: getHttpProvider()
      }
    ],
    polyjuiceConfig
  )
}




module.exports = {getWalletProvider, getHttpProvider}
