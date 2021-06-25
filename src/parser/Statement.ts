import * as Expr from "./Expression";
import { Token, Identifier, Location, Lexeme } from "../lexer";
import { BrsType, BrsInvalid } from "../brsTypes";
import { AstNode } from "./AstNode";

/** A set of reasons why a `Block` stopped executing. */
export * from "./BlockEndReason";

export interface Visitor<T> {
    visitAssignment(statement: Assignment): BrsType;
    visitDim(statement: Dim): BrsType;
    visitExpression(statement: Expression): BrsType;
    visitExitFor(statement: ExitFor): never;
    visitExitWhile(statement: ExitWhile): never;
    visitPrint(statement: Print): BrsType;
    visitIf(statement: If): BrsType;
    visitBlock(block: Block): BrsType;
    visitFor(statement: For): BrsType;
    visitForEach(statement: ForEach): BrsType;
    visitWhile(statement: While): BrsType;
    visitNamedFunction(statement: Function): BrsType;
    visitReturn(statement: Return): never;
    visitDottedSet(statement: DottedSet): BrsType;
    visitIndexedSet(statement: IndexedSet): BrsType;
    visitIncrement(expression: Increment): BrsInvalid;
    visitLibrary(statement: Library): BrsInvalid;
    visitTryCatch(statement: TryCatch): BrsInvalid;
}

let statementTypes = new Set<string>([
    "Assignment",
    "Expression",
    "ExitFor",
    "ExitWhile",
    "Print",
    "If",
    "Block",
    "For",
    "ForEach",
    "While",
    "Stmt_Function",
    "Return",
    "DottedSet",
    "IndexedSet",
    "Increment",
    "Library",
    "Dim",
]);

/**
 * Returns a boolean of whether or not the given object is a Statement.
 * @param obj object to check
 */
export function isStatement(obj: Expr.Expression | Statement): obj is Statement {
    return statementTypes.has(obj.type);
}

/** A BrightScript statement */
export interface Statement extends AstNode {
    /**
     * Handles the enclosing `Statement` with `visitor`.
     * @param visitor the `Visitor` that will handle the enclosing `Statement`
     * @returns a BrightScript value (typically `invalid`) and the reason why
     *          the statement exited (typically `StopReason.End`)
     */
    accept<R>(visitor: Visitor<R>): BrsType;
}

export class Assignment extends AstNode implements Statement {
    constructor(
        readonly tokens: {
            equals: Token;
        },
        readonly name: Identifier,
        readonly value: Expr.Expression
    ) {
        super("Assignment");
    }

    accept<R>(visitor: Visitor<R>): BrsType {
        return visitor.visitAssignment(this);
    }

    get location() {
        return {
            file: this.name.location.file,
            start: this.name.location.start,
            end: this.value.location.end,
        };
    }
}

export class Dim extends AstNode implements Statement {
    constructor(
        readonly tokens: {
            dim: Token;
            closingBrace: Token;
        },
        readonly name: Identifier,
        readonly dimensions: Expr.Expression[]
    ) {
        super("Dim");
    }

    accept<R>(visitor: Visitor<R>): BrsType {
        return visitor.visitDim(this);
    }

    get location() {
        return {
            file: this.tokens.dim.location.file,
            start: this.tokens.dim.location.start,
            end: this.tokens.closingBrace.location.end,
        };
    }
}

export class Block extends AstNode implements Statement {
    constructor(readonly statements: ReadonlyArray<Statement>, readonly location: Location) {
        super("Block");
    }

    accept<R>(visitor: Visitor<R>): BrsType {
        return visitor.visitBlock(this);
    }
}

export class Expression extends AstNode implements Statement {
    constructor(readonly expression: Expr.Expression) {
        super("Expression");
    }

    accept<R>(visitor: Visitor<R>): BrsType {
        return visitor.visitExpression(this);
    }

    get location() {
        return this.expression.location;
    }
}

export class ExitFor extends AstNode implements Statement {
    constructor(
        readonly tokens: {
            exitFor: Token;
        }
    ) {
        super("ExitFor");
    }

    accept<R>(visitor: Visitor<R>): BrsType {
        return visitor.visitExitFor(this);
    }

    get location() {
        return this.tokens.exitFor.location;
    }
}

export class ExitWhile extends AstNode implements Statement {
    constructor(
        readonly tokens: {
            exitWhile: Token;
        }
    ) {
        super("ExitWhile");
    }

    accept<R>(visitor: Visitor<R>): BrsType {
        return visitor.visitExitWhile(this);
    }

    get location() {
        return this.tokens.exitWhile.location;
    }
}

export class Function extends AstNode implements Statement {
    constructor(readonly name: Identifier, readonly func: Expr.Function) {
        super("Stmt_Function");
    }

