import { BrsValue, ValueKind, BrsString, BrsInvalid, BrsBoolean, Uninitialized } from "../BrsType";
import { BrsComponent, BrsIterable } from "./BrsComponent";
import { BrsType } from "..";
import { Callable, StdlibArgument } from "../Callable";
import { Interpreter } from "../../interpreter";
import { Int32 } from "../Int32";
import { RoAssociativeArray } from "./RoAssociativeArray";
import { RoArray } from "./RoArray";
import { AAMember } from "./RoAssociativeArray";
import { Float } from "../Float";
import { Call } from "../../parser/Expression";
import { objectExpression } from "@babel/types";

class Field {
    private type: string;
    private value: BrsType;
    private observers = new Array<BrsString>();

    constructor(value: BrsType, alwaysNotify?: boolean) {
        this.type = ValueKind.toString(value.kind);
        this.value = value;
    }

    toString(parent?: BrsType): string {
        return this.value.toString(parent);
    }

    getType(): string {
        return this.type;
    }

    getValue(): BrsType {
        return this.value;
    }

    addObserver(functionName: BrsString) {
        this.observers.push(functionName);
    }
}

export class RoSGNode extends BrsComponent implements BrsValue, BrsIterable {
    //
    readonly kind = ValueKind.Object;
    private fields = new Map<string, Field>();
    readonly builtInFields = [
        { name: "change", type: "roAssociativeArray" },
        { name: "focusable", type: "boolean" },
        { name: "focusedChild", type: "dynamic" },
        { name: "id", type: "string" },
    ];

    constructor(members: AAMember[], readonly type: string = "Node") {
        super("roSGNode");

        // All nodes start have some built-in fields when created
        this.builtInFields.forEach(field => {
            this.fields.set(field.name.toLowerCase(), new Field(this.getDefaultValue(field.type)));
        });

        members.forEach(member =>
            this.fields.set(member.name.value.toLowerCase(), new Field(member.value))
        );

        this.registerMethods([
            // ifAssociativeArray methods
            this.clear,
            this.delete,
            this.addreplace,
            this.count,
            this.doesexist,
            this.append,
            this.keys,
            this.items,
            this.lookup,
            //ifSGNodeField methods
            this.addfield,
            this.addfields,
            this.getfield,
            this.observefield,
            this.removefield,
            this.setfield,
            this.setfields,
            this.update,
        ]);
    }

    toString(parent?: BrsType): string {
        let componentName = "roSGNode:" + this.type;

        if (parent) {
            return `<Component: ${componentName}>`;
        }

        return [
            `<Component: ${componentName}> =`,
            "{",
            ...Array.from(this.fields.entries()).map(
                ([key, value]) => `    ${key}: ${value.toString(this)}`
            ),
            "}",
        ].join("\n");
    }

    equalTo(other: BrsType) {
        // SceneGraph nodes are never equal to anything
        return BrsBoolean.False;
    }

    getElements() {
        return Array.from(this.fields.keys())
            .sort()
            .map(key => new BrsString(key));
    }

    getValues() {
        return Array.from(this.fields.values())
            .sort()
            .map((field: Field) => field.getValue());
    }

    getFields() {
        return this.fields;
    }

    get(index: BrsType) {
        if (index.kind !== ValueKind.String) {
            throw new Error("RoSGNode indexes must be strings");
        }

        // TODO: this works for now, in that a property with the same name as a method essentially
        // overwrites the method. The only reason this doesn't work is that getting a method from an
        // associative array and _not_ calling it returns `invalid`, but calling it returns the
        // function itself. I'm not entirely sure why yet, but it's gotta have something to do with
        // how methods are implemented within RBI.
        //
        // Are they stored separately from elements, like they are here? Or does
        // `Interpreter#visitCall` need to check for `invalid` in its callable, then try to find a
        // method with the desired name separately? That last bit would work but it's pretty gross.
        // That'd allow roArrays to have methods with the methods not accessible via `arr["count"]`.
        // Same with RoAssociativeArrays I guess.
        let field = this.fields.get(index.value.toLowerCase());
        let result;
        if (field) {
            result = field.getValue();
        }
        return result || this.getMethod(index.value) || BrsInvalid.Instance;
    }

    set(index: BrsType, value: BrsType, alwaysNotify?: boolean) {
        if (index.kind !== ValueKind.String) {
            throw new Error("RoSGNode indexes must be strings");
        }
        this.fields.set(index.value.toLowerCase(), new Field(value, alwaysNotify));
        return BrsInvalid.Instance;
    }

