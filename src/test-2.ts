import { readFileSync } from 'fs'
import { argv, exit } from 'process'

import { None } from './reductions'
import { NormalEvaluator, Evaluator } from './evaluators'
import { AST, Application } from './ast'
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
const ref_file = argv[3]
const args = argv.slice(4)

const student_expr = readFileSync(student_file).toString()
const ref_expr = readFileSync(ref_file).toString()


var student_ast : AST = null as unknown as AST // stupid hack for stupid error handling in JS
try {
  student_ast = Parser.parse(tokenize(student_expr, codestyle), macromap)
} catch (error : any) {
  console.error("Your solution contains syntactic errors. The following message might help you to figure it out. You might also want to use Lambdulus to check your solution.")
  console.error(error.toString())
  exit(2)
}

const ref_ast = Parser.parse(tokenize(ref_expr, codestyle), macromap) // I do not expect reference file to fail to parse

const args_ast = args.map(
  expr => {
    const tokens = tokenize(expr, codestyle)
    const ast : AST = Parser.parse(tokens, macromap) // I also do not expect the arguments from the cmd line to fail to parse
    return ast
  })


// NOW WE MOVE ON TO BUILDING AN APPLICATION

const student_app = args_ast.reduce((lambda, arg) => new Application(lambda, arg), student_ast)

const ref_app = args_ast.reduce((lambda, arg) => new Application(lambda, arg), ref_ast)


// NOW WE CAN EVALUATE BOTH EXPRESSIONS

// FIRST EVALUATE THE REFERENCE

let ref_root = ref_app
let ref_steps = 0

while (true) {
  const evaluator : Evaluator = new NormalEvaluator(ref_root)

  if (evaluator.nextReduction instanceof None) {
    break
  }

  ref_root = evaluator.perform()

  ref_steps++
}


// THEN EVALUATE STUDENT'S

let student_root = student_app
let student_steps = 0

while (true) {
  const evaluator : Evaluator = new NormalEvaluator(student_root)

  if (evaluator.nextReduction instanceof None) {
    break
  }

  student_root = evaluator.perform() // perform next reduction

  student_steps++
}


// NOW I COMPARE BOTH RESULTS

const comparator : TreeComparator = new TreeComparator([ref_root, student_root], [macromap, macromap])

comparator.compare()

if (comparator.equals) {
  // everything is OK
  if (student_steps > 2 * ref_steps) {
    console.log("Your solution takes at least two times as many steps to evaluate! You might want to think about why that might be.")
  }
  exit(0)
}
else {
  // the results do not match!
  console.log("Your solution does not pass the test.")
  console.log(comparator.message)

  console.log(`reference: ${printTree(ref_root)}`)
  console.log(`student: ${printTree(student_root)}`)
  exit(1)
}


export function printTree (tree : AST) : string {
  const printer : BasicPrinter = new BasicPrinter(tree)
  return printer.print()
}