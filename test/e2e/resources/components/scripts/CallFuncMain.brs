sub Main()
    m.mainField = "mainField value"
    node = createObject("RoSGNode", "CallFuncComponent")
    
    m.componentField = "componentField modified value"

    result = node.callFunc("componentFunction", { test: 123 })
    print "main: componentFunction return value success:" result.success

    voidResult = node.callFunc("componentVoidFunction")
    print "main: componentVoidFunction return value:" voidResult
end sub
