import { hasValue, inArray, isArray, isDefined, isEmpty, isMap, isObject, isSet, isString } from './validator.functions';
/**
 * Utility function library:
 *
 * addClasses, copy, forEach, forEachCopy, hasOwn, mergeFilteredObject,
 * uniqueItems, commonItems, fixTitle, toTitleCase
*/
/**
 * 'addClasses' function
 *
 * Merges two space-delimited lists of CSS classes and removes duplicates.
 *
 * // {string | string[] | Set<string>} oldClasses
 * // {string | string[] | Set<string>} newClasses
 * // {string | string[] | Set<string>} - Combined classes
 */
export function addClasses(oldClasses, newClasses) {
    const badType = i => !isSet(i) && !isArray(i) && !isString(i);
    if (badType(newClasses)) {
        return oldClasses;
    }
    if (badType(oldClasses)) {
        oldClasses = '';
    }
    const toSet = i => isSet(i) ? i : isArray(i) ? new Set(i) : new Set(i.split(' '));
    const combinedSet = toSet(oldClasses);
    const newSet = toSet(newClasses);
    newSet.forEach(c => combinedSet.add(c));
    if (isSet(oldClasses)) {
        return combinedSet;
    }
    if (isArray(oldClasses)) {
        return Array.from(combinedSet);
    }
    return Array.from(combinedSet).join(' ');
}
/**
 * 'copy' function
 *
 * Makes a shallow copy of a JavaScript object, array, Map, or Set.
 * If passed a JavaScript primitive value (string, number, boolean, or null),
 * it returns the value.
 *
 * // {Object|Array|string|number|boolean|null} object - The object to copy
 * // {boolean = false} errors - Show errors?
 * // {Object|Array|string|number|boolean|null} - The copied object
 */
export function copy(object, errors = false) {
    if (typeof object !== 'object' || object === null) {
        return object;
    }
    if (isMap(object)) {
        return new Map(object);
    }
    if (isSet(object)) {
        return new Set(object);
    }
    if (isArray(object)) {
        return [...object];
    }
    if (isObject(object)) {
        return { ...object };
    }
    if (errors) {
        console.error('copy error: Object to copy must be a JavaScript object or value.');
    }
    return object;
}
/**
 * 'forEach' function
 *
 * Iterates over all items in the first level of an object or array
 * and calls an iterator funciton on each item.
 *
 * The iterator function is called with four values:
 * 1. The current item's value
 * 2. The current item's key
 * 3. The parent object, which contains the current item
 * 4. The root object
 *
 * Setting the optional third parameter to 'top-down' or 'bottom-up' will cause
 * it to also recursively iterate over items in sub-objects or sub-arrays in the
 * specified direction.
 *
 * // {Object|Array} object - The object or array to iterate over
 * // {function} fn - the iterator funciton to call on each item
 * // {boolean = false} errors - Show errors?
 * // {void}
 */
export function forEach(object, fn, recurse = false, rootObject = object, errors = false) {
    if (isEmpty(object)) {
        return;
    }
    if ((isObject(object) || isArray(object)) && typeof fn === 'function') {
        for (const key of Object.keys(object)) {
            const value = object[key];
            if (recurse === 'bottom-up' && (isObject(value) || isArray(value))) {
                forEach(value, fn, recurse, rootObject);
            }
            fn(value, key, object, rootObject);
            if (recurse === 'top-down' && (isObject(value) || isArray(value))) {
                forEach(value, fn, recurse, rootObject);
            }
        }
    }
    if (errors) {
        if (typeof fn !== 'function') {
            console.error('forEach error: Iterator must be a function.');
            console.error('function', fn);
        }
        if (!isObject(object) && !isArray(object)) {
            console.error('forEach error: Input object must be an object or array.');
            console.error('object', object);
        }
    }
}
/**
 * 'forEachCopy' function
 *
 * Iterates over all items in the first level of an object or array
 * and calls an iterator function on each item. Returns a new object or array
 * with the same keys or indexes as the original, and values set to the results
 * of the iterator function.
 *
 * Does NOT recursively iterate over items in sub-objects or sub-arrays.
 *
 * // {Object | Array} object - The object or array to iterate over
 * // {function} fn - The iterator funciton to call on each item
 * // {boolean = false} errors - Show errors?
 * // {Object | Array} - The resulting object or array
 */
export function forEachCopy(object, fn, errors = false) {
    if (!hasValue(object)) {
        return;
    }
    if ((isObject(object) || isArray(object)) && typeof object !== 'function') {
        const newObject = isArray(object) ? [] : {};
        for (const key of Object.keys(object)) {
            newObject[key] = fn(object[key], key, object);
        }
        return newObject;
    }
    if (errors) {
        if (typeof fn !== 'function') {
            console.error('forEachCopy error: Iterator must be a function.');
            console.error('function', fn);
        }
        if (!isObject(object) && !isArray(object)) {
            console.error('forEachCopy error: Input object must be an object or array.');
            console.error('object', object);
        }
    }
}
/**
 * 'hasOwn' utility function
 *
 * Checks whether an object or array has a particular property.
 *
 * // {any} object - the object to check
 * // {string} property - the property to look for
 * // {boolean} - true if object has property, false if not
 */
export function hasOwn(object, property) {
    if (!object || !['number', 'string', 'symbol'].includes(typeof property) ||
        (!isObject(object) && !isArray(object) && !isMap(object) && !isSet(object))) {
        return false;
    }
    if (isMap(object) || isSet(object)) {
        return object.has(property);
    }
    if (typeof property === 'number') {
        if (isArray(object)) {
            return object[property];
        }
        property = property + '';
    }
    return object.hasOwnProperty(property);
}
/**
 * Types of possible expressions which the app is able to evaluate.
 */
export var ExpressionType;
(function (ExpressionType) {
    ExpressionType[ExpressionType["EQUALS"] = 0] = "EQUALS";
    ExpressionType[ExpressionType["NOT_EQUALS"] = 1] = "NOT_EQUALS";
    ExpressionType[ExpressionType["NOT_AN_EXPRESSION"] = 2] = "NOT_AN_EXPRESSION";
})(ExpressionType || (ExpressionType = {}));
/**
 * Detects the type of expression from the given candidate. `==` for equals,
 * `!=` for not equals. If none of these are contained in the candidate, the candidate
 * is not considered to be an expression at all and thus `NOT_AN_EXPRESSION` is returned.
 * // {expressionCandidate} expressionCandidate - potential expression
 */
