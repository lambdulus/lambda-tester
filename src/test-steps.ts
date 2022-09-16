// import readline from 'readline'
import { readFileSync } from 'fs'
import { argv, exit } from 'process'

import { Alpha, Beta, Eta, Expansion, None } from './reductions'
import { NormalEvaluator, NormalAbstractionEvaluator, Evaluator, OptimizeEvaluator, ApplicativeEvaluator } from './evaluators'
import { AST, Macro, Application } from './ast'
import * as Parser from './parser'
import { CodeStyle, Token, tokenize } from './lexer'
import { BasicPrinter } from './visitors/basicprinter'
import { TreeComparator } from './visitors/comparator'
import { DeepExpander } from './visitors/expander'


const macromap : Parser.MacroMap = { }

const codestyle : CodeStyle = {
  singleLetterVars : false,
  lambdaLetters : [ 'λ', '\\' ],
  macromap,
}


const student_file = argv[2]
const ref_file = argv[3]
let STEPS : number = Number(argv[4])
const STRATEGY : string = argv[5]



const student_steps = readFileSync(student_file).toString()
const ref_expr = readFileSync(ref_file).toString()


// v prvni rade je potreba nadelat ze studentova souboru radky
const lines_student_ : string[] = student_steps.split('\n')
// skipnout pripadny prazdny radky
const lines_student : string[] = lines_student_
    .filter(str => str.length)
    .filter(str => {
      const m = str.match(/\s*/g)
      if (m) { return m[0] !== str } else { return true }
    })

// naparsovat prvni radek reference E0
const E0 : AST = Parser.parse(tokenize(ref_expr, codestyle), macromap)

// zkontrolovat, ze studentovo reseni obsahuje alespon prvni krok
if (lines_student.length === 0) {
  // tohle je exit /= 0 a vypsat na error out
  console.error(`Your file does not contain any steps!`)
  exit(1)
}

// naparsovat prvni radek studenta S0
const line0 = lines_student.shift() as string

const S0 : AST = try_parse(line0)

// plne expandovat oba dva
const S0_expanded = expand(S0)
const E0_expanded = expand(E0)

// porovnat
if ( ! equal(E0_expanded, S0_expanded)) {
  // pokud se lisi - error out --> vypsat chybu na error vystup
  console.error(`Your first step is not equivalent to the assignment!`)
  console.error(`Here is your first step: ${print(S0)}`)
  console.error(`Here is the assignment:  ${print(E0)}`)

  exit(3)
}
// pokud se nelisi - pokracuju



let reference_prev : AST = E0
let student_prev : AST = S0

