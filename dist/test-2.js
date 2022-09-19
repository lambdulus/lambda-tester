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
exports.printTree = void 0;
const fs_1 = require("fs");
const process_1 = require("process");
const reductions_1 = require("./reductions");
const evaluators_1 = require("./evaluators");
const ast_1 = require("./ast");
const Parser = __importStar(require("./parser"));
const lexer_1 = require("./lexer");
const basicprinter_1 = require("./visitors/basicprinter");
const comparator_1 = require("./visitors/comparator");
const macromap = {};
const codestyle = {
    singleLetterVars: false,
    lambdaLetters: ['λ', '\\'],
    macromap,
};
const student_file = process_1.argv[2];
const ref_file = process_1.argv[3];
const [recursive, args] = process_1.argv[4] === "-rec" ? [true, process_1.argv.slice(5)] : [false, process_1.argv.slice(4)];
const student_expr = (0, fs_1.readFileSync)(student_file).toString();
const ref_expr = (0, fs_1.readFileSync)(ref_file).toString();
const y_comb = "Y";
const y_ast = Parser.parse((0, lexer_1.tokenize)(y_comb, codestyle), macromap);
var student_ast = null; // stupid hack for stupid error handling in JS
try {
    student_ast = Parser.parse((0, lexer_1.tokenize)(student_expr, codestyle), macromap);
}
catch (error) {
    console.error("Your solution contains syntactic errors. The following message might help you to figure it out. You might also want to use Lambdulus to check your solution.");
    console.error(error.toString());
    (0, process_1.exit)(2);
}
const ref_ast = Parser.parse((0, lexer_1.tokenize)(ref_expr, codestyle), macromap); // I do not expect reference file to fail to parse
const args_ast = args.map(expr => {
    const tokens = (0, lexer_1.tokenize)(expr, codestyle);
    const ast = Parser.parse(tokens, macromap); // I also do not expect the arguments from the cmd line to fail to parse
    return ast;
});
// NOW WE MOVE ON TO BUILDING AN APPLICATION
const student_app_arr = recursive ? [y_ast, student_ast, ...args_ast] : [student_ast, ...args_ast];
const [student_head, ...student_tail] = student_app_arr;
const student_app = student_tail.reduce((lambda, arg) => new ast_1.Application(lambda, arg), student_head);
const ref_app_arr = recursive ? [y_ast, ref_ast, ...args_ast] : [ref_ast, ...args_ast];
const [ref_head, ...ref_tail] = ref_app_arr;
const ref_app = ref_tail.reduce((lambda, arg) => new ast_1.Application(lambda, arg), ref_head);
// console.log(printTree(student_app))
// console.log("___")
// console.log(printTree(ref_app))
// NOW WE CAN EVALUATE BOTH EXPRESSIONS
// FIRST EVALUATE THE REFERENCE
let ref_root = ref_app;
let ref_steps = 0;
while (true) {
    const evaluator = new evaluators_1.NormalEvaluator(ref_root);
    if (evaluator.nextReduction instanceof reductions_1.None) {
        break;
    }
    ref_root = evaluator.perform();
    ref_steps++;
}
// THEN EVALUATE STUDENT'S
let student_root = student_app;
let student_steps = 0;
while (true) {
    const evaluator = new evaluators_1.NormalEvaluator(student_root);
    if (evaluator.nextReduction instanceof reductions_1.None) {
        break;
    }
    student_root = evaluator.perform(); // perform next reduction
    student_steps++;
}
// NOW I COMPARE BOTH RESULTS
const comparator = new comparator_1.TreeComparator([ref_root, student_root], [macromap, macromap]);
if (comparator.equals) {
    // everything is OK
    if (student_steps > 2 * ref_steps) {
        console.log("Your solution takes at least two times as many steps to evaluate! You might want to think about why that might be.");
    }
    (0, process_1.exit)(0);
}
else {
    // the results do not match!
    console.log("Your solution does not pass the test.");
    console.log(`reference: ${printTree(ref_root)}`);
    console.log(`student: ${printTree(student_root)}`);
    (0, process_1.exit)(1);
}
function printTree(tree) {
    const printer = new basicprinter_1.BasicPrinter(tree);
    return printer.print();
}
exports.printTree = printTree;
