const { getComponentDefinitionMap } = require("../../lib/componentprocessor");
const { Interpreter, defaultExecutionOptions } = require("../../lib/interpreter");
const path = require("path");
const LexerParser = require("../../lib/LexerParser");

jest.mock("fast-glob");
jest.mock("fs");
const fg = require("fast-glob");
const fs = require("fs");

const realFs = jest.requireActual("fs");

describe("integration tests", () => {
    beforeEach(() => {
        fg.sync.mockImplementation(() => {
            return [
                "baseComponent.xml",
                "extendedComponent.xml",
                "scripts/baseComp.brs",
                "scripts/extendedComp.brs",
                "scripts/utility.brs",
            ];
        });
        fs.readFile.mockImplementation((filename, _, cb) => {
            resourcePath = path.join(__dirname, "resources", filename);
            contents = realFs.readFileSync(resourcePath, "utf8");
            cb(/* no error */ null, contents);
        });
    });

    afterEach(() => {
        fg.sync.mockRestore();
        fs.readFile.mockRestore();
    });

    test("interpreter environments have the right functions per component", async () => {
        let componentMap = await getComponentDefinitionMap("/doesnt/matter");
        componentMap.forEach(comp => {
            comp.scripts = comp.scripts.map(script => {
                script.uri = path.join("scripts/", path.parse(script.uri).base);
                return script;
            });
        });
        let interpreter = await Interpreter.withSubEnvsFromComponents(
            componentMap,
            LexerParser.getLexerParserFn(new Map(), defaultExecutionOptions)
        );

        let baseComp = interpreter.environment.nodeDefMap.get("BaseComponent");
        expect(baseComp).not.toBeUndefined();
        expect(baseComp.environment.module.size).toEqual(0);

        let extendedComp = interpreter.environment.nodeDefMap.get("ExtendedComponent");
        expect(extendedComp).not.toBeUndefined();
        let actualFns = Array.from(extendedComp.environment.module).map(methodKV => {
            let [fnNamePair] = methodKV;
            return fnNamePair;
        });

        expect(actualFns).toEqual(["init", "test1", "utility"]);
    });
});