export function getExpressionType(expressionCandidate) {
    if (expressionCandidate.indexOf('==') !== -1) {
        return ExpressionType.EQUALS;
    }
    if (expressionCandidate.toString().indexOf('!=') !== -1) {
        return ExpressionType.NOT_EQUALS;
    }
    return ExpressionType.NOT_AN_EXPRESSION;
}
export function isEqual(expressionType) {
    return expressionType === ExpressionType.EQUALS;
}
export function isNotEqual(expressionType) {
    return expressionType === ExpressionType.NOT_EQUALS;
}
export function isNotExpression(expressionType) {
    return expressionType === ExpressionType.NOT_AN_EXPRESSION;
}
/**
 * Splits the expression key by the expressionType on a pair of values
 * before and after the equals or nor equals sign.
 * // {expressionType} enum of an expression type
 * // {key} the given key from a for loop iver all conditions
 */
export function getKeyAndValueByExpressionType(expressionType, key) {
    if (isEqual(expressionType)) {
        return key.split('==', 2);
    }
    if (isNotEqual(expressionType)) {
        return key.split('!=', 2);
    }
    return null;
}
export function cleanValueOfQuotes(keyAndValue) {
    if (keyAndValue.charAt(0) === '\'' && keyAndValue.charAt(keyAndValue.length - 1) === '\'') {
        return keyAndValue.replace('\'', '').replace('\'', '');
    }
    return keyAndValue;
}
/**
 * 'mergeFilteredObject' utility function
 *
 * Shallowly merges two objects, setting key and values from source object
 * in target object, excluding specified keys.
 *
 * Optionally, it can also use functions to transform the key names and/or
 * the values of the merging object.
 *
 * // {PlainObject} targetObject - Target object to add keys and values to
 * // {PlainObject} sourceObject - Source object to copy keys and values from
 * // {string[]} excludeKeys - Array of keys to exclude
 * // {(string: string) => string = (k) => k} keyFn - Function to apply to keys
 * // {(any: any) => any = (v) => v} valueFn - Function to apply to values
 * // {PlainObject} - Returns targetObject
 */
export function mergeFilteredObject(targetObject, sourceObject, excludeKeys = [], keyFn = (key) => key, valFn = (val) => val) {
    if (!isObject(sourceObject)) {
        return targetObject;
    }
    if (!isObject(targetObject)) {
        targetObject = {};
    }
    for (const key of Object.keys(sourceObject)) {
        if (!inArray(key, excludeKeys) && isDefined(sourceObject[key])) {
            targetObject[keyFn(key)] = valFn(sourceObject[key]);
        }
    }
    return targetObject;
}
/**
 * 'uniqueItems' function
 *
 * Accepts any number of string value inputs,
 * and returns an array of all input vaues, excluding duplicates.
 *
 * // {...string} ...items -
 * // {string[]} -
 */
export function uniqueItems(...items) {
    const returnItems = [];
    for (const item of items) {
        if (!returnItems.includes(item)) {
            returnItems.push(item);
        }
    }
    return returnItems;
}
/**
 * 'commonItems' function
 *
 * Accepts any number of strings or arrays of string values,
 * and returns a single array containing only values present in all inputs.
 *
 * // {...string|string[]} ...arrays -
 * // {string[]} -
 */
export function commonItems(...arrays) {
    let returnItems = null;
    for (let array of arrays) {
        if (isString(array)) {
            array = [array];
        }
        returnItems = returnItems === null ? [...array] :
            returnItems.filter(item => array.includes(item));
        if (!returnItems.length) {
            return [];
        }
    }
    return returnItems;
}
/**
 * 'fixTitle' function
 *
 *
 * // {string} input -
 * // {string} -
 */
export function fixTitle(name) {
    return name && toTitleCase(name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' '));
}
/**
 * 'toTitleCase' function
 *
 * Intelligently converts an input string to Title Case.
 *
 * Accepts an optional second parameter with a list of additional
 * words and abbreviations to force into a particular case.
 *
 * This function is built on prior work by John Gruber and David Gouch:
 * http://daringfireball.net/2008/08/title_case_update
 * https://github.com/gouch/to-title-case
 *
 * // {string} input -
 * // {string|string[]} forceWords? -
 * // {string} -
 */
