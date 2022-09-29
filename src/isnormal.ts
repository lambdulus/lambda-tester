import { readFileSync } from 'fs'
import { argv, exit } from 'process'

import { None } from './reductions'
import { NormalEvaluator, Evaluator, OptimizeEvaluator } from './evaluators'
import { AST, Application, Macro } from './ast'
import * as Parser from './parser'
import { CodeStyle, tokenize } from './lexer'
import { BasicPrinter } from './visitors/basicprinter'
import { TreeComparator } from './visitors/comparator'




const macromap : Parser.MacroMap = { }

const codestyle : CodeStyle = {
  singleLetterVars : false,
  lambdaLetters : [ 'λ', '\\' ],
  macromap,
}



const student_file = argv[2]
const consider_eta = argv[3] === "-eta"


const student_expr = readFileSync(student_file).toString()


var student_ast : AST = null as unknown as AST // stupid hack for stupid error handling in JS
try {
  student_ast = Parser.parse(tokenize(student_expr, codestyle), macromap)
} catch (error : any) {
  console.error("Your solution contains syntactic errors. The following message might help you to figure it out. You might also want to use Lambdulus to check your solution.")
  console.error(error.toString())
  exit(2)
}


// FIRST TRY TO EVALUATE THE STUDENT'S

const evaluator : Evaluator = new NormalEvaluator(student_ast)

if (evaluator.nextReduction instanceof None) {
  if (consider_eta) {
    const optimizer : Evaluator = new OptimizeEvaluator(student_ast)
    if (optimizer.nextReduction instanceof None) {
      exit(0)
    }
    else {
      exit(1)
    }
  }
  else {
    exit(0)
  }
}

exit(1)

export function printTree (tree : AST) : string {
  const printer : BasicPrinter = new BasicPrinter(tree)
  return printer.print()
}