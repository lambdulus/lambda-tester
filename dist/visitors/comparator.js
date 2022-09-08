"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeComparator = void 0;
const index_1 = require("../index");
class TreeComparator {
    constructor(roots, macrotables) {
        this.roots = roots;
        this.macrotables = macrotables;
        this.translator = new Map();
        this.equals = true;
        this.message = "";
        this.context = roots;
        this.compare();
    }
    compare() {
        const [left, right] = this.context;
        if (left instanceof index_1.Lambda && right instanceof index_1.Lambda) {
            const backup = new Map(this.translator.entries());
            this.translator.set(left.argument.name(), right.argument.name());
            this.context = [left.right, right.right];
            this.compare();
            this.translator = backup;
        }
        else if (left instanceof index_1.Application && right instanceof index_1.Application) {
            this.context = [left.left, right.left];
            this.compare();
            if (!this.equals) {
                return;
            }
            this.context = [left.right, right.right];
            this.compare();
        }
        else if (left instanceof index_1.Macro && right instanceof index_1.Macro) {
            // if (this.macrotables[0][left.name()] === this.macrotables[1][right.name()]) {
            //   this.equals = true
            //   return
            // }
            this.equals = left.name() === right.name();
            this.message = `${left} is not the same as ${right}`;
        }
        else if (left instanceof index_1.ChurchNumeral && right instanceof index_1.ChurchNumeral) {
            this.equals = left.name() === right.name();
            this.message = `${left} is not the same as ${right}`;
        }
        else if (left instanceof index_1.Variable && right instanceof index_1.Variable) {
            if (this.translator.has(left.name())) {
                this.equals = this.translator.get(left.name()) === right.name();
                this.message = `${left} is not the same as ${right}`;
            }
            else {
                this.equals = left.name() === right.name();
                this.message = `${left} is not the same as ${right}`;
            }
        }
        else {
            this.message = `${left} is not the same as ${right}`;
            this.equals = false;
        }
    }
}
exports.TreeComparator = TreeComparator;