    accept<R>(visitor: Visitor<R>): BrsType {
        return visitor.visitNamedFunction(this);
    }

    get location() {
        return {
            file: this.name.location.file,
            start: this.func.location.start,
            end: this.func.location.end,
        };
    }
}

export interface ElseIf {
    condition: Expr.Expression;
    thenBranch: Block;
    /** Signal to ESLint to walk condition and thenBranch */
    type: string;
}

export class If extends AstNode implements Statement {
    constructor(
        readonly tokens: {
            if: Token;
            then?: Token;
            // TODO: figure a decent way to represent the if/then + elseif/then pairs to enable a
            // linter to check for the lack of `then` with this AST. maybe copy ESTree's format?
            elseIfs?: Token[];
            else?: Token;
            endIf?: Token;
        },
        readonly condition: Expr.Expression,
        readonly thenBranch: Block,
        readonly elseIfs: ElseIf[],
        readonly elseBranch?: Block
    ) {
        super("If");
    }

    accept<R>(visitor: Visitor<R>): BrsType {
        return visitor.visitIf(this);
    }

    private getEndLocation(): Location {
        if (this.tokens.endIf) {
            return this.tokens.endIf.location;
        } else if (this.elseBranch) {
            return this.elseBranch.location;
        } else if (this.elseIfs.length) {
            return this.elseIfs[this.elseIfs.length - 1].thenBranch.location;
        } else {
            return this.thenBranch.location;
        }
    }

    get location() {
        return {
            file: this.tokens.if.location.file,
            start: this.tokens.if.location.start,
            end: this.getEndLocation().end,
        };
    }
}

export class Increment extends AstNode implements Statement {
    constructor(readonly value: Expr.Expression, readonly token: Token) {
        super("Increment");
    }

    accept<R>(visitor: Visitor<R>): BrsType {
        return visitor.visitIncrement(this);
    }

    get location() {
        return {
            file: this.value.location.file,
            start: this.value.location.start,
            end: this.token.location.end,
        };
    }
}

/** The set of all accepted `print` statement separators. */
export namespace PrintSeparator {
    /** Used to indent the current `print` position to the next 16-character-width output zone. */
    export interface Tab extends Token {
        kind: Lexeme.Comma;
    }

    /** Used to insert a single whitespace character at the current `print` position. */
    export interface Space extends Token {
        kind: Lexeme.Semicolon;
    }
}

/**
 * Represents a `print` statement within BrightScript.
 */
export class Print extends AstNode implements Statement {
    /**
     * Creates a new internal representation of a BrightScript `print` statement.
     * @param expressions an array of expressions or `PrintSeparator`s to be
     *                    evaluated and printed.
     */
    constructor(
        readonly tokens: {
            print: Token;
        },
        readonly expressions: (Expr.Expression | Token)[]
    ) {
        super("Print");
    }

    accept<R>(visitor: Visitor<R>): BrsType {
        return visitor.visitPrint(this);
    }

    get location() {
        let end = this.expressions.length
            ? this.expressions[this.expressions.length - 1].location.end
            : this.tokens.print.location.end;

        return {
            file: this.tokens.print.location.file,
            start: this.tokens.print.location.start,
            end: end,
        };
    }
}

export class Goto extends AstNode implements Statement {
    constructor(
        readonly tokens: {
            goto: Token;
            label: Token;
        }
    ) {
        super("Goto");
    }

    accept<R>(_visitor: Visitor<R>): BrsType {
        //should search the code for the corresponding label, and set that as the next line to execute
        throw new Error("Not implemented");
    }

    get location() {
        return {
            file: this.tokens.goto.location.file,
            start: this.tokens.goto.location.start,
            end: this.tokens.label.location.end,
        };
    }
}

export class Label extends AstNode implements Statement {
    constructor(
        readonly tokens: {
            identifier: Token;
            colon: Token;
        }
    ) {
        super("Label");
    }

    accept<R>(_visitor: Visitor<R>): BrsType {
        throw new Error("Not implemented");
    }

    get location() {
        return {
            file: this.tokens.identifier.location.file,
            start: this.tokens.identifier.location.start,
            end: this.tokens.colon.location.end,
        };
    }
}

export class Return extends AstNode implements Statement {
    constructor(
        readonly tokens: {
            return: Token;
        },
        readonly value?: Expr.Expression
    ) {
        super("Return");
    }

    accept<R>(visitor: Visitor<R>): BrsType {
        return visitor.visitReturn(this);
    }

    get location() {
        return {
            file: this.tokens.return.location.file,
            start: this.tokens.return.location.start,
            end: (this.value && this.value.location.end) || this.tokens.return.location.end,
        };
    }
}

export class End extends AstNode implements Statement {
    constructor(
        readonly tokens: {
            end: Token;
        }
    ) {
        super("End");
    }

