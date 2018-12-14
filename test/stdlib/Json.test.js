const { Interpreter } = require('../../lib/interpreter');
const { FormatJson, ParseJson } = require("../../lib/stdlib/index");
const {
    BrsBoolean,
    BrsInvalid,
    BrsString,
    Float,
    Int32,
    Int64,
    Uninitialized,
    ValueKind
} = require("../../lib/brsTypes");

expect.extend({
    toBeFloatStrCloseTo(actual, expected, numDigits = Float.IEEE_FLOAT_SIGFIGS) {
        actualFloat = Number.parseFloat(actual);
        expectedFloat = Number.parseFloat(expected);
        expect(actualFloat).toBeCloseTo(expectedFloat, numDigits);
        return { pass: true };
    },
    toBeBrsFloatCloseTo(actual, floatStr) {
        expect(actual.kind).toBe(ValueKind.Float); // 5
        expect(actual.value).toBeFloatStrCloseTo(floatStr);
        return { pass: true };
    },
    toBeBrsBareFloatCloseTo(actual, floatStr) {
        expect(actual.kind).toBe(ValueKind.String); // 2
        expect(actual.value).toBeFloatStrCloseTo(floatStr);
        return { pass: true };
    }
});

describe('global JSON functions', () => {
    let interpreter = new Interpreter();

    let brsBareNull = new BrsString('null');

    let brsBareFalse = new BrsString('false');

    let brsEmpty = new BrsString('');

    let brsUnquoted = new BrsString('ok');
    let brsQuoted = new BrsString('"ok"');

    let floatStr = '3.14159265358979323846264338327950288419716939937510';
    let brsFloat = Float.fromString(floatStr);
    let brsBareFloat = new BrsString(floatStr);

    let integerStr = '2147483647'; // max 32-bit int
    let brsInteger = Int32.fromString(integerStr);
    let brsBareInteger = new BrsString(integerStr);

    let longIntegerStr = '9223372036854775807'; // max 64-bit int
    let brsLongInteger = Int64.fromString(longIntegerStr);
    let brsBareLongInteger = new BrsString(longIntegerStr);

    describe('FormatJson', () => {
        it('rejects non-convertible types', () => {
            jest.spyOn(console, 'error').mockImplementationOnce((s) => {
                expect(s).toMatch(/BRIGHTSCRIPT: ERROR: FormatJSON: /)
            })
            actual = FormatJson.call(interpreter, Uninitialized.Instance);
            expect(actual).toMatchObject(brsEmpty);
        });

        it('converts BRS invalid to bare null string', () => {
            actual = FormatJson.call(interpreter, BrsInvalid.Instance);
            expect(actual).toMatchObject(brsBareNull);
        });

        it('converts BRS false to bare false string', () => {
            actual = FormatJson.call(interpreter, BrsBoolean.False);
            expect(actual).toMatchObject(brsBareFalse);
        });

        it('converts BRS string to bare (quoted) string', () => {
            actual = FormatJson.call(interpreter, brsUnquoted);
            expect(actual).toMatchObject(brsQuoted);
        });

        it('converts BRS integer to bare integer string', () => {
            actual = FormatJson.call(interpreter, brsInteger);
            expect(actual).toMatchObject(brsBareInteger);
        });

        it('converts BRS longInteger to bare longInteger string', () => {
            actual = FormatJson.call(interpreter, brsLongInteger);
            expect(actual).toMatchObject(brsBareLongInteger);
        });

        it('converts BRS float to bare float string', () => {
            actual = FormatJson.call(interpreter, brsFloat);
            expect(actual).toBeBrsBareFloatCloseTo(floatStr);
        });
    });

    describe('ParseJson', () => {
        it('rejects empty strings', () => {
            jest.spyOn(console, 'error').mockImplementationOnce((s) => {
                expect(s).toMatch(/BRIGHTSCRIPT: ERROR: ParseJSON: /)
            })
            actual = ParseJson.call(interpreter, brsEmpty);
            expect(actual).toBe(BrsInvalid.Instance);
        });

        it('converts bare null string to BRS invalid', () => {
            actual = ParseJson.call(interpreter, brsBareNull);
            expect(actual).toBe(BrsInvalid.Instance);
        });

        it('converts bare false string to BRS false', () => {
            actual = ParseJson.call(interpreter, brsBareFalse);
            expect(actual).toBe(BrsBoolean.False);
        });

        it('converts bare (quoted) string to BRS string', () => {
            actual = ParseJson.call(interpreter, brsQuoted);
            expect(actual).toMatchObject(brsUnquoted);
        });

        it('converts bare integer string to BRS integer', () => {
            actual = ParseJson.call(interpreter, brsBareInteger);
            expect(actual).toMatchObject(brsInteger);
        });

        it('converts bare longInteger string to BRS longInteger', () => {
            actual = ParseJson.call(interpreter, brsBareLongInteger);
            expect(actual).toMatchObject(brsLongInteger);
        });

        it('converts bare float string to BRS float', () => {
            actual = ParseJson.call(interpreter, brsBareFloat);
            expect(actual).toBeBrsFloatCloseTo(floatStr);
        });
    });
});
