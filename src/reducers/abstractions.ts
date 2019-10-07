import { arity } from "../reductions"
import { ChurchNumeral, AST, Macro, Lambda } from "../ast"
import { parse } from "../parser"
import { tokenize, TokenType, Token, BLANK_POSITION } from "../lexer"

export class Abstractions {
  private static knownAbstractions : { [ name : string ] : [ arity, (args : Array<AST>) => boolean, (args : Array<AST>) => AST ] } = {
    // TODO: consider implementing Y combinator
    // 'Y' : [
    //   1,
    //   (args : Array<AST>) => {
    //     const [ first ] = args

    //     return args.length === 1 && first instanceof Lambda
    //   },
    //   (args : Array<AST>) => {
    //     const [ first ] = args

    //     const lambdaValue : string = `${first.toString()} (Y ${first.toString()})`

    //     return parse(tokenize(lambdaValue, { lambdaLetters : [ '\\' ], singleLetterVars : false }), {})
    //   }
    // ],
    'ZERO' : [
      1,
      (args : Array<AST>) => {
        const [ first ] = args

        return args.length === 1 && first instanceof ChurchNumeral
      },
      (args : Array<AST>) => {
        const [ first ] = args

        const value : boolean = 0 === Number((<ChurchNumeral>first).name())
        const lambdaValue : string = value ? 'T' : 'F'

        return parse(tokenize(lambdaValue, { lambdaLetters : [ '\\' ], singleLetterVars : false }), {})
      }
    ],
    'PRED' : [
      1,
      (args : Array<AST>) => {
        const [ first ] = args

        return args.length === 1 && first instanceof ChurchNumeral
      },
      (args : Array<AST>) => {
        const [ first ] = args

        const value : number = Math.max(0, Number(first) - 1)
        const lambdaValue : string = `${value}`

        return parse(tokenize(lambdaValue, { lambdaLetters : [ '\\' ], singleLetterVars : false }), {})
      }
    ],
    'SUC' : [
      1,
      (args : Array<AST>) => {
        const [ first ] = args

        return args.length === 1 && first instanceof ChurchNumeral
      },
      (args : Array<AST>) => {
        const [ first ] = args

        const value : number = Number(first) + 1
        const lambdaValue : string = `${value}`

        return parse(tokenize(lambdaValue, { lambdaLetters : [ '\\' ], singleLetterVars : false }), {})
      }
    ],
    'AND' : [
      2,
      (args : Array<AST>) => {
        const [ first, second ] = args
        return args.length === 2 && first instanceof Macro && second instanceof Macro && (first.name() === 'T' || first.name() === 'F') && (second.name() === 'T' || second.name() === 'F')
      },
      (args : Array<AST>) => {
        const [ first, second ] = args


        const firstBoolean : boolean = (<Macro>first).name() === 'T' ? true : false
        const secondBoolean : boolean = (<Macro>second).name() === 'T' ? true : false

        const value : boolean = firstBoolean && secondBoolean
        const lambdaValue : string = value ? 'T' : 'F'

        return parse(tokenize(lambdaValue, { lambdaLetters : [ '\\' ], singleLetterVars : false }), {})
      }
    ],
    'OR' : [
      2,
      (args : Array<AST>) => {
        const [ first, second ] = args
        return args.length === 2 && first instanceof Macro && second instanceof Macro && (first.name() === 'T' || first.name() === 'F') && (second.name() === 'T' || second.name() === 'F')
      },
      (args : Array<AST>) => {
        const [ first, second ] = args


        const firstBoolean : boolean = (<Macro>first).name() === 'T' ? true : false
        const secondBoolean : boolean = (<Macro>second).name() === 'T' ? true : false

        const value : boolean = firstBoolean || secondBoolean
        const lambdaValue : string = value ? 'T' : 'F'

        return parse(tokenize(lambdaValue, { lambdaLetters : [ '\\' ], singleLetterVars : false }), {})
      }
    ],
    'NOT' : [
      1,
      (args : Array<AST>) => {
        const [ first ] = args

        return args.length === 1 && first instanceof Macro && (first.name() === 'F' || first.name() === 'T')
      },
      (args : Array<AST>) => {
        const [ first ] = args

        const name : string = (<Macro>first).name()
        const value : boolean = name === 'T' ? true : false
        const negative : boolean = ! value
        const lambdaValue : string = negative ? 'T' : 'F'
        // TODO: if I create Boolean offspring of Macro - this place is to get more simple

        return parse(tokenize(lambdaValue, { lambdaLetters : [ '\\' ], singleLetterVars : false }), {})
      }
    ],
    '+' : [
      2,
      (args : Array<AST>) => {
        const [ first, second ] = args
        return args.length === 2 && first instanceof ChurchNumeral && second instanceof ChurchNumeral
      },
      (args : Array<AST>) => {
      const [ first, second ] = args

      const value : number = Number((<ChurchNumeral>first).name()) + Number((<ChurchNumeral>second).name())
      const dummyToken : Token = new Token(TokenType.Number, `${value}`, BLANK_POSITION)
      return new ChurchNumeral(dummyToken)
    } ],
    '-' : [
      2,
      (args : Array<AST>) => {
      const [ first, second ] = args
      return args.length === 2 && first instanceof ChurchNumeral && second instanceof ChurchNumeral
    },
    (args : Array<AST>) => {
      const [ first, second ] = args

      const value : number = Number((<ChurchNumeral>first).name()) - Number((<ChurchNumeral>second).name())
      const dummyToken : Token = new Token(TokenType.Number, `${value}`, BLANK_POSITION)
      return new ChurchNumeral(dummyToken)
    } ],
    '*' : [
      2,
      (args : Array<AST>) => {
      const [ first, second ] = args
      return args.length === 2 && first instanceof ChurchNumeral && second instanceof ChurchNumeral
      },
      (args : Array<AST>) => {
      const [ first, second ] = args

      const value : number = Number((<ChurchNumeral>first).name()) * Number((<ChurchNumeral>second).name())
      const dummyToken : Token = new Token(TokenType.Number, `${value}`, BLANK_POSITION)
      return new ChurchNumeral(dummyToken)
    } ],
    '/' : [
      2,
      (args : Array<AST>) => {
      const [ first, second ] = args
      return args.length === 2 && first instanceof ChurchNumeral && second instanceof ChurchNumeral
      },
      (args : Array<AST>) => {
      const [ first, second ] = args

      const value : number = Number((<ChurchNumeral>first).name()) / Number((<ChurchNumeral>second).name())
      const dummyToken : Token = new Token(TokenType.Number, `${value}`, BLANK_POSITION)
      return new ChurchNumeral(dummyToken)
    } ],
    '^' : [
      2,
      (args : Array<AST>) => {
        const [ first, second ] = args
        return args.length === 2 && first instanceof ChurchNumeral && second instanceof ChurchNumeral
      },
      (args : Array<AST>) => {
        const [ first, second ] = args

        const value : number = Number((<ChurchNumeral>first).name()) ^ Number((<ChurchNumeral>second).name())
        const dummyToken : Token = new Token(TokenType.Number, `${value}`, BLANK_POSITION)
        return new ChurchNumeral(dummyToken)
    } ],
    'DELTA' : [
      2,
      (args : Array<AST>) => {
      const [ first, second ] = args
      return args.length === 2 && first instanceof ChurchNumeral && second instanceof ChurchNumeral
    }, (args : Array<AST>) => {
      const [ first, second ] = args

      const value : number = Math.abs( Number((<ChurchNumeral>first).name()) - Number((<ChurchNumeral>second).name()) )
      const dummyToken : Token = new Token(TokenType.Number, `${value}`, BLANK_POSITION)
      return new ChurchNumeral(dummyToken)
    } ],
    '=' : [
      2,
      (args : Array<AST>) => {
        const [ first, second ] = args

        return args.length === 2 && first instanceof ChurchNumeral && second instanceof ChurchNumeral
    }, (args : Array<AST>) => {
      const [ first, second ] = args

      const value : boolean = Number((<ChurchNumeral>first).name()) === Number((<ChurchNumeral>second).name())
      const lambdaValue = value ? 'T' : 'F'

      return parse(tokenize(lambdaValue, { lambdaLetters : [ '\\' ], singleLetterVars : false }), {})
    } ],
    '>' : [
      2,
      (args : Array<AST>) => {
      const [ first, second ] = args
      return args.length === 2 && first instanceof ChurchNumeral && second instanceof ChurchNumeral
    }, (args : Array<AST>) => {
      const [ first, second ] = args

      const value : boolean = Number((<ChurchNumeral>first).name()) > Number((<ChurchNumeral>second).name())
      const lambdaValue = value ? 'T' : 'F'

      return parse(tokenize(lambdaValue, { lambdaLetters : [ '\\' ], singleLetterVars : false }), {})
    } ],
    '<' : [
      2,
      (args : Array<AST>) => {
      const [ first, second ] = args
      return args.length === 2 && first instanceof ChurchNumeral && second instanceof ChurchNumeral
    }, (args : Array<AST>) => {
      const [ first, second ] = args

      const value : boolean = Number((<ChurchNumeral>first).name()) < Number((<ChurchNumeral>second).name())
      const lambdaValue = value ? 'T' : 'F'

      return parse(tokenize(lambdaValue, { lambdaLetters : [ '\\' ], singleLetterVars : false }), {})
    } ],
    '>=' : [
      2,
      (args : Array<AST>) => {
      const [ first, second ] = args
      return args.length === 2 && first instanceof ChurchNumeral && second instanceof ChurchNumeral
    }, (args : Array<AST>) => {
      const [ first, second ] = args

      const value : boolean = Number((<ChurchNumeral>first).name()) >= Number((<ChurchNumeral>second).name())
      const lambdaValue = value ? 'T' : 'F'

      return parse(tokenize(lambdaValue, { lambdaLetters : [ '\\' ], singleLetterVars : false }), {})
    } ],
    '<=' : [
      2,
      (args : Array<AST>) => {
      const [ first, second ] = args
      return args.length === 2 && first instanceof ChurchNumeral && second instanceof ChurchNumeral
    }, (args : Array<AST>) => {
      const [ first, second ] = args

      const value : boolean = Number((<ChurchNumeral>first).name()) <= Number((<ChurchNumeral>second).name())
      const lambdaValue = value ? 'T' : 'F'

      return parse(tokenize(lambdaValue, { lambdaLetters : [ '\\' ], singleLetterVars : false }), {})
    } ],
  }

  public static has (name : string) : boolean {
    return name in this.knownAbstractions
  }

  public static getArity (name : string) : number {
    const [ arity ] = this.knownAbstractions[name]

    return arity
  }

  public static assert (name : string, args : Array<AST>) : boolean {
    const [ _, assert ] = this.knownAbstractions[name]

    return assert(args)
  }

  public static evaluate (name : string, args : Array<AST>) : AST {
    const [ _, __, evaluation ] = this.knownAbstractions[name]

    return evaluation(args)
  }
}