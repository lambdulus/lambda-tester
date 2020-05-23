"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var lexer_1 = require("./lexer");
exports.Token = lexer_1.Token;
exports.TokenType = lexer_1.TokenType;
exports.tokenize = lexer_1.tokenize;
var parser_1 = require("./parser");
exports.MacroDef = parser_1.MacroDef;
exports.parse = parser_1.parse;
exports.builtinMacros = parser_1.builtinMacros;
var ast_1 = require("./ast");
exports.AST = ast_1.AST;
exports.Application = ast_1.Application;
exports.Lambda = ast_1.Lambda;
exports.ChurchNumeral = ast_1.ChurchNumeral;
exports.Macro = ast_1.Macro;
exports.Variable = ast_1.Variable;
var reductions_1 = require("./reductions");
exports.ASTReductionType = reductions_1.ASTReductionType;
exports.Alpha = reductions_1.Alpha;
exports.Beta = reductions_1.Beta;
exports.Expansion = reductions_1.Expansion;
exports.None = reductions_1.None;
exports.Gama = reductions_1.Gama;
exports.Eta = reductions_1.Eta;
var reducers_1 = require("./reducers");
exports.AlphaConverter = reducers_1.AlphaConverter;
exports.BetaReducer = reducers_1.BetaReducer;
exports.Expander = reducers_1.Expander;
exports.EtaConverter = reducers_1.EtaConverter;
exports.EmptyReducer = reducers_1.EmptyReducer;
exports.constructFor = reducers_1.constructFor;
var evaluators_1 = require("./evaluators");
exports.NormalEvaluator = evaluators_1.NormalEvaluator;
exports.ApplicativeEvaluator = evaluators_1.ApplicativeEvaluator;
exports.OptimizeEvaluator = evaluators_1.OptimizeEvaluator;
exports.NormalAbstractionEvaluator = evaluators_1.NormalAbstractionEvaluator;
// TODO: tohle pujde do svejch ruznejch souboru
var visitors_1 = require("./visitors");
exports.ASTVisitor = visitors_1.ASTVisitor;
var basicprinter_1 = require("./visitors/basicprinter");
exports.BasicPrinter = basicprinter_1.BasicPrinter;
var boundingfinder_1 = require("./visitors/boundingfinder");
exports.BoundingFinder = boundingfinder_1.BoundingFinder;
var freevarsfinder_1 = require("./visitors/freevarsfinder");
exports.FreeVarsFinder = freevarsfinder_1.FreeVarsFinder;
var usedvarnamesfinder_1 = require("./visitors/usedvarnamesfinder");
exports.UsedVarNamesFinder = usedvarnamesfinder_1.UsedVarNamesFinder;
var varbindfinder_1 = require("./visitors/varbindfinder"); // TODO: tohle asi neni potreba
exports.VarBindFinder = varbindfinder_1.VarBindFinder;
var decoder_1 = require("./decoder");
exports.decodeSafe = decoder_1.decodeSafe;
exports.decodeFast = decoder_1.decodeFast;
