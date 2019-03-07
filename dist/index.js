"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lexer_1 = __importDefault(require("./lexer"));
const parser_1 = __importDefault(require("./parser"));
const visitors_1 = require("./visitors");
const basicprinter_1 = require("./visitors/basicprinter");
const normalevaluator_1 = require("./visitors/normalevaluator");
const reducer_1 = require("./visitors/reducer");
var lexer_2 = require("./lexer");
exports.Token = lexer_2.Token;
exports.tokenize = lexer_2.tokenize;
exports.Lexer = lexer_2.default;
var parser_2 = require("./parser");
exports.parse = parser_2.parse;
exports.Parser = parser_2.default;
const inputs = [
    '(Y (λ f n . (<= n 1) 1 (* n (f (- n 1))) ) 6)',
    '(~ x y z . x y z) y z x',
    '1 a',
    '^ 4 4',
    '(~ x y z . x y z) 1 2 3',
    '(\\ x y z . x y z)',
    '(λ x . x x) A',
    '(λ x . x x)',
    '2 s z',
    '+ (* 4 5) D',
    'Y (λ f n . (< n 2) 1 (* n (f (- n 1))) ) 3',
    '(λ a b c d . - a b) 11 6 7 8',
    '+ (+ A B) C',
    '(λ ab . + ab)',
    'A (B +) C',
    '(+ A B)',
    '+ 555 6',
    '(λ _x . x x)',
];
console.log(inputs[0]);
const tokens = lexer_1.default.tokenize(inputs[0], {
    singleLetterVars: false,
    lambdaLetters: ['λ', '\\', '~'],
});
const ast = parser_1.default.parse(tokens);
let root = ast;
let e = 0;
while (true) {
    // console.log('E ==== ', e)
    const normal = new normalevaluator_1.NormalEvaluator(root);
    if (normal.nextReduction instanceof visitors_1.NextNone) {
        break;
    }
    // console.log('REDUCTION TYPE ', normal.nextReduction)
    const nextReduction = normal.nextReduction;
    const reducer = new reducer_1.Reducer(root, nextReduction);
    root = reducer.tree;
    e++;
    // const printer : BasicPrinter = new BasicPrinter(root)
    // const s = printer.print()
    // console.log(s)
}
console.log('steps: ' + e);
const printer = new basicprinter_1.BasicPrinter(root);
const s = printer.print();
console.log(s);