    accept<R>(_visitor: Visitor<R>): BrsType {
        //TODO implement this in the runtime. It should immediately terminate program execution, without error
        throw new Error("Not implemented");
    }

    get location() {
        return {
            file: this.tokens.end.location.file,
            start: this.tokens.end.location.start,
            end: this.tokens.end.location.end,
        };
    }
}

export class Stop extends AstNode implements Statement {
    constructor(
        readonly tokens: {
            stop: Token;
        }
    ) {
        super("Stop");
    }

    accept<R>(_visitor: Visitor<R>): BrsType {
        //TODO implement this in the runtime. It should pause code execution until a `c` command is issued from the console
        throw new Error("Not implemented");
    }

    get location() {
        return {
            file: this.tokens.stop.location.file,
            start: this.tokens.stop.location.start,
            end: this.tokens.stop.location.end,
        };
    }
}

export class For extends AstNode implements Statement {
    constructor(
        readonly tokens: {
            for: Token;
            to: Token;
            step?: Token;
            endFor: Token;
        },
        readonly counterDeclaration: Assignment,
        readonly finalValue: Expr.Expression,
        readonly increment: Expr.Expression,
        readonly body: Block
    ) {
        super("For");
    }

    accept<R>(visitor: Visitor<R>): BrsType {
        return visitor.visitFor(this);
    }

    get location() {
        return {
            file: this.tokens.for.location.file,
            start: this.tokens.for.location.start,
            end: this.tokens.endFor.location.end,
        };
    }
}

export class ForEach extends AstNode implements Statement {
    constructor(
        readonly tokens: {
            forEach: Token;
            in: Token;
            endFor: Token;
        },
        readonly item: Token,
        readonly target: Expr.Expression,
        readonly body: Block
    ) {
        super("ForEach");
    }

    accept<R>(visitor: Visitor<R>): BrsType {
        return visitor.visitForEach(this);
    }

    get location() {
        return {
            file: this.tokens.forEach.location.file,
            start: this.tokens.forEach.location.start,
            end: this.tokens.endFor.location.end,
        };
    }
}

export class While extends AstNode implements Statement {
    constructor(
        readonly tokens: {
            while: Token;
            endWhile: Token;
        },
        readonly condition: Expr.Expression,
        readonly body: Block
    ) {
        super("While");
    }

    accept<R>(visitor: Visitor<R>): BrsType {
        return visitor.visitWhile(this);
    }

    get location() {
        return {
            file: this.tokens.while.location.file,
            start: this.tokens.while.location.start,
            end: this.tokens.endWhile.location.end,
        };
    }
}

export class DottedSet extends AstNode implements Statement {
    constructor(
        readonly obj: Expr.Expression,
        readonly name: Identifier,
        readonly value: Expr.Expression
    ) {
        super("DottedSet");
    }

    accept<R>(visitor: Visitor<R>): BrsType {
        return visitor.visitDottedSet(this);
    }

    get location() {
        return {
            file: this.obj.location.file,
            start: this.obj.location.start,
            end: this.value.location.end,
        };
    }
}

export class IndexedSet extends AstNode implements Statement {
    constructor(
        readonly obj: Expr.Expression,
        readonly index: Expr.Expression,
        readonly value: Expr.Expression,
        readonly closingSquare: Token
    ) {
        super("IndexedSet");
    }

    accept<R>(visitor: Visitor<R>): BrsType {
        return visitor.visitIndexedSet(this);
    }

    get location() {
        return {
            file: this.obj.location.file,
            start: this.obj.location.start,
            end: this.value.location.end,
        };
    }
}

export class Library extends AstNode implements Statement {
    constructor(
        readonly tokens: {
            library: Token;
            filePath: Token | undefined;
        }
    ) {
        super("Library");
    }

    accept<R>(visitor: Visitor<R>): BrsType {
        return visitor.visitLibrary(this);
    }

    get location() {
        return {
            file: this.tokens.library.location.file,
            start: this.tokens.library.location.start,
            end: this.tokens.filePath
                ? this.tokens.filePath.location.end
                : this.tokens.library.location.end,
        };
    }
}

export class TryCatch extends AstNode implements Statement {
    constructor(
        readonly tryBlock: Block,
        readonly catchBlock: Block,
        readonly errorBinding: Expr.Variable,
        readonly tokens: {
            try: Token;
            catch: Token;
            endtry: Token;
        }
    ) {
        super("TryCatch");
    }

    accept<R>(visitor: Visitor<R>): BrsType {
        return visitor.visitTryCatch(this);
    }

    get location() {
        return {
            file: this.tokens.try.location.file,
            start: this.tokens.endtry.location.start,
            end: this.tokens.endtry.location.end,
        };
    }
}