    private getDefaultValue(type: string): BrsType {
        let value: BrsType;

        switch (type.toLowerCase()) {
            case "boolean":
                value = BrsBoolean.False;
                break;
            case "dynamic":
                value = BrsInvalid.Instance;
                break;
            case "integer":
                value = new Int32(0);
                break;
            case "float":
                value = new Float(0);
                break;
            case "roArray":
                value = BrsInvalid.Instance;
                break;
            case "roAssociativeArray":
                value = BrsInvalid.Instance;
                break;
            case "string":
                value = new BrsString("");
                break;
            default:
                value = Uninitialized.Instance;
                break;
        }

        return value;
    }

    /** Removes all elements from the node */
    // ToDo: Built-in fields shouldn't be removed
    private clear = new Callable("clear", {
        signature: {
            args: [],
            returns: ValueKind.Void,
        },
        impl: (interpreter: Interpreter) => {
            this.fields.clear();
            return BrsInvalid.Instance;
        },
    });

    /** Removes a given item from the node */
    // ToDo: Built-in fields shouldn't be removed
    private delete = new Callable("delete", {
        signature: {
            args: [new StdlibArgument("str", ValueKind.String)],
            returns: ValueKind.Boolean,
        },
        impl: (interpreter: Interpreter, str: BrsString) => {
            let deleted = this.fields.delete(str.value);
            return BrsBoolean.from(deleted);
        },
    });

    /** Given a key and value, adds an item to the node if it doesn't exist
     * Or replaces the value of a key that already exists in the node
     */
    private addreplace = new Callable("addreplace", {
        signature: {
            args: [
                new StdlibArgument("key", ValueKind.String),
                new StdlibArgument("value", ValueKind.Dynamic),
            ],
            returns: ValueKind.Void,
        },
        impl: (interpreter: Interpreter, key: BrsString, value: BrsType) => {
            this.set(key, value);
            return BrsInvalid.Instance;
        },
    });

    /** Returns the number of items in the node */
    private count = new Callable("count", {
        signature: {
            args: [],
            returns: ValueKind.Int32,
        },
        impl: (interpreter: Interpreter) => {
            return new Int32(this.fields.size);
        },
    });

    /** Returns a boolean indicating whether or not a given key exists in the node */
    private doesexist = new Callable("doesexist", {
        signature: {
            args: [new StdlibArgument("str", ValueKind.String)],
            returns: ValueKind.Boolean,
        },
        impl: (interpreter: Interpreter, str: BrsString) => {
            return this.get(str) !== BrsInvalid.Instance ? BrsBoolean.True : BrsBoolean.False;
        },
    });

    /** Appends a new node to another. If two keys are the same, the value of the original AA is replaced with the new one. */
    private append = new Callable("append", {
        signature: {
            args: [new StdlibArgument("obj", ValueKind.Object)],
            returns: ValueKind.Void,
        },
        impl: (interpreter: Interpreter, obj: BrsType) => {
            if (obj instanceof RoAssociativeArray) {
                obj.elements.forEach((value, key) => {
                    this.fields.set(key, new Field(value));
                });
            }

            if (obj instanceof RoSGNode) {
                obj.getFields().forEach((value, key) => {
                    this.fields.set(key, value);
                });
            }

            return BrsInvalid.Instance;
        },
    });

    /** Returns an array of keys from the node in lexicographical order */
    private keys = new Callable("keys", {
        signature: {
            args: [],
            returns: ValueKind.Object,
        },
        impl: (interpreter: Interpreter) => {
            return new RoArray(this.getElements());
        },
    });

    /** Returns an array of values from the node in lexicographical order */
    private items = new Callable("items", {
        signature: {
            args: [],
            returns: ValueKind.Object,
        },
        impl: (interpreter: Interpreter) => {
            return new RoArray(this.getValues());
        },
    });

    /** Given a key, returns the value associated with that key. This method is case insensitive. */
    private lookup = new Callable("lookup", {
        signature: {
            args: [new StdlibArgument("key", ValueKind.String)],
            returns: ValueKind.Dynamic,
        },
        impl: (interpreter: Interpreter, key: BrsString) => {
            let lKey = key.value.toLowerCase();
            return this.get(new BrsString(lKey));
        },
    });

    /** Adds a new field to the node, if the field already exists it doesn't change the current value. */
    private addfield = new Callable("addfield", {
        signature: {
            args: [
                new StdlibArgument("fieldname", ValueKind.String),
                new StdlibArgument("type", ValueKind.String),
                new StdlibArgument("alwaysnotify", ValueKind.Boolean),
            ],
            returns: ValueKind.Boolean,
        },
        impl: (
            interpreter: Interpreter,
            fieldname: BrsString,
            type: BrsString,
            alwaysnotify: BrsBoolean
        ) => {
            let defaultValue = this.getDefaultValue(type.value);

            if (
                defaultValue !== Uninitialized.Instance &&
                this.get(fieldname) === BrsInvalid.Instance
            ) {
                this.set(fieldname, defaultValue, alwaysnotify.toBoolean());
            }

            return BrsBoolean.True;
        },
    });

