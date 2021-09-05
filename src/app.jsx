import React, {useCallback, useEffect, useState} from 'react'
import Web3 from 'web3'
import {ToastContainer, toast} from 'react-toastify'
import {AddressTranslator} from 'nervos-godwoken-integration'
import detectEthereumProvider from '@metamask/detect-provider'

import './css/app.css'

import {Adoption} from './contracts/Adoption'
import pets from './pets.json'
import {getHttpProvider} from '../tools/polyjuice-provider'

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export function App() {
  const [provider, setProvider] = useState()
  const [ethAddress, setEthAddress] = useState()
  const [adopters, setAdopters] = useState()
  const [contract, setContract] = useState()
  const [polyjuiceAddress, setPolyjuiceAddress] = useState()
  const [transactionInProgress, setTransactionInProgress] = useState(false)
  const toastId = React.useRef(null)

  const handleAccountsChanged = (accounts) => {
    const [_account] = accounts
    setEthAddress(_account)

    if (_account) {
      toast('Wallet connected')
      const addressTranslator = new AddressTranslator()
      setPolyjuiceAddress(addressTranslator.ethAddressToGodwokenShortAddress(_account))

    } else {
      toast.warning('Wallet disconnected')
      setPolyjuiceAddress()
    }
  }

  const fetchAdopters = async (contract) => {
    const _adopters = await contract.getAdopters()
    setAdopters(_adopters)
  }

  const adoptPet = useCallback(
    async (petId) => {
      try {
        setTransactionInProgress(true)
        await contract.adopt(petId, ethAddress)
        toast('Adopted pet :)')
        await fetchAdopters(contract)
      } catch (error) {
        console.error(error)
        toast.error('There was an error adopting your pet')
      } finally {
        setTransactionInProgress(false)
      }
    },
    [contract, ethAddress]
  )

  const abandonPet = useCallback(
    async (petId) => {
      try {
        setTransactionInProgress(true)
        await contract.abandon(petId, ethAddress)
        toast('Abandoned pet :(')
        await fetchAdopters(contract)
      } catch (error) {
        console.error(error)
        toast.error('There was an error abandoning your pet')
      } finally {
        setTransactionInProgress(false)
      }
    },
    [contract, ethAddress]
  )


  useEffect(() => {
    (async () => {
      const _provider = await detectEthereumProvider()
      if (!_provider) {
        console.log('No provider detected, consider using metamask')
        return
      }
      setProvider(_provider)

      const _web3 = new Web3(getHttpProvider() || Web3.givenProvider)
      const _contract = new Adoption(_web3)
      setContract(_contract)
      await fetchAdopters(_contract)
    })()
  }, [])

  useEffect(() => {
    if (!provider) {
      return
    }
    if (provider !== window.ethereum) {
      console.error('Do you have multiple wallets installed?')
      toast.error('Unknown wallet provider.')
      return
    }

    provider.on('accountsChanged', handleAccountsChanged)
    provider.request({method: 'eth_accounts'}).then(async (accounts) => {
      if (accounts.length) {
        // only requestAccount if accounts are already accessible
        try {
          const _accounts = await provider.request({method: 'eth_requestAccounts'})
          await handleAccountsChanged(_accounts)
        } catch (error) {
          if (error?.code === -32002) {
            // already pending
            toast.info('Please open Metamask to confirm.')
            return
          }
          console.error(error)
        }
      }
    })
  }, [provider])


  useEffect(() => {
    if (transactionInProgress && !toastId.current) {
      toastId.current = toast.info(
        'Transaction in progress. Confirm MetaMask signing dialog and please wait...',
        {
          position: 'top-right',
          autoClose: false,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          closeButton: false
        }
      )
    } else if (!transactionInProgress && toastId.current) {
      toast.dismiss(toastId.current)
      toastId.current = null
    }
  }, [transactionInProgress, toastId.current])

  const getOwnerText = (petId) => {
    if (!adopters) {
      return <span className="rotating-icon">⚙️</span>
    }
    if (adopters?.[petId] === ZERO_ADDRESS) {
      return 'None'
    }
    if (adopters?.[petId].toLowerCase() === polyjuiceAddress) {
      return 'Me'
    }
    return adopters?.[petId]
  }


  function getCardFooter(petId) {
    if (adopters?.[petId] === ZERO_ADDRESS) {
      // Pet has no owner
      return (
        <button
          className="btn btn-success w-100"
          type="button"
          disabled={transactionInProgress}
          onClick={() => adoptPet(petId)}
        >
          Adopt
        </button>
      )
    }

    if (adopters?.[petId].toLowerCase() === polyjuiceAddress) {
      // allow user to abandon owned pets
      return (
        <div>
          <button
            className="btn btn-warning w-100"
            type="button"
            disabled={transactionInProgress}
            onClick={() => abandonPet(petId)}
          >
            Abandon
          </button>
        </div>
      )
    }

    // has owner
    return <br/>
  }

  return (
    <div>
      <div className="container">
        <h1 className="text-center">Pet Shop</h1>


        {provider && !ethAddress && (
          <div>
            <hr/>
            <button
              className="btn btn-primary"
              onClick={() => provider.request({method: 'eth_requestAccounts'})}
            >
              Enable Ethereum
            </button>
          </div>
        )}

        <hr/>

        <div className="row">
          {pets.map(pet => {
            return (
              <div className="col-sm-12 col-md-6 col-lg-4 mb-4" key={pet.id}>
                <div className="card">
                  <img
                    alt="nothing"
                    className="card-img-top"
                    src={`public/${pet.name
                      .toLowerCase()
                      .replace(/\s/g, '-')}.png`}
                    data-holder-rendered="true"
                  />

                  <div className="card-body">
                    <h3 className="card-title">{pet.name}</h3>
                    <div className="card-text">
                      <div className="text-truncate">
                        <strong>Owner: </strong>
                        <span>{getOwnerText(pet.id)}</span>
                      </div>
                      <strong>Breed: </strong>
                      <span className="pet-breed">{pet.breed}</span>
                      <br/>
                      <strong>Age: </strong>
                      <span className="pet-age">{pet.age}</span>
                      <br/>
                      <strong>Location: </strong>
                      <span className="pet-location">{pet.location}</span>
                    </div>
                  </div>
                  <div className="card-footer">{getCardFooter(pet.id)}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <ToastContainer newestOnTop={true}/>
    </div>
  )
}
