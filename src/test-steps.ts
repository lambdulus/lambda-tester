// import readline from 'readline'
import { readFileSync } from 'fs'
import { argv, exit } from 'process'

import { None } from './reductions'
import { NormalEvaluator, NormalAbstractionEvaluator, Evaluator } from './evaluators'
import { AST, Macro, Application } from './ast'
import * as Parser from './parser'
import { CodeStyle, Token, tokenize } from './lexer'
import { BasicPrinter } from './visitors/basicprinter'
import { TreeComparator } from './visitors/comparator'




const macromap : Parser.MacroMap = { }

const codestyle : CodeStyle = {
  singleLetterVars : false,
  lambdaLetters : [ 'λ', '\\' ],
  macromap,
}


const binary = argv[0]
const student_file = argv[1]
const ref_file = argv[2]
const args = argv.slice(3)


const student_expr = readFileSync(student_file).toString()
const ref_expr = readFileSync(ref_file).toString()


// v prvni rade je potreba nadelat ze studentova souboru radky
// skipnout pripadny prazdny radky

// precist prvni radek referenec - to je jediny

// naparsovat prvni radek reference E0
// naparsovat prvni radek studenta S0
// plne expandovat oba dva
// porovnat
// pokud se lisi - error out --> vypsat chybu na error vystup
// pokud se nelisi - pokracuju


// ted se vleze do cyklu

// identifikuju nasledujici krok pro referenci
// pokud reference nema zadny dalsi krok (ale student ma, jinak by se nedelala iterace)
// tak jeste zkusim najit eta redukci
// pokud najdu --> provedu a porovnam

// pokud reference nasla alpha nebo beta redex:

// provedu nasledujici krok pro referenci
// porovnam novy stav reference a novy krok studenta
// pokud jsou stejne --> OK, jdu dal

// pokud se lisi, muze to byt z nekolika duvodu:
// 1) student udelal zbytecnou alpha conversion nebo macro/number expansion
// to se zjisti porovnanim studentova kroku PRED a PO
// pokud jsou strukturalne stejny (oba po expanzi) --> udelal operaci, ktera se neposouva dopredu
// --> tenhle krok ignoruju --> to se udela tak, ze jako momentalni studentuv krok nastavim to co teda udelal zbytecne
// a referencni krok nezmenim
// v pristi iteraci se znova reference posune o jeden krok dopredu (ten co uz jsem videl) a student se posune nekam, kam jsem jeste nevidel
// tim se umozni preskocit to co udelal zbytecne

// 2) student udelal eta redukci misto toho aby udelal beta (pokud je to ve stejnem redexu, tak cajk, jinak dela redukci kde nema)
// to se da identifikovat tak, ze porovnam puvodni krok reference

// 3) student ma chybu
// to se pozna tak, ze ani jedna z predchozich moznosti neni platna