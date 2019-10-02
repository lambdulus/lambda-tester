"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const counter_1 = require("./counter");
const _1 = require("./");
const errors_1 = require("./errors");
class Lexer {
    constructor(source, config) {
        this.source = source;
        this.config = config;
        this.position = new counter_1.Counter;
        this.tokens = [];
    }
    top() {
        return this.source[this.position.position];
    }
    pop() {
        const current = this.top();
        if (current === '\n') {
            this.position.newLine();
        }
        else {
            this.position.nextChar();
        }
        return current;
    }
    isWhiteSpace(char) {
        return char.trim() !== char;
    }
    isNumeric(char) {
        return char >= '0' && char <= '9';
    }
    isAlphabetic(char) {
        return (char >= 'a' && char <= 'z'
            ||
                char >= 'A' && char <= 'Z');
    }
    getCharToken(kind) {
        const position = this.position.toRecord();
        const char = this.pop();
        return new _1.Token(kind, char, position);
    }
    readLeftParen() {
        const paren = this.getCharToken(_1.TokenType.LeftParen);
        this.tokens.push(paren);
    }
    readRightParen() {
        const paren = this.getCharToken(_1.TokenType.RightParen);
        this.tokens.push(paren);
    }
    readRightBracket() {
        const bracket = this.getCharToken(_1.TokenType.RightBracket);
        this.tokens.push(bracket);
    }
    readDot() {
        const dot = this.getCharToken(_1.TokenType.Dot);
        this.tokens.push(dot);
    }
    readLambda() {
        const lambda = this.getCharToken(_1.TokenType.Lambda);
        this.tokens.push(lambda);
    }
    readIdentifier() {
        let id = '';
        let topPosition = this.position.toRecord();
        if (this.config.singleLetterVars) {
            while (this.isAlphabetic(this.top())) {
                id = this.pop();
                if (this.isNumeric(this.top())) {
                    id += this.pop();
                }
                const identifier = new _1.Token(_1.TokenType.Identifier, id, topPosition);
                this.tokens.push(identifier);
            }
            if (this.isNumeric(this.top())) {
                throw new _1.InvalidIdentifier(`${id}`, topPosition);
            }
            return;
        }
        // alphabetic part
        while (this.isAlphabetic(this.top())) {
            id += this.pop();
        }
        // optional numeric part
        while (this.isNumeric(this.top())) {
            id += this.pop();
        }
        if (this.isAlphabetic(this.top())) {
            throw new _1.InvalidIdentifier(`${id}`, topPosition);
        }
        const identifier = new _1.Token(_1.TokenType.Identifier, id, topPosition);
        this.tokens.push(identifier);
    }
    readNumber() {
        let n = 0;
        let topPosition = this.position.toRecord();
        while (this.isNumeric(this.top())) {
            n = n * 10 + Number(this.pop());
        }
        if (this.isAlphabetic(this.top())) {
            throw new _1.InvalidNumber(`${n}${this.top()}`, topPosition);
        }
        const number = new _1.Token(_1.TokenType.Number, n, topPosition);
        this.tokens.push(number);
    }
    mayBeLambda(char) {
        return this.config.lambdaLetters.indexOf(char) !== -1;
    }
    mayBeIdentifier(char) {
        return this.isAlphabetic(char);
    }
    mayBeNumber(char) {
        return this.isNumeric(char);
    }
    tokenize() {
        while (this.position.position < this.source.length) {
            switch (this.top()) {
                case '(':
                    this.readLeftParen();
                    break;
                case ')':
                    this.readRightParen();
                    break;
                case ']':
                    this.readRightBracket();
                    break;
                case '.':
                    this.readDot();
                    break;
                case '+':
                case '-':
                case '*':
                case '/':
                case '=':
                case '^': {
                    const operator = this.pop();
                    const topPosition = this.position.toRecord();
                    this.tokens.push(new _1.Token(_1.TokenType.Operator, operator, topPosition));
                    break;
                }
                case '<':
                case '>': {
                    let operator = this.pop();
                    const topPosition = this.position.toRecord();
                    if (this.top() === '=') {
                        operator += this.pop();
                    }
                    this.tokens.push(new _1.Token(_1.TokenType.Operator, operator, topPosition));
                    break;
                }
                case '\'': {
                    const operator = this.pop();
                    const topPosition = this.position.toRecord();
                    this.tokens.push(new _1.Token(_1.TokenType.Quote, operator, topPosition));
                    break;
                }
                default:
                    if (this.mayBeNumber(this.top()))
                        this.readNumber();
                    else if (this.mayBeIdentifier(this.top()))
                        this.readIdentifier();
                    else if (this.mayBeLambda(this.top()))
                        this.readLambda();
                    else if (this.isWhiteSpace(this.top()))
                        this.pop();
                    else {
                        throw new errors_1.InvalidCharacter(`${this.top()}`, this.position.toRecord());
                    }
            }
        }
        return this.tokens;
    }
}
function tokenize(input, config) {
    const lexer = new Lexer(input + ' ', config);
    return lexer.tokenize();
}
exports.tokenize = tokenize;