// ted se vleze do cyklu
while (STEPS) {
  // identifikuju nasledujici krok pro referenci
  const evaluator : Evaluator = new_evaluator(reference_prev)

  if (lines_student.length === 0) {
    // student skoncil, ale je treba se ujistit, ze reference ma taky None, nebo Etu - tu nebereme nutne jako nutnou udelat
    if (evaluator.nextReduction instanceof None) {
      // pokud jo --> OK, skoncime
      exit(0)
    }
    else if (evaluator.nextReduction instanceof Eta) {
      // student uz nema kroky, ale evaluator jeste ma
      console.log(`Your solution ends too soon. The expression is not in the Normal Form yet. Hint: Maybe you need to do eta reduction?`)
      exit(1)
    }
    else {
      // student uz nema kroky, ale evaluator jeste ma
      console.log(`Your solution ends too soon. The expression is not in the Normal Form yet.`)
      exit(1)
    }
  }

  // ted uz to udelat muzu
  const student_next_str : string = next(lines_student)
  const student_next : AST = try_parse(student_next_str)
  const student_expanded : AST = expand(student_next)


  // pokud reference nema zadny dalsi krok, ale student ma
  if (evaluator.nextReduction instanceof None) {
    // tak jenom pro jistotu zkontroluju, ze to neni jenom alpha conversion
    // pokud ano, posunu se dal, pro pripad, ze by jich tady bylo vic
    if (equal(expand(student_prev), student_expanded)) {
      student_prev = student_next
      continue
    }

    // nebo jeste zkusim najit eta redukci
    const optimizer : OptimizeEvaluator = new OptimizeEvaluator(reference_prev)
    if (optimizer.nextReduction instanceof Eta) {
      // pokud najdu --> provedu, expanduju a porovnam
      const optimized : AST = optimizer.perform()
      const expanded : AST = expand(optimized)

      if (equal(expanded, student_expanded)) {
        // to co student udela byla Eta
        // ta se NEpocita jako krok -> takze zadny STEPS--
        reference_prev = optimized
        student_prev = student_next
        continue
      }
      else {
        // nesouhlasi, urcite to neni jenom alfa (to uz jsem kontroloval)
        // ja jsem udelal etu a student udelal neco, co neni eta tam kde bych ji udelal ja
        // dam chybu
        console.log(`Your step "${student_next_str}" is not correct. Hint: Check the previous step and see if it is in the Normal Form.`)
        exit(1)
      }
    }

    // v tenhle moment, ja uz nemam co delat, nejde udelat ani Etu, ale student porad ma nejaky krok, ktery neni jenom alpha
    // to je jeho chyba!
    console.log(`Your solution contains some step(s) even after the evaluation reaches the Normal Form. It starts with the step "${student_next_str}".`)
    exit(1)

  }

  // pokud reference nasla expanzi
  if (evaluator.nextReduction instanceof Expansion) {
    // provedu ji, plne expanduju a porovnam s dalsim studentovym krokem
    const next_ref : AST = evaluator.perform()
    const NR_expanded : AST = expand(next_ref)

    if (equal(NR_expanded, student_expanded)) {
      // pokud se rovnaji
      // ok
      reference_prev = next_ref
      student_prev = student_next
      STEPS--
      continue
    }
    else {
      // pokud se nerovnaji
      
      // porovnam ten expandovany krok jeste s predchozim (expandovanym) studentovym krokem
      // - je mozne, ze tuhle expanzi uz udelal v minulosti "pri necem jinem" -- coz neni nelegalni
      if (equal(NR_expanded, expand(student_prev))) {
        // pokud se rovnaji
        // tak ok
        // jako soucasny ref krok uvedu ten co ted mam -- takze se v dalsi iteraci pujde na dalsi
        // a studentuv ten predchozi (takze se ten studentuv soucasny bude delat znova v dalsi iteraci)
        // tenhle krok nepocitam
        lines_student.unshift(student_next_str)
        reference_prev = next_ref
        continue
      }
      else {
        // pokud se ani ted nerovnaji --> chyba!
        console.log(`Your step "${student_next_str}" is not correct.`)
        exit(1)
      }
    }
  }

  // pokud reference nasla alpha nebo beta redex:
  if (evaluator.nextReduction instanceof Alpha || evaluator.nextReduction instanceof Beta || evaluator.nextReduction instanceof Eta) {
    // stroj dela alpha conversion nebo beta reduction
    // provedu ji, expanduju
    const next_ref : AST = evaluator.perform()
    const NR_expanded : AST = expand(next_ref)

    // console.log(`Reference Expanded "${NR_expanded}"`)
    // console.log()

    // provedu nasledujici krok pro referenci
    // porovnam novy stav reference a novy krok studenta
    if (equal(NR_expanded, student_expanded)) {
      // pokud jsou stejne --> OK, jdu dal
      reference_prev = next_ref
      student_prev = student_next
      STEPS--
      continue
    }
    else {
      // pokud se lisi, muze to byt z nekolika duvodu:
      if (equal(expand(student_prev), student_expanded)) {
        // 1) student udelal zbytecnou alpha conversion nebo macro/number expansion
        // to se zjisti porovnanim studentova kroku PRED a PO
        // pokud jsou strukturalne stejny (oba po expanzi) --> udelal operaci, ktera se neposouva dopredu
        // --> tenhle krok ignoruju --> to se udela tak, ze jako momentalni studentuv krok nastavim to co teda udelal zbytecne
        // a referencni krok nezmenim
        // v pristi iteraci se znova reference posune o jeden krok dopredu (ten co uz jsem videl) a student se posune nekam, kam jsem jeste nevidel
        // tim se umozni preskocit to co udelal zbytecne
        student_prev = student_next
        continue
      }

      // rozdil mezi etou a betou (pokud jde udelat beta) nejde poznat, takze bych to tim krokem nahore pokryl
      // const optimizer : OptimizeEvaluator = new OptimizeEvaluator(reference_prev)
      // if (optimizer.nextReduction instanceof Eta) {
      //   // 2) student udelal eta redukci misto toho aby udelal beta (pokud je to ve stejnem redexu, tak cajk, jinak dela redukci kde nema)
      //   // to se da identifikovat tak, ze misto bety a alphy zkusim udelat etu
      //   // pokud to jde -> expanduju a porovnam s tim co ma student
      //   const next_ref : AST = optimizer.perform()
      //   const expanded : AST = expand(next_ref)
      //   if (equal(expanded, student_next)) {
      //     // prima!, student udelal etu, misto bety, to neni zakazane
      //     // takze tenhle krok dovolujeme
      //     // student se posouva dopredu, reference preskoci na ten krok, kterej je vysledkem ety na referenci

      //     student_prev = student_next
      //     reference_prev = next_ref
      //     continue
      //   }
        
      // }
      // else {
      //   // pokud to nejde -> chyba! (netusim proc student nema to co ja)
      //   // nejde udelat eta a student ma neco, co nedokazu identifikovat
      //   console.log(`Your step "${student_next_str}" is not correct.`)
      //   exit(1)
      // }

      // 3) student ma chybu
      // to se pozna tak, ze ani jedna z predchozich moznosti neni platna
      console.log(`Your step "${student_next_str}" is not correct.`)
      exit(1)
    }
  }
  console.error(`Failure of the testing sub-system.`)
  exit(42)
}



function expand(ast : AST) : AST {
  return new DeepExpander(ast).tree
}


function try_parse(line : string) : AST {
  try {
    return Parser.parse(tokenize(line, codestyle), macromap)
  } catch (error : any) {
    console.error(`Your step: ${line} contains syntactic errors. The following message might help you to figure it out. You might also want to use Lambdulus to check your solution.`)
    console.error(error.toString())
    exit(2)
  }
}


function print(ast : AST) : string {
  const printer : BasicPrinter = new BasicPrinter(ast)
  return printer.print()
}


function next(student_steps : string[]) : string {
  const next : string | undefined = student_steps.shift()

  if (next) {
    // TODO: try catch
    return next
  }

  console.log(`You are missing some step(s).`)
  exit(4)
}


function equal(one : AST, other : AST) : boolean {
  const comparator : TreeComparator = new TreeComparator([one, other], [macromap, macromap])

  return comparator.equals
}


function new_evaluator(ast : AST) : Evaluator {
  if (STRATEGY === "normal") {
    return new NormalEvaluator(ast)
  }
  else {
    return new ApplicativeEvaluator(ast)
  }
}