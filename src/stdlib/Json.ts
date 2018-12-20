import { AssociativeArray } from "../brsTypes/components/AssociativeArray";
import { BrsArray } from "../brsTypes/components/BrsArray";
import { Interpreter } from "../interpreter";
import { Literal } from "../parser/Expression";
import {
    BrsBoolean,
    BrsInvalid,
    BrsString,
    BrsType,
    BrsValue,
    Callable,
    Float,
    Int32,
    Int64,
    Uninitialized,
    ValueKind
} from "../brsTypes";

function isInt32(n: number): boolean {
    const lo: number = -2_147_483_648;
    const hi: number = 2_147_483_647;
    return Number.isInteger(n) && n >= lo && n <= hi;
}

function brsValueOf(x: any): any {
    if (x === null) { return BrsInvalid.Instance; }
    let t: string = typeof x;
    switch (t) {
    case "boolean":
        return BrsBoolean.from(x);
    case "string":
        return new BrsString(x);
    case "number":
        if (Number.isInteger(x)) {
            return isInt32(x) ? new Int32(x) : new Int64(x);
        }
        return new Float(x);
    case "object":
        if (Array.isArray(x)) {
            return new BrsArray(x.map(brsValueOf));
        }
        return new AssociativeArray(
            Object.getOwnPropertyNames(x).map((k: string) => {
                return {
                    name: brsValueOf(k),
                    value: brsValueOf(x[k])
                };
            })
        );
    default:
        throw new Error(`brsValueOf not implemented for: ${x} <${t}>`);
    }
}

// An ItemFn is a function that takes a key and a value and returns a string.
// NOTE: `jsonOfItem` matches this signature.
type ItemFn = (k: BrsString, v: BrsValue) => string;

/**
 * Convenience function for mapping an ItemFn onto the "items" (key/value
 * pairs) of an AssociativeArray.
 * @param {AssociativeArray} associativeArray An AssociativeArray.
 * @param {ItemFn} fn A function that takes a BrsString and a BrsValue and returns a string.
 * @return {string[]} An array of strings.
 */
function itemsMap(associativeArray: AssociativeArray, fn: ItemFn): string[] {
    return associativeArray.getElements().map((key: BrsString) => {
        return fn(key, associativeArray.get(key));
    });
}

// An ElementFn is a function that takes a value and returns a string.
// NOTE: `jsonOf` matches this signature.
type ElementFn = (v: any) => string;

/**
 * Maps an ElementFn onto the "elements" (values) of a BrsArray.
 * @param {BrsArray} brsArray A BrsArray.
 * @param {ElementFn} fn A function that takes a value and returns a string.
 * @return {string[]} An array of strings.
 */
function elementsMap(brsArray: BrsArray, fn: ElementFn): string[] {
    return brsArray.getElements().map(fn);
}

function jsonOfItem(k: BrsString, v: BrsValue): string {
    return `"${k.toString()}":${jsonOf(v)}`;
}

function jsonOf(x: BrsValue): string {
    if (x instanceof BrsInvalid) {
        return "null";
    }
    if (x instanceof AssociativeArray) {
        return `{${itemsMap(x, jsonOfItem).join(",")}}`;
    }
    if (x instanceof BrsArray) {
        return `[${elementsMap(x, jsonOf).join(",")}]`;
    }
    if (x instanceof BrsString) {
        return `"${x.toString()}"`;
    }
    if (!(x instanceof Uninitialized)) {
        return x.toString();
    }
    throw new Error(`jsonValueOf not implemented for: ${x}`);
}

function logBrsErr(functionName: string, err: Error): void {
    console.error(`BRIGHTSCRIPT: ERROR: ${functionName}: ${err.message}`);
}

export const FormatJson = new Callable("FormatJson", {
    signature: { returns: ValueKind.String, args: [
        { name: "x", type: ValueKind.Object },
        { name: "flags", type: ValueKind.Int32, defaultValue: new Literal(new Int32(0)) }
    ]},
    impl: (_: Interpreter, x: BrsType, _flags: Int32) => {
        try {
            return new BrsString(jsonOf(x));
        } catch (err) {
            // example RBI error:
            // "BRIGHTSCRIPT: ERROR: FormatJSON: Value type not supported: roFunction: pkg:/source/main.brs(14)"
            logBrsErr("FormatJSON", err);
            return new BrsString("");
        }
    }
});

export const ParseJson = new Callable("ParseJson", {
    signature: { returns: ValueKind.Dynamic, args: [
        { name: "jsonString", type: ValueKind.String }
    ]},
    impl: (_: Interpreter, jsonString: BrsString) => {
        try {
            return brsValueOf(JSON.parse(jsonString.toString()));
        } catch (err) {
            // example RBI error:
            // "BRIGHTSCRIPT: ERROR: ParseJSON: Unknown identifier 'x': pkg:/source/main.brs(25)"
            logBrsErr("ParseJSON", err);
            return BrsInvalid.Instance;
        }
    }
});
