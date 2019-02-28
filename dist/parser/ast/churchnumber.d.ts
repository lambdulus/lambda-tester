import { Token } from '../../lexer';
import { AST, ReductionResult, Expandable } from '../parser';
export declare class ChurchNumber implements AST, Expandable {
    readonly token: Token;
    name(): string;
    constructor(token: Token);
    clone(): ChurchNumber;
    reduceNormal(): ReductionResult;
    expand(): AST;
    reduceApplicative(): ReductionResult;
    alphaConvert(oldName: string, newName: string): AST;
    betaReduce(argName: string, value: AST): AST;
    etaConvert(): AST;
    print(): string;
    freeVarName(bound: Array<string>): string | null;
}
