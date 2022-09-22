import { readFileSync } from 'fs'
import { argv, exit } from 'process'

import { None } from './reductions'
import { NormalEvaluator, Evaluator } from './evaluators'
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
const ref_file = argv[3]
const [recursive, args] = argv[4] === "-rec" ? [true, argv.slice(5)] : [false, argv.slice(4)]

const student_expr = readFileSync(student_file).toString()
const ref_expr = readFileSync(ref_file).toString()

const y_comb = "Y"
const y_ast = Parser.parse(tokenize(y_comb, codestyle), macromap)


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
const student_app_arr = recursive ? [y_ast, student_ast, ...args_ast] : [student_ast, ...args_ast]
const [student_head, ...student_tail] = student_app_arr
const student_app = student_tail.reduce((lambda, arg) => new Application(lambda, arg), student_head)


const ref_app_arr = recursive ? [y_ast, ref_ast, ...args_ast] : [ref_ast, ...args_ast]
const [ref_head, ...ref_tail] = ref_app_arr
const ref_app = ref_tail.reduce((lambda, arg) => new Application(lambda, arg), ref_head)

// console.log(printTree(student_app))
// console.log("___")
// console.log(printTree(ref_app)


// NOW WE CAN EVALUATE BOTH EXPRESSIONS

// FIRST EVALUATE THE REFERENCE

let ref_root = ref_app
let ref_steps = 0

try {
  while (true) {
    const evaluator : Evaluator = new NormalEvaluator(ref_root)
  
    if (evaluator.nextReduction instanceof None) {
      break
    }
  
    ref_root = evaluator.perform()
  
    ref_steps++
  }
} catch (error) {
  console.error(`Failure of the testing sub-system. Send us an email, this is probably some sort of a bug.`)
  exit(1)
}



// THEN EVALUATE STUDENT'S
let student_root = student_app
let student_steps = 0

try {  
  while (true) {
    const evaluator : Evaluator = new NormalEvaluator(student_root)
  
    if (evaluator.nextReduction instanceof None) {
      break
    }
  
    student_root = evaluator.perform() // perform next reduction
  
    student_steps++
  }
} catch (error) {
  // studentovo reseni zpusobylo runtime error
  // pravdepodobne stack overflow
  console.error(`Failure of the testing sub-system. Maybe your expression results in infinite recursion?`)
  exit(1)
  
}



// NOW I COMPARE BOTH RESULTS

const comparator : TreeComparator = new TreeComparator([ref_root, student_root], [macromap, macromap])

if (comparator.equals) {
  // everything is OK
  if (student_steps > 2 * ref_steps) {
    console.log("Your solution takes at least two times as many steps to evaluate! You might want to think about why that might be.")
  }
  exit(0)
}
else {
  // the results do not match!
  // console.log("Your solution does not pass the test.")

  console.log(`reference: ${printTree(ref_root)}`)
  console.log(`student:   ${printTree(student_root)}`)
  exit(1)
}


export function printTree (tree : AST) : string {
  const printer : BasicPrinter = new BasicPrinter(tree)
  return printer.print()
}