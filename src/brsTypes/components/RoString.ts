import { BrsComponent } from "./BrsComponent";
import { RoArray } from "./RoArray";
import { BrsValue, ValueKind, BrsString, BrsBoolean, BrsInvalid } from "../BrsType";
import { Callable, StdlibArgument } from "../Callable";
import { Interpreter } from "../../interpreter";
import { BrsType } from "..";
import { Unboxable } from "../Boxing";
import { Int32 } from "../Int32";

export class RoString extends BrsComponent implements BrsValue, Unboxable {
    readonly kind = ValueKind.Object;
    private intrinsic: BrsString;

    public getValue(): string {
        return this.intrinsic.value;
    }

    constructor(initialValue: BrsString) {
        super("roString", ["ifStringOps"]);

        this.intrinsic = initialValue;
        this.registerMethods([
            this.setString,
            this.appendString,
            this.len,
            this.left,
            this.right,
            this.mid,
            this.instr,
            this.replace,
            this.split,
        ]);
    }

    equalTo(other: BrsType): BrsBoolean {
        if (other.kind === ValueKind.String) {
            return BrsBoolean.from(other.box().intrinsic === this.intrinsic);
        }

        if (other instanceof RoString) {
            return BrsBoolean.from(other.intrinsic === this.intrinsic);
        }

        return BrsBoolean.False;
    }

    unbox() {
        return this.intrinsic;
    }

    toString(_parent?: BrsType): string {
        return this.intrinsic.toString();
    }

    // ---------- ifStringOps ----------
    /** Sets the string to the first len characters of s. */
    private setString = new Callable("SetString", {
        signature: {
            args: [
                new StdlibArgument("s", ValueKind.String),
                new StdlibArgument("len", ValueKind.Int32),
            ],
            returns: ValueKind.Void,
        },
        impl: (_interpreter, Interpreter, s: BrsString, len: Int32) => {
            this.intrinsic = new BrsString(s.value.substr(0, len.getValue()));
            return BrsInvalid.Instance;
        },
    });

    /** Appends the first len characters of s to the end of the string. */
    private appendString = new Callable("AppendString", {
        signature: {
            args: [
                new StdlibArgument("s", ValueKind.String),
                new StdlibArgument("len", ValueKind.Int32),
            ],
            returns: ValueKind.Void,
        },
        impl: (_interpreter, Interpreter, s: BrsString, len: Int32) => {
            this.intrinsic = this.intrinsic.concat(
                new BrsString(s.value.substr(0, len.getValue()))
            );
            return BrsInvalid.Instance;
        },
    });

    /** Returns the number of characters in the string. */
    private len = new Callable("Len", {
        signature: {
            args: [],
            returns: ValueKind.Int32,
        },
        impl: _interpreter => {
            return new Int32(this.intrinsic.value.length);
        },
    });

    /** Returns a string consisting of the first len characters of the string. */
    private left = new Callable("Left", {
        signature: {
            args: [new StdlibArgument("len", ValueKind.Int32)],
            returns: ValueKind.String,
        },
        impl: (_interpreter: Interpreter, len: Int32) => {
            return new BrsString(this.intrinsic.value.substr(0, len.getValue()));
        },
    });

    /** Returns a string consisting of the last len characters of the string. */
    private right = new Callable("Right", {
        signature: {
            args: [new StdlibArgument("len", ValueKind.Int32)],
            returns: ValueKind.String,
        },
        impl: (_interpreter: Interpreter, len: Int32) => {
            let source = this.intrinsic.value;
            return new BrsString(source.substr(source.length - len.getValue()));
        },
    });

    private mid = new Callable(
        "Mid",
        /**
         * Returns a string consisting of the last characters of the string, starting at the
         * zero-based start_index.
         */
        {
            signature: {
                args: [new StdlibArgument("start_index", ValueKind.Int32)],
                returns: ValueKind.String,
            },
            impl: (_interpreter: Interpreter, startIndex: Int32) => {
                return new BrsString(this.intrinsic.value.substr(startIndex.getValue()));
            },
        },

        /**
         * Returns a string consisting of num_chars characters of the string, starting at the
         * zero-based start_index.
         */
        {
            signature: {
                args: [
                    new StdlibArgument("start_index", ValueKind.Int32),
                    new StdlibArgument("num_chars", ValueKind.Int32),
                ],
                returns: ValueKind.String,
            },
            impl: (_interpreter: Interpreter, startIndex: Int32, numChars: Int32) => {
                let source = this.intrinsic.value;
                return new BrsString(
                    this.intrinsic.value.substr(startIndex.getValue(), numChars.getValue())
                );
            },
        }
    );

    private instr = new Callable(
        "Instr",
        /** Returns the zero-based index of the first occurrence of substring in the string. */
        {
            signature: {
                args: [new StdlibArgument("substring", ValueKind.String)],
                returns: ValueKind.Int32,
            },
            impl: (_interpreter: Interpreter, substring: BrsString) => {
                return new Int32(this.intrinsic.value.indexOf(substring.value));
            },
        },
        /**
         * Returns the zero-based index of the first occurrence of substring in the string, starting
         * at the specified zero-based start_index.
         */
        {
            signature: {
                args: [
                    new StdlibArgument("start_index", ValueKind.Int32),
                    new StdlibArgument("substring", ValueKind.String),
                ],
                returns: ValueKind.Int32,
            },
            impl: (_interpreter: Interpreter, startIndex: Int32, substring: BrsString) => {
                return new Int32(
                    this.intrinsic.value.indexOf(substring.value, startIndex.getValue())
                );
            },
        }
    );

    /**
     * Returns a copy of the string with all instances of fromStr replaced with toStr. If fromStr is
     * empty the return value is the same as the source string.
     */
    private replace = new Callable("Replace", {
        signature: {
            args: [
                new StdlibArgument("from", ValueKind.String),
                new StdlibArgument("to", ValueKind.String),
            ],
            returns: ValueKind.String,
        },
        impl: (_interpreter, from: BrsString, to: BrsString) => {
            return new BrsString(
                this.intrinsic.value.replace(new RegExp(from.value, "g"), to.value)
            );
        },
    });

    /**
     * Splits the input string using the separator string as a delimiter, and returns an array of
     * the split token strings (not including the delimiter). An empty separator string indicates
     * to split the string by character.
     */
    private split = new Callable("Split", {
        signature: {
            args: [new StdlibArgument("separator", ValueKind.String)],
            returns: ValueKind.Object,
        },
        impl: (_interpreter: Interpreter, separator: BrsString) => {
            return new RoArray(
                this.intrinsic.value.split(separator.value).map(section => new BrsString(section))
            );
        },
    });
}
