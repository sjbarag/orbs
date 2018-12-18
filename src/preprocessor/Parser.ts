import { Token, Lexeme } from "../lexer";
import { ParseError } from "../parser";
import * as CC from "./Chunk";

let current: number;
let tokens: ReadonlyArray<Token>;

/**
 * Parses an array of tokens into an array of "conditional compilation directives and their
 * associated BrightScript.
 *
 * @param toParse the array of tokens to parse
 * @returns an array of chunks (conditional compilation directives and the associated BrightScript) to be later
 *          executed.
 */
export function parse(toParse: ReadonlyArray<Token>) {
    current = 0;
    tokens = toParse;

    try {
        return nChunks();
    } catch (conditionalCompilationError) {
        return [];
    }
}

/**
 * Parses tokens to produce an array containing a variable number of heterogeneous chunks.
 * @returns a heterogeneous array of chunks
 */
function nChunks(): CC.Chunk[] {
    let chunks: CC.Chunk[] = [];

    while (!isAtEnd()) {
        let c = hashConst();
        if (c) {
            chunks.push(c);
        } else {
            break;
        }
    }

    return chunks;
}

/**
 * Parses tokens to produce a "declaration" chunk if possible, otherwise falls back to `hashIf`.
 * @returns a "declaration" chunk if one is detected, otherwise whatever `hashIf` returns
 */
function hashConst(): CC.Chunk | undefined {
    if (match(Lexeme.HashConst)) {
        let name = advance();
        consume("Expected '=' after #const (name)", Lexeme.Equal);
        let value = advance();
        match(Lexeme.Newline);
        return new CC.Declaration(name, value);
    }

    return hashIf();
}

/**
 * Parses tokens to produce an "if" chunk (including "else if" and "else" chunks) if possible,
 * otherwise falls back to `hashError`.
 * @returns an "if" chunk if one is detected, otherwise whatever `hashError` returns
 */
function hashIf(): CC.Chunk | undefined {
    let startingLine = peek().line;

    if (match(Lexeme.HashIf)) {
        let elseChunk: CC.Chunk[] | undefined;

        let ifCondition = advance();
        match(Lexeme.Newline);

        let thenChunk = nChunks();

        let elseIfs: CC.HashElseIf[] = [];

        while (match(Lexeme.HashElseIf)) {
            let condition = advance();
            match(Lexeme.Newline);

            elseIfs.push({
                condition: condition,
                thenChunks: nChunks()
            });
        }

        if (match(Lexeme.HashElse)) {
            match(Lexeme.Newline);

            elseChunk = nChunks();
        }

        consume(
            `Expected '#else if' to close '#if' conditional compilation statement starting on line ${startingLine}`,
            Lexeme.HashEndIf
        );
        match(Lexeme.Newline);

        return new CC.If(ifCondition, thenChunk, elseIfs, elseChunk);
    }

    return hashError();
}

/**
 * Parses tokens to produce an "error" chunk (including the associated message) if possible,
 * otherwise falls back to a chunk of plain BrightScript.
 * @returns an "error" chunk if one is detected, otherwise whatever `brightScriptChunk` returns
 */
function hashError(): CC.Chunk | undefined {
    if (check(Lexeme.HashError)) {
        let hashError = advance();
        let message = advance();
        return new CC.Error(hashError, message.text || "");
    }

    return brightScriptChunk();
}

/**
 * Parses tokens to produce a chunk of BrightScript.
 * @returns a chunk of plain BrightScript if any is detected, otherwise `undefined` to indicate
 *          that no non-conditional compilation directives were found.
 */
function brightScriptChunk(): CC.BrightScript | undefined {
    let chunkTokens: Token[] = [];
    while (!check(Lexeme.HashIf, Lexeme.HashElseIf, Lexeme.HashElse, Lexeme.HashEndIf, Lexeme.HashConst, Lexeme.HashError)) {
        chunkTokens.push(advance());

        if (isAtEnd()) {
            chunkTokens.push(peek());
            break;
        }
    }

    if (chunkTokens.length > 0) {
        return new CC.BrightScript(chunkTokens);
    } else {
        return undefined;
    }
}

function match(...lexemes: Lexeme[]) {
    for (let lexeme of lexemes) {
        if (check(lexeme)) {
            advance();
            return true;
        }
    }

    return false;
}

function consume(message: string, ...lexemes: Lexeme[]): Token {
    let foundLexeme = lexemes.map(lexeme => peek().kind === lexeme)
        .reduce(
            (foundAny, foundCurrent) => foundAny || foundCurrent,
            false
        );

    if (foundLexeme) { return advance(); }
    throw ParseError.make(peek(), message);
}

function advance(): Token {
    if (!isAtEnd()) { current++; }
    return previous();
}

function check(...lexemes: Lexeme[]) {
    if (isAtEnd()) { return false; }

    return lexemes.some(lexeme => peek().kind === lexeme);
}

function isAtEnd() {
    return peek().kind === Lexeme.Eof;
}

function peek() {
    return tokens[current];
}

function previous() {
    return tokens[current - 1];
}

