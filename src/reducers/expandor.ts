import { Token, TokenType } from "../lexer";
import { AST, Binary, Child, ChurchNumber, Macro, Application, Variable, Lambda } from "../ast";
import { ASTVisitor } from "../visitors";
import { Expansion } from "../reductions";


export class Expandor extends ASTVisitor {
  private expanded : AST | null = null

  private parent : Binary | null
  private treeSide : Child | null
  private target : AST

  constructor (
    { parent, treeSide, target } : Expansion,
    public tree : AST
  ) {
    super()
    this.parent = parent
    this.treeSide = treeSide
    this.target = target
  }

  churchNumberBody (n : number) : AST {
    if (n === 0) {
      return new Variable(new Token(TokenType.Identifier, 'z', {column:0,position:0,row:0}))
    }

    const left : Variable = new Variable(new Token(TokenType.Identifier, 's', {column:0,position:0,row:0}))
    const right : AST = this.churchNumberBody(n - 1)
    return new Application(left, right)
  }

  // TODO: creating dummy token, there should be something like NoPosition
  churchNumberHeader (tree : AST) : AST {
    const s : Variable = new Variable(new Token(TokenType.Identifier, 's', {column:0,position:0,row:0}))
    const z : Variable = new Variable(new Token(TokenType.Identifier, 'z', {column:0,position:0,row:0}))
    
    const body : Lambda = new Lambda(z, tree)
    return new Lambda(s, body)
  }

  onChurchNumber(churchNumber : ChurchNumber) : void {
    const value : number = <number> churchNumber.token.value
    const churchLiteral : AST = this.churchNumberHeader(this.churchNumberBody(value))

    this.expanded = churchLiteral
  }

  onMacro(macro : Macro) : void {
    // TODO: here I lose token - useful for location and origin of macro - should solve this
    // also consider not clonning
    this.expanded = macro.definition.ast.clone()
  }

  perform () : void {
    this.target.visit(this)

    if (this.parent === null) {
      this.tree = <AST> this.expanded
    }
    else {
      this.parent[<Child> this.treeSide] = <AST> this.expanded
    }
  }
}