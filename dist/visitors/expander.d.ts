import { AST, Application, Lambda, ChurchNumeral, Macro, Variable } from "../ast";
import { ASTVisitor } from ".";
export declare class MacroExpander extends ASTVisitor {
    tree: AST;
    private expression;
    constructor(tree: AST);
    print(): string;
    onApplication(application: Application): void;
    onChurchNumeralBody(n: number): AST;
    onChurchNumeralHeader(tree: AST): AST;
    onChurchNumeral(churchNumeral: ChurchNumeral): void;
    onLambda(lambda: Lambda): void;
    onMacro(macro: Macro): void;
    onVariable(variable: Variable): void;
}