    /** Adds one or more fields defined as an associative aray of key values. */
    private addfields = new Callable("addfields", {
        signature: {
            args: [new StdlibArgument("fields", ValueKind.Object)],
            returns: ValueKind.Boolean,
        },
        impl: (interpreter: Interpreter, fields: RoAssociativeArray) => {
            if (!(fields instanceof RoAssociativeArray)) {
                return BrsBoolean.False;
            }

            fields.getValue().forEach((value, key) => {
                let fieldName = new BrsString(key);
                let fieldType = ValueKind.toString(value.kind);
                if (this.get(fieldName) === BrsInvalid.Instance) {
                    this.set(fieldName, value);
                }
            });

            return BrsBoolean.True;
        },
    });

    /** Returns the value of the field passed as argument, if the field doesn't exist it returns invalid. */
    private getfield = new Callable("getfield", {
        signature: {
            args: [new StdlibArgument("fieldname", ValueKind.String)],
            returns: ValueKind.Dynamic,
        },
        impl: (interpreter: Interpreter, fieldname: BrsString) => {
            return this.get(fieldname);
        },
    });

    private observefield = new Callable("observefield", {
        signature: {
            args: [
                new StdlibArgument("fieldname", ValueKind.String),
                new StdlibArgument("functionname", ValueKind.String),
            ],
            returns: ValueKind.Boolean,
        },
        impl: (interpreter: Interpreter, fieldname: BrsString) => {
            return BrsBoolean.True;
        },
    });

    /** Removes the given field from the node */
    /** TODO: node built-in fields shouldn't be removable (i.e. id, change, focusable,) */
    private removefield = new Callable("removefield", {
        signature: {
            args: [new StdlibArgument("fieldname", ValueKind.String)],
            returns: ValueKind.Boolean,
        },
        impl: (interpreter: Interpreter, fieldname: BrsString) => {
            if (this.get(fieldname) !== BrsInvalid.Instance) {
                this.fields.delete(fieldname.value);
            }

            return BrsBoolean.True;
        },
    });

    /** Updates the value of an existing field only if the types match. */
    private setfield = new Callable("setfield", {
        signature: {
            args: [
                new StdlibArgument("fieldname", ValueKind.String),
                new StdlibArgument("value", ValueKind.Dynamic),
            ],
            returns: ValueKind.Boolean,
        },
        impl: (interpreter: Interpreter, fieldname: BrsString, value: BrsType) => {
            let field = this.get(fieldname);

            if (field === BrsInvalid.Instance) {
                return BrsBoolean.False;
            }

            if (
                ValueKind.toString(field.kind).toLowerCase() !==
                ValueKind.toString(value.kind).toLowerCase()
            ) {
                return BrsBoolean.False;
            }

            this.set(fieldname, value);
            return BrsBoolean.True;
        },
    });

    /** Updates the value of multiple existing field only if the types match. */
    private setfields = new Callable("setfields", {
        signature: {
            args: [new StdlibArgument("fields", ValueKind.Object)],
            returns: ValueKind.Boolean,
        },
        impl: (interpreter: Interpreter, fields: RoAssociativeArray) => {
            if (!(fields instanceof RoAssociativeArray)) {
                return BrsBoolean.False;
            }

            fields.getValue().forEach((value, key) => {
                let fieldName = new BrsString(key);
                let field = this.get(fieldName);
                let valueType = ValueKind.toString(value.kind);
                if (
                    field !== BrsInvalid.Instance &&
                    ValueKind.toString(field.kind).toLowerCase() === valueType.toLowerCase()
                ) {
                    this.set(fieldName, value);
                }
            });

            return BrsBoolean.True;
        },
    });

    /** Updates the value of multiple existing field only if the types match.
     * In contrast to setFields method, update always return Uninitialized */
    private update = new Callable("update", {
        signature: {
            args: [new StdlibArgument("aa", ValueKind.Object)],
            returns: ValueKind.Uninitialized,
        },
        impl: (interpreter: Interpreter, aa: RoAssociativeArray) => {
            if (!(aa instanceof RoAssociativeArray)) {
                return Uninitialized.Instance;
            }

            aa.getValue().forEach((value, key) => {
                let fieldName = new BrsString(key);
                let field = this.get(fieldName);
                let valueType = ValueKind.toString(value.kind);
                if (
                    field !== BrsInvalid.Instance &&
                    ValueKind.toString(field.kind).toLowerCase() === valueType.toLowerCase()
                ) {
                    this.set(fieldName, value);
                }
            });

            return Uninitialized.Instance;
        },
    });
}

export function createNodeByType(type: BrsString) {
    if (type.value === "Node") {
        return new RoSGNode([]);
    } else {
        return BrsInvalid.Instance;
    }
}
