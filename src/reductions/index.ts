export interface ASTReduction {
  type : ASTReductionType
}

export { Alpha } from './alpha'
export { Beta } from './beta'
export { Expansion } from './expansion'
export { Eta } from './eta'
export { None } from './none'

export { Gama, arity } from './gama'

export enum ASTReductionType {
  ALPHA,
  BETA,
  EXPANSION,
  ETA,
  NONE,
  GAMA
}