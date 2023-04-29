import isEqual from 'lodash/isEqual';
import { isArray, isEmpty, isNumber, isObject, isString } from './validator.functions';
import { hasOwn, uniqueItems, commonItems } from './utility.functions';
/**
 * 'mergeSchemas' function
 *
 * Merges multiple JSON schemas into a single schema with combined rules.
 *
 * If able to logically merge properties from all schemas,
 * returns a single schema object containing all merged properties.
 *
 * Example: ({ a: b, max: 1 }, { c: d, max: 2 }) => { a: b, c: d, max: 1 }
 *
 * If unable to logically merge, returns an allOf schema object containing
 * an array of the original schemas;
 *
 * Example: ({ a: b }, { a: d }) => { allOf: [ { a: b }, { a: d } ] }
 *
 * //   schemas - one or more input schemas
 * //  - merged schema
 */
export function mergeSchemas(...schemas) {
    schemas = schemas.filter(schema => !isEmpty(schema));
    if (schemas.some(schema => !isObject(schema))) {
        return null;
    }
    const combinedSchema = {};
    for (const schema of schemas) {
        for (const key of Object.keys(schema)) {
            const combinedValue = combinedSchema[key];
            const schemaValue = schema[key];
            if (!hasOwn(combinedSchema, key) || isEqual(combinedValue, schemaValue)) {
                combinedSchema[key] = schemaValue;
            }
            else {
                switch (key) {
                    case 'allOf':
                        // Combine all items from both arrays
                        if (isArray(combinedValue) && isArray(schemaValue)) {
                            combinedSchema.allOf = mergeSchemas(...combinedValue, ...schemaValue);
                        }
                        else {
                            return { allOf: [...schemas] };
                        }
                        break;
                    case 'additionalItems':
                    case 'additionalProperties':
                    case 'contains':
                    case 'propertyNames':
                        // Merge schema objects
                        if (isObject(combinedValue) && isObject(schemaValue)) {
                            combinedSchema[key] = mergeSchemas(combinedValue, schemaValue);
                            // additionalProperties == false in any schema overrides all other values
                        }
                        else if (key === 'additionalProperties' &&
                            (combinedValue === false || schemaValue === false)) {
                            combinedSchema.combinedSchema = false;
                        }
                        else {
                            return { allOf: [...schemas] };
                        }
                        break;
                    case 'anyOf':
                    case 'oneOf':
                    case 'enum':
                        // Keep only items that appear in both arrays
                        if (isArray(combinedValue) && isArray(schemaValue)) {
                            combinedSchema[key] = combinedValue.filter(item1 => schemaValue.findIndex(item2 => isEqual(item1, item2)) > -1);
                            if (!combinedSchema[key].length) {
                                return { allOf: [...schemas] };
                            }
                        }
                        else {
                            return { allOf: [...schemas] };
                        }
                        break;
                    case 'definitions':
                        // Combine keys from both objects
                        if (isObject(combinedValue) && isObject(schemaValue)) {
                            const combinedObject = { ...combinedValue };
                            for (const subKey of Object.keys(schemaValue)) {
                                if (!hasOwn(combinedObject, subKey) ||
                                    isEqual(combinedObject[subKey], schemaValue[subKey])) {
                                    combinedObject[subKey] = schemaValue[subKey];
                                    // Don't combine matching keys with different values
                                }
                                else {
                                    return { allOf: [...schemas] };
                                }
                            }
                            combinedSchema.definitions = combinedObject;
                        }
                        else {
                            return { allOf: [...schemas] };
                        }
                        break;
                    case 'dependencies':
                        // Combine all keys from both objects
                        // and merge schemas on matching keys,
                        // converting from arrays to objects if necessary
                        if (isObject(combinedValue) && isObject(schemaValue)) {
                            const combinedObject = { ...combinedValue };
                            for (const subKey of Object.keys(schemaValue)) {
                                if (!hasOwn(combinedObject, subKey) ||
                                    isEqual(combinedObject[subKey], schemaValue[subKey])) {
                                    combinedObject[subKey] = schemaValue[subKey];
                                    // If both keys are arrays, include all items from both arrays,
                                    // excluding duplicates
                                }
                                else if (isArray(schemaValue[subKey]) && isArray(combinedObject[subKey])) {
                                    combinedObject[subKey] =
                                        uniqueItems(...combinedObject[subKey], ...schemaValue[subKey]);
                                    // If either key is an object, merge the schemas
                                }
                                else if ((isArray(schemaValue[subKey]) || isObject(schemaValue[subKey])) &&
                                    (isArray(combinedObject[subKey]) || isObject(combinedObject[subKey]))) {
                                    // If either key is an array, convert it to an object first
                                    const required = isArray(combinedSchema.required) ?
                                        combinedSchema.required : [];
                                    const combinedDependency = isArray(combinedObject[subKey]) ?
                                        { required: uniqueItems(...required, combinedObject[subKey]) } :
                                        combinedObject[subKey];
                                    const schemaDependency = isArray(schemaValue[subKey]) ?
                                        { required: uniqueItems(...required, schemaValue[subKey]) } :
                                        schemaValue[subKey];
                                    combinedObject[subKey] =
                                        mergeSchemas(combinedDependency, schemaDependency);
                                }
                                else {
                                    return { allOf: [...schemas] };
                                }
                            }
                            combinedSchema.dependencies = combinedObject;
                        }
                        else {
                            return { allOf: [...schemas] };
                        }
                        break;
                    case 'items':
                        // If arrays, keep only items that appear in both arrays
                        if (isArray(combinedValue) && isArray(schemaValue)) {
                            combinedSchema.items = combinedValue.filter(item1 => schemaValue.findIndex(item2 => isEqual(item1, item2)) > -1);
                            if (!combinedSchema.items.length) {
                                return { allOf: [...schemas] };
                            }
                            // If both keys are objects, merge them
                        }
                        else if (isObject(combinedValue) && isObject(schemaValue)) {
                            combinedSchema.items = mergeSchemas(combinedValue, schemaValue);
                            // If object + array, combine object with each array item
                        }
                        else if (isArray(combinedValue) && isObject(schemaValue)) {
                            combinedSchema.items =
                                combinedValue.map(item => mergeSchemas(item, schemaValue));
                        }
                        else if (isObject(combinedValue) && isArray(schemaValue)) {
                            combinedSchema.items =
                                schemaValue.map(item => mergeSchemas(item, combinedValue));
                        }
                        else {
                            return { allOf: [...schemas] };
                        }
                        break;
                    case 'multipleOf':
                        // TODO: Adjust to correctly handle decimal values
                        // If numbers, set to least common multiple
                        if (isNumber(combinedValue) && isNumber(schemaValue)) {
                            const gcd = (x, y) => !y ? x : gcd(y, x % y);
                            const lcm = (x, y) => (x * y) / gcd(x, y);
                            combinedSchema.multipleOf = lcm(combinedValue, schemaValue);
                        }
                        else {
                            return { allOf: [...schemas] };
                        }
                        break;
                    case 'maximum':
                    case 'exclusiveMaximum':
                    case 'maxLength':
                    case 'maxItems':
                    case 'maxProperties':
                        // If numbers, set to lowest value
                        if (isNumber(combinedValue) && isNumber(schemaValue)) {
                            combinedSchema[key] = Math.min(combinedValue, schemaValue);
                        }
                        else {
                            return { allOf: [...schemas] };
                        }
                        break;
                    case 'minimum':
                    case 'exclusiveMinimum':
                    case 'minLength':
                    case 'minItems':
                    case 'minProperties':
                        // If numbers, set to highest value
                        if (isNumber(combinedValue) && isNumber(schemaValue)) {
                            combinedSchema[key] = Math.max(combinedValue, schemaValue);
                        }
                        else {
                            return { allOf: [...schemas] };
                        }
                        break;
                    case 'not':
                        // Combine not values into anyOf array
                        if (isObject(combinedValue) && isObject(schemaValue)) {
                            const notAnyOf = [combinedValue, schemaValue]
                                .reduce((notAnyOfArray, notSchema) => isArray(notSchema.anyOf) &&
                                Object.keys(notSchema).length === 1 ?
                                [...notAnyOfArray, ...notSchema.anyOf] :
                                [...notAnyOfArray, notSchema], []);
                            // TODO: Remove duplicate items from array
                            combinedSchema.not = { anyOf: notAnyOf };
                        }
                        else {
                            return { allOf: [...schemas] };
                        }
                        break;
                    case 'patternProperties':
                        // Combine all keys from both objects
                        // and merge schemas on matching keys
                        if (isObject(combinedValue) && isObject(schemaValue)) {
                            const combinedObject = { ...combinedValue };
                            for (const subKey of Object.keys(schemaValue)) {
                                if (!hasOwn(combinedObject, subKey) ||
                                    isEqual(combinedObject[subKey], schemaValue[subKey])) {
                                    combinedObject[subKey] = schemaValue[subKey];
                                    // If both keys are objects, merge them
                                }
                                else if (isObject(schemaValue[subKey]) && isObject(combinedObject[subKey])) {
                                    combinedObject[subKey] =
                                        mergeSchemas(combinedObject[subKey], schemaValue[subKey]);
                                }
                                else {
                                    return { allOf: [...schemas] };
                                }
                            }
                            combinedSchema.patternProperties = combinedObject;
                        }
                        else {
                            return { allOf: [...schemas] };
                        }
                        break;
                    case 'properties':
                        // Combine all keys from both objects
                        // unless additionalProperties === false
                        // and merge schemas on matching keys
                        if (isObject(combinedValue) && isObject(schemaValue)) {
                            const combinedObject = { ...combinedValue };
                            // If new schema has additionalProperties,
                            // merge or remove non-matching property keys in combined schema
                            if (hasOwn(schemaValue, 'additionalProperties')) {
                                Object.keys(combinedValue)
                                    .filter(combinedKey => !Object.keys(schemaValue).includes(combinedKey))
                                    .forEach(nonMatchingKey => {
                                    if (schemaValue.additionalProperties === false) {
                                        delete combinedObject[nonMatchingKey];
                                    }
                                    else if (isObject(schemaValue.additionalProperties)) {
                                        combinedObject[nonMatchingKey] = mergeSchemas(combinedObject[nonMatchingKey], schemaValue.additionalProperties);
                                    }
                                });
                            }
                            for (const subKey of Object.keys(schemaValue)) {
                                if (isEqual(combinedObject[subKey], schemaValue[subKey]) || (!hasOwn(combinedObject, subKey) &&
                                    !hasOwn(combinedObject, 'additionalProperties'))) {
                                    combinedObject[subKey] = schemaValue[subKey];
                                    // If combined schema has additionalProperties,
                                    // merge or ignore non-matching property keys in new schema
                                }
                                else if (!hasOwn(combinedObject, subKey) &&
                                    hasOwn(combinedObject, 'additionalProperties')) {
                                    // If combinedObject.additionalProperties === false,
                                    // do nothing (don't set key)
                                    // If additionalProperties is object, merge with new key
                                    if (isObject(combinedObject.additionalProperties)) {
                                        combinedObject[subKey] = mergeSchemas(combinedObject.additionalProperties, schemaValue[subKey]);
                                    }
                                    // If both keys are objects, merge them
                                }
                                else if (isObject(schemaValue[subKey]) &&
                                    isObject(combinedObject[subKey])) {
                                    combinedObject[subKey] =
                                        mergeSchemas(combinedObject[subKey], schemaValue[subKey]);
                                }
                                else {
                                    return { allOf: [...schemas] };
                                }
                            }
                            combinedSchema.properties = combinedObject;
                        }
                        else {
                            return { allOf: [...schemas] };
                        }
                        break;
                    case 'required':
                        // If arrays, include all items from both arrays, excluding duplicates
                        if (isArray(combinedValue) && isArray(schemaValue)) {
                            combinedSchema.required = uniqueItems(...combinedValue, ...schemaValue);
                            // If booleans, aet true if either true
                        }
                        else if (typeof schemaValue === 'boolean' &&
                            typeof combinedValue === 'boolean') {
                            combinedSchema.required = !!combinedValue || !!schemaValue;
                        }
                        else {
                            return { allOf: [...schemas] };
                        }
                        break;
                    case '$schema':
                    case '$id':
                    case 'id':
                        // Don't combine these keys
                        break;
                    case 'title':
                    case 'description':
                    case '$comment':
                        // Return the last value, overwriting any previous one
                        // These properties are not used for validation, so conflicts don't matter
                        combinedSchema[key] = schemaValue;
                        break;
                    case 'type':
                        if ((isArray(schemaValue) || isString(schemaValue)) &&
                            (isArray(combinedValue) || isString(combinedValue))) {
                            const combinedTypes = commonItems(combinedValue, schemaValue);
                            if (!combinedTypes.length) {
                                return { allOf: [...schemas] };
                            }
                            combinedSchema.type = combinedTypes.length > 1 ? combinedTypes : combinedTypes[0];
                        }
                        else {
                            return { allOf: [...schemas] };
                        }
                        break;
                    case 'uniqueItems':
                        // Set true if either true
                        combinedSchema.uniqueItems = !!combinedValue || !!schemaValue;
                        break;
                    default:
                        return { allOf: [...schemas] };
                }
            }
        }
    }
    return combinedSchema;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2Utc2NoZW1hcy5mdW5jdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2Fqc2YtY29yZS9zcmMvbGliL3NoYXJlZC9tZXJnZS1zY2hlbWFzLmZ1bmN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sT0FBTyxNQUFNLGdCQUFnQixDQUFDO0FBRXJDLE9BQU8sRUFDTCxPQUFPLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUMvQyxNQUFNLHVCQUF1QixDQUFDO0FBQy9CLE9BQU8sRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRSxNQUFNLHFCQUFxQixDQUFDO0FBR3ZFOzs7Ozs7Ozs7Ozs7Ozs7OztHQWlCRztBQUNILE1BQU0sVUFBVSxZQUFZLENBQUMsR0FBRyxPQUFPO0lBQ3JDLE9BQU8sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUNyRCxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFO1FBQUUsT0FBTyxJQUFJLENBQUM7S0FBRTtJQUMvRCxNQUFNLGNBQWMsR0FBUSxFQUFFLENBQUM7SUFDL0IsS0FBSyxNQUFNLE1BQU0sSUFBSSxPQUFPLEVBQUU7UUFDNUIsS0FBSyxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ3JDLE1BQU0sYUFBYSxHQUFHLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMxQyxNQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDaEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsR0FBRyxDQUFDLElBQUksT0FBTyxDQUFDLGFBQWEsRUFBRSxXQUFXLENBQUMsRUFBRTtnQkFDdkUsY0FBYyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFdBQVcsQ0FBQzthQUNuQztpQkFBTTtnQkFDTCxRQUFRLEdBQUcsRUFBRTtvQkFDWCxLQUFLLE9BQU87d0JBQ1YscUNBQXFDO3dCQUNyQyxJQUFJLE9BQU8sQ0FBQyxhQUFhLENBQUMsSUFBSSxPQUFPLENBQUMsV0FBVyxDQUFDLEVBQUU7NEJBQ2xELGNBQWMsQ0FBQyxLQUFLLEdBQUcsWUFBWSxDQUFDLEdBQUcsYUFBYSxFQUFFLEdBQUcsV0FBVyxDQUFDLENBQUM7eUJBQ3ZFOzZCQUFNOzRCQUNMLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBRSxHQUFHLE9BQU8sQ0FBRSxFQUFFLENBQUM7eUJBQ2xDO3dCQUNILE1BQU07b0JBQ04sS0FBSyxpQkFBaUIsQ0FBQztvQkFBQyxLQUFLLHNCQUFzQixDQUFDO29CQUNwRCxLQUFLLFVBQVUsQ0FBQztvQkFBQyxLQUFLLGVBQWU7d0JBQ25DLHVCQUF1Qjt3QkFDdkIsSUFBSSxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksUUFBUSxDQUFDLFdBQVcsQ0FBQyxFQUFFOzRCQUNwRCxjQUFjLENBQUMsR0FBRyxDQUFDLEdBQUcsWUFBWSxDQUFDLGFBQWEsRUFBRSxXQUFXLENBQUMsQ0FBQzs0QkFDakUseUVBQXlFO3lCQUN4RTs2QkFBTSxJQUNMLEdBQUcsS0FBSyxzQkFBc0I7NEJBQzlCLENBQUMsYUFBYSxLQUFLLEtBQUssSUFBSSxXQUFXLEtBQUssS0FBSyxDQUFDLEVBQ2xEOzRCQUNBLGNBQWMsQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDO3lCQUN2Qzs2QkFBTTs0QkFDTCxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUUsR0FBRyxPQUFPLENBQUUsRUFBRSxDQUFDO3lCQUNsQzt3QkFDSCxNQUFNO29CQUNOLEtBQUssT0FBTyxDQUFDO29CQUFDLEtBQUssT0FBTyxDQUFDO29CQUFDLEtBQUssTUFBTTt3QkFDckMsNkNBQTZDO3dCQUM3QyxJQUFJLE9BQU8sQ0FBQyxhQUFhLENBQUMsSUFBSSxPQUFPLENBQUMsV0FBVyxDQUFDLEVBQUU7NEJBQ2xELGNBQWMsQ0FBQyxHQUFHLENBQUMsR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQ2pELFdBQVcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQzNELENBQUM7NEJBQ0YsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUU7Z0NBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFFLEdBQUcsT0FBTyxDQUFFLEVBQUUsQ0FBQzs2QkFBRTt5QkFDdkU7NkJBQU07NEJBQ0wsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFFLEdBQUcsT0FBTyxDQUFFLEVBQUUsQ0FBQzt5QkFDbEM7d0JBQ0gsTUFBTTtvQkFDTixLQUFLLGFBQWE7d0JBQ2hCLGlDQUFpQzt3QkFDakMsSUFBSSxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksUUFBUSxDQUFDLFdBQVcsQ0FBQyxFQUFFOzRCQUNwRCxNQUFNLGNBQWMsR0FBRyxFQUFFLEdBQUcsYUFBYSxFQUFFLENBQUM7NEJBQzVDLEtBQUssTUFBTSxNQUFNLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRTtnQ0FDN0MsSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDO29DQUNqQyxPQUFPLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxFQUFFLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUNwRDtvQ0FDQSxjQUFjLENBQUMsTUFBTSxDQUFDLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO29DQUMvQyxvREFBb0Q7aUNBQ25EO3FDQUFNO29DQUNMLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBRSxHQUFHLE9BQU8sQ0FBRSxFQUFFLENBQUM7aUNBQ2xDOzZCQUNGOzRCQUNELGNBQWMsQ0FBQyxXQUFXLEdBQUcsY0FBYyxDQUFDO3lCQUM3Qzs2QkFBTTs0QkFDTCxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUUsR0FBRyxPQUFPLENBQUUsRUFBRSxDQUFDO3lCQUNsQzt3QkFDSCxNQUFNO29CQUNOLEtBQUssY0FBYzt3QkFDakIscUNBQXFDO3dCQUNyQyxzQ0FBc0M7d0JBQ3RDLGlEQUFpRDt3QkFDakQsSUFBSSxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksUUFBUSxDQUFDLFdBQVcsQ0FBQyxFQUFFOzRCQUNwRCxNQUFNLGNBQWMsR0FBRyxFQUFFLEdBQUcsYUFBYSxFQUFFLENBQUM7NEJBQzVDLEtBQUssTUFBTSxNQUFNLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRTtnQ0FDN0MsSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDO29DQUNqQyxPQUFPLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxFQUFFLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUNwRDtvQ0FDQSxjQUFjLENBQUMsTUFBTSxDQUFDLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO29DQUMvQywrREFBK0Q7b0NBQy9ELHVCQUF1QjtpQ0FDdEI7cUNBQU0sSUFDTCxPQUFPLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUMvRDtvQ0FDQSxjQUFjLENBQUMsTUFBTSxDQUFDO3dDQUNwQixXQUFXLENBQUMsR0FBRyxjQUFjLENBQUMsTUFBTSxDQUFDLEVBQUUsR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztvQ0FDbkUsZ0RBQWdEO2lDQUMvQztxQ0FBTSxJQUNMLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztvQ0FDL0QsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksUUFBUSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQ3JFO29DQUNBLDJEQUEyRDtvQ0FDM0QsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO3dDQUNqRCxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7b0NBQy9CLE1BQU0sa0JBQWtCLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7d0NBQzFELEVBQUUsUUFBUSxFQUFFLFdBQVcsQ0FBQyxHQUFHLFFBQVEsRUFBRSxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7d0NBQ2hFLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztvQ0FDekIsTUFBTSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQzt3Q0FDckQsRUFBRSxRQUFRLEVBQUUsV0FBVyxDQUFDLEdBQUcsUUFBUSxFQUFFLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQzt3Q0FDN0QsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO29DQUN0QixjQUFjLENBQUMsTUFBTSxDQUFDO3dDQUNwQixZQUFZLENBQUMsa0JBQWtCLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztpQ0FDdEQ7cUNBQU07b0NBQ0wsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFFLEdBQUcsT0FBTyxDQUFFLEVBQUUsQ0FBQztpQ0FDbEM7NkJBQ0Y7NEJBQ0QsY0FBYyxDQUFDLFlBQVksR0FBRyxjQUFjLENBQUM7eUJBQzlDOzZCQUFNOzRCQUNMLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBRSxHQUFHLE9BQU8sQ0FBRSxFQUFFLENBQUM7eUJBQ2xDO3dCQUNILE1BQU07b0JBQ04sS0FBSyxPQUFPO3dCQUNWLHdEQUF3RDt3QkFDeEQsSUFBSSxPQUFPLENBQUMsYUFBYSxDQUFDLElBQUksT0FBTyxDQUFDLFdBQVcsQ0FBQyxFQUFFOzRCQUNsRCxjQUFjLENBQUMsS0FBSyxHQUFHLGFBQWEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FDbEQsV0FBVyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FDM0QsQ0FBQzs0QkFDRixJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUU7Z0NBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFFLEdBQUcsT0FBTyxDQUFFLEVBQUUsQ0FBQzs2QkFBRTs0QkFDekUsdUNBQXVDO3lCQUN0Qzs2QkFBTSxJQUFJLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxRQUFRLENBQUMsV0FBVyxDQUFDLEVBQUU7NEJBQzNELGNBQWMsQ0FBQyxLQUFLLEdBQUcsWUFBWSxDQUFDLGFBQWEsRUFBRSxXQUFXLENBQUMsQ0FBQzs0QkFDbEUseURBQXlEO3lCQUN4RDs2QkFBTSxJQUFJLE9BQU8sQ0FBQyxhQUFhLENBQUMsSUFBSSxRQUFRLENBQUMsV0FBVyxDQUFDLEVBQUU7NEJBQzFELGNBQWMsQ0FBQyxLQUFLO2dDQUNsQixhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDO3lCQUM5RDs2QkFBTSxJQUFJLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxPQUFPLENBQUMsV0FBVyxDQUFDLEVBQUU7NEJBQzFELGNBQWMsQ0FBQyxLQUFLO2dDQUNsQixXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFDO3lCQUM5RDs2QkFBTTs0QkFDTCxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUUsR0FBRyxPQUFPLENBQUUsRUFBRSxDQUFDO3lCQUNsQzt3QkFDSCxNQUFNO29CQUNOLEtBQUssWUFBWTt3QkFDZixrREFBa0Q7d0JBQ2xELDJDQUEyQzt3QkFDM0MsSUFBSSxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksUUFBUSxDQUFDLFdBQVcsQ0FBQyxFQUFFOzRCQUNwRCxNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDOzRCQUM3QyxNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7NEJBQzFDLGNBQWMsQ0FBQyxVQUFVLEdBQUcsR0FBRyxDQUFDLGFBQWEsRUFBRSxXQUFXLENBQUMsQ0FBQzt5QkFDN0Q7NkJBQU07NEJBQ0wsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFFLEdBQUcsT0FBTyxDQUFFLEVBQUUsQ0FBQzt5QkFDbEM7d0JBQ0gsTUFBTTtvQkFDTixLQUFLLFNBQVMsQ0FBQztvQkFBQyxLQUFLLGtCQUFrQixDQUFDO29CQUFDLEtBQUssV0FBVyxDQUFDO29CQUMxRCxLQUFLLFVBQVUsQ0FBQztvQkFBQyxLQUFLLGVBQWU7d0JBQ25DLGtDQUFrQzt3QkFDbEMsSUFBSSxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksUUFBUSxDQUFDLFdBQVcsQ0FBQyxFQUFFOzRCQUNwRCxjQUFjLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsV0FBVyxDQUFDLENBQUM7eUJBQzVEOzZCQUFNOzRCQUNMLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBRSxHQUFHLE9BQU8sQ0FBRSxFQUFFLENBQUM7eUJBQ2xDO3dCQUNILE1BQU07b0JBQ04sS0FBSyxTQUFTLENBQUM7b0JBQUMsS0FBSyxrQkFBa0IsQ0FBQztvQkFBQyxLQUFLLFdBQVcsQ0FBQztvQkFDMUQsS0FBSyxVQUFVLENBQUM7b0JBQUMsS0FBSyxlQUFlO3dCQUNuQyxtQ0FBbUM7d0JBQ25DLElBQUksUUFBUSxDQUFDLGFBQWEsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxXQUFXLENBQUMsRUFBRTs0QkFDcEQsY0FBYyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLFdBQVcsQ0FBQyxDQUFDO3lCQUM1RDs2QkFBTTs0QkFDTCxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUUsR0FBRyxPQUFPLENBQUUsRUFBRSxDQUFDO3lCQUNsQzt3QkFDSCxNQUFNO29CQUNOLEtBQUssS0FBSzt3QkFDUixzQ0FBc0M7d0JBQ3RDLElBQUksUUFBUSxDQUFDLGFBQWEsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxXQUFXLENBQUMsRUFBRTs0QkFDcEQsTUFBTSxRQUFRLEdBQUcsQ0FBQyxhQUFhLEVBQUUsV0FBVyxDQUFDO2lDQUMxQyxNQUFNLENBQUMsQ0FBQyxhQUFhLEVBQUUsU0FBUyxFQUFFLEVBQUUsQ0FDbkMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUM7Z0NBQ3hCLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDO2dDQUNuQyxDQUFFLEdBQUcsYUFBYSxFQUFFLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBRSxDQUFDLENBQUM7Z0NBQzFDLENBQUUsR0FBRyxhQUFhLEVBQUUsU0FBUyxDQUFFLEVBQ2pDLEVBQUUsQ0FBQyxDQUFDOzRCQUNSLDBDQUEwQzs0QkFDMUMsY0FBYyxDQUFDLEdBQUcsR0FBRyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsQ0FBQzt5QkFDMUM7NkJBQU07NEJBQ0wsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFFLEdBQUcsT0FBTyxDQUFFLEVBQUUsQ0FBQzt5QkFDbEM7d0JBQ0gsTUFBTTtvQkFDTixLQUFLLG1CQUFtQjt3QkFDdEIscUNBQXFDO3dCQUNyQyxxQ0FBcUM7d0JBQ3JDLElBQUksUUFBUSxDQUFDLGFBQWEsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxXQUFXLENBQUMsRUFBRTs0QkFDcEQsTUFBTSxjQUFjLEdBQUcsRUFBRSxHQUFHLGFBQWEsRUFBRSxDQUFDOzRCQUM1QyxLQUFLLE1BQU0sTUFBTSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUU7Z0NBQzdDLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQztvQ0FDakMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsRUFBRSxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsRUFDcEQ7b0NBQ0EsY0FBYyxDQUFDLE1BQU0sQ0FBQyxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztvQ0FDL0MsdUNBQXVDO2lDQUN0QztxQ0FBTSxJQUNMLFFBQVEsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxRQUFRLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQ2pFO29DQUNBLGNBQWMsQ0FBQyxNQUFNLENBQUM7d0NBQ3BCLFlBQVksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLEVBQUUsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7aUNBQzdEO3FDQUFNO29DQUNMLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBRSxHQUFHLE9BQU8sQ0FBRSxFQUFFLENBQUM7aUNBQ2xDOzZCQUNGOzRCQUNELGNBQWMsQ0FBQyxpQkFBaUIsR0FBRyxjQUFjLENBQUM7eUJBQ25EOzZCQUFNOzRCQUNMLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBRSxHQUFHLE9BQU8sQ0FBRSxFQUFFLENBQUM7eUJBQ2xDO3dCQUNILE1BQU07b0JBQ04sS0FBSyxZQUFZO3dCQUNmLHFDQUFxQzt3QkFDckMsd0NBQXdDO3dCQUN4QyxxQ0FBcUM7d0JBQ3JDLElBQUksUUFBUSxDQUFDLGFBQWEsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxXQUFXLENBQUMsRUFBRTs0QkFDcEQsTUFBTSxjQUFjLEdBQUcsRUFBRSxHQUFHLGFBQWEsRUFBRSxDQUFDOzRCQUM1QywwQ0FBMEM7NEJBQzFDLGdFQUFnRTs0QkFDaEUsSUFBSSxNQUFNLENBQUMsV0FBVyxFQUFFLHNCQUFzQixDQUFDLEVBQUU7Z0NBQy9DLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDO3FDQUN2QixNQUFNLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDO3FDQUN0RSxPQUFPLENBQUMsY0FBYyxDQUFDLEVBQUU7b0NBQ3hCLElBQUksV0FBVyxDQUFDLG9CQUFvQixLQUFLLEtBQUssRUFBRTt3Q0FDOUMsT0FBTyxjQUFjLENBQUMsY0FBYyxDQUFDLENBQUM7cUNBQ3ZDO3lDQUFNLElBQUksUUFBUSxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFO3dDQUNyRCxjQUFjLENBQUMsY0FBYyxDQUFDLEdBQUcsWUFBWSxDQUMzQyxjQUFjLENBQUMsY0FBYyxDQUFDLEVBQzlCLFdBQVcsQ0FBQyxvQkFBb0IsQ0FDakMsQ0FBQztxQ0FDSDtnQ0FDSCxDQUFDLENBQUMsQ0FBQzs2QkFDTjs0QkFDRCxLQUFLLE1BQU0sTUFBTSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUU7Z0NBQzdDLElBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsRUFBRSxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUMxRCxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDO29DQUMvQixDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsc0JBQXNCLENBQUMsQ0FDaEQsRUFBRTtvQ0FDRCxjQUFjLENBQUMsTUFBTSxDQUFDLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO29DQUMvQywrQ0FBK0M7b0NBQy9DLDJEQUEyRDtpQ0FDMUQ7cUNBQU0sSUFDTCxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDO29DQUMvQixNQUFNLENBQUMsY0FBYyxFQUFFLHNCQUFzQixDQUFDLEVBQzlDO29DQUNBLG9EQUFvRDtvQ0FDcEQsNkJBQTZCO29DQUM3Qix3REFBd0Q7b0NBQ3hELElBQUksUUFBUSxDQUFDLGNBQWMsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFO3dDQUNqRCxjQUFjLENBQUMsTUFBTSxDQUFDLEdBQUcsWUFBWSxDQUNuQyxjQUFjLENBQUMsb0JBQW9CLEVBQUUsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUN6RCxDQUFDO3FDQUNIO29DQUNILHVDQUF1QztpQ0FDdEM7cUNBQU0sSUFDTCxRQUFRLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO29DQUM3QixRQUFRLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQ2hDO29DQUNBLGNBQWMsQ0FBQyxNQUFNLENBQUM7d0NBQ3BCLFlBQVksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLEVBQUUsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7aUNBQzdEO3FDQUFNO29DQUNMLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBRSxHQUFHLE9BQU8sQ0FBRSxFQUFFLENBQUM7aUNBQ2xDOzZCQUNGOzRCQUNELGNBQWMsQ0FBQyxVQUFVLEdBQUcsY0FBYyxDQUFDO3lCQUM1Qzs2QkFBTTs0QkFDTCxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUUsR0FBRyxPQUFPLENBQUUsRUFBRSxDQUFDO3lCQUNsQzt3QkFDSCxNQUFNO29CQUNOLEtBQUssVUFBVTt3QkFDYixzRUFBc0U7d0JBQ3RFLElBQUksT0FBTyxDQUFDLGFBQWEsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxXQUFXLENBQUMsRUFBRTs0QkFDbEQsY0FBYyxDQUFDLFFBQVEsR0FBRyxXQUFXLENBQUMsR0FBRyxhQUFhLEVBQUUsR0FBRyxXQUFXLENBQUMsQ0FBQzs0QkFDMUUsdUNBQXVDO3lCQUN0Qzs2QkFBTSxJQUNMLE9BQU8sV0FBVyxLQUFLLFNBQVM7NEJBQ2hDLE9BQU8sYUFBYSxLQUFLLFNBQVMsRUFDbEM7NEJBQ0EsY0FBYyxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsYUFBYSxJQUFJLENBQUMsQ0FBQyxXQUFXLENBQUM7eUJBQzVEOzZCQUFNOzRCQUNMLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBRSxHQUFHLE9BQU8sQ0FBRSxFQUFFLENBQUM7eUJBQ2xDO3dCQUNILE1BQU07b0JBQ04sS0FBSyxTQUFTLENBQUM7b0JBQUMsS0FBSyxLQUFLLENBQUM7b0JBQUMsS0FBSyxJQUFJO3dCQUNuQywyQkFBMkI7d0JBQzdCLE1BQU07b0JBQ04sS0FBSyxPQUFPLENBQUM7b0JBQUMsS0FBSyxhQUFhLENBQUM7b0JBQUMsS0FBSyxVQUFVO3dCQUMvQyxzREFBc0Q7d0JBQ3RELDBFQUEwRTt3QkFDMUUsY0FBYyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFdBQVcsQ0FBQzt3QkFDcEMsTUFBTTtvQkFDTixLQUFLLE1BQU07d0JBQ1QsSUFDRSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7NEJBQy9DLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQyxFQUNuRDs0QkFDQSxNQUFNLGFBQWEsR0FBRyxXQUFXLENBQUMsYUFBYSxFQUFFLFdBQVcsQ0FBQyxDQUFDOzRCQUM5RCxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtnQ0FBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUUsR0FBRyxPQUFPLENBQUUsRUFBRSxDQUFDOzZCQUFFOzRCQUNoRSxjQUFjLENBQUMsSUFBSSxHQUFHLGFBQWEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQzt5QkFDbkY7NkJBQU07NEJBQ0wsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFFLEdBQUcsT0FBTyxDQUFFLEVBQUUsQ0FBQzt5QkFDbEM7d0JBQ0gsTUFBTTtvQkFDTixLQUFLLGFBQWE7d0JBQ2hCLDBCQUEwQjt3QkFDMUIsY0FBYyxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUMsYUFBYSxJQUFJLENBQUMsQ0FBQyxXQUFXLENBQUM7d0JBQ2hFLE1BQU07b0JBQ047d0JBQ0UsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFFLEdBQUcsT0FBTyxDQUFFLEVBQUUsQ0FBQztpQkFDcEM7YUFDRjtTQUNGO0tBQ0Y7SUFDRCxPQUFPLGNBQWMsQ0FBQztBQUN4QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGlzRXF1YWwgZnJvbSAnbG9kYXNoL2lzRXF1YWwnO1xyXG5cclxuaW1wb3J0IHtcclxuICBpc0FycmF5LCBpc0VtcHR5LCBpc051bWJlciwgaXNPYmplY3QsIGlzU3RyaW5nXHJcbn0gZnJvbSAnLi92YWxpZGF0b3IuZnVuY3Rpb25zJztcclxuaW1wb3J0IHsgaGFzT3duLCB1bmlxdWVJdGVtcywgY29tbW9uSXRlbXMgfSBmcm9tICcuL3V0aWxpdHkuZnVuY3Rpb25zJztcclxuaW1wb3J0IHsgSnNvblBvaW50ZXIsIFBvaW50ZXIgfSBmcm9tICcuL2pzb25wb2ludGVyLmZ1bmN0aW9ucyc7XHJcblxyXG4vKipcclxuICogJ21lcmdlU2NoZW1hcycgZnVuY3Rpb25cclxuICpcclxuICogTWVyZ2VzIG11bHRpcGxlIEpTT04gc2NoZW1hcyBpbnRvIGEgc2luZ2xlIHNjaGVtYSB3aXRoIGNvbWJpbmVkIHJ1bGVzLlxyXG4gKlxyXG4gKiBJZiBhYmxlIHRvIGxvZ2ljYWxseSBtZXJnZSBwcm9wZXJ0aWVzIGZyb20gYWxsIHNjaGVtYXMsXHJcbiAqIHJldHVybnMgYSBzaW5nbGUgc2NoZW1hIG9iamVjdCBjb250YWluaW5nIGFsbCBtZXJnZWQgcHJvcGVydGllcy5cclxuICpcclxuICogRXhhbXBsZTogKHsgYTogYiwgbWF4OiAxIH0sIHsgYzogZCwgbWF4OiAyIH0pID0+IHsgYTogYiwgYzogZCwgbWF4OiAxIH1cclxuICpcclxuICogSWYgdW5hYmxlIHRvIGxvZ2ljYWxseSBtZXJnZSwgcmV0dXJucyBhbiBhbGxPZiBzY2hlbWEgb2JqZWN0IGNvbnRhaW5pbmdcclxuICogYW4gYXJyYXkgb2YgdGhlIG9yaWdpbmFsIHNjaGVtYXM7XHJcbiAqXHJcbiAqIEV4YW1wbGU6ICh7IGE6IGIgfSwgeyBhOiBkIH0pID0+IHsgYWxsT2Y6IFsgeyBhOiBiIH0sIHsgYTogZCB9IF0gfVxyXG4gKlxyXG4gKiAvLyAgIHNjaGVtYXMgLSBvbmUgb3IgbW9yZSBpbnB1dCBzY2hlbWFzXHJcbiAqIC8vICAtIG1lcmdlZCBzY2hlbWFcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBtZXJnZVNjaGVtYXMoLi4uc2NoZW1hcykge1xyXG4gIHNjaGVtYXMgPSBzY2hlbWFzLmZpbHRlcihzY2hlbWEgPT4gIWlzRW1wdHkoc2NoZW1hKSk7XHJcbiAgaWYgKHNjaGVtYXMuc29tZShzY2hlbWEgPT4gIWlzT2JqZWN0KHNjaGVtYSkpKSB7IHJldHVybiBudWxsOyB9XHJcbiAgY29uc3QgY29tYmluZWRTY2hlbWE6IGFueSA9IHt9O1xyXG4gIGZvciAoY29uc3Qgc2NoZW1hIG9mIHNjaGVtYXMpIHtcclxuICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKHNjaGVtYSkpIHtcclxuICAgICAgY29uc3QgY29tYmluZWRWYWx1ZSA9IGNvbWJpbmVkU2NoZW1hW2tleV07XHJcbiAgICAgIGNvbnN0IHNjaGVtYVZhbHVlID0gc2NoZW1hW2tleV07XHJcbiAgICAgIGlmICghaGFzT3duKGNvbWJpbmVkU2NoZW1hLCBrZXkpIHx8IGlzRXF1YWwoY29tYmluZWRWYWx1ZSwgc2NoZW1hVmFsdWUpKSB7XHJcbiAgICAgICAgY29tYmluZWRTY2hlbWFba2V5XSA9IHNjaGVtYVZhbHVlO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHN3aXRjaCAoa2V5KSB7XHJcbiAgICAgICAgICBjYXNlICdhbGxPZic6XHJcbiAgICAgICAgICAgIC8vIENvbWJpbmUgYWxsIGl0ZW1zIGZyb20gYm90aCBhcnJheXNcclxuICAgICAgICAgICAgaWYgKGlzQXJyYXkoY29tYmluZWRWYWx1ZSkgJiYgaXNBcnJheShzY2hlbWFWYWx1ZSkpIHtcclxuICAgICAgICAgICAgICBjb21iaW5lZFNjaGVtYS5hbGxPZiA9IG1lcmdlU2NoZW1hcyguLi5jb21iaW5lZFZhbHVlLCAuLi5zY2hlbWFWYWx1ZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHsgYWxsT2Y6IFsgLi4uc2NoZW1hcyBdIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgY2FzZSAnYWRkaXRpb25hbEl0ZW1zJzogY2FzZSAnYWRkaXRpb25hbFByb3BlcnRpZXMnOlxyXG4gICAgICAgICAgY2FzZSAnY29udGFpbnMnOiBjYXNlICdwcm9wZXJ0eU5hbWVzJzpcclxuICAgICAgICAgICAgLy8gTWVyZ2Ugc2NoZW1hIG9iamVjdHNcclxuICAgICAgICAgICAgaWYgKGlzT2JqZWN0KGNvbWJpbmVkVmFsdWUpICYmIGlzT2JqZWN0KHNjaGVtYVZhbHVlKSkge1xyXG4gICAgICAgICAgICAgIGNvbWJpbmVkU2NoZW1hW2tleV0gPSBtZXJnZVNjaGVtYXMoY29tYmluZWRWYWx1ZSwgc2NoZW1hVmFsdWUpO1xyXG4gICAgICAgICAgICAvLyBhZGRpdGlvbmFsUHJvcGVydGllcyA9PSBmYWxzZSBpbiBhbnkgc2NoZW1hIG92ZXJyaWRlcyBhbGwgb3RoZXIgdmFsdWVzXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoXHJcbiAgICAgICAgICAgICAga2V5ID09PSAnYWRkaXRpb25hbFByb3BlcnRpZXMnICYmXHJcbiAgICAgICAgICAgICAgKGNvbWJpbmVkVmFsdWUgPT09IGZhbHNlIHx8IHNjaGVtYVZhbHVlID09PSBmYWxzZSlcclxuICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgY29tYmluZWRTY2hlbWEuY29tYmluZWRTY2hlbWEgPSBmYWxzZTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICByZXR1cm4geyBhbGxPZjogWyAuLi5zY2hlbWFzIF0gfTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICBjYXNlICdhbnlPZic6IGNhc2UgJ29uZU9mJzogY2FzZSAnZW51bSc6XHJcbiAgICAgICAgICAgIC8vIEtlZXAgb25seSBpdGVtcyB0aGF0IGFwcGVhciBpbiBib3RoIGFycmF5c1xyXG4gICAgICAgICAgICBpZiAoaXNBcnJheShjb21iaW5lZFZhbHVlKSAmJiBpc0FycmF5KHNjaGVtYVZhbHVlKSkge1xyXG4gICAgICAgICAgICAgIGNvbWJpbmVkU2NoZW1hW2tleV0gPSBjb21iaW5lZFZhbHVlLmZpbHRlcihpdGVtMSA9PlxyXG4gICAgICAgICAgICAgICAgc2NoZW1hVmFsdWUuZmluZEluZGV4KGl0ZW0yID0+IGlzRXF1YWwoaXRlbTEsIGl0ZW0yKSkgPiAtMVxyXG4gICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgaWYgKCFjb21iaW5lZFNjaGVtYVtrZXldLmxlbmd0aCkgeyByZXR1cm4geyBhbGxPZjogWyAuLi5zY2hlbWFzIF0gfTsgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHJldHVybiB7IGFsbE9mOiBbIC4uLnNjaGVtYXMgXSB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIGNhc2UgJ2RlZmluaXRpb25zJzpcclxuICAgICAgICAgICAgLy8gQ29tYmluZSBrZXlzIGZyb20gYm90aCBvYmplY3RzXHJcbiAgICAgICAgICAgIGlmIChpc09iamVjdChjb21iaW5lZFZhbHVlKSAmJiBpc09iamVjdChzY2hlbWFWYWx1ZSkpIHtcclxuICAgICAgICAgICAgICBjb25zdCBjb21iaW5lZE9iamVjdCA9IHsgLi4uY29tYmluZWRWYWx1ZSB9O1xyXG4gICAgICAgICAgICAgIGZvciAoY29uc3Qgc3ViS2V5IG9mIE9iamVjdC5rZXlzKHNjaGVtYVZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFoYXNPd24oY29tYmluZWRPYmplY3QsIHN1YktleSkgfHxcclxuICAgICAgICAgICAgICAgICAgaXNFcXVhbChjb21iaW5lZE9iamVjdFtzdWJLZXldLCBzY2hlbWFWYWx1ZVtzdWJLZXldKVxyXG4gICAgICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbWJpbmVkT2JqZWN0W3N1YktleV0gPSBzY2hlbWFWYWx1ZVtzdWJLZXldO1xyXG4gICAgICAgICAgICAgICAgLy8gRG9uJ3QgY29tYmluZSBtYXRjaGluZyBrZXlzIHdpdGggZGlmZmVyZW50IHZhbHVlc1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgYWxsT2Y6IFsgLi4uc2NoZW1hcyBdIH07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGNvbWJpbmVkU2NoZW1hLmRlZmluaXRpb25zID0gY29tYmluZWRPYmplY3Q7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHsgYWxsT2Y6IFsgLi4uc2NoZW1hcyBdIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgY2FzZSAnZGVwZW5kZW5jaWVzJzpcclxuICAgICAgICAgICAgLy8gQ29tYmluZSBhbGwga2V5cyBmcm9tIGJvdGggb2JqZWN0c1xyXG4gICAgICAgICAgICAvLyBhbmQgbWVyZ2Ugc2NoZW1hcyBvbiBtYXRjaGluZyBrZXlzLFxyXG4gICAgICAgICAgICAvLyBjb252ZXJ0aW5nIGZyb20gYXJyYXlzIHRvIG9iamVjdHMgaWYgbmVjZXNzYXJ5XHJcbiAgICAgICAgICAgIGlmIChpc09iamVjdChjb21iaW5lZFZhbHVlKSAmJiBpc09iamVjdChzY2hlbWFWYWx1ZSkpIHtcclxuICAgICAgICAgICAgICBjb25zdCBjb21iaW5lZE9iamVjdCA9IHsgLi4uY29tYmluZWRWYWx1ZSB9O1xyXG4gICAgICAgICAgICAgIGZvciAoY29uc3Qgc3ViS2V5IG9mIE9iamVjdC5rZXlzKHNjaGVtYVZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFoYXNPd24oY29tYmluZWRPYmplY3QsIHN1YktleSkgfHxcclxuICAgICAgICAgICAgICAgICAgaXNFcXVhbChjb21iaW5lZE9iamVjdFtzdWJLZXldLCBzY2hlbWFWYWx1ZVtzdWJLZXldKVxyXG4gICAgICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbWJpbmVkT2JqZWN0W3N1YktleV0gPSBzY2hlbWFWYWx1ZVtzdWJLZXldO1xyXG4gICAgICAgICAgICAgICAgLy8gSWYgYm90aCBrZXlzIGFyZSBhcnJheXMsIGluY2x1ZGUgYWxsIGl0ZW1zIGZyb20gYm90aCBhcnJheXMsXHJcbiAgICAgICAgICAgICAgICAvLyBleGNsdWRpbmcgZHVwbGljYXRlc1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChcclxuICAgICAgICAgICAgICAgICAgaXNBcnJheShzY2hlbWFWYWx1ZVtzdWJLZXldKSAmJiBpc0FycmF5KGNvbWJpbmVkT2JqZWN0W3N1YktleV0pXHJcbiAgICAgICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICAgICAgY29tYmluZWRPYmplY3Rbc3ViS2V5XSA9XHJcbiAgICAgICAgICAgICAgICAgICAgdW5pcXVlSXRlbXMoLi4uY29tYmluZWRPYmplY3Rbc3ViS2V5XSwgLi4uc2NoZW1hVmFsdWVbc3ViS2V5XSk7XHJcbiAgICAgICAgICAgICAgICAvLyBJZiBlaXRoZXIga2V5IGlzIGFuIG9iamVjdCwgbWVyZ2UgdGhlIHNjaGVtYXNcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoXHJcbiAgICAgICAgICAgICAgICAgIChpc0FycmF5KHNjaGVtYVZhbHVlW3N1YktleV0pIHx8IGlzT2JqZWN0KHNjaGVtYVZhbHVlW3N1YktleV0pKSAmJlxyXG4gICAgICAgICAgICAgICAgICAoaXNBcnJheShjb21iaW5lZE9iamVjdFtzdWJLZXldKSB8fCBpc09iamVjdChjb21iaW5lZE9iamVjdFtzdWJLZXldKSlcclxuICAgICAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgICAvLyBJZiBlaXRoZXIga2V5IGlzIGFuIGFycmF5LCBjb252ZXJ0IGl0IHRvIGFuIG9iamVjdCBmaXJzdFxyXG4gICAgICAgICAgICAgICAgICBjb25zdCByZXF1aXJlZCA9IGlzQXJyYXkoY29tYmluZWRTY2hlbWEucmVxdWlyZWQpID9cclxuICAgICAgICAgICAgICAgICAgICBjb21iaW5lZFNjaGVtYS5yZXF1aXJlZCA6IFtdO1xyXG4gICAgICAgICAgICAgICAgICBjb25zdCBjb21iaW5lZERlcGVuZGVuY3kgPSBpc0FycmF5KGNvbWJpbmVkT2JqZWN0W3N1YktleV0pID9cclxuICAgICAgICAgICAgICAgICAgICB7IHJlcXVpcmVkOiB1bmlxdWVJdGVtcyguLi5yZXF1aXJlZCwgY29tYmluZWRPYmplY3Rbc3ViS2V5XSkgfSA6XHJcbiAgICAgICAgICAgICAgICAgICAgY29tYmluZWRPYmplY3Rbc3ViS2V5XTtcclxuICAgICAgICAgICAgICAgICAgY29uc3Qgc2NoZW1hRGVwZW5kZW5jeSA9IGlzQXJyYXkoc2NoZW1hVmFsdWVbc3ViS2V5XSkgP1xyXG4gICAgICAgICAgICAgICAgICAgIHsgcmVxdWlyZWQ6IHVuaXF1ZUl0ZW1zKC4uLnJlcXVpcmVkLCBzY2hlbWFWYWx1ZVtzdWJLZXldKSB9IDpcclxuICAgICAgICAgICAgICAgICAgICBzY2hlbWFWYWx1ZVtzdWJLZXldO1xyXG4gICAgICAgICAgICAgICAgICBjb21iaW5lZE9iamVjdFtzdWJLZXldID1cclxuICAgICAgICAgICAgICAgICAgICBtZXJnZVNjaGVtYXMoY29tYmluZWREZXBlbmRlbmN5LCBzY2hlbWFEZXBlbmRlbmN5KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiB7IGFsbE9mOiBbIC4uLnNjaGVtYXMgXSB9O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBjb21iaW5lZFNjaGVtYS5kZXBlbmRlbmNpZXMgPSBjb21iaW5lZE9iamVjdDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICByZXR1cm4geyBhbGxPZjogWyAuLi5zY2hlbWFzIF0gfTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICBjYXNlICdpdGVtcyc6XHJcbiAgICAgICAgICAgIC8vIElmIGFycmF5cywga2VlcCBvbmx5IGl0ZW1zIHRoYXQgYXBwZWFyIGluIGJvdGggYXJyYXlzXHJcbiAgICAgICAgICAgIGlmIChpc0FycmF5KGNvbWJpbmVkVmFsdWUpICYmIGlzQXJyYXkoc2NoZW1hVmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgY29tYmluZWRTY2hlbWEuaXRlbXMgPSBjb21iaW5lZFZhbHVlLmZpbHRlcihpdGVtMSA9PlxyXG4gICAgICAgICAgICAgICAgc2NoZW1hVmFsdWUuZmluZEluZGV4KGl0ZW0yID0+IGlzRXF1YWwoaXRlbTEsIGl0ZW0yKSkgPiAtMVxyXG4gICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgaWYgKCFjb21iaW5lZFNjaGVtYS5pdGVtcy5sZW5ndGgpIHsgcmV0dXJuIHsgYWxsT2Y6IFsgLi4uc2NoZW1hcyBdIH07IH1cclxuICAgICAgICAgICAgLy8gSWYgYm90aCBrZXlzIGFyZSBvYmplY3RzLCBtZXJnZSB0aGVtXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNPYmplY3QoY29tYmluZWRWYWx1ZSkgJiYgaXNPYmplY3Qoc2NoZW1hVmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgY29tYmluZWRTY2hlbWEuaXRlbXMgPSBtZXJnZVNjaGVtYXMoY29tYmluZWRWYWx1ZSwgc2NoZW1hVmFsdWUpO1xyXG4gICAgICAgICAgICAvLyBJZiBvYmplY3QgKyBhcnJheSwgY29tYmluZSBvYmplY3Qgd2l0aCBlYWNoIGFycmF5IGl0ZW1cclxuICAgICAgICAgICAgfSBlbHNlIGlmIChpc0FycmF5KGNvbWJpbmVkVmFsdWUpICYmIGlzT2JqZWN0KHNjaGVtYVZhbHVlKSkge1xyXG4gICAgICAgICAgICAgIGNvbWJpbmVkU2NoZW1hLml0ZW1zID1cclxuICAgICAgICAgICAgICAgIGNvbWJpbmVkVmFsdWUubWFwKGl0ZW0gPT4gbWVyZ2VTY2hlbWFzKGl0ZW0sIHNjaGVtYVZhbHVlKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNPYmplY3QoY29tYmluZWRWYWx1ZSkgJiYgaXNBcnJheShzY2hlbWFWYWx1ZSkpIHtcclxuICAgICAgICAgICAgICBjb21iaW5lZFNjaGVtYS5pdGVtcyA9XHJcbiAgICAgICAgICAgICAgICBzY2hlbWFWYWx1ZS5tYXAoaXRlbSA9PiBtZXJnZVNjaGVtYXMoaXRlbSwgY29tYmluZWRWYWx1ZSkpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHJldHVybiB7IGFsbE9mOiBbIC4uLnNjaGVtYXMgXSB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIGNhc2UgJ211bHRpcGxlT2YnOlxyXG4gICAgICAgICAgICAvLyBUT0RPOiBBZGp1c3QgdG8gY29ycmVjdGx5IGhhbmRsZSBkZWNpbWFsIHZhbHVlc1xyXG4gICAgICAgICAgICAvLyBJZiBudW1iZXJzLCBzZXQgdG8gbGVhc3QgY29tbW9uIG11bHRpcGxlXHJcbiAgICAgICAgICAgIGlmIChpc051bWJlcihjb21iaW5lZFZhbHVlKSAmJiBpc051bWJlcihzY2hlbWFWYWx1ZSkpIHtcclxuICAgICAgICAgICAgICBjb25zdCBnY2QgPSAoeCwgeSkgPT4gIXkgPyB4IDogZ2NkKHksIHggJSB5KTtcclxuICAgICAgICAgICAgICBjb25zdCBsY20gPSAoeCwgeSkgPT4gKHggKiB5KSAvIGdjZCh4LCB5KTtcclxuICAgICAgICAgICAgICBjb21iaW5lZFNjaGVtYS5tdWx0aXBsZU9mID0gbGNtKGNvbWJpbmVkVmFsdWUsIHNjaGVtYVZhbHVlKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICByZXR1cm4geyBhbGxPZjogWyAuLi5zY2hlbWFzIF0gfTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICBjYXNlICdtYXhpbXVtJzogY2FzZSAnZXhjbHVzaXZlTWF4aW11bSc6IGNhc2UgJ21heExlbmd0aCc6XHJcbiAgICAgICAgICBjYXNlICdtYXhJdGVtcyc6IGNhc2UgJ21heFByb3BlcnRpZXMnOlxyXG4gICAgICAgICAgICAvLyBJZiBudW1iZXJzLCBzZXQgdG8gbG93ZXN0IHZhbHVlXHJcbiAgICAgICAgICAgIGlmIChpc051bWJlcihjb21iaW5lZFZhbHVlKSAmJiBpc051bWJlcihzY2hlbWFWYWx1ZSkpIHtcclxuICAgICAgICAgICAgICBjb21iaW5lZFNjaGVtYVtrZXldID0gTWF0aC5taW4oY29tYmluZWRWYWx1ZSwgc2NoZW1hVmFsdWUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHJldHVybiB7IGFsbE9mOiBbIC4uLnNjaGVtYXMgXSB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIGNhc2UgJ21pbmltdW0nOiBjYXNlICdleGNsdXNpdmVNaW5pbXVtJzogY2FzZSAnbWluTGVuZ3RoJzpcclxuICAgICAgICAgIGNhc2UgJ21pbkl0ZW1zJzogY2FzZSAnbWluUHJvcGVydGllcyc6XHJcbiAgICAgICAgICAgIC8vIElmIG51bWJlcnMsIHNldCB0byBoaWdoZXN0IHZhbHVlXHJcbiAgICAgICAgICAgIGlmIChpc051bWJlcihjb21iaW5lZFZhbHVlKSAmJiBpc051bWJlcihzY2hlbWFWYWx1ZSkpIHtcclxuICAgICAgICAgICAgICBjb21iaW5lZFNjaGVtYVtrZXldID0gTWF0aC5tYXgoY29tYmluZWRWYWx1ZSwgc2NoZW1hVmFsdWUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHJldHVybiB7IGFsbE9mOiBbIC4uLnNjaGVtYXMgXSB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIGNhc2UgJ25vdCc6XHJcbiAgICAgICAgICAgIC8vIENvbWJpbmUgbm90IHZhbHVlcyBpbnRvIGFueU9mIGFycmF5XHJcbiAgICAgICAgICAgIGlmIChpc09iamVjdChjb21iaW5lZFZhbHVlKSAmJiBpc09iamVjdChzY2hlbWFWYWx1ZSkpIHtcclxuICAgICAgICAgICAgICBjb25zdCBub3RBbnlPZiA9IFtjb21iaW5lZFZhbHVlLCBzY2hlbWFWYWx1ZV1cclxuICAgICAgICAgICAgICAgIC5yZWR1Y2UoKG5vdEFueU9mQXJyYXksIG5vdFNjaGVtYSkgPT5cclxuICAgICAgICAgICAgICAgICAgaXNBcnJheShub3RTY2hlbWEuYW55T2YpICYmXHJcbiAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKG5vdFNjaGVtYSkubGVuZ3RoID09PSAxID9cclxuICAgICAgICAgICAgICAgICAgICBbIC4uLm5vdEFueU9mQXJyYXksIC4uLm5vdFNjaGVtYS5hbnlPZiBdIDpcclxuICAgICAgICAgICAgICAgICAgICBbIC4uLm5vdEFueU9mQXJyYXksIG5vdFNjaGVtYSBdXHJcbiAgICAgICAgICAgICAgICAsIFtdKTtcclxuICAgICAgICAgICAgICAvLyBUT0RPOiBSZW1vdmUgZHVwbGljYXRlIGl0ZW1zIGZyb20gYXJyYXlcclxuICAgICAgICAgICAgICBjb21iaW5lZFNjaGVtYS5ub3QgPSB7IGFueU9mOiBub3RBbnlPZiB9O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHJldHVybiB7IGFsbE9mOiBbIC4uLnNjaGVtYXMgXSB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIGNhc2UgJ3BhdHRlcm5Qcm9wZXJ0aWVzJzpcclxuICAgICAgICAgICAgLy8gQ29tYmluZSBhbGwga2V5cyBmcm9tIGJvdGggb2JqZWN0c1xyXG4gICAgICAgICAgICAvLyBhbmQgbWVyZ2Ugc2NoZW1hcyBvbiBtYXRjaGluZyBrZXlzXHJcbiAgICAgICAgICAgIGlmIChpc09iamVjdChjb21iaW5lZFZhbHVlKSAmJiBpc09iamVjdChzY2hlbWFWYWx1ZSkpIHtcclxuICAgICAgICAgICAgICBjb25zdCBjb21iaW5lZE9iamVjdCA9IHsgLi4uY29tYmluZWRWYWx1ZSB9O1xyXG4gICAgICAgICAgICAgIGZvciAoY29uc3Qgc3ViS2V5IG9mIE9iamVjdC5rZXlzKHNjaGVtYVZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFoYXNPd24oY29tYmluZWRPYmplY3QsIHN1YktleSkgfHxcclxuICAgICAgICAgICAgICAgICAgaXNFcXVhbChjb21iaW5lZE9iamVjdFtzdWJLZXldLCBzY2hlbWFWYWx1ZVtzdWJLZXldKVxyXG4gICAgICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbWJpbmVkT2JqZWN0W3N1YktleV0gPSBzY2hlbWFWYWx1ZVtzdWJLZXldO1xyXG4gICAgICAgICAgICAgICAgLy8gSWYgYm90aCBrZXlzIGFyZSBvYmplY3RzLCBtZXJnZSB0aGVtXHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKFxyXG4gICAgICAgICAgICAgICAgICBpc09iamVjdChzY2hlbWFWYWx1ZVtzdWJLZXldKSAmJiBpc09iamVjdChjb21iaW5lZE9iamVjdFtzdWJLZXldKVxyXG4gICAgICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbWJpbmVkT2JqZWN0W3N1YktleV0gPVxyXG4gICAgICAgICAgICAgICAgICAgIG1lcmdlU2NoZW1hcyhjb21iaW5lZE9iamVjdFtzdWJLZXldLCBzY2hlbWFWYWx1ZVtzdWJLZXldKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiB7IGFsbE9mOiBbIC4uLnNjaGVtYXMgXSB9O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBjb21iaW5lZFNjaGVtYS5wYXR0ZXJuUHJvcGVydGllcyA9IGNvbWJpbmVkT2JqZWN0O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHJldHVybiB7IGFsbE9mOiBbIC4uLnNjaGVtYXMgXSB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIGNhc2UgJ3Byb3BlcnRpZXMnOlxyXG4gICAgICAgICAgICAvLyBDb21iaW5lIGFsbCBrZXlzIGZyb20gYm90aCBvYmplY3RzXHJcbiAgICAgICAgICAgIC8vIHVubGVzcyBhZGRpdGlvbmFsUHJvcGVydGllcyA9PT0gZmFsc2VcclxuICAgICAgICAgICAgLy8gYW5kIG1lcmdlIHNjaGVtYXMgb24gbWF0Y2hpbmcga2V5c1xyXG4gICAgICAgICAgICBpZiAoaXNPYmplY3QoY29tYmluZWRWYWx1ZSkgJiYgaXNPYmplY3Qoc2NoZW1hVmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgY29tYmluZWRPYmplY3QgPSB7IC4uLmNvbWJpbmVkVmFsdWUgfTtcclxuICAgICAgICAgICAgICAvLyBJZiBuZXcgc2NoZW1hIGhhcyBhZGRpdGlvbmFsUHJvcGVydGllcyxcclxuICAgICAgICAgICAgICAvLyBtZXJnZSBvciByZW1vdmUgbm9uLW1hdGNoaW5nIHByb3BlcnR5IGtleXMgaW4gY29tYmluZWQgc2NoZW1hXHJcbiAgICAgICAgICAgICAgaWYgKGhhc093bihzY2hlbWFWYWx1ZSwgJ2FkZGl0aW9uYWxQcm9wZXJ0aWVzJykpIHtcclxuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGNvbWJpbmVkVmFsdWUpXHJcbiAgICAgICAgICAgICAgICAgIC5maWx0ZXIoY29tYmluZWRLZXkgPT4gIU9iamVjdC5rZXlzKHNjaGVtYVZhbHVlKS5pbmNsdWRlcyhjb21iaW5lZEtleSkpXHJcbiAgICAgICAgICAgICAgICAgIC5mb3JFYWNoKG5vbk1hdGNoaW5nS2V5ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2NoZW1hVmFsdWUuYWRkaXRpb25hbFByb3BlcnRpZXMgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgY29tYmluZWRPYmplY3Rbbm9uTWF0Y2hpbmdLZXldO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNPYmplY3Qoc2NoZW1hVmFsdWUuYWRkaXRpb25hbFByb3BlcnRpZXMpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb21iaW5lZE9iamVjdFtub25NYXRjaGluZ0tleV0gPSBtZXJnZVNjaGVtYXMoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbWJpbmVkT2JqZWN0W25vbk1hdGNoaW5nS2V5XSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2NoZW1hVmFsdWUuYWRkaXRpb25hbFByb3BlcnRpZXNcclxuICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgZm9yIChjb25zdCBzdWJLZXkgb2YgT2JqZWN0LmtleXMoc2NoZW1hVmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNFcXVhbChjb21iaW5lZE9iamVjdFtzdWJLZXldLCBzY2hlbWFWYWx1ZVtzdWJLZXldKSB8fCAoXHJcbiAgICAgICAgICAgICAgICAgICFoYXNPd24oY29tYmluZWRPYmplY3QsIHN1YktleSkgJiZcclxuICAgICAgICAgICAgICAgICAgIWhhc093bihjb21iaW5lZE9iamVjdCwgJ2FkZGl0aW9uYWxQcm9wZXJ0aWVzJylcclxuICAgICAgICAgICAgICAgICkpIHtcclxuICAgICAgICAgICAgICAgICAgY29tYmluZWRPYmplY3Rbc3ViS2V5XSA9IHNjaGVtYVZhbHVlW3N1YktleV07XHJcbiAgICAgICAgICAgICAgICAvLyBJZiBjb21iaW5lZCBzY2hlbWEgaGFzIGFkZGl0aW9uYWxQcm9wZXJ0aWVzLFxyXG4gICAgICAgICAgICAgICAgLy8gbWVyZ2Ugb3IgaWdub3JlIG5vbi1tYXRjaGluZyBwcm9wZXJ0eSBrZXlzIGluIG5ldyBzY2hlbWFcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoXHJcbiAgICAgICAgICAgICAgICAgICFoYXNPd24oY29tYmluZWRPYmplY3QsIHN1YktleSkgJiZcclxuICAgICAgICAgICAgICAgICAgaGFzT3duKGNvbWJpbmVkT2JqZWN0LCAnYWRkaXRpb25hbFByb3BlcnRpZXMnKVxyXG4gICAgICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICAgIC8vIElmIGNvbWJpbmVkT2JqZWN0LmFkZGl0aW9uYWxQcm9wZXJ0aWVzID09PSBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgLy8gZG8gbm90aGluZyAoZG9uJ3Qgc2V0IGtleSlcclxuICAgICAgICAgICAgICAgICAgLy8gSWYgYWRkaXRpb25hbFByb3BlcnRpZXMgaXMgb2JqZWN0LCBtZXJnZSB3aXRoIG5ldyBrZXlcclxuICAgICAgICAgICAgICAgICAgaWYgKGlzT2JqZWN0KGNvbWJpbmVkT2JqZWN0LmFkZGl0aW9uYWxQcm9wZXJ0aWVzKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbWJpbmVkT2JqZWN0W3N1YktleV0gPSBtZXJnZVNjaGVtYXMoXHJcbiAgICAgICAgICAgICAgICAgICAgICBjb21iaW5lZE9iamVjdC5hZGRpdGlvbmFsUHJvcGVydGllcywgc2NoZW1hVmFsdWVbc3ViS2V5XVxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIElmIGJvdGgga2V5cyBhcmUgb2JqZWN0cywgbWVyZ2UgdGhlbVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChcclxuICAgICAgICAgICAgICAgICAgaXNPYmplY3Qoc2NoZW1hVmFsdWVbc3ViS2V5XSkgJiZcclxuICAgICAgICAgICAgICAgICAgaXNPYmplY3QoY29tYmluZWRPYmplY3Rbc3ViS2V5XSlcclxuICAgICAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgICBjb21iaW5lZE9iamVjdFtzdWJLZXldID1cclxuICAgICAgICAgICAgICAgICAgICBtZXJnZVNjaGVtYXMoY29tYmluZWRPYmplY3Rbc3ViS2V5XSwgc2NoZW1hVmFsdWVbc3ViS2V5XSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4geyBhbGxPZjogWyAuLi5zY2hlbWFzIF0gfTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgY29tYmluZWRTY2hlbWEucHJvcGVydGllcyA9IGNvbWJpbmVkT2JqZWN0O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHJldHVybiB7IGFsbE9mOiBbIC4uLnNjaGVtYXMgXSB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIGNhc2UgJ3JlcXVpcmVkJzpcclxuICAgICAgICAgICAgLy8gSWYgYXJyYXlzLCBpbmNsdWRlIGFsbCBpdGVtcyBmcm9tIGJvdGggYXJyYXlzLCBleGNsdWRpbmcgZHVwbGljYXRlc1xyXG4gICAgICAgICAgICBpZiAoaXNBcnJheShjb21iaW5lZFZhbHVlKSAmJiBpc0FycmF5KHNjaGVtYVZhbHVlKSkge1xyXG4gICAgICAgICAgICAgIGNvbWJpbmVkU2NoZW1hLnJlcXVpcmVkID0gdW5pcXVlSXRlbXMoLi4uY29tYmluZWRWYWx1ZSwgLi4uc2NoZW1hVmFsdWUpO1xyXG4gICAgICAgICAgICAvLyBJZiBib29sZWFucywgYWV0IHRydWUgaWYgZWl0aGVyIHRydWVcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChcclxuICAgICAgICAgICAgICB0eXBlb2Ygc2NoZW1hVmFsdWUgPT09ICdib29sZWFuJyAmJlxyXG4gICAgICAgICAgICAgIHR5cGVvZiBjb21iaW5lZFZhbHVlID09PSAnYm9vbGVhbidcclxuICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgY29tYmluZWRTY2hlbWEucmVxdWlyZWQgPSAhIWNvbWJpbmVkVmFsdWUgfHwgISFzY2hlbWFWYWx1ZTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICByZXR1cm4geyBhbGxPZjogWyAuLi5zY2hlbWFzIF0gfTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICBjYXNlICckc2NoZW1hJzogY2FzZSAnJGlkJzogY2FzZSAnaWQnOlxyXG4gICAgICAgICAgICAvLyBEb24ndCBjb21iaW5lIHRoZXNlIGtleXNcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgY2FzZSAndGl0bGUnOiBjYXNlICdkZXNjcmlwdGlvbic6IGNhc2UgJyRjb21tZW50JzpcclxuICAgICAgICAgICAgLy8gUmV0dXJuIHRoZSBsYXN0IHZhbHVlLCBvdmVyd3JpdGluZyBhbnkgcHJldmlvdXMgb25lXHJcbiAgICAgICAgICAgIC8vIFRoZXNlIHByb3BlcnRpZXMgYXJlIG5vdCB1c2VkIGZvciB2YWxpZGF0aW9uLCBzbyBjb25mbGljdHMgZG9uJ3QgbWF0dGVyXHJcbiAgICAgICAgICAgIGNvbWJpbmVkU2NoZW1hW2tleV0gPSBzY2hlbWFWYWx1ZTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgY2FzZSAndHlwZSc6XHJcbiAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAoaXNBcnJheShzY2hlbWFWYWx1ZSkgfHwgaXNTdHJpbmcoc2NoZW1hVmFsdWUpKSAmJlxyXG4gICAgICAgICAgICAgIChpc0FycmF5KGNvbWJpbmVkVmFsdWUpIHx8IGlzU3RyaW5nKGNvbWJpbmVkVmFsdWUpKVxyXG4gICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICBjb25zdCBjb21iaW5lZFR5cGVzID0gY29tbW9uSXRlbXMoY29tYmluZWRWYWx1ZSwgc2NoZW1hVmFsdWUpO1xyXG4gICAgICAgICAgICAgIGlmICghY29tYmluZWRUeXBlcy5sZW5ndGgpIHsgcmV0dXJuIHsgYWxsT2Y6IFsgLi4uc2NoZW1hcyBdIH07IH1cclxuICAgICAgICAgICAgICBjb21iaW5lZFNjaGVtYS50eXBlID0gY29tYmluZWRUeXBlcy5sZW5ndGggPiAxID8gY29tYmluZWRUeXBlcyA6IGNvbWJpbmVkVHlwZXNbMF07XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHsgYWxsT2Y6IFsgLi4uc2NoZW1hcyBdIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgY2FzZSAndW5pcXVlSXRlbXMnOlxyXG4gICAgICAgICAgICAvLyBTZXQgdHJ1ZSBpZiBlaXRoZXIgdHJ1ZVxyXG4gICAgICAgICAgICBjb21iaW5lZFNjaGVtYS51bmlxdWVJdGVtcyA9ICEhY29tYmluZWRWYWx1ZSB8fCAhIXNjaGVtYVZhbHVlO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICByZXR1cm4geyBhbGxPZjogWyAuLi5zY2hlbWFzIF0gfTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIGNvbWJpbmVkU2NoZW1hO1xyXG59XHJcbiJdfQ==