import cloneDeep from 'lodash/cloneDeep';
export function convertSchemaToDraft6(schema, options = {}) {
    let draft = options.draft || null;
    let changed = options.changed || false;
    if (typeof schema !== 'object') {
        return schema;
    }
    if (typeof schema.map === 'function') {
        return [...schema.map(subSchema => convertSchemaToDraft6(subSchema, { changed, draft }))];
    }
    let newSchema = { ...schema };
    const simpleTypes = ['array', 'boolean', 'integer', 'null', 'number', 'object', 'string'];
    if (typeof newSchema.$schema === 'string' &&
        /http\:\/\/json\-schema\.org\/draft\-0\d\/schema\#/.test(newSchema.$schema)) {
        draft = newSchema.$schema[30];
    }
    // Convert v1-v2 'contentEncoding' to 'media.binaryEncoding'
    // Note: This is only used in JSON hyper-schema (not regular JSON schema)
    if (newSchema.contentEncoding) {
        newSchema.media = { binaryEncoding: newSchema.contentEncoding };
        delete newSchema.contentEncoding;
        changed = true;
    }
    // Convert v1-v3 'extends' to 'allOf'
    if (typeof newSchema.extends === 'object') {
        newSchema.allOf = typeof newSchema.extends.map === 'function' ?
            newSchema.extends.map(subSchema => convertSchemaToDraft6(subSchema, { changed, draft })) :
            [convertSchemaToDraft6(newSchema.extends, { changed, draft })];
        delete newSchema.extends;
        changed = true;
    }
    // Convert v1-v3 'disallow' to 'not'
    if (newSchema.disallow) {
        if (typeof newSchema.disallow === 'string') {
            newSchema.not = { type: newSchema.disallow };
        }
        else if (typeof newSchema.disallow.map === 'function') {
            newSchema.not = {
                anyOf: newSchema.disallow
                    .map(type => typeof type === 'object' ? type : { type })
            };
        }
        delete newSchema.disallow;
        changed = true;
    }
    // Convert v3 string 'dependencies' properties to arrays
    if (typeof newSchema.dependencies === 'object' &&
        Object.keys(newSchema.dependencies)
            .some(key => typeof newSchema.dependencies[key] === 'string')) {
        newSchema.dependencies = { ...newSchema.dependencies };
        Object.keys(newSchema.dependencies)
            .filter(key => typeof newSchema.dependencies[key] === 'string')
            .forEach(key => newSchema.dependencies[key] = [newSchema.dependencies[key]]);
        changed = true;
    }
    // Convert v1 'maxDecimal' to 'multipleOf'
    if (typeof newSchema.maxDecimal === 'number') {
        newSchema.multipleOf = 1 / Math.pow(10, newSchema.maxDecimal);
        delete newSchema.divisibleBy;
        changed = true;
        if (!draft || draft === 2) {
            draft = 1;
        }
    }
    // Convert v2-v3 'divisibleBy' to 'multipleOf'
    if (typeof newSchema.divisibleBy === 'number') {
        newSchema.multipleOf = newSchema.divisibleBy;
        delete newSchema.divisibleBy;
        changed = true;
    }
    // Convert v1-v2 boolean 'minimumCanEqual' to 'exclusiveMinimum'
    if (typeof newSchema.minimum === 'number' && newSchema.minimumCanEqual === false) {
        newSchema.exclusiveMinimum = newSchema.minimum;
        delete newSchema.minimum;
        changed = true;
        if (!draft) {
            draft = 2;
        }
    }
    else if (typeof newSchema.minimumCanEqual === 'boolean') {
        delete newSchema.minimumCanEqual;
        changed = true;
        if (!draft) {
            draft = 2;
        }
    }
    // Convert v3-v4 boolean 'exclusiveMinimum' to numeric
    if (typeof newSchema.minimum === 'number' && newSchema.exclusiveMinimum === true) {
        newSchema.exclusiveMinimum = newSchema.minimum;
        delete newSchema.minimum;
        changed = true;
    }
    else if (typeof newSchema.exclusiveMinimum === 'boolean') {
        delete newSchema.exclusiveMinimum;
        changed = true;
    }
    // Convert v1-v2 boolean 'maximumCanEqual' to 'exclusiveMaximum'
    if (typeof newSchema.maximum === 'number' && newSchema.maximumCanEqual === false) {
        newSchema.exclusiveMaximum = newSchema.maximum;
        delete newSchema.maximum;
        changed = true;
        if (!draft) {
            draft = 2;
        }
    }
    else if (typeof newSchema.maximumCanEqual === 'boolean') {
        delete newSchema.maximumCanEqual;
        changed = true;
        if (!draft) {
            draft = 2;
        }
    }
    // Convert v3-v4 boolean 'exclusiveMaximum' to numeric
    if (typeof newSchema.maximum === 'number' && newSchema.exclusiveMaximum === true) {
        newSchema.exclusiveMaximum = newSchema.maximum;
        delete newSchema.maximum;
        changed = true;
    }
    else if (typeof newSchema.exclusiveMaximum === 'boolean') {
        delete newSchema.exclusiveMaximum;
        changed = true;
    }
    // Search object 'properties' for 'optional', 'required', and 'requires' items,
    // and convert them into object 'required' arrays and 'dependencies' objects
    if (typeof newSchema.properties === 'object') {
        const properties = { ...newSchema.properties };
        const requiredKeys = Array.isArray(newSchema.required) ?
            new Set(newSchema.required) : new Set();
        // Convert v1-v2 boolean 'optional' properties to 'required' array
        if (draft === 1 || draft === 2 ||
            Object.keys(properties).some(key => properties[key].optional === true)) {
            Object.keys(properties)
                .filter(key => properties[key].optional !== true)
                .forEach(key => requiredKeys.add(key));
            changed = true;
            if (!draft) {
                draft = 2;
            }
        }
        // Convert v3 boolean 'required' properties to 'required' array
        if (Object.keys(properties).some(key => properties[key].required === true)) {
            Object.keys(properties)
                .filter(key => properties[key].required === true)
                .forEach(key => requiredKeys.add(key));
            changed = true;
        }
        if (requiredKeys.size) {
            newSchema.required = Array.from(requiredKeys);
        }
        // Convert v1-v2 array or string 'requires' properties to 'dependencies' object
        if (Object.keys(properties).some(key => properties[key].requires)) {
            const dependencies = typeof newSchema.dependencies === 'object' ?
                { ...newSchema.dependencies } : {};
            Object.keys(properties)
                .filter(key => properties[key].requires)
                .forEach(key => dependencies[key] =
                typeof properties[key].requires === 'string' ?
                    [properties[key].requires] : properties[key].requires);
            newSchema.dependencies = dependencies;
            changed = true;
            if (!draft) {
                draft = 2;
            }
        }
        newSchema.properties = properties;
    }
    // Revove v1-v2 boolean 'optional' key
    if (typeof newSchema.optional === 'boolean') {
        delete newSchema.optional;
        changed = true;
        if (!draft) {
            draft = 2;
        }
    }
    // Revove v1-v2 'requires' key
    if (newSchema.requires) {
        delete newSchema.requires;
    }
    // Revove v3 boolean 'required' key
    if (typeof newSchema.required === 'boolean') {
        delete newSchema.required;
    }
    // Convert id to $id
    if (typeof newSchema.id === 'string' && !newSchema.$id) {
        if (newSchema.id.slice(-1) === '#') {
            newSchema.id = newSchema.id.slice(0, -1);
        }
        newSchema.$id = newSchema.id + '-CONVERTED-TO-DRAFT-06#';
        delete newSchema.id;
        changed = true;
    }
    // Check if v1-v3 'any' or object types will be converted
    if (newSchema.type && (typeof newSchema.type.every === 'function' ?
        !newSchema.type.every(type => simpleTypes.includes(type)) :
        !simpleTypes.includes(newSchema.type))) {
        changed = true;
    }
    // If schema changed, update or remove $schema identifier
    if (typeof newSchema.$schema === 'string' &&
        /http\:\/\/json\-schema\.org\/draft\-0[1-4]\/schema\#/.test(newSchema.$schema)) {
        newSchema.$schema = 'http://json-schema.org/draft-06/schema#';
        changed = true;
    }
    else if (changed && typeof newSchema.$schema === 'string') {
        const addToDescription = 'Converted to draft 6 from ' + newSchema.$schema;
        if (typeof newSchema.description === 'string' && newSchema.description.length) {
            newSchema.description += '\n' + addToDescription;
        }
        else {
            newSchema.description = addToDescription;
        }
        delete newSchema.$schema;
    }
    // Convert v1-v3 'any' and object types
    if (newSchema.type && (typeof newSchema.type.every === 'function' ?
        !newSchema.type.every(type => simpleTypes.includes(type)) :
        !simpleTypes.includes(newSchema.type))) {
        if (newSchema.type.length === 1) {
            newSchema.type = newSchema.type[0];
        }
        if (typeof newSchema.type === 'string') {
            // Convert string 'any' type to array of all standard types
            if (newSchema.type === 'any') {
                newSchema.type = simpleTypes;
                // Delete non-standard string type
            }
            else {
                delete newSchema.type;
            }
        }
        else if (typeof newSchema.type === 'object') {
            if (typeof newSchema.type.every === 'function') {
                // If array of strings, only allow standard types
                if (newSchema.type.every(type => typeof type === 'string')) {
                    newSchema.type = newSchema.type.some(type => type === 'any') ?
                        newSchema.type = simpleTypes :
                        newSchema.type.filter(type => simpleTypes.includes(type));
                    // If type is an array with objects, convert the current schema to an 'anyOf' array
                }
                else if (newSchema.type.length > 1) {
                    const arrayKeys = ['additionalItems', 'items', 'maxItems', 'minItems', 'uniqueItems', 'contains'];
                    const numberKeys = ['multipleOf', 'maximum', 'exclusiveMaximum', 'minimum', 'exclusiveMinimum'];
                    const objectKeys = ['maxProperties', 'minProperties', 'required', 'additionalProperties',
                        'properties', 'patternProperties', 'dependencies', 'propertyNames'];
                    const stringKeys = ['maxLength', 'minLength', 'pattern', 'format'];
                    const filterKeys = {
                        'array': [...numberKeys, ...objectKeys, ...stringKeys],
                        'integer': [...arrayKeys, ...objectKeys, ...stringKeys],
                        'number': [...arrayKeys, ...objectKeys, ...stringKeys],
                        'object': [...arrayKeys, ...numberKeys, ...stringKeys],
                        'string': [...arrayKeys, ...numberKeys, ...objectKeys],
                        'all': [...arrayKeys, ...numberKeys, ...objectKeys, ...stringKeys],
                    };
                    const anyOf = [];
                    for (const type of newSchema.type) {
                        const newType = typeof type === 'string' ? { type } : { ...type };
                        Object.keys(newSchema)
                            .filter(key => !newType.hasOwnProperty(key) &&
                            ![...(filterKeys[newType.type] || filterKeys.all), 'type', 'default']
                                .includes(key))
                            .forEach(key => newType[key] = newSchema[key]);
                        anyOf.push(newType);
                    }
                    newSchema = newSchema.hasOwnProperty('default') ?
                        { anyOf, default: newSchema.default } : { anyOf };
                    // If type is an object, merge it with the current schema
                }
                else {
                    const typeSchema = newSchema.type;
                    delete newSchema.type;
                    Object.assign(newSchema, typeSchema);
                }
            }
        }
        else {
            delete newSchema.type;
        }
    }
    // Convert sub schemas
    Object.keys(newSchema)
        .filter(key => typeof newSchema[key] === 'object')
        .forEach(key => {
        if (['definitions', 'dependencies', 'properties', 'patternProperties']
            .includes(key) && typeof newSchema[key].map !== 'function') {
            const newKey = {};
            Object.keys(newSchema[key]).forEach(subKey => newKey[subKey] =
                convertSchemaToDraft6(newSchema[key][subKey], { changed, draft }));
            newSchema[key] = newKey;
        }
        else if (['items', 'additionalItems', 'additionalProperties',
            'allOf', 'anyOf', 'oneOf', 'not'].includes(key)) {
            newSchema[key] = convertSchemaToDraft6(newSchema[key], { changed, draft });
        }
        else {
            newSchema[key] = cloneDeep(newSchema[key]);
        }
    });
    return newSchema;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udmVydC1zY2hlbWEtdG8tZHJhZnQ2LmZ1bmN0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvYWpzZi1jb3JlL3NyYy9saWIvc2hhcmVkL2NvbnZlcnQtc2NoZW1hLXRvLWRyYWZ0Ni5mdW5jdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLFNBQVMsTUFBTSxrQkFBa0IsQ0FBQztBQW1CekMsTUFBTSxVQUFVLHFCQUFxQixDQUFDLE1BQU0sRUFBRSxVQUF3QixFQUFFO0lBQ3RFLElBQUksS0FBSyxHQUFXLE9BQU8sQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDO0lBQzFDLElBQUksT0FBTyxHQUFZLE9BQU8sQ0FBQyxPQUFPLElBQUksS0FBSyxDQUFDO0lBRWhELElBQUksT0FBTyxNQUFNLEtBQUssUUFBUSxFQUFFO1FBQUUsT0FBTyxNQUFNLENBQUM7S0FBRTtJQUNsRCxJQUFJLE9BQU8sTUFBTSxDQUFDLEdBQUcsS0FBSyxVQUFVLEVBQUU7UUFDcEMsT0FBTyxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLHFCQUFxQixDQUFDLFNBQVMsRUFBRSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUMzRjtJQUNELElBQUksU0FBUyxHQUFHLEVBQUUsR0FBRyxNQUFNLEVBQUUsQ0FBQztJQUM5QixNQUFNLFdBQVcsR0FBRyxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBRTFGLElBQUksT0FBTyxTQUFTLENBQUMsT0FBTyxLQUFLLFFBQVE7UUFDdkMsbURBQW1ELENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFDM0U7UUFDQSxLQUFLLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FB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ZW50IjpbImltcG9ydCBjbG9uZURlZXAgZnJvbSAnbG9kYXNoL2Nsb25lRGVlcCc7XHJcblxyXG4vKipcclxuICogJ2NvbnZlcnRTY2hlbWFUb0RyYWZ0NicgZnVuY3Rpb25cclxuICpcclxuICogQ29udmVydHMgYSBKU09OIFNjaGVtYSBmcm9tIGRyYWZ0IDEgdGhyb3VnaCA0IGZvcm1hdCB0byBkcmFmdCA2IGZvcm1hdFxyXG4gKlxyXG4gKiBJbnNwaXJlZCBieSBvbiBnZXJhaW50bHVmZidzIEpTT04gU2NoZW1hIDMgdG8gNCBjb21wYXRpYmlsaXR5IGZ1bmN0aW9uOlxyXG4gKiAgIGh0dHBzOi8vZ2l0aHViLmNvbS9nZXJhaW50bHVmZi9qc29uLXNjaGVtYS1jb21wYXRpYmlsaXR5XHJcbiAqIEFsc28gdXNlcyBzdWdnZXN0aW9ucyBmcm9tIEFKVidzIEpTT04gU2NoZW1hIDQgdG8gNiBtaWdyYXRpb24gZ3VpZGU6XHJcbiAqICAgaHR0cHM6Ly9naXRodWIuY29tL2Vwb2JlcmV6a2luL2Fqdi9yZWxlYXNlcy90YWcvNS4wLjBcclxuICogQW5kIGFkZGl0aW9uYWwgZGV0YWlscyBmcm9tIHRoZSBvZmZpY2lhbCBKU09OIFNjaGVtYSBkb2N1bWVudGF0aW9uOlxyXG4gKiAgIGh0dHA6Ly9qc29uLXNjaGVtYS5vcmdcclxuICpcclxuICogLy8gIHsgb2JqZWN0IH0gb3JpZ2luYWxTY2hlbWEgLSBKU09OIHNjaGVtYSAoZHJhZnQgMSwgMiwgMywgNCwgb3IgNilcclxuICogLy8gIHsgT3B0aW9uT2JqZWN0ID0ge30gfSBvcHRpb25zIC0gb3B0aW9uczogcGFyZW50IHNjaGVtYSBjaGFuZ2VkPywgc2NoZW1hIGRyYWZ0IG51bWJlcj9cclxuICogLy8geyBvYmplY3QgfSAtIEpTT04gc2NoZW1hIChkcmFmdCA2KVxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBPcHRpb25PYmplY3QgeyBjaGFuZ2VkPzogYm9vbGVhbjsgZHJhZnQ/OiBudW1iZXI7IH1cclxuZXhwb3J0IGZ1bmN0aW9uIGNvbnZlcnRTY2hlbWFUb0RyYWZ0NihzY2hlbWEsIG9wdGlvbnM6IE9wdGlvbk9iamVjdCA9IHt9KSB7XHJcbiAgbGV0IGRyYWZ0OiBudW1iZXIgPSBvcHRpb25zLmRyYWZ0IHx8IG51bGw7XHJcbiAgbGV0IGNoYW5nZWQ6IGJvb2xlYW4gPSBvcHRpb25zLmNoYW5nZWQgfHwgZmFsc2U7XHJcblxyXG4gIGlmICh0eXBlb2Ygc2NoZW1hICE9PSAnb2JqZWN0JykgeyByZXR1cm4gc2NoZW1hOyB9XHJcbiAgaWYgKHR5cGVvZiBzY2hlbWEubWFwID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICByZXR1cm4gWy4uLnNjaGVtYS5tYXAoc3ViU2NoZW1hID0+IGNvbnZlcnRTY2hlbWFUb0RyYWZ0NihzdWJTY2hlbWEsIHsgY2hhbmdlZCwgZHJhZnQgfSkpXTtcclxuICB9XHJcbiAgbGV0IG5ld1NjaGVtYSA9IHsgLi4uc2NoZW1hIH07XHJcbiAgY29uc3Qgc2ltcGxlVHlwZXMgPSBbJ2FycmF5JywgJ2Jvb2xlYW4nLCAnaW50ZWdlcicsICdudWxsJywgJ251bWJlcicsICdvYmplY3QnLCAnc3RyaW5nJ107XHJcblxyXG4gIGlmICh0eXBlb2YgbmV3U2NoZW1hLiRzY2hlbWEgPT09ICdzdHJpbmcnICYmXHJcbiAgICAvaHR0cFxcOlxcL1xcL2pzb25cXC1zY2hlbWFcXC5vcmdcXC9kcmFmdFxcLTBcXGRcXC9zY2hlbWFcXCMvLnRlc3QobmV3U2NoZW1hLiRzY2hlbWEpXHJcbiAgKSB7XHJcbiAgICBkcmFmdCA9IG5ld1NjaGVtYS4kc2NoZW1hWzMwXTtcclxuICB9XHJcblxyXG4gIC8vIENvbnZlcnQgdjEtdjIgJ2NvbnRlbnRFbmNvZGluZycgdG8gJ21lZGlhLmJpbmFyeUVuY29kaW5nJ1xyXG4gIC8vIE5vdGU6IFRoaXMgaXMgb25seSB1c2VkIGluIEpTT04gaHlwZXItc2NoZW1hIChub3QgcmVndWxhciBKU09OIHNjaGVtYSlcclxuICBpZiAobmV3U2NoZW1hLmNvbnRlbnRFbmNvZGluZykge1xyXG4gICAgbmV3U2NoZW1hLm1lZGlhID0geyBiaW5hcnlFbmNvZGluZzogbmV3U2NoZW1hLmNvbnRlbnRFbmNvZGluZyB9O1xyXG4gICAgZGVsZXRlIG5ld1NjaGVtYS5jb250ZW50RW5jb2Rpbmc7XHJcbiAgICBjaGFuZ2VkID0gdHJ1ZTtcclxuICB9XHJcblxyXG4gIC8vIENvbnZlcnQgdjEtdjMgJ2V4dGVuZHMnIHRvICdhbGxPZidcclxuICBpZiAodHlwZW9mIG5ld1NjaGVtYS5leHRlbmRzID09PSAnb2JqZWN0Jykge1xyXG4gICAgbmV3U2NoZW1hLmFsbE9mID0gdHlwZW9mIG5ld1NjaGVtYS5leHRlbmRzLm1hcCA9PT0gJ2Z1bmN0aW9uJyA/XHJcbiAgICAgIG5ld1NjaGVtYS5leHRlbmRzLm1hcChzdWJTY2hlbWEgPT4gY29udmVydFNjaGVtYVRvRHJhZnQ2KHN1YlNjaGVtYSwgeyBjaGFuZ2VkLCBkcmFmdCB9KSkgOlxyXG4gICAgICBbY29udmVydFNjaGVtYVRvRHJhZnQ2KG5ld1NjaGVtYS5leHRlbmRzLCB7IGNoYW5nZWQsIGRyYWZ0IH0pXTtcclxuICAgIGRlbGV0ZSBuZXdTY2hlbWEuZXh0ZW5kcztcclxuICAgIGNoYW5nZWQgPSB0cnVlO1xyXG4gIH1cclxuXHJcbiAgLy8gQ29udmVydCB2MS12MyAnZGlzYWxsb3cnIHRvICdub3QnXHJcbiAgaWYgKG5ld1NjaGVtYS5kaXNhbGxvdykge1xyXG4gICAgaWYgKHR5cGVvZiBuZXdTY2hlbWEuZGlzYWxsb3cgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIG5ld1NjaGVtYS5ub3QgPSB7IHR5cGU6IG5ld1NjaGVtYS5kaXNhbGxvdyB9O1xyXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgbmV3U2NoZW1hLmRpc2FsbG93Lm1hcCA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICBuZXdTY2hlbWEubm90ID0ge1xyXG4gICAgICAgIGFueU9mOiBuZXdTY2hlbWEuZGlzYWxsb3dcclxuICAgICAgICAgIC5tYXAodHlwZSA9PiB0eXBlb2YgdHlwZSA9PT0gJ29iamVjdCcgPyB0eXBlIDogeyB0eXBlIH0pXHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgICBkZWxldGUgbmV3U2NoZW1hLmRpc2FsbG93O1xyXG4gICAgY2hhbmdlZCA9IHRydWU7XHJcbiAgfVxyXG5cclxuICAvLyBDb252ZXJ0IHYzIHN0cmluZyAnZGVwZW5kZW5jaWVzJyBwcm9wZXJ0aWVzIHRvIGFycmF5c1xyXG4gIGlmICh0eXBlb2YgbmV3U2NoZW1hLmRlcGVuZGVuY2llcyA9PT0gJ29iamVjdCcgJiZcclxuICAgIE9iamVjdC5rZXlzKG5ld1NjaGVtYS5kZXBlbmRlbmNpZXMpXHJcbiAgICAgIC5zb21lKGtleSA9PiB0eXBlb2YgbmV3U2NoZW1hLmRlcGVuZGVuY2llc1trZXldID09PSAnc3RyaW5nJylcclxuICApIHtcclxuICAgIG5ld1NjaGVtYS5kZXBlbmRlbmNpZXMgPSB7IC4uLm5ld1NjaGVtYS5kZXBlbmRlbmNpZXMgfTtcclxuICAgIE9iamVjdC5rZXlzKG5ld1NjaGVtYS5kZXBlbmRlbmNpZXMpXHJcbiAgICAgIC5maWx0ZXIoa2V5ID0+IHR5cGVvZiBuZXdTY2hlbWEuZGVwZW5kZW5jaWVzW2tleV0gPT09ICdzdHJpbmcnKVxyXG4gICAgICAuZm9yRWFjaChrZXkgPT4gbmV3U2NoZW1hLmRlcGVuZGVuY2llc1trZXldID0gW25ld1NjaGVtYS5kZXBlbmRlbmNpZXNba2V5XV0pO1xyXG4gICAgY2hhbmdlZCA9IHRydWU7XHJcbiAgfVxyXG5cclxuICAvLyBDb252ZXJ0IHYxICdtYXhEZWNpbWFsJyB0byAnbXVsdGlwbGVPZidcclxuICBpZiAodHlwZW9mIG5ld1NjaGVtYS5tYXhEZWNpbWFsID09PSAnbnVtYmVyJykge1xyXG4gICAgbmV3U2NoZW1hLm11bHRpcGxlT2YgPSAxIC8gTWF0aC5wb3coMTAsIG5ld1NjaGVtYS5tYXhEZWNpbWFsKTtcclxuICAgIGRlbGV0ZSBuZXdTY2hlbWEuZGl2aXNpYmxlQnk7XHJcbiAgICBjaGFuZ2VkID0gdHJ1ZTtcclxuICAgIGlmICghZHJhZnQgfHwgZHJhZnQgPT09IDIpIHsgZHJhZnQgPSAxOyB9XHJcbiAgfVxyXG5cclxuICAvLyBDb252ZXJ0IHYyLXYzICdkaXZpc2libGVCeScgdG8gJ211bHRpcGxlT2YnXHJcbiAgaWYgKHR5cGVvZiBuZXdTY2hlbWEuZGl2aXNpYmxlQnkgPT09ICdudW1iZXInKSB7XHJcbiAgICBuZXdTY2hlbWEubXVsdGlwbGVPZiA9IG5ld1NjaGVtYS5kaXZpc2libGVCeTtcclxuICAgIGRlbGV0ZSBuZXdTY2hlbWEuZGl2aXNpYmxlQnk7XHJcbiAgICBjaGFuZ2VkID0gdHJ1ZTtcclxuICB9XHJcblxyXG4gIC8vIENvbnZlcnQgdjEtdjIgYm9vbGVhbiAnbWluaW11bUNhbkVxdWFsJyB0byAnZXhjbHVzaXZlTWluaW11bSdcclxuICBpZiAodHlwZW9mIG5ld1NjaGVtYS5taW5pbXVtID09PSAnbnVtYmVyJyAmJiBuZXdTY2hlbWEubWluaW11bUNhbkVxdWFsID09PSBmYWxzZSkge1xyXG4gICAgbmV3U2NoZW1hLmV4Y2x1c2l2ZU1pbmltdW0gPSBuZXdTY2hlbWEubWluaW11bTtcclxuICAgIGRlbGV0ZSBuZXdTY2hlbWEubWluaW11bTtcclxuICAgIGNoYW5nZWQgPSB0cnVlO1xyXG4gICAgaWYgKCFkcmFmdCkgeyBkcmFmdCA9IDI7IH1cclxuICB9IGVsc2UgaWYgKHR5cGVvZiBuZXdTY2hlbWEubWluaW11bUNhbkVxdWFsID09PSAnYm9vbGVhbicpIHtcclxuICAgIGRlbGV0ZSBuZXdTY2hlbWEubWluaW11bUNhbkVxdWFsO1xyXG4gICAgY2hhbmdlZCA9IHRydWU7XHJcbiAgICBpZiAoIWRyYWZ0KSB7IGRyYWZ0ID0gMjsgfVxyXG4gIH1cclxuXHJcbiAgLy8gQ29udmVydCB2My12NCBib29sZWFuICdleGNsdXNpdmVNaW5pbXVtJyB0byBudW1lcmljXHJcbiAgaWYgKHR5cGVvZiBuZXdTY2hlbWEubWluaW11bSA9PT0gJ251bWJlcicgJiYgbmV3U2NoZW1hLmV4Y2x1c2l2ZU1pbmltdW0gPT09IHRydWUpIHtcclxuICAgIG5ld1NjaGVtYS5leGNsdXNpdmVNaW5pbXVtID0gbmV3U2NoZW1hLm1pbmltdW07XHJcbiAgICBkZWxldGUgbmV3U2NoZW1hLm1pbmltdW07XHJcbiAgICBjaGFuZ2VkID0gdHJ1ZTtcclxuICB9IGVsc2UgaWYgKHR5cGVvZiBuZXdTY2hlbWEuZXhjbHVzaXZlTWluaW11bSA9PT0gJ2Jvb2xlYW4nKSB7XHJcbiAgICBkZWxldGUgbmV3U2NoZW1hLmV4Y2x1c2l2ZU1pbmltdW07XHJcbiAgICBjaGFuZ2VkID0gdHJ1ZTtcclxuICB9XHJcblxyXG4gIC8vIENvbnZlcnQgdjEtdjIgYm9vbGVhbiAnbWF4aW11bUNhbkVxdWFsJyB0byAnZXhjbHVzaXZlTWF4aW11bSdcclxuICBpZiAodHlwZW9mIG5ld1NjaGVtYS5tYXhpbXVtID09PSAnbnVtYmVyJyAmJiBuZXdTY2hlbWEubWF4aW11bUNhbkVxdWFsID09PSBmYWxzZSkge1xyXG4gICAgbmV3U2NoZW1hLmV4Y2x1c2l2ZU1heGltdW0gPSBuZXdTY2hlbWEubWF4aW11bTtcclxuICAgIGRlbGV0ZSBuZXdTY2hlbWEubWF4aW11bTtcclxuICAgIGNoYW5nZWQgPSB0cnVlO1xyXG4gICAgaWYgKCFkcmFmdCkgeyBkcmFmdCA9IDI7IH1cclxuICB9IGVsc2UgaWYgKHR5cGVvZiBuZXdTY2hlbWEubWF4aW11bUNhbkVxdWFsID09PSAnYm9vbGVhbicpIHtcclxuICAgIGRlbGV0ZSBuZXdTY2hlbWEubWF4aW11bUNhbkVxdWFsO1xyXG4gICAgY2hhbmdlZCA9IHRydWU7XHJcbiAgICBpZiAoIWRyYWZ0KSB7IGRyYWZ0ID0gMjsgfVxyXG4gIH1cclxuXHJcbiAgLy8gQ29udmVydCB2My12NCBib29sZWFuICdleGNsdXNpdmVNYXhpbXVtJyB0byBudW1lcmljXHJcbiAgaWYgKHR5cGVvZiBuZXdTY2hlbWEubWF4aW11bSA9PT0gJ251bWJlcicgJiYgbmV3U2NoZW1hLmV4Y2x1c2l2ZU1heGltdW0gPT09IHRydWUpIHtcclxuICAgIG5ld1NjaGVtYS5leGNsdXNpdmVNYXhpbXVtID0gbmV3U2NoZW1hLm1heGltdW07XHJcbiAgICBkZWxldGUgbmV3U2NoZW1hLm1heGltdW07XHJcbiAgICBjaGFuZ2VkID0gdHJ1ZTtcclxuICB9IGVsc2UgaWYgKHR5cGVvZiBuZXdTY2hlbWEuZXhjbHVzaXZlTWF4aW11bSA9PT0gJ2Jvb2xlYW4nKSB7XHJcbiAgICBkZWxldGUgbmV3U2NoZW1hLmV4Y2x1c2l2ZU1heGltdW07XHJcbiAgICBjaGFuZ2VkID0gdHJ1ZTtcclxuICB9XHJcblxyXG4gIC8vIFNlYXJjaCBvYmplY3QgJ3Byb3BlcnRpZXMnIGZvciAnb3B0aW9uYWwnLCAncmVxdWlyZWQnLCBhbmQgJ3JlcXVpcmVzJyBpdGVtcyxcclxuICAvLyBhbmQgY29udmVydCB0aGVtIGludG8gb2JqZWN0ICdyZXF1aXJlZCcgYXJyYXlzIGFuZCAnZGVwZW5kZW5jaWVzJyBvYmplY3RzXHJcbiAgaWYgKHR5cGVvZiBuZXdTY2hlbWEucHJvcGVydGllcyA9PT0gJ29iamVjdCcpIHtcclxuICAgIGNvbnN0IHByb3BlcnRpZXMgPSB7IC4uLm5ld1NjaGVtYS5wcm9wZXJ0aWVzIH07XHJcbiAgICBjb25zdCByZXF1aXJlZEtleXMgPSBBcnJheS5pc0FycmF5KG5ld1NjaGVtYS5yZXF1aXJlZCkgP1xyXG4gICAgICBuZXcgU2V0KG5ld1NjaGVtYS5yZXF1aXJlZCkgOiBuZXcgU2V0KCk7XHJcblxyXG4gICAgLy8gQ29udmVydCB2MS12MiBib29sZWFuICdvcHRpb25hbCcgcHJvcGVydGllcyB0byAncmVxdWlyZWQnIGFycmF5XHJcbiAgICBpZiAoZHJhZnQgPT09IDEgfHwgZHJhZnQgPT09IDIgfHxcclxuICAgICAgT2JqZWN0LmtleXMocHJvcGVydGllcykuc29tZShrZXkgPT4gcHJvcGVydGllc1trZXldLm9wdGlvbmFsID09PSB0cnVlKVxyXG4gICAgKSB7XHJcbiAgICAgIE9iamVjdC5rZXlzKHByb3BlcnRpZXMpXHJcbiAgICAgICAgLmZpbHRlcihrZXkgPT4gcHJvcGVydGllc1trZXldLm9wdGlvbmFsICE9PSB0cnVlKVxyXG4gICAgICAgIC5mb3JFYWNoKGtleSA9PiByZXF1aXJlZEtleXMuYWRkKGtleSkpO1xyXG4gICAgICBjaGFuZ2VkID0gdHJ1ZTtcclxuICAgICAgaWYgKCFkcmFmdCkgeyBkcmFmdCA9IDI7IH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBDb252ZXJ0IHYzIGJvb2xlYW4gJ3JlcXVpcmVkJyBwcm9wZXJ0aWVzIHRvICdyZXF1aXJlZCcgYXJyYXlcclxuICAgIGlmIChPYmplY3Qua2V5cyhwcm9wZXJ0aWVzKS5zb21lKGtleSA9PiBwcm9wZXJ0aWVzW2tleV0ucmVxdWlyZWQgPT09IHRydWUpKSB7XHJcbiAgICAgIE9iamVjdC5rZXlzKHByb3BlcnRpZXMpXHJcbiAgICAgICAgLmZpbHRlcihrZXkgPT4gcHJvcGVydGllc1trZXldLnJlcXVpcmVkID09PSB0cnVlKVxyXG4gICAgICAgIC5mb3JFYWNoKGtleSA9PiByZXF1aXJlZEtleXMuYWRkKGtleSkpO1xyXG4gICAgICBjaGFuZ2VkID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAocmVxdWlyZWRLZXlzLnNpemUpIHsgbmV3U2NoZW1hLnJlcXVpcmVkID0gQXJyYXkuZnJvbShyZXF1aXJlZEtleXMpOyB9XHJcblxyXG4gICAgLy8gQ29udmVydCB2MS12MiBhcnJheSBvciBzdHJpbmcgJ3JlcXVpcmVzJyBwcm9wZXJ0aWVzIHRvICdkZXBlbmRlbmNpZXMnIG9iamVjdFxyXG4gICAgaWYgKE9iamVjdC5rZXlzKHByb3BlcnRpZXMpLnNvbWUoa2V5ID0+IHByb3BlcnRpZXNba2V5XS5yZXF1aXJlcykpIHtcclxuICAgICAgY29uc3QgZGVwZW5kZW5jaWVzID0gdHlwZW9mIG5ld1NjaGVtYS5kZXBlbmRlbmNpZXMgPT09ICdvYmplY3QnID9cclxuICAgICAgICB7IC4uLm5ld1NjaGVtYS5kZXBlbmRlbmNpZXMgfSA6IHt9O1xyXG4gICAgICBPYmplY3Qua2V5cyhwcm9wZXJ0aWVzKVxyXG4gICAgICAgIC5maWx0ZXIoa2V5ID0+IHByb3BlcnRpZXNba2V5XS5yZXF1aXJlcylcclxuICAgICAgICAuZm9yRWFjaChrZXkgPT4gZGVwZW5kZW5jaWVzW2tleV0gPVxyXG4gICAgICAgICAgdHlwZW9mIHByb3BlcnRpZXNba2V5XS5yZXF1aXJlcyA9PT0gJ3N0cmluZycgP1xyXG4gICAgICAgICAgICBbcHJvcGVydGllc1trZXldLnJlcXVpcmVzXSA6IHByb3BlcnRpZXNba2V5XS5yZXF1aXJlc1xyXG4gICAgICAgICk7XHJcbiAgICAgIG5ld1NjaGVtYS5kZXBlbmRlbmNpZXMgPSBkZXBlbmRlbmNpZXM7XHJcbiAgICAgIGNoYW5nZWQgPSB0cnVlO1xyXG4gICAgICBpZiAoIWRyYWZ0KSB7IGRyYWZ0ID0gMjsgfVxyXG4gICAgfVxyXG5cclxuICAgIG5ld1NjaGVtYS5wcm9wZXJ0aWVzID0gcHJvcGVydGllcztcclxuICB9XHJcblxyXG4gIC8vIFJldm92ZSB2MS12MiBib29sZWFuICdvcHRpb25hbCcga2V5XHJcbiAgaWYgKHR5cGVvZiBuZXdTY2hlbWEub3B0aW9uYWwgPT09ICdib29sZWFuJykge1xyXG4gICAgZGVsZXRlIG5ld1NjaGVtYS5vcHRpb25hbDtcclxuICAgIGNoYW5nZWQgPSB0cnVlO1xyXG4gICAgaWYgKCFkcmFmdCkgeyBkcmFmdCA9IDI7IH1cclxuICB9XHJcblxyXG4gIC8vIFJldm92ZSB2MS12MiAncmVxdWlyZXMnIGtleVxyXG4gIGlmIChuZXdTY2hlbWEucmVxdWlyZXMpIHtcclxuICAgIGRlbGV0ZSBuZXdTY2hlbWEucmVxdWlyZXM7XHJcbiAgfVxyXG5cclxuICAvLyBSZXZvdmUgdjMgYm9vbGVhbiAncmVxdWlyZWQnIGtleVxyXG4gIGlmICh0eXBlb2YgbmV3U2NoZW1hLnJlcXVpcmVkID09PSAnYm9vbGVhbicpIHtcclxuICAgIGRlbGV0ZSBuZXdTY2hlbWEucmVxdWlyZWQ7XHJcbiAgfVxyXG5cclxuICAvLyBDb252ZXJ0IGlkIHRvICRpZFxyXG4gIGlmICh0eXBlb2YgbmV3U2NoZW1hLmlkID09PSAnc3RyaW5nJyAmJiAhbmV3U2NoZW1hLiRpZCkge1xyXG4gICAgaWYgKG5ld1NjaGVtYS5pZC5zbGljZSgtMSkgPT09ICcjJykge1xyXG4gICAgICBuZXdTY2hlbWEuaWQgPSBuZXdTY2hlbWEuaWQuc2xpY2UoMCwgLTEpO1xyXG4gICAgfVxyXG4gICAgbmV3U2NoZW1hLiRpZCA9IG5ld1NjaGVtYS5pZCArICctQ09OVkVSVEVELVRPLURSQUZULTA2Iyc7XHJcbiAgICBkZWxldGUgbmV3U2NoZW1hLmlkO1xyXG4gICAgY2hhbmdlZCA9IHRydWU7XHJcbiAgfVxyXG5cclxuICAvLyBDaGVjayBpZiB2MS12MyAnYW55JyBvciBvYmplY3QgdHlwZXMgd2lsbCBiZSBjb252ZXJ0ZWRcclxuICBpZiAobmV3U2NoZW1hLnR5cGUgJiYgKHR5cGVvZiBuZXdTY2hlbWEudHlwZS5ldmVyeSA9PT0gJ2Z1bmN0aW9uJyA/XHJcbiAgICAhbmV3U2NoZW1hLnR5cGUuZXZlcnkodHlwZSA9PiBzaW1wbGVUeXBlcy5pbmNsdWRlcyh0eXBlKSkgOlxyXG4gICAgIXNpbXBsZVR5cGVzLmluY2x1ZGVzKG5ld1NjaGVtYS50eXBlKVxyXG4gICkpIHtcclxuICAgIGNoYW5nZWQgPSB0cnVlO1xyXG4gIH1cclxuXHJcbiAgLy8gSWYgc2NoZW1hIGNoYW5nZWQsIHVwZGF0ZSBvciByZW1vdmUgJHNjaGVtYSBpZGVudGlmaWVyXHJcbiAgaWYgKHR5cGVvZiBuZXdTY2hlbWEuJHNjaGVtYSA9PT0gJ3N0cmluZycgJiZcclxuICAgIC9odHRwXFw6XFwvXFwvanNvblxcLXNjaGVtYVxcLm9yZ1xcL2RyYWZ0XFwtMFsxLTRdXFwvc2NoZW1hXFwjLy50ZXN0KG5ld1NjaGVtYS4kc2NoZW1hKVxyXG4gICkge1xyXG4gICAgbmV3U2NoZW1hLiRzY2hlbWEgPSAnaHR0cDovL2pzb24tc2NoZW1hLm9yZy9kcmFmdC0wNi9zY2hlbWEjJztcclxuICAgIGNoYW5nZWQgPSB0cnVlO1xyXG4gIH0gZWxzZSBpZiAoY2hhbmdlZCAmJiB0eXBlb2YgbmV3U2NoZW1hLiRzY2hlbWEgPT09ICdzdHJpbmcnKSB7XHJcbiAgICBjb25zdCBhZGRUb0Rlc2NyaXB0aW9uID0gJ0NvbnZlcnRlZCB0byBkcmFmdCA2IGZyb20gJyArIG5ld1NjaGVtYS4kc2NoZW1hO1xyXG4gICAgaWYgKHR5cGVvZiBuZXdTY2hlbWEuZGVzY3JpcHRpb24gPT09ICdzdHJpbmcnICYmIG5ld1NjaGVtYS5kZXNjcmlwdGlvbi5sZW5ndGgpIHtcclxuICAgICAgbmV3U2NoZW1hLmRlc2NyaXB0aW9uICs9ICdcXG4nICsgYWRkVG9EZXNjcmlwdGlvbjtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIG5ld1NjaGVtYS5kZXNjcmlwdGlvbiA9IGFkZFRvRGVzY3JpcHRpb247XHJcbiAgICB9XHJcbiAgICBkZWxldGUgbmV3U2NoZW1hLiRzY2hlbWE7XHJcbiAgfVxyXG5cclxuICAvLyBDb252ZXJ0IHYxLXYzICdhbnknIGFuZCBvYmplY3QgdHlwZXNcclxuICBpZiAobmV3U2NoZW1hLnR5cGUgJiYgKHR5cGVvZiBuZXdTY2hlbWEudHlwZS5ldmVyeSA9PT0gJ2Z1bmN0aW9uJyA/XHJcbiAgICAhbmV3U2NoZW1hLnR5cGUuZXZlcnkodHlwZSA9PiBzaW1wbGVUeXBlcy5pbmNsdWRlcyh0eXBlKSkgOlxyXG4gICAgIXNpbXBsZVR5cGVzLmluY2x1ZGVzKG5ld1NjaGVtYS50eXBlKVxyXG4gICkpIHtcclxuICAgIGlmIChuZXdTY2hlbWEudHlwZS5sZW5ndGggPT09IDEpIHsgbmV3U2NoZW1hLnR5cGUgPSBuZXdTY2hlbWEudHlwZVswXTsgfVxyXG4gICAgaWYgKHR5cGVvZiBuZXdTY2hlbWEudHlwZSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgLy8gQ29udmVydCBzdHJpbmcgJ2FueScgdHlwZSB0byBhcnJheSBvZiBhbGwgc3RhbmRhcmQgdHlwZXNcclxuICAgICAgaWYgKG5ld1NjaGVtYS50eXBlID09PSAnYW55Jykge1xyXG4gICAgICAgIG5ld1NjaGVtYS50eXBlID0gc2ltcGxlVHlwZXM7XHJcbiAgICAgICAgLy8gRGVsZXRlIG5vbi1zdGFuZGFyZCBzdHJpbmcgdHlwZVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGRlbGV0ZSBuZXdTY2hlbWEudHlwZTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgbmV3U2NoZW1hLnR5cGUgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgIGlmICh0eXBlb2YgbmV3U2NoZW1hLnR5cGUuZXZlcnkgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAvLyBJZiBhcnJheSBvZiBzdHJpbmdzLCBvbmx5IGFsbG93IHN0YW5kYXJkIHR5cGVzXHJcbiAgICAgICAgaWYgKG5ld1NjaGVtYS50eXBlLmV2ZXJ5KHR5cGUgPT4gdHlwZW9mIHR5cGUgPT09ICdzdHJpbmcnKSkge1xyXG4gICAgICAgICAgbmV3U2NoZW1hLnR5cGUgPSBuZXdTY2hlbWEudHlwZS5zb21lKHR5cGUgPT4gdHlwZSA9PT0gJ2FueScpID9cclxuICAgICAgICAgICAgbmV3U2NoZW1hLnR5cGUgPSBzaW1wbGVUeXBlcyA6XHJcbiAgICAgICAgICAgIG5ld1NjaGVtYS50eXBlLmZpbHRlcih0eXBlID0+IHNpbXBsZVR5cGVzLmluY2x1ZGVzKHR5cGUpKTtcclxuICAgICAgICAgIC8vIElmIHR5cGUgaXMgYW4gYXJyYXkgd2l0aCBvYmplY3RzLCBjb252ZXJ0IHRoZSBjdXJyZW50IHNjaGVtYSB0byBhbiAnYW55T2YnIGFycmF5XHJcbiAgICAgICAgfSBlbHNlIGlmIChuZXdTY2hlbWEudHlwZS5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICBjb25zdCBhcnJheUtleXMgPSBbJ2FkZGl0aW9uYWxJdGVtcycsICdpdGVtcycsICdtYXhJdGVtcycsICdtaW5JdGVtcycsICd1bmlxdWVJdGVtcycsICdjb250YWlucyddO1xyXG4gICAgICAgICAgY29uc3QgbnVtYmVyS2V5cyA9IFsnbXVsdGlwbGVPZicsICdtYXhpbXVtJywgJ2V4Y2x1c2l2ZU1heGltdW0nLCAnbWluaW11bScsICdleGNsdXNpdmVNaW5pbXVtJ107XHJcbiAgICAgICAgICBjb25zdCBvYmplY3RLZXlzID0gWydtYXhQcm9wZXJ0aWVzJywgJ21pblByb3BlcnRpZXMnLCAncmVxdWlyZWQnLCAnYWRkaXRpb25hbFByb3BlcnRpZXMnLFxyXG4gICAgICAgICAgICAncHJvcGVydGllcycsICdwYXR0ZXJuUHJvcGVydGllcycsICdkZXBlbmRlbmNpZXMnLCAncHJvcGVydHlOYW1lcyddO1xyXG4gICAgICAgICAgY29uc3Qgc3RyaW5nS2V5cyA9IFsnbWF4TGVuZ3RoJywgJ21pbkxlbmd0aCcsICdwYXR0ZXJuJywgJ2Zvcm1hdCddO1xyXG4gICAgICAgICAgY29uc3QgZmlsdGVyS2V5cyA9IHtcclxuICAgICAgICAgICAgJ2FycmF5JzogWy4uLm51bWJlcktleXMsIC4uLm9iamVjdEtleXMsIC4uLnN0cmluZ0tleXNdLFxyXG4gICAgICAgICAgICAnaW50ZWdlcic6IFsuLi5hcnJheUtleXMsIC4uLm9iamVjdEtleXMsIC4uLnN0cmluZ0tleXNdLFxyXG4gICAgICAgICAgICAnbnVtYmVyJzogWy4uLmFycmF5S2V5cywgLi4ub2JqZWN0S2V5cywgLi4uc3RyaW5nS2V5c10sXHJcbiAgICAgICAgICAgICdvYmplY3QnOiBbLi4uYXJyYXlLZXlzLCAuLi5udW1iZXJLZXlzLCAuLi5zdHJpbmdLZXlzXSxcclxuICAgICAgICAgICAgJ3N0cmluZyc6IFsuLi5hcnJheUtleXMsIC4uLm51bWJlcktleXMsIC4uLm9iamVjdEtleXNdLFxyXG4gICAgICAgICAgICAnYWxsJzogWy4uLmFycmF5S2V5cywgLi4ubnVtYmVyS2V5cywgLi4ub2JqZWN0S2V5cywgLi4uc3RyaW5nS2V5c10sXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgY29uc3QgYW55T2YgPSBbXTtcclxuICAgICAgICAgIGZvciAoY29uc3QgdHlwZSBvZiBuZXdTY2hlbWEudHlwZSkge1xyXG4gICAgICAgICAgICBjb25zdCBuZXdUeXBlID0gdHlwZW9mIHR5cGUgPT09ICdzdHJpbmcnID8geyB0eXBlIH0gOiB7IC4uLnR5cGUgfTtcclxuICAgICAgICAgICAgT2JqZWN0LmtleXMobmV3U2NoZW1hKVxyXG4gICAgICAgICAgICAgIC5maWx0ZXIoa2V5ID0+ICFuZXdUeXBlLmhhc093blByb3BlcnR5KGtleSkgJiZcclxuICAgICAgICAgICAgICAgICFbLi4uKGZpbHRlcktleXNbbmV3VHlwZS50eXBlXSB8fCBmaWx0ZXJLZXlzLmFsbCksICd0eXBlJywgJ2RlZmF1bHQnXVxyXG4gICAgICAgICAgICAgICAgICAuaW5jbHVkZXMoa2V5KVxyXG4gICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAuZm9yRWFjaChrZXkgPT4gbmV3VHlwZVtrZXldID0gbmV3U2NoZW1hW2tleV0pO1xyXG4gICAgICAgICAgICBhbnlPZi5wdXNoKG5ld1R5cGUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgbmV3U2NoZW1hID0gbmV3U2NoZW1hLmhhc093blByb3BlcnR5KCdkZWZhdWx0JykgP1xyXG4gICAgICAgICAgICB7IGFueU9mLCBkZWZhdWx0OiBuZXdTY2hlbWEuZGVmYXVsdCB9IDogeyBhbnlPZiB9O1xyXG4gICAgICAgICAgLy8gSWYgdHlwZSBpcyBhbiBvYmplY3QsIG1lcmdlIGl0IHdpdGggdGhlIGN1cnJlbnQgc2NoZW1hXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGNvbnN0IHR5cGVTY2hlbWEgPSBuZXdTY2hlbWEudHlwZTtcclxuICAgICAgICAgIGRlbGV0ZSBuZXdTY2hlbWEudHlwZTtcclxuICAgICAgICAgIE9iamVjdC5hc3NpZ24obmV3U2NoZW1hLCB0eXBlU2NoZW1hKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGRlbGV0ZSBuZXdTY2hlbWEudHlwZTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIENvbnZlcnQgc3ViIHNjaGVtYXNcclxuICBPYmplY3Qua2V5cyhuZXdTY2hlbWEpXHJcbiAgICAuZmlsdGVyKGtleSA9PiB0eXBlb2YgbmV3U2NoZW1hW2tleV0gPT09ICdvYmplY3QnKVxyXG4gICAgLmZvckVhY2goa2V5ID0+IHtcclxuICAgICAgaWYgKFxyXG4gICAgICAgIFsnZGVmaW5pdGlvbnMnLCAnZGVwZW5kZW5jaWVzJywgJ3Byb3BlcnRpZXMnLCAncGF0dGVyblByb3BlcnRpZXMnXVxyXG4gICAgICAgICAgLmluY2x1ZGVzKGtleSkgJiYgdHlwZW9mIG5ld1NjaGVtYVtrZXldLm1hcCAhPT0gJ2Z1bmN0aW9uJ1xyXG4gICAgICApIHtcclxuICAgICAgICBjb25zdCBuZXdLZXkgPSB7fTtcclxuICAgICAgICBPYmplY3Qua2V5cyhuZXdTY2hlbWFba2V5XSkuZm9yRWFjaChzdWJLZXkgPT4gbmV3S2V5W3N1YktleV0gPVxyXG4gICAgICAgICAgY29udmVydFNjaGVtYVRvRHJhZnQ2KG5ld1NjaGVtYVtrZXldW3N1YktleV0sIHsgY2hhbmdlZCwgZHJhZnQgfSlcclxuICAgICAgICApO1xyXG4gICAgICAgIG5ld1NjaGVtYVtrZXldID0gbmV3S2V5O1xyXG4gICAgICB9IGVsc2UgaWYgKFxyXG4gICAgICAgIFsnaXRlbXMnLCAnYWRkaXRpb25hbEl0ZW1zJywgJ2FkZGl0aW9uYWxQcm9wZXJ0aWVzJyxcclxuICAgICAgICAgICdhbGxPZicsICdhbnlPZicsICdvbmVPZicsICdub3QnXS5pbmNsdWRlcyhrZXkpXHJcbiAgICAgICkge1xyXG4gICAgICAgIG5ld1NjaGVtYVtrZXldID0gY29udmVydFNjaGVtYVRvRHJhZnQ2KG5ld1NjaGVtYVtrZXldLCB7IGNoYW5nZWQsIGRyYWZ0IH0pO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG5ld1NjaGVtYVtrZXldID0gY2xvbmVEZWVwKG5ld1NjaGVtYVtrZXldKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gIHJldHVybiBuZXdTY2hlbWE7XHJcbn1cclxuIl19