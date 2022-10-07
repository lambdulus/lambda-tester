"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
// import readline from 'readline'
const fs_1 = require("fs");
const process_1 = require("process");
const reductions_1 = require("./reductions");
const evaluators_1 = require("./evaluators");
const Parser = __importStar(require("./parser"));
const lexer_1 = require("./lexer");
const basicprinter_1 = require("./visitors/basicprinter");
const comparator_1 = require("./visitors/comparator");
const expander_1 = require("./visitors/expander");
const macromap = {};
const codestyle = {
    singleLetterVars: false,
    lambdaLetters: ['λ', '\\'],
    macromap,
};
const student_file = process_1.argv[2];
const ref_file = process_1.argv[3];
let STEPS = Number(process_1.argv[4]);
const STRATEGY = process_1.argv[5];
const student_steps = (0, fs_1.readFileSync)(student_file).toString();
const ref_expr = (0, fs_1.readFileSync)(ref_file).toString();
// v prvni rade je potreba nadelat ze studentova souboru radky
const lines_student_ = student_steps.split('\n');
// skipnout pripadny prazdny radky
const lines_student = lines_student_
    .filter(str => str.length)
    .filter(str => {
    const m = str.match(/\s*/g);
    if (m) {
        return m[0] !== str;
    }
    else {
        return true;
    }
});
// naparsovat prvni radek reference E0
const E0 = Parser.parse((0, lexer_1.tokenize)(ref_expr, codestyle), macromap);
// zkontrolovat, ze studentovo reseni obsahuje alespon prvni krok
if (lines_student.length === 0) {
    // tohle je exit /= 0 a vypsat na error out
    console.error(`Your file does not contain any steps!`);
    (0, process_1.exit)(1);
}
// naparsovat prvni radek studenta S0
const line0 = lines_student.shift();
const S0 = try_parse(line0);
// plne expandovat oba dva
const S0_expanded = expand(S0);
const E0_expanded = expand(E0);
// porovnat
if (!equal(E0_expanded, S0_expanded)) {
    // pokud se lisi - error out --> vypsat chybu na error vystup
    console.error(`Your first step is not equivalent to the assignment!`);
    console.error(`Here is your first step: ${print(S0)}`);
    console.error(`Here is the assignment:  ${print(E0)}`);
    (0, process_1.exit)(3);
}
// pokud se nelisi - pokracuju
let reference_prev = E0;
let student_prev = S0;
// ted se vleze do cyklu
while (STEPS) {
    // identifikuju nasledujici krok pro referenci
    const evaluator = new_evaluator(reference_prev.clone());
    if (lines_student.length === 0) {
        // student skoncil, ale je treba se ujistit, ze reference ma taky None, nebo Etu - tu nebereme nutne jako nutnou udelat
        if (evaluator.nextReduction instanceof reductions_1.None) {
            // pokud jo --> OK, skoncime
            (0, process_1.exit)(0);
        }
        else if (evaluator.nextReduction instanceof reductions_1.Eta) {
            // student uz nema kroky, ale evaluator jeste ma
            console.log(`Your solution ends too soon. The expression is not in the Normal Form yet. Hint: Maybe you need to do eta reduction?`);
            (0, process_1.exit)(1);
        }
        else {
            // student uz nema kroky, ale evaluator jeste ma
            console.log(`Your solution ends too soon. The expression is not in the Normal Form yet.`);
            (0, process_1.exit)(1);
        }
    }
    // ted uz to udelat muzu
    const student_next_str = next(lines_student);
    const student_next = try_parse(student_next_str);
    const student_expanded = expand(student_next);
    // pokud reference nema zadny dalsi krok, ale student ma
    if (evaluator.nextReduction instanceof reductions_1.None) {
        // tak jenom pro jistotu zkontroluju, ze to neni jenom alpha conversion
        // pokud ano, posunu se dal, pro pripad, ze by jich tady bylo vic
        if (equal(expand(student_prev), student_expanded)) {
            student_prev = student_next.clone();
            continue;
        }
        // nebo jeste zkusim najit eta redukci
        const optimizer = new evaluators_1.OptimizeEvaluator(reference_prev.clone());
        if (optimizer.nextReduction instanceof reductions_1.Eta) {
            // pokud najdu --> provedu, expanduju a porovnam
            const optimized = optimizer.perform();
            const expanded = expand(optimized);
            if (equal(expanded, student_expanded)) {
                // to co student udela byla Eta
                // ta se NEpocita jako krok -> takze zadny STEPS--
                reference_prev = optimized.clone();
                student_prev = student_next.clone();
                continue;
            }
            else {
                // nesouhlasi, urcite to neni jenom alfa (to uz jsem kontroloval)
                // ja jsem udelal etu a student udelal neco, co neni eta tam kde bych ji udelal ja
                // dam chybu
                console.log(`Your step "${student_next_str}" is not correct. Hint: Check the previous step and see if it is in the Normal Form already.`);
                (0, process_1.exit)(1);
            }
        }
        // v tenhle moment, ja uz nemam co delat, nejde udelat ani Etu, ale student porad ma nejaky krok, ktery neni jenom alpha
        // to je jeho chyba!
        console.log(`Your solution contains some step(s) even after the evaluation reaches the Normal Form. It starts with the step "${student_next_str}".`);
        (0, process_1.exit)(1);
    }
    // pokud reference nasla expanzi
    if (evaluator.nextReduction instanceof reductions_1.Expansion) {
        // provedu ji, plne expanduju a porovnam s dalsim studentovym krokem
        const next_ref = evaluator.perform();
        const NR_expanded = expand(next_ref);
        if (equal(NR_expanded, student_expanded)) {
            // pokud se rovnaji
            // ok
            reference_prev = next_ref.clone();
            student_prev = student_next.clone();
            STEPS--;
            continue;
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
                lines_student.unshift(student_next_str);
                reference_prev = next_ref.clone();
                continue;
            }
            else {
                // pokud se ani ted nerovnaji --> chyba!
                console.log(`Your step "${student_next_str}" is not correct.`);
                (0, process_1.exit)(1);
            }
        }
    }
    // pokud reference nasla alpha nebo beta nebo eta redex:
    if (evaluator.nextReduction instanceof reductions_1.Alpha || evaluator.nextReduction instanceof reductions_1.Beta || evaluator.nextReduction instanceof reductions_1.Eta) {
        // stroj dela alpha conversion nebo beta nebo eta reduction
        // provedu ji, expanduju
        const next_ref = evaluator.perform();
        const NR_expanded = expand(next_ref);
        // console.log(`Reference Expanded "${NR_expanded}"`)
        // console.log()
        // provedu nasledujici krok pro referenci
        // porovnam novy stav reference a novy krok studenta
        if (equal(NR_expanded, student_expanded)) {
            // pokud jsou stejne --> OK, jdu dal
            reference_prev = next_ref.clone();
            student_prev = student_next.clone();
            STEPS--;
            continue;
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
                student_prev = student_next.clone();
                continue;
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
            console.log(`Your step "${student_next_str}" is not correct.`);
            (0, process_1.exit)(1);
        }
    }
    console.error(`Failure of the testing sub-system.`);
    (0, process_1.exit)(42);
}
function expand(ast) {
    return new expander_1.DeepExpander(ast).tree;
}
function try_parse(line) {
    try {
        return Parser.parse((0, lexer_1.tokenize)(line, codestyle), macromap);
    }
    catch (error) {
        console.error(`Your step: ${line} contains syntactic errors. The following message might help you to figure it out. You might also want to use Lambdulus to check your solution.`);
        console.error(error.toString());
        (0, process_1.exit)(2);
    }
}
function print(ast) {
    const printer = new basicprinter_1.BasicPrinter(ast);
    return printer.print();
}
function next(student_steps) {
    const next = student_steps.shift();
    if (next) {
        // TODO: try catch
        return next;
    }
    console.log(`You are missing some step(s).`);
    (0, process_1.exit)(4);
}
function equal(one, other) {
    const comparator = new comparator_1.TreeComparator([one, other], [macromap, macromap]);
    return comparator.equals;
}
function new_evaluator(ast) {
    if (STRATEGY === "normal") {
        return new evaluators_1.NormalEvaluator(ast);
    }
    else {
        return new evaluators_1.ApplicativeEvaluator(ast);
    }
}
