import { curatedWords } from './curated'
import { intermediateWords, starterWords } from './courseWords'

export const vocabulary = [...starterWords, ...intermediateWords, ...curatedWords]
