import { SkynetClient, genKeyPairFromSeed } from "skynet-js";

export class SkyDb {
  #clientSeed
  #privateKey
  publicKey

  constructor(seed=process.env.SKYNET_CLIENT_SEED) {
    if (!seed) {
      throw new Error('seed is required')
    }
    this.#clientSeed = seed

    const { publicKey, privateKey} = genKeyPairFromSeed(this.#clientSeed)
    this.publicKey = publicKey
    this.#privateKey = privateKey
    this.client = new SkynetClient(process.env.SKYNET_PORTAL)
  }

  async get(key) {
    const { data, dataLink } = await this.client.db.getJSON(this.publicKey, `${key}`)
    return data
  }

  async set(key, data) {
    const res = await this.client.db.setJSON(this.#privateKey, `${key}`, data)
    return res
  }
}
