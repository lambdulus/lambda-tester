import { AST, Lambda, Application, Macro, ChurchNumeral, Variable, MacroMap } from "../index"



type Pair<T> = [T, T]

export class TreeComparator {
  private translator : Map<string, string> = new Map()
  public equals : boolean = true
  private context : Pair<AST>

  constructor (readonly roots : Pair<AST>, readonly macrotables : Pair<MacroMap>) {
    this.context = roots

    this.compare()
  }

  compare () : void {    
    const [ left, right ] : Pair<AST> = this.context

    if (left instanceof Lambda && right instanceof Lambda) {
      const backup : Map<string, string> = new Map(this.translator.entries())

      this.translator.set(left.argument.name(), right.argument.name())
      this.context = [ left.body, right.body ]
      this.compare()

      this.translator = backup
    }
    else if (left instanceof Application && right instanceof Application) {
      this.context = [ left.left, right.left ]
      this.compare()

      if ( ! this.equals) {
        return
      }

      this.context = [ left.right, right.right ]
      this.compare()
    }
    else if (left instanceof Macro && right instanceof Macro) {
      // if (this.macrotables[0][left.name()] === this.macrotables[1][right.name()]) {
      //   this.equals = true
      //   return
      // }
      this.equals = left.name() === right.name()
    }
    else if (left instanceof ChurchNumeral && right instanceof ChurchNumeral) {
      this.equals = left.name() === right.name()
    }
    else if (left instanceof Variable && right instanceof Variable) {      
      if (this.translator.has(left.name())) {
        this.equals = this.translator.get(left.name()) === right.name()
      }
      else {
        this.equals = left.name() === right.name()
      }
    }
    else {
      this.equals = false
    }
  }
}
