const { execute } = require("../../lib/");
const { createMockStreams, resourceFile, allArgs } = require("./E2ETests");
const lolex = require("lolex");

describe("end to end brightscript functions", () => {
    let outputStreams;
    let clock;
    const OLD_ENV = process.env;

    beforeAll(() => {
        clock = lolex.install({ now: 1547072370937 });
        outputStreams = createMockStreams();
        outputStreams.root = __dirname + "/resources";
    });

    beforeEach(() => {
        process.env = { ...OLD_ENV };
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    afterAll(() => {
        clock.uninstall();
        jest.restoreAllMocks();
        process.env = OLD_ENV;
    });

    test("components/roArray.brs", async () => {
        await execute([resourceFile("components", "roArray.brs")], outputStreams);

        expect(allArgs(outputStreams.stdout.write).filter((arg) => arg !== "\n")).toEqual([
            "array length: ",
            "4",
            "last element: ",
            "sit",
            "first element: ",
            "lorem",
            "can delete elements: ",
            "true",
            "can empty itself: ",
            "true",
        ]);
    });

    test("components/roAssociativeArray.brs", async () => {
        await execute([resourceFile("components", "roAssociativeArray.brs")], outputStreams);

        expect(allArgs(outputStreams.stdout.write).filter((arg) => arg !== "\n")).toEqual([
            "AA size: ",
            "3",
            "AA keys size: ",
            "3",
            "AA items size: ",
            "3",
            "can delete elements: ",
            "true",
            "can look up elements: ",
            "true",
            "can look up elements (brackets): ",
            "true",
            "can check for existence: ",
            "true",
            "items() example key: ",
            "bar",
            "items() example value: ",
            "5",
            "key is not found if sensitive mode is enabled",
            "false",
            "key exits with correct casing",
            "value1",
            "lookup uses mode case too",
            "value1",
            "can empty itself: ",
            "true",
        ]);
    });

    test("components/roDateTime.brs", async () => {
        await execute([resourceFile("components", "roDateTime.brs")], outputStreams);

        expect(allArgs(outputStreams.stdout.write).filter((arg) => arg !== "\n")).toEqual([
            "Full Date: ",
            "Friday November 12, 2010",
            "No Week Day: ",
            "November 12, 2010",
            "Short Date: ",
            "11/12/10",
            "Weekday: ",
            "Friday",
            "Day of Week: ",
            "5",
            "Day of Month: ",
            "12",
            "Month: ",
            "11",
            "Year: ",
            "2010",
            "Hours: ",
            "13",
            "Minutes: ",
            "14",
            "Seconds: ",
            "15",
            "Last Day of Month: ",
            "30",
            "Milliseconds: ",
            "160",
            "ISO String UTC: ",
            "2010-11-12T13:14:15Z",
        ]);
    });

    test("components/roTimespan.brs", async () => {
        await execute([resourceFile("components", "roTimespan.brs")], outputStreams);

        expect(allArgs(outputStreams.stdout.write).filter((arg) => arg !== "\n")).toEqual([
            "can return seconds from date until now: ",
            "373447701",
            "can return 2077252342 for date that can't be parsed: ",
            "2077252342",
        ]);
    });

    test("components/roSGNode.brs", async () => {
        await execute([resourceFile("components", "roSGNode.brs")], outputStreams);

        expect(allArgs(outputStreams.stdout.write).filter((arg) => arg !== "\n")).toEqual([
            "node size: ",
            "7",
            "node keys size: ",
            "7",
            "node items size: ",
            "7",
            "can delete elements: ",
            "true",
            "can look up elements: ",
            "true",
            "can look up elements (brackets): ",
            "true",
            "can check for existence: ",
            "true",
            "can empty itself: ",
            "true",
            //ifNodeField tests
            "node size: ",
            "3",
            "node size: ",
            "2",
            "field3 in node is: ",
            "false",
            "field3 in node now is: ",
            "true",
            "field1 in node now is: ",
            "hello",
            "field3 in node now is: ",
            "false",
            "field3 present? ",
            "true",
            "fieldほ present? ",
            "false",
            "callback 1 called",
            "callback 2 called",
            "field 3 updated",
            //ifNodeChildren tests
            "parent child count: ",
            "0",
            "get same parent from child: ",
            "true",
            "parent child count: ",
            "1",
            "parent child count: ",
            "2",
            "parent child count: ",
            "3",
            "parent child count: ",
            "2",
            "children size: ",
            "2",
            "first child id after replacing: ",
            "new node",
            "parent child count: ",
            "2",
            "parent child count: ",
            "2",
            "parent child count: ",
            "0",
            "parent child count: ",
            "3",
            "parent child count: ",
            "0",
            "parent child count: ",
            "2",
            "parent child count: ",
            "3",
            "parent child count: ",
            "4",
            "parent child count: ",
            "4",
            "parent child count: ",
            "6",
            "parent child count: ",
            "4",
            "inserted child id: ",
            "new node",
            "parent child count: ",
            "4",
            "new parent id: ",
            "new node",
            //ifSGNodeFocus tests
            "is parent in focus chain: ",
            "false",
            "is parent in focus chain: ",
            "true",
            "does grand child1 have focus: ",
            "true",
            "does grand child1 still have focus: ",
            "false",
            "does child2 have focus: ",
            "true",
            //ifNodeDict tests
            "find node that does not exist: ",
            "invalid",
            "node finds itself: ",
            "current",
            "node finds one of its children: ",
            "Child",
            "node finds its grandchild: ",
            "Grandchild",
            "node finds its sibling: ",
            "sibling-c7",
            "node finds a cousin node: ",
            "Cousin-2",
            "node finds its grandparent: ",
            "root-node",
            "is same node returns true:",
            "true",
            "is same node returns false:",
            "false",
            "Node subtype is returned:",
            "Node",
            "updatedId",
            "invalid",
            "updatedId",
            "newValue",
            "updatedId",
            "invalid",
            "33",
            "37",
        ]);
    });

    test("components/roRegex.brs", async () => {
        await execute([resourceFile("components", "roRegex.brs")], outputStreams);

        expect(allArgs(outputStreams.stdout.write).filter((arg) => arg !== "\n")).toEqual([
            "HeLlO_123_WoRlD is match of hello_[0-9]*_world: ",
            "true",
            "goodbye_123_WoRlD isn't match of hello_[0-9]*_world: ",
            "true",
            "Replacing ',' in 2019,03,26 by '-' on first occurrence: ",
            "2019-03,26",
            "Replacing ',' in 2019,03,26 by '-' on all occurrences: ",
            "2019-03-26",
            "Split by ',': [ ",
            "2019",
            " ",
            "03",
            " ",
            "26",
            " ]",
            "First match: [ ",
            "123",
            " ]",
            "All matches: [ ",
            "[ ",
            "123",
            " ]",
            "[ ",
            "456",
            " ]",
            "[ ",
            "789",
            " ]",
            " ]",
        ]);
    });

    test("components/roString.brs", async () => {
        await execute([resourceFile("components", "roString.brs")], outputStreams);

        expect(allArgs(outputStreams.stderr.write)).toEqual([]);
        expect(allArgs(outputStreams.stdout.write).filter((arg) => arg !== "\n")).toEqual([
            "bar",
            "bar",
            "true", // comparison
            "5", // length
            "b", // split("/")[1]
            "%F0%9F%90%B6", // dog emoji, uri-encoded
            "🐶", // uri-encoded dog emoji, decoded
        ]);
    });

    test("components/customComponent.brs", async () => {
        await execute([resourceFile("components", "customComponent.brs")], outputStreams);

        expect(allArgs(outputStreams.stdout.write).filter((arg) => arg !== "\n")).toEqual([
            "node.baseBoolField: ",
            "false",
            "node.baseIntField: ",
            "0",
            "node.normalBoolField: ",
            "true",
            "node.advancedStringField: ",
            "advancedField!",
            "node.advancedIntField: ",
            "12345",
            "node child count is: ",
            "6",
            "child id is: ",
            "normalLabel",
            "otherNode child count is: ",
            "3",
            "anotherNode child count is: ",
            "1",
            "baseRectangle width: ",
            "100",
            "baseRectangle height: ",
            "200",
        ]);
    });

    test("components/componentExtension.brs", async () => {
        let consoleWarningSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

        await execute([resourceFile("components", "componentExtension.brs")], outputStreams);

        expect(allArgs(outputStreams.stdout.write).filter((arg) => arg !== "\n")).toEqual([
            "BaseChild init",
            "BaseComponent init",
            "ExtendedComponent start",
            "ExtendedChild init",
            "ExtendedComponent init",
            "ExtendedComponent start",
        ]);

        let warning = allArgs(consoleWarningSpy)
            .filter((arg) => arg !== "\n")[0]
            .split("Warning: ")[1]
            .trim();
        expect(warning).toEqual(`"nonImplementedSub" was not found in scope.`);
        consoleWarningSpy.mockRestore();
    });

    test("components/roIntrinsics.brs", async () => {
        await execute([resourceFile("components", "roIntrinsics.brs")], outputStreams);

        expect(allArgs(outputStreams.stderr.write)).toEqual([]);
        expect(allArgs(outputStreams.stdout.write).filter((arg) => arg !== "\n")).toEqual([
            "Boolean object A ",
            "true",
            "Boolean object B ",
            "false",
            "Comparing true = false should be false ",
            "false",
            "Double value ",
            "123.456",
            "Double value * 2 ",
            "246.912",
            "Float object ",
            "789.012",
            "Float object * 10 ",
            "7890.12",
            "Integer object ",
            "23",
            "Integer object times itself ",
            "529",
            "Double to string ",
            "123.456",
            "Float to string ",
            "789.012",
            "Integer to string ",
            "23",
        ]);
    });

    test("components/roInvalid.brs", async () => {
        await execute([resourceFile("components", "roInvalid.brs")], outputStreams);

        expect(allArgs(outputStreams.stderr.write)).toEqual([]);
        expect(allArgs(outputStreams.stdout.write).filter((arg) => arg !== "\n")).toEqual([
            "roInvalid",
            "<Component: roInvalid>",
            "invalid",
            "true",
        ]);
    });

    test("components/Group.brs", async () => {
        await execute([resourceFile("components", "Group.brs")], outputStreams);

        expect(allArgs(outputStreams.stdout.write).filter((arg) => arg !== "\n")).toEqual([
            "group node type:",
            "Node",
            "group node subtype:",
            "Group",
            "group node visible:",
            "true",
            "group node opacity:",
            "1",
            "extended group node type:",
            "Node",
            "extended group node subtype:",
            "ExtendedGroup",
            "extended group node visible:",
            "true",
            "extended group node opacity:",
            "1",
            "group as child node rotation:",
            "0.2",
        ]);
    });

    test("components/LayoutGroup.brs", async () => {
        await execute([resourceFile("components", "LayoutGroup.brs")], outputStreams);

        expect(allArgs(outputStreams.stdout.write).filter((arg) => arg !== "\n")).toEqual([
            "layoutGroup node type:",
            "Node",
            "layoutGroup node subtype:",
            "LayoutGroup",
            "layoutGroup node layoutDirection:",
            "vert",
            "layoutGroup node horizAlignment:",
            "left",
            "layoutGroup as child layoutDirection:",
            "horiz",
            "layoutGroup as child horizAlignment:",
            "right",
        ]);
    });

    test("components/Rectangle.brs", async () => {
        await execute([resourceFile("components", "Rectangle.brs")], outputStreams);

        expect(allArgs(outputStreams.stdout.write).filter((arg) => arg !== "\n")).toEqual([
            "rectangle node type:",
            "Node",
            "rectangle node subtype:",
            "Rectangle",
            "rectangle node width:",
            "0",
            "rectangle node height:",
            "0",
            "rectangle as child width:",
            "500",
            "rectangle as child height:",
            "50",
        ]);
    });

    test("components/Label.brs", async () => {
        await execute([resourceFile("components", "Label.brs")], outputStreams);

        expect(allArgs(outputStreams.stdout.write).filter((arg) => arg !== "\n")).toEqual([
            "label node type:",
            "Node",
            "label node subtype:",
            "Label",
            "label node horizAlign:",
            "left",
            "label node numLines:",
            "0",
            "label as child numLines:",
            "10",
            "label as child wrap:",
            "true",
            "label as child lineSpacing:",
            "5.5",
        ]);
    });

    test("components/Timer.brs", async () => {
        await execute([resourceFile("components", "Timer.brs")], outputStreams);

        expect(allArgs(outputStreams.stdout.write).filter((arg) => arg !== "\n")).toEqual([
            "timer node type:",
            "Node",
            "timer node subtype:",
            "Timer",
            "timer node control:",
            "",
            "timer node repeat:",
            "false",
            "timer node duration:",
            "0",
            "timer node fire:",
            "<UNINITIALIZED>",
        ]);
    });

    test("components/Font.brs", async () => {
        await execute([resourceFile("components", "Font.brs")], outputStreams);

        expect(allArgs(outputStreams.stdout.write).filter((arg) => arg !== "\n")).toEqual([
            "font node type:",
            "Node",
            "font node subtype:",
            "Font",
            "font node uri:",
            "",
            "font node size:",
            "1",
            "font node fallbackGlyph:",
            "",
            "font as child size:",
            "56",
            "font as child uri:",
            "font/as/child/uri",
        ]);
    });

    test("components/Poster.brs", async () => {
        await execute([resourceFile("components", "Poster.brs")], outputStreams);

        expect(allArgs(outputStreams.stdout.write).filter((arg) => arg !== "\n")).toEqual([
            "poster node type:",
            "Node",
            "poster node subtype:",
            "Poster",
            "poster node width:",
            "0",
            "poster node height:",
            "0",
            "poster as child audioGuideText:",
            "fake text",
            "poster as child uri:",
            "/fake/uri",
            "poster as child bitmapWidth:",
            "10.4",
        ]);
    });

    test("components/ArrayGrid.brs", async () => {
        await execute([resourceFile("components", "ArrayGrid.brs")], outputStreams);

        expect(allArgs(outputStreams.stdout.write).filter((arg) => arg !== "\n")).toEqual([
            "arraygrid node type:",
            "Node",
            "arraygrid node subtype:",
            "ArrayGrid",
            "arraygrid node focusRow:",
            "0",
            "arraygrid node jumpToItem:",
            "0",
            "arraygrid as child wrapDividerWidth",
            "1.23",
            "arraygrid as child numRows",
            "5",
        ]);
    });

    test("components/MarkupGrid.brs", async () => {
        await execute([resourceFile("components", "MarkupGrid.brs")], outputStreams);

        expect(allArgs(outputStreams.stdout.write).filter((arg) => arg !== "\n")).toEqual([
            "markupgrid node type:",
            "Node",
            "markupgrid node subtype:",
            "MarkupGrid",
            "markupgrid node numRows:",
            "12",
            "markupgrid node sectionDividerMinWidth:",
            "117",
            "markupgridAsChild numColumns:",
            "10",
            "markupgridAsChild fixedLayout:",
            "true",
        ]);
    });

    test("components/scripts/FieldChangeMain.brs", async () => {
        await execute(
            [resourceFile("components", "scripts", "FieldChangeMain.brs")],
            outputStreams
        );

        expect(allArgs(outputStreams.stdout.write).filter((arg) => arg !== "\n")).toEqual([
            // inheritance/overrides
            "runner: node childHandled text field value before modifying:",
            "childHandled initial",
            "child: text field changed. new value:",
            "childHandled modified",
            "runner: node childHandled text field value after modifying:",
            "childHandled modified",
            "runner: node parentHandled text field value before modifying:",
            "parentHandled initial",
            "parent: parentHandled text field changed",
            "parentHandled modified",
            "runner: node parentHandled text field value after modifying:",
            "parentHandled modified",

            // onChange with an event
            "runner: modifying intField",
            "child: event",
            "<Component: roSGNodeEvent>",
            "child: event.getData()",
            "123",
            "child: event.getField()",
            "intField",
            "child: event.getRoSGNode().subtype()",
            "FieldChangeComponent",
            "child: event.getNode()",
            "id-field-change",

            // changing a field multiple times
            "child: current event:",
            "123",
            "child: previous event:",
            "123",
            "child: current event:",
            "456",
        ]);
    });

    test("components/scripts/CallFuncMain.brs", async () => {
        await execute([resourceFile("components", "scripts", "CallFuncMain.brs")], outputStreams);

        expect(allArgs(outputStreams.stdout.write).filter((arg) => arg !== "\n")).toEqual([
            "component: inside componentFunction, args.test: ",
            "123",
            "component: componentField:",
            "componentField value",
            "component: mainField:",
            "invalid",
            "main: componentFunction return value success:",
            "true",
            "component: inside componentVoidFunction",
            "main: componentVoidFunction return value:",
            "invalid",
            "main: componentPrivateFunction return value:",
            "invalid",
        ]);

        expect(allArgs(outputStreams.stderr.write).filter((arg) => arg !== "\n")).toEqual([
            "Warning calling function in CallFuncComponent: no function interface specified for componentPrivateFunction",
        ]);
    });

    test("components/ContentNode.brs", async () => {
        await execute([resourceFile("components", "scripts", "ContentNode.brs")], outputStreams);

        expect(allArgs(outputStreams.stdout.write).filter((arg) => arg !== "\n")).toEqual([
            "contentnode node type:",
            "Node",
            "contentnode node subtype:",
            "ContentNode",
            "contentnode.ContentType:",
            "",
            "contentnode.TargetRotation:",
            "0",
            "contentnodeAsChild.episodeNumber:",
            "10",
            "contentnodeAsChild.subtitleUrl:",
            "subtitle.example.com",
        ]);
    });

    test("components/scripts/ComponentFields.brs", async () => {
        await execute(
            [resourceFile("components", "scripts", "ComponentFields.brs")],
            outputStreams
        );

        expect(allArgs(outputStreams.stdout.write).filter((arg) => arg !== "\n")).toEqual([
            "bar",
            "invalid",
            "invalid",
            "Node",
        ]);
    });
<<<<<<< HEAD
=======

    test("components/scripts/MockFunctionsMain.brs", async () => {
        await execute(
            [resourceFile("components", "scripts", "MockFunctionsMain.brs")],
            outputStreams
        );
        expect(allArgs(outputStreams.stdout.write).filter((arg) => arg !== "\n")).toEqual([
            "{fake:'json'}",
            "GET status: 400",
            "POST status: 500",
            "true",
            "{real: 'json'}",
            "GET status: 200",
            "POST status: 200",
            "false",
        ]);
    });

    test("components/roDeviceInfo.brs", async () => {
        process.env.TZ = "PST";
        process.env.LOCALE = "en_US";

        await execute([resourceFile("components", "roDeviceInfo.brs")], outputStreams);
        expect(allArgs(outputStreams.stdout.write).filter((arg) => arg !== "\n")).toEqual([
            "4280x",
            "Roku 4 XD",
            "TV",
            "Roku",
            "5000x",
            "",
            "71",
            "Roku 5000X, Serial Number: 12121212121212",
            "9",
            "2",
            "6",
            "4127",
            "034.08E01185A",
            "123e4567-e89b-12d3-a456-426655440000",
            "true",
            "123e4567-e89b-12d3-a456-426655440000",
            "en_US",
            "123e4567-e89b-12d3-a456-426655440000",
            "PST",
            "true",
            "en_US",
            "en_US",
            "eng",
            "360",
            "tee;ss",
            "false",
            "true",
            "false",
            "2",
            "On",
            "true",
            "Default",
            "12h",
            "Event notifications are enabled",
            "Screen saver exit event notifications are enabled",
            "lowGeneralMemoryLevel event notifications are enabled",
            "normal",
            "true",
            "true",
            "true",
            "WiFi Connection",
            "192.0.0.101",
            "192.0.0.101",
            "WiFi Connection",
            "Connection Interface",
            "192.0.0.101",
            "ssid",
            "gateway",
            "dns.0",
            "dns.1",
            "HDTV",
            "1080p",
            "16x9",
            "720",
            "1280",
            "1280x720",
            "1200cm",
            "1200cm",
            "2880",
            "1880",
            "120 cm",
            "true",
            "true",
            "false",
            "level;profile",
            "mpeg4 avc",
            "4.1",
            "HD",
            "1920",
            "1080",
            "opengl",
            "Codec event notifications are enabled",
            "5.1 surround",
            "8:6:0:1",
            "8:6:0:1",
            "8:6:0:1",
            "true",
            "100",
            "Audio guide is enabled",
            "Audio guide change event notifications are enabled",
        ]);
    });
>>>>>>> add e2e tests WIP
});
