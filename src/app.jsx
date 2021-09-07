import React, {useCallback, useEffect, useState} from 'react'
import Web3 from 'web3'
import {ToastContainer, toast} from 'react-toastify'
import {AddressTranslator} from 'nervos-godwoken-integration'
import detectEthereumProvider from '@metamask/detect-provider'

import './css/app.css'

import {Adoption} from './contracts/Adoption'
import {getHttpProvider} from '../tools/polyjuice-provider'

import {SkyDb} from './skydb'

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const skyDb = new SkyDb()

export function App() {
  const [provider, setProvider] = useState()
  const [ethAddress, setEthAddress] = useState()
  const [adopters, setAdopters] = useState()
  const [contract, setContract] = useState()
  const [pets, setPets] = useState(new Map())
  const [polyjuiceAddress, setPolyjuiceAddress] = useState()
  const [transactionInProgress, setTransactionInProgress] = useState(false)
  const toastId = React.useRef(null)

  async function fetchPet(petId) {
    const pet = await skyDb.get(petId)
    if (!pet) {
      return console.error('No pet found for:', petId)
    }
    setPets(new Map(pets.set(petId, pet)))
  }

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

  const fetchAdoptersAndPets = async (contract) => {
    const _adopters = await contract.getAdopters()
    setAdopters(_adopters)

    await Promise.all(_adopters.map(((_, i) => fetchPet(i))))
  }

  const adoptPet = useCallback(
    async (petId) => {
      try {
        setTransactionInProgress(true)
        await contract.adopt(petId, ethAddress)
        toast('Adopted pet :)')
        await fetchAdoptersAndPets(contract)
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
        await fetchAdoptersAndPets(contract)
      } catch (error) {
        console.error(error)
        toast.error('There was an error abandoning your pet')
      } finally {
        setTransactionInProgress(false)
      }
    },
    [contract, ethAddress]
  )

  async function toggleLike(pet) {
    if (!polyjuiceAddress) {
      return toast.info('Please enable your wallet first.')
    }
    if (pet.likes && pet.likes.includes(polyjuiceAddress)) {
      pet.likes = pet.likes.filter(x => x !== polyjuiceAddress)
      if (pet.likes.length === 0) {
        delete pet.likes
      }
    } else {
      if (!pet.likes) {
        pet.likes = []
      }
      pet.likes.push(polyjuiceAddress)
    }
    setPets(new Map(pets.set(pet.id, pet)))
    const res = await skyDb.set(pet.id, pet)
    console.log('toggled like', res)

  }


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
      await fetchAdoptersAndPets(_contract)
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
    if (!polyjuiceAddress || !adopters) {
      return <br />
    }

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
          {pets.size === 0 && <p>Loading pets...<span className="rotating-icon">⚙️</span></p>}
          {Array.from(pets).map(([_, pet]) => {
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
                    <div className=" d-flex justify-content-between align-content-center">
                      <h3 className="card-title">{pet.name}</h3>
                      <button className="btn p-0" onClick={() => toggleLike(pet)} disabled={!polyjuiceAddress}>
                        {pet.likes && pet.likes.includes(polyjuiceAddress)
                          ?
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                            <path fill="#ff3526" d="M12 4.419c-2.826-5.695-11.999-4.064-11.999 3.27 0 7.27 9.903 10.938 11.999 15.311 2.096-4.373 12-8.041 12-15.311 0-7.327-9.17-8.972-12-3.27z" />
                          </svg>
                          :
                          <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fillRule="evenodd" clipRule="evenodd">
                            <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402m5.726-20.583c-2.203 0-4.446 1.042-5.726 3.238-1.285-2.206-3.522-3.248-5.719-3.248-3.183 0-6.281 2.187-6.281 6.191 0 4.661 5.571 9.429 12 15.809 6.43-6.38 12-11.148 12-15.809 0-4.011-3.095-6.181-6.274-6.181"/>
                          </svg>}


                      </button>
                    </div>

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
                      <br/>
                      <strong>Likes: </strong>
                      <span>{pet.likes ? pet.likes.length : 0}</span>
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
