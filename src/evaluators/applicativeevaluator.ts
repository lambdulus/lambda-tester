import { ASTVisitor } from "../visitors"
import { FreeVarsFinder } from "../visitors/freevarsfinder"
import { Binary, AST, Child, Application, Lambda, ChurchNumeral, Macro, Variable } from "../ast"
import { BoundingFinder } from "../visitors/boundingfinder"
import { constructFor, Reducer } from "../reducers"
import { ASTReduction, Beta, Alpha, Expansion, None, Eta } from "../reductions"
import { OptimizeEvaluator } from "./optimizeevaluator"


export class ApplicativeEvaluator extends ASTVisitor {
  private parent : Binary | null = null
  private child : Child | null = null

  public nextReduction : ASTReduction = new None
  public reducer : Reducer

  constructor (
    public readonly tree : AST
  ) {
    super()
    this.nextReduction = new None
    this.tree.visit(this)

    // if (this.nextReduction instanceof None) {
    //   const normal : OptimizeEvaluator = new OptimizeEvaluator(tree)

    //   this.nextReduction = normal.nextReduction
    //   this.reducer = constructFor(tree, this.nextReduction)
    // }
    // else {
    //   this.reducer = constructFor(tree, this.nextReduction)
    // }

    this.reducer = constructFor(tree, this.nextReduction)
  }

  onApplication (application : Application) : void {
    if (application.left instanceof Lambda) {
      const parent : Binary | null = this.parent
      const child : Child | null = this.child

      // first reduce argument
      this.parent = application
      this.child = Child.Right
      application.right.visit(this)

      if (this.nextReduction instanceof None || this.nextReduction instanceof Eta) {
        // argument is in normal form
        const freeVarsFinder : FreeVarsFinder = new FreeVarsFinder(application.right)
        const freeVars : Set<string> = freeVarsFinder.freeVars

        const boundingfinder : BoundingFinder = new BoundingFinder(application.left, freeVars)
        const lambdas : Set<Lambda> = boundingfinder.lambdas

        if (lambdas.size) {
          this.nextReduction = new Alpha(lambdas)
        }
        else {
          this.nextReduction = new Beta(application, parent, child, application.left.body, application.left.argument.name(), application.right)
        }
      }
    }

    else if (application.left instanceof Application) {
      this.parent = application
      this.child = Child.Left

      application.left.visit(this)

      if (this.nextReduction instanceof None) {
        this.parent = application
        this.child = Child.Right

        application.right.visit(this)
      }
    }

    // (application.left instanceof Macro || application.left instanceof ChurchNumeral || application.left instanceof Variable)
    else {
      this.parent = application
      this.child = Child.Right

      application.right.visit(this)

      if (this.nextReduction instanceof None || this.nextReduction instanceof Eta) {
        this.parent = application
        this.child = Child.Left

        application.left.visit(this)
      }
    }
  }
  
  onLambda (lambda : Lambda) : void {
    if (lambda.right instanceof Application
        &&
        lambda.right.right instanceof Variable
        &&
        lambda.right.right.name() === lambda.left.name()
    ) {
      const freeVarsFinder : FreeVarsFinder = new FreeVarsFinder(lambda.right.left)
      const freeVars : Set<string> = freeVarsFinder.freeVars
      
      if ( ! freeVars.has(lambda.left.name())) {
        this.nextReduction = new Eta(this.parent, this.child, lambda.right.left)
      }
    }

    this.parent = lambda
    this.child = Child.Right

    lambda.body.visit(this)
  }

  onChurchNumeral (churchNumeral : ChurchNumeral) : void {
    this.nextReduction = new Expansion(this.parent, this.child, churchNumeral)
  }

  onMacro (macro : Macro) : void {
    this.nextReduction = new Expansion(this.parent, this.child, macro)
  }

  onVariable (variable : Variable) : void {
    // this.nextReduction = new None
  }

  perform () : AST {
    this.reducer.perform()
    return this.reducer.tree
  }
}