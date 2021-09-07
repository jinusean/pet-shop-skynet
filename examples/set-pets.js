import pets from './pets.json'
import {SkyDb} from '../src/skydb'

export async function setPets() {
  const db = new SkyDb()
  for (const pet of pets) {
    console.log('Setting', pet.id, pet)
    await db.set(pet.id, pet)
    console.log('Set', pet.id)
  }
}
