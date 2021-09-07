import pets from './pets.json'
import {SkyDb} from '../src/skydb'

async function setPets() {
  const db = new SkyDb()
  for (const pet of pets) {
    await db.set(pet.id, pet)
  }
}
