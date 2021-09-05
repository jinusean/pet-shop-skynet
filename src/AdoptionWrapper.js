import AdoptionJSON from '../build/contracts/Adoption.json'

export class AdoptionWrapper {
  constructor(web3) {
    this.web3 = web3

    this.contract = new web3.eth.Contract(
      AdoptionJSON.abi,
      AdoptionJSON.networks[process.env.NETWORK_ID].address
    )
  }

  get address() {
    return this.contract.options.address
  }

  async getAdopters() {
    return this.contract.methods.getAdopters().call()
  }

  async adopt(petId, fromAddress) {
    return this.contract.methods.adopt(petId).send({gas: process.env.GAS, from: fromAddress})
  }

  async abandon(petId, fromAddress) {
    return this.contract.methods
      .abandon(petId)
      .send({gas: process.env.GAS, from: fromAddress})
  }
}
