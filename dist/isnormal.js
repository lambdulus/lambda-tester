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
const Parser = __importStar(require("./parser"));
const lexer_1 = require("./lexer");
const basicprinter_1 = require("./visitors/basicprinter");
const macromap = {};
const codestyle = {
    singleLetterVars: false,
    lambdaLetters: ['λ', '\\'],
    macromap,
};
const student_file = process_1.argv[2];
const consider_eta = process_1.argv[3] === "-eta";
const student_expr = (0, fs_1.readFileSync)(student_file).toString();
var student_ast = null; // stupid hack for stupid error handling in JS
try {
    student_ast = Parser.parse((0, lexer_1.tokenize)(student_expr, codestyle), macromap);
}
catch (error) {
    console.error("Your solution contains syntactic errors. The following message might help you to figure it out. You might also want to use Lambdulus to check your solution.");
    console.error(error.toString());
    (0, process_1.exit)(2);
}
// FIRST TRY TO EVALUATE THE STUDENT'S
const evaluator = new evaluators_1.NormalEvaluator(student_ast);
if (evaluator.nextReduction instanceof reductions_1.None) {
    if (consider_eta) {
        const optimizer = new evaluators_1.OptimizeEvaluator(student_ast);
        if (optimizer.nextReduction instanceof reductions_1.None) {
            (0, process_1.exit)(0);
        }
        else {
            (0, process_1.exit)(1);
        }
    }
    else {
        (0, process_1.exit)(0);
    }
}
(0, process_1.exit)(1);
function printTree(tree) {
    const printer = new basicprinter_1.BasicPrinter(tree);
    return printer.print();
}
exports.printTree = printTree;
