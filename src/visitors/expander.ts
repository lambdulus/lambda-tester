import { AST, Application, Lambda, ChurchNumeral, Macro, Variable } from "../ast"
import { ASTVisitor } from "."
import { BLANK_POSITION, Token, TokenType, tokenize } from "../lexer"
import { Parser } from "../parser/parser"


// the goal is to transform the tree in such a way, that all numerals and macros are fully expanded
export class MacroExpander extends ASTVisitor {
  private expression : string = ''

  constructor (
    public tree : AST,
  ) {
    super()
    this.tree.visit(this)
  }

  print () : string {
    return this.expression
  }

  onApplication(application: Application): void {
    const left : AST = application.left
    const right : AST = application.right

    left.visit(this)

    const expanded_left : AST = this.tree

    right.visit(this)

    const expanded_right : AST = this.tree

    this.tree = new Application(expanded_left, expanded_right)    
  }


  onChurchNumeralBody (n : number) : AST {
    if (n === 0) {
      return new Variable(new Token(TokenType.Identifier, 'z', BLANK_POSITION))
    }

    const left : Variable = new Variable(new Token(TokenType.Identifier, 's', BLANK_POSITION))
    const right : AST = this.onChurchNumeralBody(n - 1)
    return new Application(left, right)
  }

  // TODO: creating dummy token, there should be something like NoPosition
  onChurchNumeralHeader (tree : AST) : AST {
    const s : Variable = new Variable(new Token(TokenType.Identifier, 's', BLANK_POSITION))
    const z : Variable = new Variable(new Token(TokenType.Identifier, 'z', BLANK_POSITION))
    
    const body : Lambda = new Lambda(z, tree)
    return new Lambda(s, body)
  }

  onChurchNumeral(churchNumeral: ChurchNumeral): void {
    const value : number = <number> churchNumeral.token.value
    const churchLambda : AST = this.onChurchNumeralHeader(this.onChurchNumeralBody(value))

    this.tree = churchLambda
  }

  onLambda(lambda: Lambda): void {
    const param = lambda.argument
    const body = lambda.body

    body.visit(this)

    const expanded_body = this.tree

    const expanded = new Lambda(param, expanded_body)

    this.tree = expanded
  }

  onMacro(macro: Macro): void {
    const value : string = macro.token.value as string
    const definition : string = macro.macroTable[value]

    const parser : Parser = new Parser(tokenize(definition, { lambdaLetters : [ '\\', 'λ' ], singleLetterVars : false, macromap : macro.macroTable }), macro.macroTable)

    const expression : AST = parser.parse(null)

    expression.visit(this) // this assigns the expanded expression into the `this.tree`
  }

  onVariable(variable: Variable): void {
    this.tree = variable
  }
}