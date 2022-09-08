import { AST, MacroMap } from "../index";
declare type Pair<T> = [T, T];
export declare class TreeComparator {
    readonly roots: Pair<AST>;
    readonly macrotables: Pair<MacroMap>;
    private translator;
    equals: boolean;
    private context;
    message: string;
    constructor(roots: Pair<AST>, macrotables: Pair<MacroMap>);
    compare(): void;
}
export {};
