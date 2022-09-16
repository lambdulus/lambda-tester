"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeepExpander = void 0;
const ast_1 = require("../ast");
const _1 = require(".");
const lexer_1 = require("../lexer");
const parser_1 = require("../parser/parser");
// the goal is to transform the tree in such a way, that all numerals and macros are fully expanded
class DeepExpander extends _1.ASTVisitor {
    constructor(tree) {
        super();
        this.tree = tree;
        this.tree.visit(this);
    }
    onApplication(application) {
        const left = application.left;
        const right = application.right;
        left.visit(this);
        const expanded_left = this.tree;
        right.visit(this);
        const expanded_right = this.tree;
        this.tree = new ast_1.Application(expanded_left, expanded_right);
    }
    onChurchNumeralBody(n) {
        if (n === 0) {
            return new ast_1.Variable(new lexer_1.Token(lexer_1.TokenType.Identifier, 'z', lexer_1.BLANK_POSITION));
        }
        const left = new ast_1.Variable(new lexer_1.Token(lexer_1.TokenType.Identifier, 's', lexer_1.BLANK_POSITION));
        const right = this.onChurchNumeralBody(n - 1);
        return new ast_1.Application(left, right);
    }
    // TODO: creating dummy token, there should be something like NoPosition
    onChurchNumeralHeader(tree) {
        const s = new ast_1.Variable(new lexer_1.Token(lexer_1.TokenType.Identifier, 's', lexer_1.BLANK_POSITION));
        const z = new ast_1.Variable(new lexer_1.Token(lexer_1.TokenType.Identifier, 'z', lexer_1.BLANK_POSITION));
        const body = new ast_1.Lambda(z, tree);
        return new ast_1.Lambda(s, body);
    }
    onChurchNumeral(churchNumeral) {
        const value = churchNumeral.token.value;
        const churchLambda = this.onChurchNumeralHeader(this.onChurchNumeralBody(value));
        this.tree = churchLambda;
    }
    onLambda(lambda) {
        const param = lambda.argument;
        const body = lambda.body;
        body.visit(this);
        const expanded_body = this.tree;
        const expanded = new ast_1.Lambda(param, expanded_body);
        this.tree = expanded;
    }
    onMacro(macro) {
        const value = macro.token.value;
        const definition = macro.macroTable[value];
        const parser = new parser_1.Parser((0, lexer_1.tokenize)(definition, { lambdaLetters: ['\\', 'λ'], singleLetterVars: false, macromap: macro.macroTable }), macro.macroTable);
        const expression = parser.parse(null);
        expression.visit(this); // this assigns the expanded expression into the `this.tree`
    }
    onVariable(variable) {
        this.tree = variable;
    }
}
exports.DeepExpander = DeepExpander;