export function toTitleCase(input, forceWords) {
    if (!isString(input)) {
        return input;
    }
    let forceArray = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'en',
        'for', 'if', 'in', 'nor', 'of', 'on', 'or', 'per', 'the', 'to', 'v', 'v.',
        'vs', 'vs.', 'via'];
    if (isString(forceWords)) {
        forceWords = forceWords.split('|');
    }
    if (isArray(forceWords)) {
        forceArray = forceArray.concat(forceWords);
    }
    const forceArrayLower = forceArray.map(w => w.toLowerCase());
    const noInitialCase = input === input.toUpperCase() || input === input.toLowerCase();
    let prevLastChar = '';
    input = input.trim();
    return input.replace(/[A-Za-z0-9\u00C0-\u00FF]+[^\s-]*/g, (word, idx) => {
        if (!noInitialCase && word.slice(1).search(/[A-Z]|\../) !== -1) {
            return word;
        }
        else {
            let newWord;
            const forceWord = forceArray[forceArrayLower.indexOf(word.toLowerCase())];
            if (!forceWord) {
                if (noInitialCase) {
                    if (word.slice(1).search(/\../) !== -1) {
                        newWord = word.toLowerCase();
                    }
                    else {
                        newWord = word[0].toUpperCase() + word.slice(1).toLowerCase();
                    }
                }
                else {
                    newWord = word[0].toUpperCase() + word.slice(1);
                }
            }
            else if (forceWord === forceWord.toLowerCase() && (idx === 0 || idx + word.length === input.length ||
                prevLastChar === ':' || input[idx - 1].search(/[^\s-]/) !== -1 ||
                (input[idx - 1] !== '-' && input[idx + word.length] === '-'))) {
                newWord = forceWord[0].toUpperCase() + forceWord.slice(1);
            }
            else {
                newWord = forceWord;
            }
            prevLastChar = word.slice(-1);
            return newWord;
        }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbGl0eS5mdW5jdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9hanNmLWNvcmUvc3JjL2xpYi9zaGFyZWQvdXRpbGl0eS5mdW5jdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFjLE1BQU0sdUJBQXVCLENBQUM7QUFFcEk7Ozs7O0VBS0U7QUFFRjs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sVUFBVSxVQUFVLENBQ3hCLFVBQTJDLEVBQzNDLFVBQTJDO0lBRTNDLE1BQU0sT0FBTyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDOUQsSUFBSSxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUU7UUFBRSxPQUFPLFVBQVUsQ0FBQztLQUFFO0lBQy9DLElBQUksT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFO1FBQUUsVUFBVSxHQUFHLEVBQUUsQ0FBQztLQUFFO0lBQzdDLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUNsRixNQUFNLFdBQVcsR0FBYSxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7SUFD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TSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQzdELEVBQ0Q7Z0JBQ0EsT0FBTyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQzNEO2lCQUFNO2dCQUNMLE9BQU8sR0FBRyxTQUFTLENBQUM7YUFDckI7WUFDRCxZQUFZLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlCLE9BQU8sT0FBTyxDQUFDO1NBQ2hCO0lBQ0gsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtoYXNWYWx1ZSwgaW5BcnJheSwgaXNBcnJheSwgaXNEZWZpbmVkLCBpc0VtcHR5LCBpc01hcCwgaXNPYmplY3QsIGlzU2V0LCBpc1N0cmluZywgUGxhaW5PYmplY3R9IGZyb20gJy4vdmFsaWRhdG9yLmZ1bmN0aW9ucyc7XHJcblxyXG4vKipcclxuICogVXRpbGl0eSBmdW5jdGlvbiBsaWJyYXJ5OlxyXG4gKlxyXG4gKiBhZGRDbGFzc2VzLCBjb3B5LCBmb3JFYWNoLCBmb3JFYWNoQ29weSwgaGFzT3duLCBtZXJnZUZpbHRlcmVkT2JqZWN0LFxyXG4gKiB1bmlxdWVJdGVtcywgY29tbW9uSXRlbXMsIGZpeFRpdGxlLCB0b1RpdGxlQ2FzZVxyXG4qL1xyXG5cclxuLyoqXHJcbiAqICdhZGRDbGFzc2VzJyBmdW5jdGlvblxyXG4gKlxyXG4gKiBNZXJnZXMgdHdvIHNwYWNlLWRlbGltaXRlZCBsaXN0cyBvZiBDU1MgY2xhc3NlcyBhbmQgcmVtb3ZlcyBkdXBsaWNhdGVzLlxyXG4gKlxyXG4gKiAvLyB7c3RyaW5nIHwgc3RyaW5nW10gfCBTZXQ8c3RyaW5nPn0gb2xkQ2xhc3Nlc1xyXG4gKiAvLyB7c3RyaW5nIHwgc3RyaW5nW10gfCBTZXQ8c3RyaW5nPn0gbmV3Q2xhc3Nlc1xyXG4gKiAvLyB7c3RyaW5nIHwgc3RyaW5nW10gfCBTZXQ8c3RyaW5nPn0gLSBDb21iaW5lZCBjbGFzc2VzXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gYWRkQ2xhc3NlcyhcclxuICBvbGRDbGFzc2VzOiBzdHJpbmcgfCBzdHJpbmdbXSB8IFNldDxzdHJpbmc+LFxyXG4gIG5ld0NsYXNzZXM6IHN0cmluZyB8IHN0cmluZ1tdIHwgU2V0PHN0cmluZz5cclxuKTogc3RyaW5nIHwgc3RyaW5nW10gfCBTZXQ8c3RyaW5nPiB7XHJcbiAgY29uc3QgYmFkVHlwZSA9IGkgPT4gIWlzU2V0KGkpICYmICFpc0FycmF5KGkpICYmICFpc1N0cmluZyhpKTtcclxuICBpZiAoYmFkVHlwZShuZXdDbGFzc2VzKSkgeyByZXR1cm4gb2xkQ2xhc3NlczsgfVxyXG4gIGlmIChiYWRUeXBlKG9sZENsYXNzZXMpKSB7IG9sZENsYXNzZXMgPSAnJzsgfVxyXG4gIGNvbnN0IHRvU2V0ID0gaSA9PiBpc1NldChpKSA/IGkgOiBpc0FycmF5KGkpID8gbmV3IFNldChpKSA6IG5ldyBTZXQoaS5zcGxpdCgnICcpKTtcclxuICBjb25zdCBjb21iaW5lZFNldDogU2V0PGFueT4gPSB0b1NldChvbGRDbGFzc2VzKTtcclxuICBjb25zdCBuZXdTZXQ6IFNldDxhbnk+ID0gdG9TZXQobmV3Q2xhc3Nlcyk7XHJcbiAgbmV3U2V0LmZvckVhY2goYyA9PiBjb21iaW5lZFNldC5hZGQoYykpO1xyXG4gIGlmIChpc1NldChvbGRDbGFzc2VzKSkgeyByZXR1cm4gY29tYmluZWRTZXQ7IH1cclxuICBpZiAoaXNBcnJheShvbGRDbGFzc2VzKSkgeyByZXR1cm4gQXJyYXkuZnJvbShjb21iaW5lZFNldCk7IH1cclxuICByZXR1cm4gQXJyYXkuZnJvbShjb21iaW5lZFNldCkuam9pbignICcpO1xyXG59XHJcblxyXG4vKipcclxuICogJ2NvcHknIGZ1bmN0aW9uXHJcbiAqXHJcbiAqIE1ha2VzIGEgc2hhbGxvdyBjb3B5IG9mIGEgSmF2YVNjcmlwdCBvYmplY3QsIGFycmF5LCBNYXAsIG9yIFNldC5cclxuICogSWYgcGFzc2VkIGEgSmF2YVNjcmlwdCBwcmltaXRpdmUgdmFsdWUgKHN0cmluZywgbnVtYmVyLCBib29sZWFuLCBvciBudWxsKSxcclxuICogaXQgcmV0dXJucyB0aGUgdmFsdWUuXHJcbiAqXHJcbiAqIC8vIHtPYmplY3R8QXJyYXl8c3RyaW5nfG51bWJlcnxib29sZWFufG51bGx9IG9iamVjdCAtIFRoZSBvYmplY3QgdG8gY29weVxyXG4gKiAvLyB7Ym9vbGVhbiA9IGZhbHNlfSBlcnJvcnMgLSBTaG93IGVycm9ycz9cclxuICogLy8ge09iamVjdHxBcnJheXxzdHJpbmd8bnVtYmVyfGJvb2xlYW58bnVsbH0gLSBUaGUgY29waWVkIG9iamVjdFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGNvcHkob2JqZWN0OiBhbnksIGVycm9ycyA9IGZhbHNlKTogYW55IHtcclxuICBpZiAodHlwZW9mIG9iamVjdCAhPT0gJ29iamVjdCcgfHwgb2JqZWN0ID09PSBudWxsKSB7IHJldHVybiBvYmplY3Q7IH1cclxuICBpZiAoaXNNYXAob2JqZWN0KSkgICAgeyByZXR1cm4gbmV3IE1hcChvYmplY3QpOyB9XHJcbiAgaWYgKGlzU2V0KG9iamVjdCkpICAgIHsgcmV0dXJuIG5ldyBTZXQob2JqZWN0KTsgfVxyXG4gIGlmIChpc0FycmF5KG9iamVjdCkpICB7IHJldHVybiBbIC4uLm9iamVjdCBdOyAgIH1cclxuICBpZiAoaXNPYmplY3Qob2JqZWN0KSkgeyByZXR1cm4geyAuLi5vYmplY3QgfTsgICB9XHJcbiAgaWYgKGVycm9ycykge1xyXG4gICAgY29uc29sZS5lcnJvcignY29weSBlcnJvcjogT2JqZWN0IHRvIGNvcHkgbXVzdCBiZSBhIEphdmFTY3JpcHQgb2JqZWN0IG9yIHZhbHVlLicpO1xyXG4gIH1cclxuICByZXR1cm4gb2JqZWN0O1xyXG59XHJcblxyXG4vKipcclxuICogJ2ZvckVhY2gnIGZ1bmN0aW9uXHJcbiAqXHJcbiAqIEl0ZXJhdGVzIG92ZXIgYWxsIGl0ZW1zIGluIHRoZSBmaXJzdCBsZXZlbCBvZiBhbiBvYmplY3Qgb3IgYXJyYXlcclxuICogYW5kIGNhbGxzIGFuIGl0ZXJhdG9yIGZ1bmNpdG9uIG9uIGVhY2ggaXRlbS5cclxuICpcclxuICogVGhlIGl0ZXJhdG9yIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aXRoIGZvdXIgdmFsdWVzOlxyXG4gKiAxLiBUaGUgY3VycmVudCBpdGVtJ3MgdmFsdWVcclxuICogMi4gVGhlIGN1cnJlbnQgaXRlbSdzIGtleVxyXG4gKiAzLiBUaGUgcGFyZW50IG9iamVjdCwgd2hpY2ggY29udGFpbnMgdGhlIGN1cnJlbnQgaXRlbVxyXG4gKiA0LiBUaGUgcm9vdCBvYmplY3RcclxuICpcclxuICogU2V0dGluZyB0aGUgb3B0aW9uYWwgdGhpcmQgcGFyYW1ldGVyIHRvICd0b3AtZG93bicgb3IgJ2JvdHRvbS11cCcgd2lsbCBjYXVzZVxyXG4gKiBpdCB0byBhbHNvIHJlY3Vyc2l2ZWx5IGl0ZXJhdGUgb3ZlciBpdGVtcyBpbiBzdWItb2JqZWN0cyBvciBzdWItYXJyYXlzIGluIHRoZVxyXG4gKiBzcGVjaWZpZWQgZGlyZWN0aW9uLlxyXG4gKlxyXG4gKiAvLyB7T2JqZWN0fEFycmF5fSBvYmplY3QgLSBUaGUgb2JqZWN0IG9yIGFycmF5IHRvIGl0ZXJhdGUgb3ZlclxyXG4gKiAvLyB7ZnVuY3Rpb259IGZuIC0gdGhlIGl0ZXJhdG9yIGZ1bmNpdG9uIHRvIGNhbGwgb24gZWFjaCBpdGVtXHJcbiAqIC8vIHtib29sZWFuID0gZmFsc2V9IGVycm9ycyAtIFNob3cgZXJyb3JzP1xyXG4gKiAvLyB7dm9pZH1cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBmb3JFYWNoKFxyXG4gIG9iamVjdDogYW55LCBmbjogKHY6IGFueSwgaz86IHN0cmluZyB8IG51bWJlciwgYz86IGFueSwgcmM/OiBhbnkpID0+IGFueSxcclxuICByZWN1cnNlOiBib29sZWFuIHwgc3RyaW5nID0gZmFsc2UsIHJvb3RPYmplY3Q6IGFueSA9IG9iamVjdCwgZXJyb3JzID0gZmFsc2VcclxuKTogdm9pZCB7XHJcbiAgaWYgKGlzRW1wdHkob2JqZWN0KSkgeyByZXR1cm47IH1cclxuICBpZiAoKGlzT2JqZWN0KG9iamVjdCkgfHwgaXNBcnJheShvYmplY3QpKSAmJiB0eXBlb2YgZm4gPT09ICdmdW5jdGlvbicpIHtcclxuICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKG9iamVjdCkpIHtcclxuICAgICAgY29uc3QgdmFsdWUgPSBvYmplY3Rba2V5XTtcclxuICAgICAgaWYgKHJlY3Vyc2UgPT09ICdib3R0b20tdXAnICYmIChpc09iamVjdCh2YWx1ZSkgfHwgaXNBcnJheSh2YWx1ZSkpKSB7XHJcbiAgICAgICAgZm9yRWFjaCh2YWx1ZSwgZm4sIHJlY3Vyc2UsIHJvb3RPYmplY3QpO1xyXG4gICAgICB9XHJcbiAgICAgIGZuKHZhbHVlLCBrZXksIG9iamVjdCwgcm9vdE9iamVjdCk7XHJcbiAgICAgIGlmIChyZWN1cnNlID09PSAndG9wLWRvd24nICYmIChpc09iamVjdCh2YWx1ZSkgfHwgaXNBcnJheSh2YWx1ZSkpKSB7XHJcbiAgICAgICAgZm9yRWFjaCh2YWx1ZSwgZm4sIHJlY3Vyc2UsIHJvb3RPYmplY3QpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4gIGlmIChlcnJvcnMpIHtcclxuICAgIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgY29uc29sZS5lcnJvcignZm9yRWFjaCBlcnJvcjogSXRlcmF0b3IgbXVzdCBiZSBhIGZ1bmN0aW9uLicpO1xyXG4gICAgICBjb25zb2xlLmVycm9yKCdmdW5jdGlvbicsIGZuKTtcclxuICAgIH1cclxuICAgIGlmICghaXNPYmplY3Qob2JqZWN0KSAmJiAhaXNBcnJheShvYmplY3QpKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ2ZvckVhY2ggZXJyb3I6IElucHV0IG9iamVjdCBtdXN0IGJlIGFuIG9iamVjdCBvciBhcnJheS4nKTtcclxuICAgICAgY29uc29sZS5lcnJvcignb2JqZWN0Jywgb2JqZWN0KTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiAnZm9yRWFjaENvcHknIGZ1bmN0aW9uXHJcbiAqXHJcbiAqIEl0ZXJhdGVzIG92ZXIgYWxsIGl0ZW1zIGluIHRoZSBmaXJzdCBsZXZlbCBvZiBhbiBvYmplY3Qgb3IgYXJyYXlcclxuICogYW5kIGNhbGxzIGFuIGl0ZXJhdG9yIGZ1bmN0aW9uIG9uIGVhY2ggaXRlbS4gUmV0dXJucyBhIG5ldyBvYmplY3Qgb3IgYXJyYXlcclxuICogd2l0aCB0aGUgc2FtZSBrZXlzIG9yIGluZGV4ZXMgYXMgdGhlIG9yaWdpbmFsLCBhbmQgdmFsdWVzIHNldCB0byB0aGUgcmVzdWx0c1xyXG4gKiBvZiB0aGUgaXRlcmF0b3IgZnVuY3Rpb24uXHJcbiAqXHJcbiAqIERvZXMgTk9UIHJlY3Vyc2l2ZWx5IGl0ZXJhdGUgb3ZlciBpdGVtcyBpbiBzdWItb2JqZWN0cyBvciBzdWItYXJyYXlzLlxyXG4gKlxyXG4gKiAvLyB7T2JqZWN0IHwgQXJyYXl9IG9iamVjdCAtIFRoZSBvYmplY3Qgb3IgYXJyYXkgdG8gaXRlcmF0ZSBvdmVyXHJcbiAqIC8vIHtmdW5jdGlvbn0gZm4gLSBUaGUgaXRlcmF0b3IgZnVuY2l0b24gdG8gY2FsbCBvbiBlYWNoIGl0ZW1cclxuICogLy8ge2Jvb2xlYW4gPSBmYWxzZX0gZXJyb3JzIC0gU2hvdyBlcnJvcnM/XHJcbiAqIC8vIHtPYmplY3QgfCBBcnJheX0gLSBUaGUgcmVzdWx0aW5nIG9iamVjdCBvciBhcnJheVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGZvckVhY2hDb3B5KFxyXG4gIG9iamVjdDogYW55LCBmbjogKHY6IGFueSwgaz86IHN0cmluZyB8IG51bWJlciwgbz86IGFueSwgcD86IHN0cmluZykgPT4gYW55LFxyXG4gIGVycm9ycyA9IGZhbHNlXHJcbik6IGFueSB7XHJcbiAgaWYgKCFoYXNWYWx1ZShvYmplY3QpKSB7IHJldHVybjsgfVxyXG4gIGlmICgoaXNPYmplY3Qob2JqZWN0KSB8fCBpc0FycmF5KG9iamVjdCkpICYmIHR5cGVvZiBvYmplY3QgIT09ICdmdW5jdGlvbicpIHtcclxuICAgIGNvbnN0IG5ld09iamVjdDogYW55ID0gaXNBcnJheShvYmplY3QpID8gW10gOiB7fTtcclxuICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKG9iamVjdCkpIHtcclxuICAgICAgbmV3T2JqZWN0W2tleV0gPSBmbihvYmplY3Rba2V5XSwga2V5LCBvYmplY3QpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5ld09iamVjdDtcclxuICB9XHJcbiAgaWYgKGVycm9ycykge1xyXG4gICAgaWYgKHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICBjb25zb2xlLmVycm9yKCdmb3JFYWNoQ29weSBlcnJvcjogSXRlcmF0b3IgbXVzdCBiZSBhIGZ1bmN0aW9uLicpO1xyXG4gICAgICBjb25zb2xlLmVycm9yKCdmdW5jdGlvbicsIGZuKTtcclxuICAgIH1cclxuICAgIGlmICghaXNPYmplY3Qob2JqZWN0KSAmJiAhaXNBcnJheShvYmplY3QpKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ2ZvckVhY2hDb3B5IGVycm9yOiBJbnB1dCBvYmplY3QgbXVzdCBiZSBhbiBvYmplY3Qgb3IgYXJyYXkuJyk7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ29iamVjdCcsIG9iamVjdCk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogJ2hhc093bicgdXRpbGl0eSBmdW5jdGlvblxyXG4gKlxyXG4gKiBDaGVja3Mgd2hldGhlciBhbiBvYmplY3Qgb3IgYXJyYXkgaGFzIGEgcGFydGljdWxhciBwcm9wZXJ0eS5cclxuICpcclxuICogLy8ge2FueX0gb2JqZWN0IC0gdGhlIG9iamVjdCB0byBjaGVja1xyXG4gKiAvLyB7c3RyaW5nfSBwcm9wZXJ0eSAtIHRoZSBwcm9wZXJ0eSB0byBsb29rIGZvclxyXG4gKiAvLyB7Ym9vbGVhbn0gLSB0cnVlIGlmIG9iamVjdCBoYXMgcHJvcGVydHksIGZhbHNlIGlmIG5vdFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGhhc093bihvYmplY3Q6IGFueSwgcHJvcGVydHk6IHN0cmluZyk6IGJvb2xlYW4ge1xyXG4gIGlmICghb2JqZWN0IHx8ICFbJ251bWJlcicsICdzdHJpbmcnLCAnc3ltYm9sJ10uaW5jbHVkZXModHlwZW9mIHByb3BlcnR5KSB8fFxyXG4gICAgKCFpc09iamVjdChvYmplY3QpICYmICFpc0FycmF5KG9iamVjdCkgJiYgIWlzTWFwKG9iamVjdCkgJiYgIWlzU2V0KG9iamVjdCkpXHJcbiAgKSB7IHJldHVybiBmYWxzZTsgfVxyXG4gIGlmIChpc01hcChvYmplY3QpIHx8IGlzU2V0KG9iamVjdCkpIHsgcmV0dXJuIG9iamVjdC5oYXMocHJvcGVydHkpOyB9XHJcbiAgaWYgKHR5cGVvZiBwcm9wZXJ0eSA9PT0gJ251bWJlcicpIHtcclxuICAgIGlmIChpc0FycmF5KG9iamVjdCkpIHsgcmV0dXJuIG9iamVjdFs8bnVtYmVyPnByb3BlcnR5XTsgfVxyXG4gICAgcHJvcGVydHkgPSBwcm9wZXJ0eSArICcnO1xyXG4gIH1cclxuICByZXR1cm4gb2JqZWN0Lmhhc093blByb3BlcnR5KHByb3BlcnR5KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFR5cGVzIG9mIHBvc3NpYmxlIGV4cHJlc3Npb25zIHdoaWNoIHRoZSBhcHAgaXMgYWJsZSB0byBldmFsdWF0ZS5cclxuICovXHJcbmV4cG9ydCBlbnVtIEV4cHJlc3Npb25UeXBlIHtcclxuICBFUVVBTFMsXHJcbiAgTk9UX0VRVUFMUyxcclxuICBOT1RfQU5fRVhQUkVTU0lPTlxyXG59XHJcblxyXG4vKipcclxuICogRGV0ZWN0cyB0aGUgdHlwZSBvZiBleHByZXNzaW9uIGZyb20gdGhlIGdpdmVuIGNhbmRpZGF0ZS4gYD09YCBmb3IgZXF1YWxzLFxyXG4gKiBgIT1gIGZvciBub3QgZXF1YWxzLiBJZiBub25lIG9mIHRoZXNlIGFyZSBjb250YWluZWQgaW4gdGhlIGNhbmRpZGF0ZSwgdGhlIGNhbmRpZGF0ZVxyXG4gKiBpcyBub3QgY29uc2lkZXJlZCB0byBiZSBhbiBleHByZXNzaW9uIGF0IGFsbCBhbmQgdGh1cyBgTk9UX0FOX0VYUFJFU1NJT05gIGlzIHJldHVybmVkLlxyXG4gKiAvLyB7ZXhwcmVzc2lvbkNhbmRpZGF0ZX0gZXhwcmVzc2lvbkNhbmRpZGF0ZSAtIHBvdGVudGlhbCBleHByZXNzaW9uXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RXhwcmVzc2lvblR5cGUoZXhwcmVzc2lvbkNhbmRpZGF0ZTogc3RyaW5nKTogRXhwcmVzc2lvblR5cGUge1xyXG4gIGlmIChleHByZXNzaW9uQ2FuZGlkYXRlLmluZGV4T2YoJz09JykgIT09IC0xKSB7XHJcbiAgICByZXR1cm4gRXhwcmVzc2lvblR5cGUuRVFVQUxTO1xyXG4gIH1cclxuXHJcbiAgaWYgKGV4cHJlc3Npb25DYW5kaWRhdGUudG9TdHJpbmcoKS5pbmRleE9mKCchPScpICE9PSAtMSkge1xyXG4gICAgcmV0dXJuIEV4cHJlc3Npb25UeXBlLk5PVF9FUVVBTFM7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gRXhwcmVzc2lvblR5cGUuTk9UX0FOX0VYUFJFU1NJT047XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc0VxdWFsKGV4cHJlc3Npb25UeXBlKSB7XHJcbiAgcmV0dXJuIGV4cHJlc3Npb25UeXBlIGFzIEV4cHJlc3Npb25UeXBlID09PSBFeHByZXNzaW9uVHlwZS5FUVVBTFM7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc05vdEVxdWFsKGV4cHJlc3Npb25UeXBlKSB7XHJcbiAgcmV0dXJuIGV4cHJlc3Npb25UeXBlIGFzIEV4cHJlc3Npb25UeXBlID09PSBFeHByZXNzaW9uVHlwZS5OT1RfRVFVQUxTO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNOb3RFeHByZXNzaW9uKGV4cHJlc3Npb25UeXBlKSB7XHJcbiAgcmV0dXJuIGV4cHJlc3Npb25UeXBlIGFzIEV4cHJlc3Npb25UeXBlID09PSBFeHByZXNzaW9uVHlwZS5OT1RfQU5fRVhQUkVTU0lPTjtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNwbGl0cyB0aGUgZXhwcmVzc2lvbiBrZXkgYnkgdGhlIGV4cHJlc3Npb25UeXBlIG9uIGEgcGFpciBvZiB2YWx1ZXNcclxuICogYmVmb3JlIGFuZCBhZnRlciB0aGUgZXF1YWxzIG9yIG5vciBlcXVhbHMgc2lnbi5cclxuICogLy8ge2V4cHJlc3Npb25UeXBlfSBlbnVtIG9mIGFuIGV4cHJlc3Npb24gdHlwZVxyXG4gKiAvLyB7a2V5fSB0aGUgZ2l2ZW4ga2V5IGZyb20gYSBmb3IgbG9vcCBpdmVyIGFsbCBjb25kaXRpb25zXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0S2V5QW5kVmFsdWVCeUV4cHJlc3Npb25UeXBlKGV4cHJlc3Npb25UeXBlOiBFeHByZXNzaW9uVHlwZSwga2V5OiBzdHJpbmcpIHtcclxuICBpZiAoaXNFcXVhbChleHByZXNzaW9uVHlwZSkpIHtcclxuICAgIHJldHVybiBrZXkuc3BsaXQoJz09JywgMik7XHJcbiAgfVxyXG5cclxuICBpZiAoaXNOb3RFcXVhbChleHByZXNzaW9uVHlwZSkpIHtcclxuICAgIHJldHVybiBrZXkuc3BsaXQoJyE9JywgMik7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gbnVsbDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNsZWFuVmFsdWVPZlF1b3RlcyhrZXlBbmRWYWx1ZSk6IFN0cmluZyB7XHJcbiAgaWYgKGtleUFuZFZhbHVlLmNoYXJBdCgwKSA9PT0gJ1xcJycgJiYga2V5QW5kVmFsdWUuY2hhckF0KGtleUFuZFZhbHVlLmxlbmd0aCAtIDEpID09PSAnXFwnJykge1xyXG4gICAgcmV0dXJuIGtleUFuZFZhbHVlLnJlcGxhY2UoJ1xcJycsICcnKS5yZXBsYWNlKCdcXCcnLCAnJyk7XHJcbiAgfVxyXG4gIHJldHVybiBrZXlBbmRWYWx1ZTtcclxufVxyXG5cclxuLyoqXHJcbiAqICdtZXJnZUZpbHRlcmVkT2JqZWN0JyB1dGlsaXR5IGZ1bmN0aW9uXHJcbiAqXHJcbiAqIFNoYWxsb3dseSBtZXJnZXMgdHdvIG9iamVjdHMsIHNldHRpbmcga2V5IGFuZCB2YWx1ZXMgZnJvbSBzb3VyY2Ugb2JqZWN0XHJcbiAqIGluIHRhcmdldCBvYmplY3QsIGV4Y2x1ZGluZyBzcGVjaWZpZWQga2V5cy5cclxuICpcclxuICogT3B0aW9uYWxseSwgaXQgY2FuIGFsc28gdXNlIGZ1bmN0aW9ucyB0byB0cmFuc2Zvcm0gdGhlIGtleSBuYW1lcyBhbmQvb3JcclxuICogdGhlIHZhbHVlcyBvZiB0aGUgbWVyZ2luZyBvYmplY3QuXHJcbiAqXHJcbiAqIC8vIHtQbGFpbk9iamVjdH0gdGFyZ2V0T2JqZWN0IC0gVGFyZ2V0IG9iamVjdCB0byBhZGQga2V5cyBhbmQgdmFsdWVzIHRvXHJcbiAqIC8vIHtQbGFpbk9iamVjdH0gc291cmNlT2JqZWN0IC0gU291cmNlIG9iamVjdCB0byBjb3B5IGtleXMgYW5kIHZhbHVlcyBmcm9tXHJcbiAqIC8vIHtzdHJpbmdbXX0gZXhjbHVkZUtleXMgLSBBcnJheSBvZiBrZXlzIHRvIGV4Y2x1ZGVcclxuICogLy8geyhzdHJpbmc6IHN0cmluZykgPT4gc3RyaW5nID0gKGspID0+IGt9IGtleUZuIC0gRnVuY3Rpb24gdG8gYXBwbHkgdG8ga2V5c1xyXG4gKiAvLyB7KGFueTogYW55KSA9PiBhbnkgPSAodikgPT4gdn0gdmFsdWVGbiAtIEZ1bmN0aW9uIHRvIGFwcGx5IHRvIHZhbHVlc1xyXG4gKiAvLyB7UGxhaW5PYmplY3R9IC0gUmV0dXJucyB0YXJnZXRPYmplY3RcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBtZXJnZUZpbHRlcmVkT2JqZWN0KFxyXG4gIHRhcmdldE9iamVjdDogUGxhaW5PYmplY3QsXHJcbiAgc291cmNlT2JqZWN0OiBQbGFpbk9iamVjdCxcclxuICBleGNsdWRlS2V5cyA9IDxzdHJpbmdbXT5bXSxcclxuICBrZXlGbiA9IChrZXk6IHN0cmluZyk6IHN0cmluZyA9PiBrZXksXHJcbiAgdmFsRm4gPSAodmFsOiBhbnkpOiBhbnkgPT4gdmFsXHJcbik6IFBsYWluT2JqZWN0IHtcclxuICBpZiAoIWlzT2JqZWN0KHNvdXJjZU9iamVjdCkpIHsgcmV0dXJuIHRhcmdldE9iamVjdDsgfVxyXG4gIGlmICghaXNPYmplY3QodGFyZ2V0T2JqZWN0KSkgeyB0YXJnZXRPYmplY3QgPSB7fTsgfVxyXG4gIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKHNvdXJjZU9iamVjdCkpIHtcclxuICAgIGlmICghaW5BcnJheShrZXksIGV4Y2x1ZGVLZXlzKSAmJiBpc0RlZmluZWQoc291cmNlT2JqZWN0W2tleV0pKSB7XHJcbiAgICAgIHRhcmdldE9iamVjdFtrZXlGbihrZXkpXSA9IHZhbEZuKHNvdXJjZU9iamVjdFtrZXldKTtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIHRhcmdldE9iamVjdDtcclxufVxyXG5cclxuLyoqXHJcbiAqICd1bmlxdWVJdGVtcycgZnVuY3Rpb25cclxuICpcclxuICogQWNjZXB0cyBhbnkgbnVtYmVyIG9mIHN0cmluZyB2YWx1ZSBpbnB1dHMsXHJcbiAqIGFuZCByZXR1cm5zIGFuIGFycmF5IG9mIGFsbCBpbnB1dCB2YXVlcywgZXhjbHVkaW5nIGR1cGxpY2F0ZXMuXHJcbiAqXHJcbiAqIC8vIHsuLi5zdHJpbmd9IC4uLml0ZW1zIC1cclxuICogLy8ge3N0cmluZ1tdfSAtXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gdW5pcXVlSXRlbXMoLi4uaXRlbXMpOiBzdHJpbmdbXSB7XHJcbiAgY29uc3QgcmV0dXJuSXRlbXMgPSBbXTtcclxuICBmb3IgKGNvbnN0IGl0ZW0gb2YgaXRlbXMpIHtcclxuICAgIGlmICghcmV0dXJuSXRlbXMuaW5jbHVkZXMoaXRlbSkpIHsgcmV0dXJuSXRlbXMucHVzaChpdGVtKTsgfVxyXG4gIH1cclxuICByZXR1cm4gcmV0dXJuSXRlbXM7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiAnY29tbW9uSXRlbXMnIGZ1bmN0aW9uXHJcbiAqXHJcbiAqIEFjY2VwdHMgYW55IG51bWJlciBvZiBzdHJpbmdzIG9yIGFycmF5cyBvZiBzdHJpbmcgdmFsdWVzLFxyXG4gKiBhbmQgcmV0dXJucyBhIHNpbmdsZSBhcnJheSBjb250YWluaW5nIG9ubHkgdmFsdWVzIHByZXNlbnQgaW4gYWxsIGlucHV0cy5cclxuICpcclxuICogLy8gey4uLnN0cmluZ3xzdHJpbmdbXX0gLi4uYXJyYXlzIC1cclxuICogLy8ge3N0cmluZ1tdfSAtXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY29tbW9uSXRlbXMoLi4uYXJyYXlzKTogc3RyaW5nW10ge1xyXG4gIGxldCByZXR1cm5JdGVtcyA9IG51bGw7XHJcbiAgZm9yIChsZXQgYXJyYXkgb2YgYXJyYXlzKSB7XHJcbiAgICBpZiAoaXNTdHJpbmcoYXJyYXkpKSB7IGFycmF5ID0gW2FycmF5XTsgfVxyXG4gICAgcmV0dXJuSXRlbXMgPSByZXR1cm5JdGVtcyA9PT0gbnVsbCA/IFsgLi4uYXJyYXkgXSA6XHJcbiAgICAgIHJldHVybkl0ZW1zLmZpbHRlcihpdGVtID0+IGFycmF5LmluY2x1ZGVzKGl0ZW0pKTtcclxuICAgIGlmICghcmV0dXJuSXRlbXMubGVuZ3RoKSB7IHJldHVybiBbXTsgfVxyXG4gIH1cclxuICByZXR1cm4gcmV0dXJuSXRlbXM7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiAnZml4VGl0bGUnIGZ1bmN0aW9uXHJcbiAqXHJcbiAqXHJcbiAqIC8vIHtzdHJpbmd9IGlucHV0IC1cclxuICogLy8ge3N0cmluZ30gLVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGZpeFRpdGxlKG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgcmV0dXJuIG5hbWUgJiYgdG9UaXRsZUNhc2UobmFtZS5yZXBsYWNlKC8oW2Etel0pKFtBLVpdKS9nLCAnJDEgJDInKS5yZXBsYWNlKC9fL2csICcgJykpO1xyXG59XHJcblxyXG4vKipcclxuICogJ3RvVGl0bGVDYXNlJyBmdW5jdGlvblxyXG4gKlxyXG4gKiBJbnRlbGxpZ2VudGx5IGNvbnZlcnRzIGFuIGlucHV0IHN0cmluZyB0byBUaXRsZSBDYXNlLlxyXG4gKlxyXG4gKiBBY2NlcHRzIGFuIG9wdGlvbmFsIHNlY29uZCBwYXJhbWV0ZXIgd2l0aCBhIGxpc3Qgb2YgYWRkaXRpb25hbFxyXG4gKiB3b3JkcyBhbmQgYWJicmV2aWF0aW9ucyB0byBmb3JjZSBpbnRvIGEgcGFydGljdWxhciBjYXNlLlxyXG4gKlxyXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGJ1aWx0IG9uIHByaW9yIHdvcmsgYnkgSm9obiBHcnViZXIgYW5kIERhdmlkIEdvdWNoOlxyXG4gKiBodHRwOi8vZGFyaW5nZmlyZWJhbGwubmV0LzIwMDgvMDgvdGl0bGVfY2FzZV91cGRhdGVcclxuICogaHR0cHM6Ly9naXRodWIuY29tL2dvdWNoL3RvLXRpdGxlLWNhc2VcclxuICpcclxuICogLy8ge3N0cmluZ30gaW5wdXQgLVxyXG4gKiAvLyB7c3RyaW5nfHN0cmluZ1tdfSBmb3JjZVdvcmRzPyAtXHJcbiAqIC8vIHtzdHJpbmd9IC1cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiB0b1RpdGxlQ2FzZShpbnB1dDogc3RyaW5nLCBmb3JjZVdvcmRzPzogc3RyaW5nfHN0cmluZ1tdKTogc3RyaW5nIHtcclxuICBpZiAoIWlzU3RyaW5nKGlucHV0KSkgeyByZXR1cm4gaW5wdXQ7IH1cclxuICBsZXQgZm9yY2VBcnJheTogc3RyaW5nW10gPSBbJ2EnLCAnYW4nLCAnYW5kJywgJ2FzJywgJ2F0JywgJ2J1dCcsICdieScsICdlbicsXHJcbiAgICdmb3InLCAnaWYnLCAnaW4nLCAnbm9yJywgJ29mJywgJ29uJywgJ29yJywgJ3BlcicsICd0aGUnLCAndG8nLCAndicsICd2LicsXHJcbiAgICd2cycsICd2cy4nLCAndmlhJ107XHJcbiAgaWYgKGlzU3RyaW5nKGZvcmNlV29yZHMpKSB7IGZvcmNlV29yZHMgPSAoPHN0cmluZz5mb3JjZVdvcmRzKS5zcGxpdCgnfCcpOyB9XHJcbiAgaWYgKGlzQXJyYXkoZm9yY2VXb3JkcykpIHsgZm9yY2VBcnJheSA9IGZvcmNlQXJyYXkuY29uY2F0KGZvcmNlV29yZHMpOyB9XHJcbiAgY29uc3QgZm9yY2VBcnJheUxvd2VyOiBzdHJpbmdbXSA9IGZvcmNlQXJyYXkubWFwKHcgPT4gdy50b0xvd2VyQ2FzZSgpKTtcclxuICBjb25zdCBub0luaXRpYWxDYXNlOiBib29sZWFuID1cclxuICAgIGlucHV0ID09PSBpbnB1dC50b1VwcGVyQ2FzZSgpIHx8IGlucHV0ID09PSBpbnB1dC50b0xvd2VyQ2FzZSgpO1xyXG4gIGxldCBwcmV2TGFzdENoYXIgPSAnJztcclxuICBpbnB1dCA9IGlucHV0LnRyaW0oKTtcclxuICByZXR1cm4gaW5wdXQucmVwbGFjZSgvW0EtWmEtejAtOVxcdTAwQzAtXFx1MDBGRl0rW15cXHMtXSovZywgKHdvcmQsIGlkeCkgPT4ge1xyXG4gICAgaWYgKCFub0luaXRpYWxDYXNlICYmIHdvcmQuc2xpY2UoMSkuc2VhcmNoKC9bQS1aXXxcXC4uLykgIT09IC0xKSB7XHJcbiAgICAgIHJldHVybiB3b3JkO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbGV0IG5ld1dvcmQ6IHN0cmluZztcclxuICAgICAgY29uc3QgZm9yY2VXb3JkOiBzdHJpbmcgPVxyXG4gICAgICAgIGZvcmNlQXJyYXlbZm9yY2VBcnJheUxvd2VyLmluZGV4T2Yod29yZC50b0xvd2VyQ2FzZSgpKV07XHJcbiAgICAgIGlmICghZm9yY2VXb3JkKSB7XHJcbiAgICAgICAgaWYgKG5vSW5pdGlhbENhc2UpIHtcclxuICAgICAgICAgIGlmICh3b3JkLnNsaWNlKDEpLnNlYXJjaCgvXFwuLi8pICE9PSAtMSkge1xyXG4gICAgICAgICAgICBuZXdXb3JkID0gd29yZC50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbmV3V29yZCA9IHdvcmRbMF0udG9VcHBlckNhc2UoKSArIHdvcmQuc2xpY2UoMSkudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgbmV3V29yZCA9IHdvcmRbMF0udG9VcHBlckNhc2UoKSArIHdvcmQuc2xpY2UoMSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2UgaWYgKFxyXG4gICAgICAgIGZvcmNlV29yZCA9PT0gZm9yY2VXb3JkLnRvTG93ZXJDYXNlKCkgJiYgKFxyXG4gICAgICAgICAgaWR4ID09PSAwIHx8IGlkeCArIHdvcmQubGVuZ3RoID09PSBpbnB1dC5sZW5ndGggfHxcclxuICAgICAgICAgIHByZXZMYXN0Q2hhciA9PT0gJzonIHx8IGlucHV0W2lkeCAtIDFdLnNlYXJjaCgvW15cXHMtXS8pICE9PSAtMSB8fFxyXG4gICAgICAgICAgKGlucHV0W2lkeCAtIDFdICE9PSAnLScgJiYgaW5wdXRbaWR4ICsgd29yZC5sZW5ndGhdID09PSAnLScpXHJcbiAgICAgICAgKVxyXG4gICAgICApIHtcclxuICAgICAgICBuZXdXb3JkID0gZm9yY2VXb3JkWzBdLnRvVXBwZXJDYXNlKCkgKyBmb3JjZVdvcmQuc2xpY2UoMSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbmV3V29yZCA9IGZvcmNlV29yZDtcclxuICAgICAgfVxyXG4gICAgICBwcmV2TGFzdENoYXIgPSB3b3JkLnNsaWNlKC0xKTtcclxuICAgICAgcmV0dXJuIG5ld1dvcmQ7XHJcbiAgICB9XHJcbiAgfSk7XHJcbn1cclxuIl19