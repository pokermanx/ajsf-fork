import isEqual from 'lodash/isEqual';
import { _executeAsyncValidators, _executeValidators, _mergeErrors, _mergeObjects, getType, hasValue, isArray, isBoolean, isDefined, isEmpty, isNumber, isString, isType, toJavaScriptType, toObservable, xor } from './validator.functions';
import { forEachCopy } from './utility.functions';
import { forkJoin } from 'rxjs';
import { jsonSchemaFormatTests } from './format-regex.constants';
import { map } from 'rxjs/operators';
/**
 * 'JsonValidators' class
 *
 * Provides an extended set of validators to be used by form controls,
 * compatible with standard JSON Schema validation options.
 * http://json-schema.org/latest/json-schema-validation.html
 *
 * Note: This library is designed as a drop-in replacement for the Angular
 * Validators library, and except for one small breaking change to the 'pattern'
 * validator (described below) it can even be imported as a substitute, like so:
 *
 *   import { JsonValidators as Validators } from 'json-validators';
 *
 * and it should work with existing code as a complete replacement.
 *
 * The one exception is the 'pattern' validator, which has been changed to
 * matche partial values by default (the standard 'pattern' validator wrapped
 * all patterns in '^' and '$', forcing them to always match an entire value).
 * However, the old behavior can be restored by simply adding '^' and '$'
 * around your patterns, or by passing an optional second parameter of TRUE.
 * This change is to make the 'pattern' validator match the behavior of a
 * JSON Schema pattern, which allows partial matches, rather than the behavior
 * of an HTML input control pattern, which does not.
 *
 * This library replaces Angular's validators and combination functions
 * with the following validators and transformation functions:
 *
 * Validators:
 *   For all formControls:     required (*), type, enum, const
 *   For text formControls:    minLength (*), maxLength (*), pattern (*), format
 *   For numeric formControls: maximum, exclusiveMaximum,
 *                             minimum, exclusiveMinimum, multipleOf
 *   For formGroup objects:    minProperties, maxProperties, dependencies
 *   For formArray arrays:     minItems, maxItems, uniqueItems, contains
 *   Not used by JSON Schema:  min (*), max (*), requiredTrue (*), email (*)
 * (Validators originally included with Angular are maked with (*).)
 *
 * NOTE / TODO: The dependencies validator is not complete.
 * NOTE / TODO: The contains validator is not complete.
 *
 * Validators not used by JSON Schema (but included for compatibility)
 * and their JSON Schema equivalents:
 *
 *   Angular validator | JSON Schema equivalent
 *   ------------------|-----------------------
 *     min(number)     |   minimum(number)
 *     max(number)     |   maximum(number)
 *     requiredTrue()  |   const(true)
 *     email()         |   format('email')
 *
 * Validator transformation functions:
 *   composeAnyOf, composeOneOf, composeAllOf, composeNot
 * (Angular's original combination funciton, 'compose', is also included for
 * backward compatibility, though it is functionally equivalent to composeAllOf,
 * asside from its more generic error message.)
 *
 * All validators have also been extended to accept an optional second argument
 * which, if passed a TRUE value, causes the validator to perform the opposite
 * of its original finction. (This is used internally to enable 'not' and
 * 'composeOneOf' to function and return useful error messages.)
 *
 * The 'required' validator has also been overloaded so that if called with
 * a boolean parameter (or no parameters) it returns the original validator
 * function (rather than executing it). However, if it is called with an
 * AbstractControl parameter (as was previously required), it behaves
 * exactly as before.
 *
 * This enables all validators (including 'required') to be constructed in
 * exactly the same way, so they can be automatically applied using the
 * equivalent key names and values taken directly from a JSON Schema.
 *
 * This source code is partially derived from Angular,
 * which is Copyright (c) 2014-2017 Google, Inc.
 * Use of this source code is therefore governed by the same MIT-style license
 * that can be found in the LICENSE file at https://angular.io/license
 *
 * Original Angular Validators:
 * https://github.com/angular/angular/blob/master/packages/forms/src/validators.ts
 */
export class JsonValidators {
    static required(input) {
        if (input === undefined) {
            input = true;
        }
        switch (input) {
            case true: // Return required function (do not execute it yet)
                return (control, invert = false) => {
                    if (invert) {
                        return null;
                    } // if not required, always return valid
                    return hasValue(control.value) ? null : { 'required': true };
                };
            case false: // Do nothing (if field is not required, it is always valid)
                return JsonValidators.nullValidator;
            default: // Execute required function
                return hasValue(input.value) ? null : { 'required': true };
        }
    }
    /**
     * 'type' validator
     *
     * Requires a control to only accept values of a specified type,
     * or one of an array of types.
     *
     * Note: SchemaPrimitiveType = 'string'|'number'|'integer'|'boolean'|'null'
     *
     * // {SchemaPrimitiveType|SchemaPrimitiveType[]} type - type(s) to accept
     * // {IValidatorFn}
     */
    static type(requiredType) {
        if (!hasValue(requiredType)) {
            return JsonValidators.nullValidator;
        }
        return (control, invert = false) => {
            if (isEmpty(control.value)) {
                return null;
            }
            const currentValue = control.value;
            const isValid = isArray(requiredType) ?
                requiredType.some(type => isType(currentValue, type)) :
                isType(currentValue, requiredType);
            return xor(isValid, invert) ?
                null : { 'type': { requiredType, currentValue } };
        };
    }
    /**
     * 'enum' validator
     *
     * Requires a control to have a value from an enumerated list of values.
     *
     * Converts types as needed to allow string inputs to still correctly
     * match number, boolean, and null enum values.
     *
     * // {any[]} allowedValues - array of acceptable values
     * // {IValidatorFn}
     */
    static enum(allowedValues) {
        if (!isArray(allowedValues)) {
            return JsonValidators.nullValidator;
        }
        return (control, invert = false) => {
            if (isEmpty(control.value)) {
                return null;
            }
            const currentValue = control.value;
            const isEqualVal = (enumValue, inputValue) => enumValue === inputValue ||
                (isNumber(enumValue) && +inputValue === +enumValue) ||
                (isBoolean(enumValue, 'strict') &&
                    toJavaScriptType(inputValue, 'boolean') === enumValue) ||
                (enumValue === null && !hasValue(inputValue)) ||
                isEqual(enumValue, inputValue);
            const isValid = isArray(currentValue) ?
                currentValue.every(inputValue => allowedValues.some(enumValue => isEqualVal(enumValue, inputValue))) :
                allowedValues.some(enumValue => isEqualVal(enumValue, currentValue));
            return xor(isValid, invert) ?
                null : { 'enum': { allowedValues, currentValue } };
        };
    }
    /**
     * 'const' validator
     *
     * Requires a control to have a specific value.
     *
     * Converts types as needed to allow string inputs to still correctly
     * match number, boolean, and null values.
     *
     * TODO: modify to work with objects
     *
     * // {any[]} requiredValue - required value
     * // {IValidatorFn}
     */
    static const(requiredValue) {
        if (!hasValue(requiredValue)) {
            return JsonValidators.nullValidator;
        }
        return (control, invert = false) => {
            if (isEmpty(control.value)) {
                return null;
            }
            const currentValue = control.value;
            const isEqualVal = (constValue, inputValue) => constValue === inputValue ||
                isNumber(constValue) && +inputValue === +constValue ||
                isBoolean(constValue, 'strict') &&
                    toJavaScriptType(inputValue, 'boolean') === constValue ||
                constValue === null && !hasValue(inputValue);
            const isValid = isEqualVal(requiredValue, currentValue);
            return xor(isValid, invert) ?
                null : { 'const': { requiredValue, currentValue } };
        };
    }
    /**
     * 'minLength' validator
     *
     * Requires a control's text value to be greater than a specified length.
     *
     * // {number} minimumLength - minimum allowed string length
     * // {boolean = false} invert - instead return error object only if valid
     * // {IValidatorFn}
     */
    static minLength(minimumLength) {
        if (!hasValue(minimumLength)) {
            return JsonValidators.nullValidator;
        }
        return (control, invert = false) => {
            if (isEmpty(control.value)) {
                return null;
            }
            const currentLength = isString(control.value) ? control.value.length : 0;
            const isValid = currentLength >= minimumLength;
            return xor(isValid, invert) ?
                null : { 'minLength': { minimumLength, currentLength } };
        };
    }
    /**
     * 'maxLength' validator
     *
     * Requires a control's text value to be less than a specified length.
     *
     * // {number} maximumLength - maximum allowed string length
     * // {boolean = false} invert - instead return error object only if valid
     * // {IValidatorFn}
     */
    static maxLength(maximumLength) {
        if (!hasValue(maximumLength)) {
            return JsonValidators.nullValidator;
        }
        return (control, invert = false) => {
            const currentLength = isString(control.value) ? control.value.length : 0;
            const isValid = currentLength <= maximumLength;
            return xor(isValid, invert) ?
                null : { 'maxLength': { maximumLength, currentLength } };
        };
    }
    /**
     * 'pattern' validator
     *
     * Note: NOT the same as Angular's default pattern validator.
     *
     * Requires a control's value to match a specified regular expression pattern.
     *
     * This validator changes the behavior of default pattern validator
     * by replacing RegExp(`^${pattern}$`) with RegExp(`${pattern}`),
     * which allows for partial matches.
     *
     * To return to the default funcitonality, and match the entire string,
     * pass TRUE as the optional second parameter.
     *
     * // {string} pattern - regular expression pattern
     * // {boolean = false} wholeString - match whole value string?
     * // {IValidatorFn}
     */
    static pattern(pattern, wholeString = false) {
        if (!hasValue(pattern)) {
            return JsonValidators.nullValidator;
        }
        return (control, invert = false) => {
            if (isEmpty(control.value)) {
                return null;
            }
            let regex;
            let requiredPattern;
            if (typeof pattern === 'string') {
                requiredPattern = (wholeString) ? `^${pattern}$` : pattern;
                regex = new RegExp(requiredPattern);
            }
            else {
                requiredPattern = pattern.toString();
                regex = pattern;
            }
            const currentValue = control.value;
            const isValid = isString(currentValue) ? regex.test(currentValue) : false;
            return xor(isValid, invert) ?
                null : { 'pattern': { requiredPattern, currentValue } };
        };
    }
    /**
     * 'format' validator
     *
     * Requires a control to have a value of a certain format.
     *
     * This validator currently checks the following formsts:
     *   date, time, date-time, email, hostname, ipv4, ipv6,
     *   uri, uri-reference, uri-template, url, uuid, color,
     *   json-pointer, relative-json-pointer, regex
     *
     * Fast format regular expressions copied from AJV:
     * https://github.com/epoberezkin/ajv/blob/master/lib/compile/formats.js
     *
     * // {JsonSchemaFormatNames} requiredFormat - format to check
     * // {IValidatorFn}
     */
    static format(requiredFormat) {
        if (!hasValue(requiredFormat)) {
            return JsonValidators.nullValidator;
        }
        return (control, invert = false) => {
            if (isEmpty(control.value)) {
                return null;
            }
            let isValid;
            const currentValue = control.value;
            if (isString(currentValue)) {
                const formatTest = jsonSchemaFormatTests[requiredFormat];
                if (typeof formatTest === 'object') {
                    isValid = formatTest.test(currentValue);
                }
                else if (typeof formatTest === 'function') {
                    isValid = formatTest(currentValue);
                }
                else {
                    console.error(`format validator error: "${requiredFormat}" is not a recognized format.`);
                    isValid = true;
                }
            }
            else {
                // Allow JavaScript Date objects
                isValid = ['date', 'time', 'date-time'].includes(requiredFormat) &&
                    Object.prototype.toString.call(currentValue) === '[object Date]';
            }
            return xor(isValid, invert) ?
                null : { 'format': { requiredFormat, currentValue } };
        };
    }
    /**
     * 'minimum' validator
     *
     * Requires a control's numeric value to be greater than or equal to
     * a minimum amount.
     *
     * Any non-numeric value is also valid (according to the HTML forms spec,
     * a non-numeric value doesn't have a minimum).
     * https://www.w3.org/TR/html5/forms.html#attr-input-max
     *
     * // {number} minimum - minimum allowed value
     * // {IValidatorFn}
     */
    static minimum(minimumValue) {
        if (!hasValue(minimumValue)) {
            return JsonValidators.nullValidator;
        }
        return (control, invert = false) => {
            if (isEmpty(control.value)) {
                return null;
            }
            const currentValue = control.value;
            const isValid = !isNumber(currentValue) || currentValue >= minimumValue;
            return xor(isValid, invert) ?
                null : { 'minimum': { minimumValue, currentValue } };
        };
    }
    /**
     * 'exclusiveMinimum' validator
     *
     * Requires a control's numeric value to be less than a maximum amount.
     *
     * Any non-numeric value is also valid (according to the HTML forms spec,
     * a non-numeric value doesn't have a maximum).
     * https://www.w3.org/TR/html5/forms.html#attr-input-max
     *
     * // {number} exclusiveMinimumValue - maximum allowed value
     * // {IValidatorFn}
     */
    static exclusiveMinimum(exclusiveMinimumValue) {
        if (!hasValue(exclusiveMinimumValue)) {
            return JsonValidators.nullValidator;
        }
        return (control, invert = false) => {
            if (isEmpty(control.value)) {
                return null;
            }
            const currentValue = control.value;
            const isValid = !isNumber(currentValue) || +currentValue < exclusiveMinimumValue;
            return xor(isValid, invert) ?
                null : { 'exclusiveMinimum': { exclusiveMinimumValue, currentValue } };
        };
    }
    /**
     * 'maximum' validator
     *
     * Requires a control's numeric value to be less than or equal to
     * a maximum amount.
     *
     * Any non-numeric value is also valid (according to the HTML forms spec,
     * a non-numeric value doesn't have a maximum).
     * https://www.w3.org/TR/html5/forms.html#attr-input-max
     *
     * // {number} maximumValue - maximum allowed value
     * // {IValidatorFn}
     */
    static maximum(maximumValue) {
        if (!hasValue(maximumValue)) {
            return JsonValidators.nullValidator;
        }
        return (control, invert = false) => {
            if (isEmpty(control.value)) {
                return null;
            }
            const currentValue = control.value;
            const isValid = !isNumber(currentValue) || +currentValue <= maximumValue;
            return xor(isValid, invert) ?
                null : { 'maximum': { maximumValue, currentValue } };
        };
    }
    /**
     * 'exclusiveMaximum' validator
     *
     * Requires a control's numeric value to be less than a maximum amount.
     *
     * Any non-numeric value is also valid (according to the HTML forms spec,
     * a non-numeric value doesn't have a maximum).
     * https://www.w3.org/TR/html5/forms.html#attr-input-max
     *
     * // {number} exclusiveMaximumValue - maximum allowed value
     * // {IValidatorFn}
     */
    static exclusiveMaximum(exclusiveMaximumValue) {
        if (!hasValue(exclusiveMaximumValue)) {
            return JsonValidators.nullValidator;
        }
        return (control, invert = false) => {
            if (isEmpty(control.value)) {
                return null;
            }
            const currentValue = control.value;
            const isValid = !isNumber(currentValue) || +currentValue < exclusiveMaximumValue;
            return xor(isValid, invert) ?
                null : { 'exclusiveMaximum': { exclusiveMaximumValue, currentValue } };
        };
    }
    /**
     * 'multipleOf' validator
     *
     * Requires a control to have a numeric value that is a multiple
     * of a specified number.
     *
     * // {number} multipleOfValue - number value must be a multiple of
     * // {IValidatorFn}
     */
    static multipleOf(multipleOfValue) {
        if (!hasValue(multipleOfValue)) {
            return JsonValidators.nullValidator;
        }
        return (control, invert = false) => {
            if (isEmpty(control.value)) {
                return null;
            }
            const currentValue = (control.value || '').toString().replace(',', '.');
            const parsedMultipleOfValue = (control.value || '').toString().replace(',', '.');
            const lengthAfterComaOfCurrentValue = (currentValue.toString().split('.')[1] || '').length;
            const lengthAfterComaOfMultipleOfValue = (parsedMultipleOfValue.toString().split('.')[1] || '').length;
            const maxDecimalPoint = Math.max(lengthAfterComaOfCurrentValue, lengthAfterComaOfMultipleOfValue);
            const fixedMultipleOfValue = multipleOfValue * Math.pow(10, maxDecimalPoint);
            const fixedCurrentValue = currentValue * Math.pow(10, maxDecimalPoint);
            const isValid = isNumber(currentValue) &&
                fixedCurrentValue % fixedMultipleOfValue === 0;
            return xor(isValid, invert) ?
                null : { 'multipleOf': { multipleOfValue, currentValue } };
        };
    }
    /**
     * 'minProperties' validator
     *
     * Requires a form group to have a minimum number of properties (i.e. have
     * values entered in a minimum number of controls within the group).
     *
     * // {number} minimumProperties - minimum number of properties allowed
     * // {IValidatorFn}
     */
    static minProperties(minimumProperties) {
        if (!hasValue(minimumProperties)) {
            return JsonValidators.nullValidator;
        }
        return (control, invert = false) => {
            if (isEmpty(control.value)) {
                return null;
            }
            const currentProperties = Object.keys(control.value).length || 0;
            const isValid = currentProperties >= minimumProperties;
            return xor(isValid, invert) ?
                null : { 'minProperties': { minimumProperties, currentProperties } };
        };
    }
    /**
     * 'maxProperties' validator
     *
     * Requires a form group to have a maximum number of properties (i.e. have
     * values entered in a maximum number of controls within the group).
     *
     * Note: Has no effect if the form group does not contain more than the
     * maximum number of controls.
     *
     * // {number} maximumProperties - maximum number of properties allowed
     * // {IValidatorFn}
     */
    static maxProperties(maximumProperties) {
        if (!hasValue(maximumProperties)) {
            return JsonValidators.nullValidator;
        }
        return (control, invert = false) => {
            const currentProperties = Object.keys(control.value).length || 0;
            const isValid = currentProperties <= maximumProperties;
            return xor(isValid, invert) ?
                null : { 'maxProperties': { maximumProperties, currentProperties } };
        };
    }
    /**
     * 'dependencies' validator
     *
     * Requires the controls in a form group to meet additional validation
     * criteria, depending on the values of other controls in the group.
     *
     * Examples:
     * https://spacetelescope.github.io/understanding-json-schema/reference/object.html#dependencies
     *
     * // {any} dependencies - required dependencies
     * // {IValidatorFn}
     */
    static dependencies(dependencies) {
        if (getType(dependencies) !== 'object' || isEmpty(dependencies)) {
            return JsonValidators.nullValidator;
        }
        return (control, invert = false) => {
            if (isEmpty(control.value)) {
                return null;
            }
            const allErrors = _mergeObjects(forEachCopy(dependencies, (value, requiringField) => {
                if (!hasValue(control.value[requiringField])) {
                    return null;
                }
                let requiringFieldErrors = {};
                let requiredFields;
                let properties = {};
                if (getType(dependencies[requiringField]) === 'array') {
                    requiredFields = dependencies[requiringField];
                }
                else if (getType(dependencies[requiringField]) === 'object') {
                    requiredFields = dependencies[requiringField]['required'] || [];
                    properties = dependencies[requiringField]['properties'] || {};
                }
                // Validate property dependencies
                for (const requiredField of requiredFields) {
                    if (xor(!hasValue(control.value[requiredField]), invert)) {
                        requiringFieldErrors[requiredField] = { 'required': true };
                    }
                }
                // Validate schema dependencies
                requiringFieldErrors = _mergeObjects(requiringFieldErrors, forEachCopy(properties, (requirements, requiredField) => {
                    const requiredFieldErrors = _mergeObjects(forEachCopy(requirements, (requirement, parameter) => {
                        let validator = null;
                        if (requirement === 'maximum' || requirement === 'minimum') {
                            const exclusive = !!requirements['exclusiveM' + requirement.slice(1)];
                            validator = JsonValidators[requirement](parameter, exclusive);
                        }
                        else if (typeof JsonValidators[requirement] === 'function') {
                            validator = JsonValidators[requirement](parameter);
                        }
                        return !isDefined(validator) ?
                            null : validator(control.value[requiredField]);
                    }));
                    return isEmpty(requiredFieldErrors) ?
                        null : { [requiredField]: requiredFieldErrors };
                }));
                return isEmpty(requiringFieldErrors) ?
                    null : { [requiringField]: requiringFieldErrors };
            }));
            return isEmpty(allErrors) ? null : allErrors;
        };
    }
    /**
     * 'minItems' validator
     *
     * Requires a form array to have a minimum number of values.
     *
     * // {number} minimumItems - minimum number of items allowed
     * // {IValidatorFn}
     */
    static minItems(minimumItems) {
        if (!hasValue(minimumItems)) {
            return JsonValidators.nullValidator;
        }
        return (control, invert = false) => {
            if (isEmpty(control.value)) {
                return null;
            }
            const currentItems = isArray(control.value) ? control.value.length : 0;
            const isValid = currentItems >= minimumItems;
            return xor(isValid, invert) ?
                null : { 'minItems': { minimumItems, currentItems } };
        };
    }
    /**
     * 'maxItems' validator
     *
     * Requires a form array to have a maximum number of values.
     *
     * // {number} maximumItems - maximum number of items allowed
     * // {IValidatorFn}
     */
    static maxItems(maximumItems) {
        if (!hasValue(maximumItems)) {
            return JsonValidators.nullValidator;
        }
        return (control, invert = false) => {
            const currentItems = isArray(control.value) ? control.value.length : 0;
            const isValid = currentItems <= maximumItems;
            return xor(isValid, invert) ?
                null : { 'maxItems': { maximumItems, currentItems } };
        };
    }
    /**
     * 'uniqueItems' validator
     *
     * Requires values in a form array to be unique.
     *
     * // {boolean = true} unique? - true to validate, false to disable
     * // {IValidatorFn}
     */
    static uniqueItems(unique = true) {
        if (!unique) {
            return JsonValidators.nullValidator;
        }
        return (control, invert = false) => {
            if (isEmpty(control.value)) {
                return null;
            }
            const sorted = control.value.slice().sort();
            const duplicateItems = [];
            for (let i = 1; i < sorted.length; i++) {
                if (sorted[i - 1] === sorted[i] && duplicateItems.includes(sorted[i])) {
                    duplicateItems.push(sorted[i]);
                }
            }
            const isValid = !duplicateItems.length;
            return xor(isValid, invert) ?
                null : { 'uniqueItems': { duplicateItems } };
        };
    }
    /**
     * 'contains' validator
     *
     * TODO: Complete this validator
     *
     * Requires values in a form array to be unique.
     *
     * // {boolean = true} unique? - true to validate, false to disable
     * // {IValidatorFn}
     */
    static contains(requiredItem = true) {
        if (!requiredItem) {
            return JsonValidators.nullValidator;
        }
        return (control, invert = false) => {
            if (isEmpty(control.value) || !isArray(control.value)) {
                return null;
            }
            const currentItems = control.value;
            // const isValid = currentItems.some(item =>
            //
            // );
            const isValid = true;
            return xor(isValid, invert) ?
                null : { 'contains': { requiredItem, currentItems } };
        };
    }
    /**
     * No-op validator. Included for backward compatibility.
     */
    static nullValidator(control) {
        return null;
    }
    /**
     * Validator transformation functions:
     * composeAnyOf, composeOneOf, composeAllOf, composeNot,
     * compose, composeAsync
     *
     * TODO: Add composeAnyOfAsync, composeOneOfAsync,
     *           composeAllOfAsync, composeNotAsync
     */
    /**
     * 'composeAnyOf' validator combination function
     *
     * Accepts an array of validators and returns a single validator that
     * evaluates to valid if any one or more of the submitted validators are
     * valid. If every validator is invalid, it returns combined errors from
     * all validators.
     *
     * // {IValidatorFn[]} validators - array of validators to combine
     * // {IValidatorFn} - single combined validator function
     */
    static composeAnyOf(validators) {
        if (!validators) {
            return null;
        }
        const presentValidators = validators.filter(isDefined);
        if (presentValidators.length === 0) {
            return null;
        }
        return (control, invert = false) => {
            const arrayOfErrors = _executeValidators(control, presentValidators, invert).filter(isDefined);
            const isValid = validators.length > arrayOfErrors.length;
            return xor(isValid, invert) ?
                null : _mergeObjects(...arrayOfErrors, { 'anyOf': !invert });
        };
    }
    /**
     * 'composeOneOf' validator combination function
     *
     * Accepts an array of validators and returns a single validator that
     * evaluates to valid only if exactly one of the submitted validators
     * is valid. Otherwise returns combined information from all validators,
     * both valid and invalid.
     *
     * // {IValidatorFn[]} validators - array of validators to combine
     * // {IValidatorFn} - single combined validator function
     */
    static composeOneOf(validators) {
        if (!validators) {
            return null;
        }
        const presentValidators = validators.filter(isDefined);
        if (presentValidators.length === 0) {
            return null;
        }
        return (control, invert = false) => {
            const arrayOfErrors = _executeValidators(control, presentValidators);
            const validControls = validators.length - arrayOfErrors.filter(isDefined).length;
            const isValid = validControls === 1;
            if (xor(isValid, invert)) {
                return null;
            }
            const arrayOfValids = _executeValidators(control, presentValidators, invert);
            return _mergeObjects(...arrayOfErrors, ...arrayOfValids, { 'oneOf': !invert });
        };
    }
    /**
     * 'composeAllOf' validator combination function
     *
     * Accepts an array of validators and returns a single validator that
     * evaluates to valid only if all the submitted validators are individually
     * valid. Otherwise it returns combined errors from all invalid validators.
     *
     * // {IValidatorFn[]} validators - array of validators to combine
     * // {IValidatorFn} - single combined validator function
     */
    static composeAllOf(validators) {
        if (!validators) {
            return null;
        }
        const presentValidators = validators.filter(isDefined);
        if (presentValidators.length === 0) {
            return null;
        }
        return (control, invert = false) => {
            const combinedErrors = _mergeErrors(_executeValidators(control, presentValidators, invert));
            const isValid = combinedErrors === null;
            return (xor(isValid, invert)) ?
                null : _mergeObjects(combinedErrors, { 'allOf': !invert });
        };
    }
    /**
     * 'composeNot' validator inversion function
     *
     * Accepts a single validator function and inverts its result.
     * Returns valid if the submitted validator is invalid, and
     * returns invalid if the submitted validator is valid.
     * (Note: this function can itself be inverted
     *   - e.g. composeNot(composeNot(validator)) -
     *   but this can be confusing and is therefore not recommended.)
     *
     * // {IValidatorFn[]} validators - validator(s) to invert
     * // {IValidatorFn} - new validator function that returns opposite result
     */
    static composeNot(validator) {
        if (!validator) {
            return null;
        }
        return (control, invert = false) => {
            if (isEmpty(control.value)) {
                return null;
            }
            const error = validator(control, !invert);
            const isValid = error === null;
            return (xor(isValid, invert)) ?
                null : _mergeObjects(error, { 'not': !invert });
        };
    }
    /**
     * 'compose' validator combination function
     *
     * // {IValidatorFn[]} validators - array of validators to combine
     * // {IValidatorFn} - single combined validator function
     */
    static compose(validators) {
        if (!validators) {
            return null;
        }
        const presentValidators = validators.filter(isDefined);
        if (presentValidators.length === 0) {
            return null;
        }
        return (control, invert = false) => _mergeErrors(_executeValidators(control, presentValidators, invert));
    }
    /**
     * 'composeAsync' async validator combination function
     *
     * // {AsyncIValidatorFn[]} async validators - array of async validators
     * // {AsyncIValidatorFn} - single combined async validator function
     */
    static composeAsync(validators) {
        if (!validators) {
            return null;
        }
        const presentValidators = validators.filter(isDefined);
        if (presentValidators.length === 0) {
            return null;
        }
        return (control) => {
            const observables = _executeAsyncValidators(control, presentValidators).map(toObservable);
            return map.call(forkJoin(observables), _mergeErrors);
        };
    }
    // Additional angular validators (not used by Angualr JSON Schema Form)
    // From https://github.com/angular/angular/blob/master/packages/forms/src/validators.ts
    /**
     * Validator that requires controls to have a value greater than a number.
     */
    static min(min) {
        if (!hasValue(min)) {
            return JsonValidators.nullValidator;
        }
        return (control) => {
            // don't validate empty values to allow optional controls
            if (isEmpty(control.value) || isEmpty(min)) {
                return null;
            }
            const value = parseFloat(control.value);
            const actual = control.value;
            // Controls with NaN values after parsing should be treated as not having a
            // minimum, per the HTML forms spec: https://www.w3.org/TR/html5/forms.html#attr-input-min
            return isNaN(value) || value >= min ? null : { 'min': { min, actual } };
        };
    }
    /**
     * Validator that requires controls to have a value less than a number.
     */
    static max(max) {
        if (!hasValue(max)) {
            return JsonValidators.nullValidator;
        }
        return (control) => {
            // don't validate empty values to allow optional controls
            if (isEmpty(control.value) || isEmpty(max)) {
                return null;
            }
            const value = parseFloat(control.value);
            const actual = control.value;
            // Controls with NaN values after parsing should be treated as not having a
            // maximum, per the HTML forms spec: https://www.w3.org/TR/html5/forms.html#attr-input-max
            return isNaN(value) || value <= max ? null : { 'max': { max, actual } };
        };
    }
    /**
     * Validator that requires control value to be true.
     */
    static requiredTrue(control) {
        if (!control) {
            return JsonValidators.nullValidator;
        }
        return control.value === true ? null : { 'required': true };
    }
    /**
     * Validator that performs email validation.
     */
    static email(control) {
        if (!control) {
            return JsonValidators.nullValidator;
        }
        const EMAIL_REGEXP = 
        // tslint:disable-next-line:max-line-length
        /^(?=.{1,254}$)(?=.{1,64}@)[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+(\.[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+)*@[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$/;
        return EMAIL_REGEXP.test(control.value) ? null : { 'email': true };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbi52YWxpZGF0b3JzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvYWpzZi1jb3JlL3NyYy9saWIvc2hhcmVkL2pzb24udmFsaWRhdG9ycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLE9BQU8sTUFBTSxnQkFBZ0IsQ0FBQztBQUNyQyxPQUFPLEVBQ0wsdUJBQXVCLEVBQ3ZCLGtCQUFrQixFQUNsQixZQUFZLEVBQ1osYUFBYSxFQUViLE9BQU8sRUFDUCxRQUFRLEVBQ1IsT0FBTyxFQUNQLFNBQVMsRUFDVCxTQUFTLEVBQ1QsT0FBTyxFQUNQLFFBQVEsRUFDUixRQUFRLEVBQ1IsTUFBTSxFQUdOLGdCQUFnQixFQUNoQixZQUFZLEVBQ1osR0FBRyxFQUNKLE1BQU0sdUJBQXVCLENBQUM7QUFFL0IsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLHFCQUFxQixDQUFDO0FBQ2xELE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxNQUFNLENBQUM7QUFDaEMsT0FBTyxFQUF5QixxQkFBcUIsRUFBRSxNQUFNLDBCQUEwQixDQUFDO0FBQ3hGLE9BQU8sRUFBRSxHQUFHLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUlyQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBOEVHO0FBQ0gsTUFBTSxPQUFPLGNBQWM7SUFzQ3pCLE1BQU0sQ0FBQyxRQUFRLENBQUMsS0FBaUM7UUFDL0MsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO1lBQUUsS0FBSyxHQUFHLElBQUksQ0FBQztTQUFFO1FBQzFDLFFBQVEsS0FBSyxFQUFFO1lBQ2IsS0FBSyxJQUFJLEVBQUUsbURBQW1EO2dCQUM1RCxPQUFPLENBQUMsT0FBd0IsRUFBRSxNQUFNLEdBQUcsS0FBSyxFQUEyQixFQUFFO29CQUMzRSxJQUFJLE1BQU0sRUFBRTt3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QUFPLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUM7UUFDMUUsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQUVEOztPQUVHO0lBQ0gsTUFBTSxDQUFDLFlBQVksQ0FBQyxPQUF3QjtRQUMxQyxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQUUsT0FBTyxjQUFjLENBQUMsYUFBYSxDQUFDO1NBQUU7UUFDdEQsT0FBTyxPQUFPLENBQUMsS0FBSyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsQ0FBQztJQUM5RCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQXdCO1FBQ25DLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFBRSxPQUFPLGNBQWMsQ0FBQyxhQUFhLENBQUM7U0FBRTtRQUN0RCxNQUFNLFlBQVk7UUFDaEIsMkNBQTJDO1FBQzNDLDRMQUE0TCxDQUFDO1FBQy9MLE9BQU8sWUFBWSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUM7SUFDckUsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGlzRXF1YWwgZnJvbSAnbG9kYXNoL2lzRXF1YWwnO1xyXG5pbXBvcnQge1xyXG4gIF9leGVjdXRlQXN5bmNWYWxpZGF0b3JzLFxyXG4gIF9leGVjdXRlVmFsaWRhdG9ycyxcclxuICBfbWVyZ2VFcnJvcnMsXHJcbiAgX21lcmdlT2JqZWN0cyxcclxuICBBc3luY0lWYWxpZGF0b3JGbixcclxuICBnZXRUeXBlLFxyXG4gIGhhc1ZhbHVlLFxyXG4gIGlzQXJyYXksXHJcbiAgaXNCb29sZWFuLFxyXG4gIGlzRGVmaW5lZCxcclxuICBpc0VtcHR5LFxyXG4gIGlzTnVtYmVyLFxyXG4gIGlzU3RyaW5nLFxyXG4gIGlzVHlwZSxcclxuICBJVmFsaWRhdG9yRm4sXHJcbiAgU2NoZW1hUHJpbWl0aXZlVHlwZSxcclxuICB0b0phdmFTY3JpcHRUeXBlLFxyXG4gIHRvT2JzZXJ2YWJsZSxcclxuICB4b3JcclxufSBmcm9tICcuL3ZhbGlkYXRvci5mdW5jdGlvbnMnO1xyXG5pbXBvcnQgeyBBYnN0cmFjdENvbnRyb2wsIFZhbGlkYXRpb25FcnJvcnMsIFZhbGlkYXRvckZuIH0gZnJvbSAnQGFuZ3VsYXIvZm9ybXMnO1xyXG5pbXBvcnQgeyBmb3JFYWNoQ29weSB9IGZyb20gJy4vdXRpbGl0eS5mdW5jdGlvbnMnO1xyXG5pbXBvcnQgeyBmb3JrSm9pbiB9IGZyb20gJ3J4anMnO1xyXG5pbXBvcnQgeyBKc29uU2NoZW1hRm9ybWF0TmFtZXMsIGpzb25TY2hlbWFGb3JtYXRUZXN0cyB9IGZyb20gJy4vZm9ybWF0LXJlZ2V4LmNvbnN0YW50cyc7XHJcbmltcG9ydCB7IG1hcCB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcclxuXHJcblxyXG5cclxuLyoqXHJcbiAqICdKc29uVmFsaWRhdG9ycycgY2xhc3NcclxuICpcclxuICogUHJvdmlkZXMgYW4gZXh0ZW5kZWQgc2V0IG9mIHZhbGlkYXRvcnMgdG8gYmUgdXNlZCBieSBmb3JtIGNvbnRyb2xzLFxyXG4gKiBjb21wYXRpYmxlIHdpdGggc3RhbmRhcmQgSlNPTiBTY2hlbWEgdmFsaWRhdGlvbiBvcHRpb25zLlxyXG4gKiBodHRwOi8vanNvbi1zY2hlbWEub3JnL2xhdGVzdC9qc29uLXNjaGVtYS12YWxpZGF0aW9uLmh0bWxcclxuICpcclxuICogTm90ZTogVGhpcyBsaWJyYXJ5IGlzIGRlc2lnbmVkIGFzIGEgZHJvcC1pbiByZXBsYWNlbWVudCBmb3IgdGhlIEFuZ3VsYXJcclxuICogVmFsaWRhdG9ycyBsaWJyYXJ5LCBhbmQgZXhjZXB0IGZvciBvbmUgc21hbGwgYnJlYWtpbmcgY2hhbmdlIHRvIHRoZSAncGF0dGVybidcclxuICogdmFsaWRhdG9yIChkZXNjcmliZWQgYmVsb3cpIGl0IGNhbiBldmVuIGJlIGltcG9ydGVkIGFzIGEgc3Vic3RpdHV0ZSwgbGlrZSBzbzpcclxuICpcclxuICogICBpbXBvcnQgeyBKc29uVmFsaWRhdG9ycyBhcyBWYWxpZGF0b3JzIH0gZnJvbSAnanNvbi12YWxpZGF0b3JzJztcclxuICpcclxuICogYW5kIGl0IHNob3VsZCB3b3JrIHdpdGggZXhpc3RpbmcgY29kZSBhcyBhIGNvbXBsZXRlIHJlcGxhY2VtZW50LlxyXG4gKlxyXG4gKiBUaGUgb25lIGV4Y2VwdGlvbiBpcyB0aGUgJ3BhdHRlcm4nIHZhbGlkYXRvciwgd2hpY2ggaGFzIGJlZW4gY2hhbmdlZCB0b1xyXG4gKiBtYXRjaGUgcGFydGlhbCB2YWx1ZXMgYnkgZGVmYXVsdCAodGhlIHN0YW5kYXJkICdwYXR0ZXJuJyB2YWxpZGF0b3Igd3JhcHBlZFxyXG4gKiBhbGwgcGF0dGVybnMgaW4gJ14nIGFuZCAnJCcsIGZvcmNpbmcgdGhlbSB0byBhbHdheXMgbWF0Y2ggYW4gZW50aXJlIHZhbHVlKS5cclxuICogSG93ZXZlciwgdGhlIG9sZCBiZWhhdmlvciBjYW4gYmUgcmVzdG9yZWQgYnkgc2ltcGx5IGFkZGluZyAnXicgYW5kICckJ1xyXG4gKiBhcm91bmQgeW91ciBwYXR0ZXJucywgb3IgYnkgcGFzc2luZyBhbiBvcHRpb25hbCBzZWNvbmQgcGFyYW1ldGVyIG9mIFRSVUUuXHJcbiAqIFRoaXMgY2hhbmdlIGlzIHRvIG1ha2UgdGhlICdwYXR0ZXJuJyB2YWxpZGF0b3IgbWF0Y2ggdGhlIGJlaGF2aW9yIG9mIGFcclxuICogSlNPTiBTY2hlbWEgcGF0dGVybiwgd2hpY2ggYWxsb3dzIHBhcnRpYWwgbWF0Y2hlcywgcmF0aGVyIHRoYW4gdGhlIGJlaGF2aW9yXHJcbiAqIG9mIGFuIEhUTUwgaW5wdXQgY29udHJvbCBwYXR0ZXJuLCB3aGljaCBkb2VzIG5vdC5cclxuICpcclxuICogVGhpcyBsaWJyYXJ5IHJlcGxhY2VzIEFuZ3VsYXIncyB2YWxpZGF0b3JzIGFuZCBjb21iaW5hdGlvbiBmdW5jdGlvbnNcclxuICogd2l0aCB0aGUgZm9sbG93aW5nIHZhbGlkYXRvcnMgYW5kIHRyYW5zZm9ybWF0aW9uIGZ1bmN0aW9uczpcclxuICpcclxuICogVmFsaWRhdG9yczpcclxuICogICBGb3IgYWxsIGZvcm1Db250cm9sczogICAgIHJlcXVpcmVkICgqKSwgdHlwZSwgZW51bSwgY29uc3RcclxuICogICBGb3IgdGV4dCBmb3JtQ29udHJvbHM6ICAgIG1pbkxlbmd0aCAoKiksIG1heExlbmd0aCAoKiksIHBhdHRlcm4gKCopLCBmb3JtYXRcclxuICogICBGb3IgbnVtZXJpYyBmb3JtQ29udHJvbHM6IG1heGltdW0sIGV4Y2x1c2l2ZU1heGltdW0sXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW5pbXVtLCBleGNsdXNpdmVNaW5pbXVtLCBtdWx0aXBsZU9mXHJcbiAqICAgRm9yIGZvcm1Hcm91cCBvYmplY3RzOiAgICBtaW5Qcm9wZXJ0aWVzLCBtYXhQcm9wZXJ0aWVzLCBkZXBlbmRlbmNpZXNcclxuICogICBGb3IgZm9ybUFycmF5IGFycmF5czogICAgIG1pbkl0ZW1zLCBtYXhJdGVtcywgdW5pcXVlSXRlbXMsIGNvbnRhaW5zXHJcbiAqICAgTm90IHVzZWQgYnkgSlNPTiBTY2hlbWE6ICBtaW4gKCopLCBtYXggKCopLCByZXF1aXJlZFRydWUgKCopLCBlbWFpbCAoKilcclxuICogKFZhbGlkYXRvcnMgb3JpZ2luYWxseSBpbmNsdWRlZCB3aXRoIEFuZ3VsYXIgYXJlIG1ha2VkIHdpdGggKCopLilcclxuICpcclxuICogTk9URSAvIFRPRE86IFRoZSBkZXBlbmRlbmNpZXMgdmFsaWRhdG9yIGlzIG5vdCBjb21wbGV0ZS5cclxuICogTk9URSAvIFRPRE86IFRoZSBjb250YWlucyB2YWxpZGF0b3IgaXMgbm90IGNvbXBsZXRlLlxyXG4gKlxyXG4gKiBWYWxpZGF0b3JzIG5vdCB1c2VkIGJ5IEpTT04gU2NoZW1hIChidXQgaW5jbHVkZWQgZm9yIGNvbXBhdGliaWxpdHkpXHJcbiAqIGFuZCB0aGVpciBKU09OIFNjaGVtYSBlcXVpdmFsZW50czpcclxuICpcclxuICogICBBbmd1bGFyIHZhbGlkYXRvciB8IEpTT04gU2NoZW1hIGVxdWl2YWxlbnRcclxuICogICAtLS0tLS0tLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICogICAgIG1pbihudW1iZXIpICAgICB8ICAgbWluaW11bShudW1iZXIpXHJcbiAqICAgICBtYXgobnVtYmVyKSAgICAgfCAgIG1heGltdW0obnVtYmVyKVxyXG4gKiAgICAgcmVxdWlyZWRUcnVlKCkgIHwgICBjb25zdCh0cnVlKVxyXG4gKiAgICAgZW1haWwoKSAgICAgICAgIHwgICBmb3JtYXQoJ2VtYWlsJylcclxuICpcclxuICogVmFsaWRhdG9yIHRyYW5zZm9ybWF0aW9uIGZ1bmN0aW9uczpcclxuICogICBjb21wb3NlQW55T2YsIGNvbXBvc2VPbmVPZiwgY29tcG9zZUFsbE9mLCBjb21wb3NlTm90XHJcbiAqIChBbmd1bGFyJ3Mgb3JpZ2luYWwgY29tYmluYXRpb24gZnVuY2l0b24sICdjb21wb3NlJywgaXMgYWxzbyBpbmNsdWRlZCBmb3JcclxuICogYmFja3dhcmQgY29tcGF0aWJpbGl0eSwgdGhvdWdoIGl0IGlzIGZ1bmN0aW9uYWxseSBlcXVpdmFsZW50IHRvIGNvbXBvc2VBbGxPZixcclxuICogYXNzaWRlIGZyb20gaXRzIG1vcmUgZ2VuZXJpYyBlcnJvciBtZXNzYWdlLilcclxuICpcclxuICogQWxsIHZhbGlkYXRvcnMgaGF2ZSBhbHNvIGJlZW4gZXh0ZW5kZWQgdG8gYWNjZXB0IGFuIG9wdGlvbmFsIHNlY29uZCBhcmd1bWVudFxyXG4gKiB3aGljaCwgaWYgcGFzc2VkIGEgVFJVRSB2YWx1ZSwgY2F1c2VzIHRoZSB2YWxpZGF0b3IgdG8gcGVyZm9ybSB0aGUgb3Bwb3NpdGVcclxuICogb2YgaXRzIG9yaWdpbmFsIGZpbmN0aW9uLiAoVGhpcyBpcyB1c2VkIGludGVybmFsbHkgdG8gZW5hYmxlICdub3QnIGFuZFxyXG4gKiAnY29tcG9zZU9uZU9mJyB0byBmdW5jdGlvbiBhbmQgcmV0dXJuIHVzZWZ1bCBlcnJvciBtZXNzYWdlcy4pXHJcbiAqXHJcbiAqIFRoZSAncmVxdWlyZWQnIHZhbGlkYXRvciBoYXMgYWxzbyBiZWVuIG92ZXJsb2FkZWQgc28gdGhhdCBpZiBjYWxsZWQgd2l0aFxyXG4gKiBhIGJvb2xlYW4gcGFyYW1ldGVyIChvciBubyBwYXJhbWV0ZXJzKSBpdCByZXR1cm5zIHRoZSBvcmlnaW5hbCB2YWxpZGF0b3JcclxuICogZnVuY3Rpb24gKHJhdGhlciB0aGFuIGV4ZWN1dGluZyBpdCkuIEhvd2V2ZXIsIGlmIGl0IGlzIGNhbGxlZCB3aXRoIGFuXHJcbiAqIEFic3RyYWN0Q29udHJvbCBwYXJhbWV0ZXIgKGFzIHdhcyBwcmV2aW91c2x5IHJlcXVpcmVkKSwgaXQgYmVoYXZlc1xyXG4gKiBleGFjdGx5IGFzIGJlZm9yZS5cclxuICpcclxuICogVGhpcyBlbmFibGVzIGFsbCB2YWxpZGF0b3JzIChpbmNsdWRpbmcgJ3JlcXVpcmVkJykgdG8gYmUgY29uc3RydWN0ZWQgaW5cclxuICogZXhhY3RseSB0aGUgc2FtZSB3YXksIHNvIHRoZXkgY2FuIGJlIGF1dG9tYXRpY2FsbHkgYXBwbGllZCB1c2luZyB0aGVcclxuICogZXF1aXZhbGVudCBrZXkgbmFtZXMgYW5kIHZhbHVlcyB0YWtlbiBkaXJlY3RseSBmcm9tIGEgSlNPTiBTY2hlbWEuXHJcbiAqXHJcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgcGFydGlhbGx5IGRlcml2ZWQgZnJvbSBBbmd1bGFyLFxyXG4gKiB3aGljaCBpcyBDb3B5cmlnaHQgKGMpIDIwMTQtMjAxNyBHb29nbGUsIEluYy5cclxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgdGhlcmVmb3JlIGdvdmVybmVkIGJ5IHRoZSBzYW1lIE1JVC1zdHlsZSBsaWNlbnNlXHJcbiAqIHRoYXQgY2FuIGJlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcclxuICpcclxuICogT3JpZ2luYWwgQW5ndWxhciBWYWxpZGF0b3JzOlxyXG4gKiBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL2Jsb2IvbWFzdGVyL3BhY2thZ2VzL2Zvcm1zL3NyYy92YWxpZGF0b3JzLnRzXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgSnNvblZhbGlkYXRvcnMge1xyXG5cclxuICAvKipcclxuICAgKiBWYWxpZGF0b3IgZnVuY3Rpb25zOlxyXG4gICAqXHJcbiAgICogRm9yIGFsbCBmb3JtQ29udHJvbHM6ICAgICByZXF1aXJlZCwgdHlwZSwgZW51bSwgY29uc3RcclxuICAgKiBGb3IgdGV4dCBmb3JtQ29udHJvbHM6ICAgIG1pbkxlbmd0aCwgbWF4TGVuZ3RoLCBwYXR0ZXJuLCBmb3JtYXRcclxuICAgKiBGb3IgbnVtZXJpYyBmb3JtQ29udHJvbHM6IG1heGltdW0sIGV4Y2x1c2l2ZU1heGltdW0sXHJcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICBtaW5pbXVtLCBleGNsdXNpdmVNaW5pbXVtLCBtdWx0aXBsZU9mXHJcbiAgICogRm9yIGZvcm1Hcm91cCBvYmplY3RzOiAgICBtaW5Qcm9wZXJ0aWVzLCBtYXhQcm9wZXJ0aWVzLCBkZXBlbmRlbmNpZXNcclxuICAgKiBGb3IgZm9ybUFycmF5IGFycmF5czogICAgIG1pbkl0ZW1zLCBtYXhJdGVtcywgdW5pcXVlSXRlbXMsIGNvbnRhaW5zXHJcbiAgICpcclxuICAgKiBUT0RPOiBmaW5pc2ggZGVwZW5kZW5jaWVzIHZhbGlkYXRvclxyXG4gICAqL1xyXG5cclxuICAvKipcclxuICAgKiAncmVxdWlyZWQnIHZhbGlkYXRvclxyXG4gICAqXHJcbiAgICogVGhpcyB2YWxpZGF0b3IgaXMgb3ZlcmxvYWRlZCwgY29tcGFyZWQgdG8gdGhlIGRlZmF1bHQgcmVxdWlyZWQgdmFsaWRhdG9yLlxyXG4gICAqIElmIGNhbGxlZCB3aXRoIG5vIHBhcmFtZXRlcnMsIG9yIFRSVUUsIHRoaXMgdmFsaWRhdG9yIHJldHVybnMgdGhlXHJcbiAgICogJ3JlcXVpcmVkJyB2YWxpZGF0b3IgZnVuY3Rpb24gKHJhdGhlciB0aGFuIGV4ZWN1dGluZyBpdCkuIFRoaXMgbWF0Y2hlc1xyXG4gICAqIHRoZSBiZWhhdmlvciBvZiBhbGwgb3RoZXIgdmFsaWRhdG9ycyBpbiB0aGlzIGxpYnJhcnkuXHJcbiAgICpcclxuICAgKiBJZiB0aGlzIHZhbGlkYXRvciBpcyBjYWxsZWQgd2l0aCBhbiBBYnN0cmFjdENvbnRyb2wgcGFyYW1ldGVyXHJcbiAgICogKGFzIHdhcyBwcmV2aW91c2x5IHJlcXVpcmVkKSBpdCBiZWhhdmVzIHRoZSBzYW1lIGFzIEFuZ3VsYXIncyBkZWZhdWx0XHJcbiAgICogcmVxdWlyZWQgdmFsaWRhdG9yLCBhbmQgcmV0dXJucyBhbiBlcnJvciBpZiB0aGUgY29udHJvbCBpcyBlbXB0eS5cclxuICAgKlxyXG4gICAqIE9sZCBiZWhhdmlvcjogKGlmIGlucHV0IHR5cGUgPSBBYnN0cmFjdENvbnRyb2wpXHJcbiAgICogLy8ge0Fic3RyYWN0Q29udHJvbH0gY29udHJvbCAtIHJlcXVpcmVkIGNvbnRyb2xcclxuICAgKiAvLyB7e1trZXk6IHN0cmluZ106IGJvb2xlYW59fSAtIHJldHVybnMgZXJyb3IgbWVzc2FnZSBpZiBubyBpbnB1dFxyXG4gICAqXHJcbiAgICogTmV3IGJlaGF2aW9yOiAoaWYgbm8gaW5wdXQsIG9yIGlucHV0IHR5cGUgPSBib29sZWFuKVxyXG4gICAqIC8vIHtib29sZWFuID0gdHJ1ZX0gcmVxdWlyZWQ/IC0gdHJ1ZSB0byB2YWxpZGF0ZSwgZmFsc2UgdG8gZGlzYWJsZVxyXG4gICAqIC8vIHtJVmFsaWRhdG9yRm59IC0gcmV0dXJucyB0aGUgJ3JlcXVpcmVkJyB2YWxpZGF0b3IgZnVuY3Rpb24gaXRzZWxmXHJcbiAgICovXHJcbiAgc3RhdGljIHJlcXVpcmVkKGlucHV0OiBBYnN0cmFjdENvbnRyb2wpOiBWYWxpZGF0aW9uRXJyb3JzIHwgbnVsbDtcclxuICBzdGF0aWMgcmVxdWlyZWQoaW5wdXQ/OiBib29sZWFuKTogSVZhbGlkYXRvckZuO1xyXG5cclxuICBzdGF0aWMgcmVxdWlyZWQoaW5wdXQ/OiBBYnN0cmFjdENvbnRyb2wgfCBib29sZWFuKTogVmFsaWRhdGlvbkVycm9ycyB8IG51bGwgfCBJVmFsaWRhdG9yRm4ge1xyXG4gICAgaWYgKGlucHV0ID09PSB1bmRlZmluZWQpIHsgaW5wdXQgPSB0cnVlOyB9XHJcbiAgICBzd2l0Y2ggKGlucHV0KSB7XHJcbiAgICAgIGNhc2UgdHJ1ZTogLy8gUmV0dXJuIHJlcXVpcmVkIGZ1bmN0aW9uIChkbyBub3QgZXhlY3V0ZSBpdCB5ZXQpXHJcbiAgICAgICAgcmV0dXJuIChjb250cm9sOiBBYnN0cmFjdENvbnRyb2wsIGludmVydCA9IGZhbHNlKTogVmFsaWRhdGlvbkVycm9ycyB8IG51bGwgPT4ge1xyXG4gICAgICAgICAgaWYgKGludmVydCkgeyByZXR1cm4gbnVsbDsgfSAvLyBpZiBub3QgcmVxdWlyZWQsIGFsd2F5cyByZXR1cm4gdmFsaWRcclxuICAgICAgICAgIHJldHVybiBoYXNWYWx1ZShjb250cm9sLnZhbHVlKSA/IG51bGwgOiB7ICdyZXF1aXJlZCc6IHRydWUgfTtcclxuICAgICAgICB9O1xyXG4gICAgICBjYXNlIGZhbHNlOiAvLyBEbyBub3RoaW5nIChpZiBmaWVsZCBpcyBub3QgcmVxdWlyZWQsIGl0IGlzIGFsd2F5cyB2YWxpZClcclxuICAgICAgICByZXR1cm4gSnNvblZhbGlkYXRvcnMubnVsbFZhbGlkYXRvcjtcclxuICAgICAgZGVmYXVsdDogLy8gRXhlY3V0ZSByZXF1aXJlZCBmdW5jdGlvblxyXG4gICAgICAgIHJldHVybiBoYXNWYWx1ZSgoPEFic3RyYWN0Q29udHJvbD5pbnB1dCkudmFsdWUpID8gbnVsbCA6IHsgJ3JlcXVpcmVkJzogdHJ1ZSB9O1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogJ3R5cGUnIHZhbGlkYXRvclxyXG4gICAqXHJcbiAgICogUmVxdWlyZXMgYSBjb250cm9sIHRvIG9ubHkgYWNjZXB0IHZhbHVlcyBvZiBhIHNwZWNpZmllZCB0eXBlLFxyXG4gICAqIG9yIG9uZSBvZiBhbiBhcnJheSBvZiB0eXBlcy5cclxuICAgKlxyXG4gICAqIE5vdGU6IFNjaGVtYVByaW1pdGl2ZVR5cGUgPSAnc3RyaW5nJ3wnbnVtYmVyJ3wnaW50ZWdlcid8J2Jvb2xlYW4nfCdudWxsJ1xyXG4gICAqXHJcbiAgICogLy8ge1NjaGVtYVByaW1pdGl2ZVR5cGV8U2NoZW1hUHJpbWl0aXZlVHlwZVtdfSB0eXBlIC0gdHlwZShzKSB0byBhY2NlcHRcclxuICAgKiAvLyB7SVZhbGlkYXRvckZufVxyXG4gICAqL1xyXG4gIHN0YXRpYyB0eXBlKHJlcXVpcmVkVHlwZTogU2NoZW1hUHJpbWl0aXZlVHlwZSB8IFNjaGVtYVByaW1pdGl2ZVR5cGVbXSk6IElWYWxpZGF0b3JGbiB7XHJcbiAgICBpZiAoIWhhc1ZhbHVlKHJlcXVpcmVkVHlwZSkpIHsgcmV0dXJuIEpzb25WYWxpZGF0b3JzLm51bGxWYWxpZGF0b3I7IH1cclxuICAgIHJldHVybiAoY29udHJvbDogQWJzdHJhY3RDb250cm9sLCBpbnZlcnQgPSBmYWxzZSk6IFZhbGlkYXRpb25FcnJvcnMgfCBudWxsID0+IHtcclxuICAgICAgaWYgKGlzRW1wdHkoY29udHJvbC52YWx1ZSkpIHsgcmV0dXJuIG51bGw7IH1cclxuICAgICAgY29uc3QgY3VycmVudFZhbHVlOiBhbnkgPSBjb250cm9sLnZhbHVlO1xyXG4gICAgICBjb25zdCBpc1ZhbGlkID0gaXNBcnJheShyZXF1aXJlZFR5cGUpID9cclxuICAgICAgICAoPFNjaGVtYVByaW1pdGl2ZVR5cGVbXT5yZXF1aXJlZFR5cGUpLnNvbWUodHlwZSA9PiBpc1R5cGUoY3VycmVudFZhbHVlLCB0eXBlKSkgOlxyXG4gICAgICAgIGlzVHlwZShjdXJyZW50VmFsdWUsIDxTY2hlbWFQcmltaXRpdmVUeXBlPnJlcXVpcmVkVHlwZSk7XHJcbiAgICAgIHJldHVybiB4b3IoaXNWYWxpZCwgaW52ZXJ0KSA/XHJcbiAgICAgICAgbnVsbCA6IHsgJ3R5cGUnOiB7IHJlcXVpcmVkVHlwZSwgY3VycmVudFZhbHVlIH0gfTtcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiAnZW51bScgdmFsaWRhdG9yXHJcbiAgICpcclxuICAgKiBSZXF1aXJlcyBhIGNvbnRyb2wgdG8gaGF2ZSBhIHZhbHVlIGZyb20gYW4gZW51bWVyYXRlZCBsaXN0IG9mIHZhbHVlcy5cclxuICAgKlxyXG4gICAqIENvbnZlcnRzIHR5cGVzIGFzIG5lZWRlZCB0byBhbGxvdyBzdHJpbmcgaW5wdXRzIHRvIHN0aWxsIGNvcnJlY3RseVxyXG4gICAqIG1hdGNoIG51bWJlciwgYm9vbGVhbiwgYW5kIG51bGwgZW51bSB2YWx1ZXMuXHJcbiAgICpcclxuICAgKiAvLyB7YW55W119IGFsbG93ZWRWYWx1ZXMgLSBhcnJheSBvZiBhY2NlcHRhYmxlIHZhbHVlc1xyXG4gICAqIC8vIHtJVmFsaWRhdG9yRm59XHJcbiAgICovXHJcbiAgc3RhdGljIGVudW0oYWxsb3dlZFZhbHVlczogYW55W10pOiBJVmFsaWRhdG9yRm4ge1xyXG4gICAgaWYgKCFpc0FycmF5KGFsbG93ZWRWYWx1ZXMpKSB7IHJldHVybiBKc29uVmFsaWRhdG9ycy5udWxsVmFsaWRhdG9yOyB9XHJcbiAgICByZXR1cm4gKGNvbnRyb2w6IEFic3RyYWN0Q29udHJvbCwgaW52ZXJ0ID0gZmFsc2UpOiBWYWxpZGF0aW9uRXJyb3JzIHwgbnVsbCA9PiB7XHJcbiAgICAgIGlmIChpc0VtcHR5KGNvbnRyb2wudmFsdWUpKSB7IHJldHVybiBudWxsOyB9XHJcbiAgICAgIGNvbnN0IGN1cnJlbnRWYWx1ZTogYW55ID0gY29udHJvbC52YWx1ZTtcclxuICAgICAgY29uc3QgaXNFcXVhbFZhbCA9IChlbnVtVmFsdWUsIGlucHV0VmFsdWUpID0+XHJcbiAgICAgICAgZW51bVZhbHVlID09PSBpbnB1dFZhbHVlIHx8XHJcbiAgICAgICAgKGlzTnVtYmVyKGVudW1WYWx1ZSkgJiYgK2lucHV0VmFsdWUgPT09ICtlbnVtVmFsdWUpIHx8XHJcbiAgICAgICAgKGlzQm9vbGVhbihlbnVtVmFsdWUsICdzdHJpY3QnKSAmJlxyXG4gICAgICAgICAgdG9KYXZhU2NyaXB0VHlwZShpbnB1dFZhbHVlLCAnYm9vbGVhbicpID09PSBlbnVtVmFsdWUpIHx8XHJcbiAgICAgICAgKGVudW1WYWx1ZSA9PT0gbnVsbCAmJiAhaGFzVmFsdWUoaW5wdXRWYWx1ZSkpIHx8XHJcbiAgICAgICAgaXNFcXVhbChlbnVtVmFsdWUsIGlucHV0VmFsdWUpO1xyXG4gICAgICBjb25zdCBpc1ZhbGlkID0gaXNBcnJheShjdXJyZW50VmFsdWUpID9cclxuICAgICAgICBjdXJyZW50VmFsdWUuZXZlcnkoaW5wdXRWYWx1ZSA9PiBhbGxvd2VkVmFsdWVzLnNvbWUoZW51bVZhbHVlID0+XHJcbiAgICAgICAgICBpc0VxdWFsVmFsKGVudW1WYWx1ZSwgaW5wdXRWYWx1ZSlcclxuICAgICAgICApKSA6XHJcbiAgICAgICAgYWxsb3dlZFZhbHVlcy5zb21lKGVudW1WYWx1ZSA9PiBpc0VxdWFsVmFsKGVudW1WYWx1ZSwgY3VycmVudFZhbHVlKSk7XHJcbiAgICAgIHJldHVybiB4b3IoaXNWYWxpZCwgaW52ZXJ0KSA/XHJcbiAgICAgICAgbnVsbCA6IHsgJ2VudW0nOiB7IGFsbG93ZWRWYWx1ZXMsIGN1cnJlbnRWYWx1ZSB9IH07XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogJ2NvbnN0JyB2YWxpZGF0b3JcclxuICAgKlxyXG4gICAqIFJlcXVpcmVzIGEgY29udHJvbCB0byBoYXZlIGEgc3BlY2lmaWMgdmFsdWUuXHJcbiAgICpcclxuICAgKiBDb252ZXJ0cyB0eXBlcyBhcyBuZWVkZWQgdG8gYWxsb3cgc3RyaW5nIGlucHV0cyB0byBzdGlsbCBjb3JyZWN0bHlcclxuICAgKiBtYXRjaCBudW1iZXIsIGJvb2xlYW4sIGFuZCBudWxsIHZhbHVlcy5cclxuICAgKlxyXG4gICAqIFRPRE86IG1vZGlmeSB0byB3b3JrIHdpdGggb2JqZWN0c1xyXG4gICAqXHJcbiAgICogLy8ge2FueVtdfSByZXF1aXJlZFZhbHVlIC0gcmVxdWlyZWQgdmFsdWVcclxuICAgKiAvLyB7SVZhbGlkYXRvckZufVxyXG4gICAqL1xyXG4gIHN0YXRpYyBjb25zdChyZXF1aXJlZFZhbHVlOiBhbnkpOiBJVmFsaWRhdG9yRm4ge1xyXG4gICAgaWYgKCFoYXNWYWx1ZShyZXF1aXJlZFZhbHVlKSkgeyByZXR1cm4gSnNvblZhbGlkYXRvcnMubnVsbFZhbGlkYXRvcjsgfVxyXG4gICAgcmV0dXJuIChjb250cm9sOiBBYnN0cmFjdENvbnRyb2wsIGludmVydCA9IGZhbHNlKTogVmFsaWRhdGlvbkVycm9ycyB8IG51bGwgPT4ge1xyXG4gICAgICBpZiAoaXNFbXB0eShjb250cm9sLnZhbHVlKSkgeyByZXR1cm4gbnVsbDsgfVxyXG4gICAgICBjb25zdCBjdXJyZW50VmFsdWU6IGFueSA9IGNvbnRyb2wudmFsdWU7XHJcbiAgICAgIGNvbnN0IGlzRXF1YWxWYWwgPSAoY29uc3RWYWx1ZSwgaW5wdXRWYWx1ZSkgPT5cclxuICAgICAgICBjb25zdFZhbHVlID09PSBpbnB1dFZhbHVlIHx8XHJcbiAgICAgICAgaXNOdW1iZXIoY29uc3RWYWx1ZSkgJiYgK2lucHV0VmFsdWUgPT09ICtjb25zdFZhbHVlIHx8XHJcbiAgICAgICAgaXNCb29sZWFuKGNvbnN0VmFsdWUsICdzdHJpY3QnKSAmJlxyXG4gICAgICAgIHRvSmF2YVNjcmlwdFR5cGUoaW5wdXRWYWx1ZSwgJ2Jvb2xlYW4nKSA9PT0gY29uc3RWYWx1ZSB8fFxyXG4gICAgICAgIGNvbnN0VmFsdWUgPT09IG51bGwgJiYgIWhhc1ZhbHVlKGlucHV0VmFsdWUpO1xyXG4gICAgICBjb25zdCBpc1ZhbGlkID0gaXNFcXVhbFZhbChyZXF1aXJlZFZhbHVlLCBjdXJyZW50VmFsdWUpO1xyXG4gICAgICByZXR1cm4geG9yKGlzVmFsaWQsIGludmVydCkgP1xyXG4gICAgICAgIG51bGwgOiB7ICdjb25zdCc6IHsgcmVxdWlyZWRWYWx1ZSwgY3VycmVudFZhbHVlIH0gfTtcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiAnbWluTGVuZ3RoJyB2YWxpZGF0b3JcclxuICAgKlxyXG4gICAqIFJlcXVpcmVzIGEgY29udHJvbCdzIHRleHQgdmFsdWUgdG8gYmUgZ3JlYXRlciB0aGFuIGEgc3BlY2lmaWVkIGxlbmd0aC5cclxuICAgKlxyXG4gICAqIC8vIHtudW1iZXJ9IG1pbmltdW1MZW5ndGggLSBtaW5pbXVtIGFsbG93ZWQgc3RyaW5nIGxlbmd0aFxyXG4gICAqIC8vIHtib29sZWFuID0gZmFsc2V9IGludmVydCAtIGluc3RlYWQgcmV0dXJuIGVycm9yIG9iamVjdCBvbmx5IGlmIHZhbGlkXHJcbiAgICogLy8ge0lWYWxpZGF0b3JGbn1cclxuICAgKi9cclxuICBzdGF0aWMgbWluTGVuZ3RoKG1pbmltdW1MZW5ndGg6IG51bWJlcik6IElWYWxpZGF0b3JGbiB7XHJcbiAgICBpZiAoIWhhc1ZhbHVlKG1pbmltdW1MZW5ndGgpKSB7IHJldHVybiBKc29uVmFsaWRhdG9ycy5udWxsVmFsaWRhdG9yOyB9XHJcbiAgICByZXR1cm4gKGNvbnRyb2w6IEFic3RyYWN0Q29udHJvbCwgaW52ZXJ0ID0gZmFsc2UpOiBWYWxpZGF0aW9uRXJyb3JzIHwgbnVsbCA9PiB7XHJcbiAgICAgIGlmIChpc0VtcHR5KGNvbnRyb2wudmFsdWUpKSB7IHJldHVybiBudWxsOyB9XHJcbiAgICAgIGNvbnN0IGN1cnJlbnRMZW5ndGggPSBpc1N0cmluZyhjb250cm9sLnZhbHVlKSA/IGNvbnRyb2wudmFsdWUubGVuZ3RoIDogMDtcclxuICAgICAgY29uc3QgaXNWYWxpZCA9IGN1cnJlbnRMZW5ndGggPj0gbWluaW11bUxlbmd0aDtcclxuICAgICAgcmV0dXJuIHhvcihpc1ZhbGlkLCBpbnZlcnQpID9cclxuICAgICAgICBudWxsIDogeyAnbWluTGVuZ3RoJzogeyBtaW5pbXVtTGVuZ3RoLCBjdXJyZW50TGVuZ3RoIH0gfTtcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiAnbWF4TGVuZ3RoJyB2YWxpZGF0b3JcclxuICAgKlxyXG4gICAqIFJlcXVpcmVzIGEgY29udHJvbCdzIHRleHQgdmFsdWUgdG8gYmUgbGVzcyB0aGFuIGEgc3BlY2lmaWVkIGxlbmd0aC5cclxuICAgKlxyXG4gICAqIC8vIHtudW1iZXJ9IG1heGltdW1MZW5ndGggLSBtYXhpbXVtIGFsbG93ZWQgc3RyaW5nIGxlbmd0aFxyXG4gICAqIC8vIHtib29sZWFuID0gZmFsc2V9IGludmVydCAtIGluc3RlYWQgcmV0dXJuIGVycm9yIG9iamVjdCBvbmx5IGlmIHZhbGlkXHJcbiAgICogLy8ge0lWYWxpZGF0b3JGbn1cclxuICAgKi9cclxuICBzdGF0aWMgbWF4TGVuZ3RoKG1heGltdW1MZW5ndGg6IG51bWJlcik6IElWYWxpZGF0b3JGbiB7XHJcbiAgICBpZiAoIWhhc1ZhbHVlKG1heGltdW1MZW5ndGgpKSB7IHJldHVybiBKc29uVmFsaWRhdG9ycy5udWxsVmFsaWRhdG9yOyB9XHJcbiAgICByZXR1cm4gKGNvbnRyb2w6IEFic3RyYWN0Q29udHJvbCwgaW52ZXJ0ID0gZmFsc2UpOiBWYWxpZGF0aW9uRXJyb3JzIHwgbnVsbCA9PiB7XHJcbiAgICAgIGNvbnN0IGN1cnJlbnRMZW5ndGggPSBpc1N0cmluZyhjb250cm9sLnZhbHVlKSA/IGNvbnRyb2wudmFsdWUubGVuZ3RoIDogMDtcclxuICAgICAgY29uc3QgaXNWYWxpZCA9IGN1cnJlbnRMZW5ndGggPD0gbWF4aW11bUxlbmd0aDtcclxuICAgICAgcmV0dXJuIHhvcihpc1ZhbGlkLCBpbnZlcnQpID9cclxuICAgICAgICBudWxsIDogeyAnbWF4TGVuZ3RoJzogeyBtYXhpbXVtTGVuZ3RoLCBjdXJyZW50TGVuZ3RoIH0gfTtcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiAncGF0dGVybicgdmFsaWRhdG9yXHJcbiAgICpcclxuICAgKiBOb3RlOiBOT1QgdGhlIHNhbWUgYXMgQW5ndWxhcidzIGRlZmF1bHQgcGF0dGVybiB2YWxpZGF0b3IuXHJcbiAgICpcclxuICAgKiBSZXF1aXJlcyBhIGNvbnRyb2wncyB2YWx1ZSB0byBtYXRjaCBhIHNwZWNpZmllZCByZWd1bGFyIGV4cHJlc3Npb24gcGF0dGVybi5cclxuICAgKlxyXG4gICAqIFRoaXMgdmFsaWRhdG9yIGNoYW5nZXMgdGhlIGJlaGF2aW9yIG9mIGRlZmF1bHQgcGF0dGVybiB2YWxpZGF0b3JcclxuICAgKiBieSByZXBsYWNpbmcgUmVnRXhwKGBeJHtwYXR0ZXJufSRgKSB3aXRoIFJlZ0V4cChgJHtwYXR0ZXJufWApLFxyXG4gICAqIHdoaWNoIGFsbG93cyBmb3IgcGFydGlhbCBtYXRjaGVzLlxyXG4gICAqXHJcbiAgICogVG8gcmV0dXJuIHRvIHRoZSBkZWZhdWx0IGZ1bmNpdG9uYWxpdHksIGFuZCBtYXRjaCB0aGUgZW50aXJlIHN0cmluZyxcclxuICAgKiBwYXNzIFRSVUUgYXMgdGhlIG9wdGlvbmFsIHNlY29uZCBwYXJhbWV0ZXIuXHJcbiAgICpcclxuICAgKiAvLyB7c3RyaW5nfSBwYXR0ZXJuIC0gcmVndWxhciBleHByZXNzaW9uIHBhdHRlcm5cclxuICAgKiAvLyB7Ym9vbGVhbiA9IGZhbHNlfSB3aG9sZVN0cmluZyAtIG1hdGNoIHdob2xlIHZhbHVlIHN0cmluZz9cclxuICAgKiAvLyB7SVZhbGlkYXRvckZufVxyXG4gICAqL1xyXG4gIHN0YXRpYyBwYXR0ZXJuKHBhdHRlcm46IHN0cmluZyB8IFJlZ0V4cCwgd2hvbGVTdHJpbmcgPSBmYWxzZSk6IElWYWxpZGF0b3JGbiB7XHJcbiAgICBpZiAoIWhhc1ZhbHVlKHBhdHRlcm4pKSB7IHJldHVybiBKc29uVmFsaWRhdG9ycy5udWxsVmFsaWRhdG9yOyB9XHJcbiAgICByZXR1cm4gKGNvbnRyb2w6IEFic3RyYWN0Q29udHJvbCwgaW52ZXJ0ID0gZmFsc2UpOiBWYWxpZGF0aW9uRXJyb3JzIHwgbnVsbCA9PiB7XHJcbiAgICAgIGlmIChpc0VtcHR5KGNvbnRyb2wudmFsdWUpKSB7IHJldHVybiBudWxsOyB9XHJcbiAgICAgIGxldCByZWdleDogUmVnRXhwO1xyXG4gICAgICBsZXQgcmVxdWlyZWRQYXR0ZXJuOiBzdHJpbmc7XHJcbiAgICAgIGlmICh0eXBlb2YgcGF0dGVybiA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICByZXF1aXJlZFBhdHRlcm4gPSAod2hvbGVTdHJpbmcpID8gYF4ke3BhdHRlcm59JGAgOiBwYXR0ZXJuO1xyXG4gICAgICAgIHJlZ2V4ID0gbmV3IFJlZ0V4cChyZXF1aXJlZFBhdHRlcm4pO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJlcXVpcmVkUGF0dGVybiA9IHBhdHRlcm4udG9TdHJpbmcoKTtcclxuICAgICAgICByZWdleCA9IHBhdHRlcm47XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgY3VycmVudFZhbHVlOiBzdHJpbmcgPSBjb250cm9sLnZhbHVlO1xyXG4gICAgICBjb25zdCBpc1ZhbGlkID0gaXNTdHJpbmcoY3VycmVudFZhbHVlKSA/IHJlZ2V4LnRlc3QoY3VycmVudFZhbHVlKSA6IGZhbHNlO1xyXG4gICAgICByZXR1cm4geG9yKGlzVmFsaWQsIGludmVydCkgP1xyXG4gICAgICAgIG51bGwgOiB7ICdwYXR0ZXJuJzogeyByZXF1aXJlZFBhdHRlcm4sIGN1cnJlbnRWYWx1ZSB9IH07XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogJ2Zvcm1hdCcgdmFsaWRhdG9yXHJcbiAgICpcclxuICAgKiBSZXF1aXJlcyBhIGNvbnRyb2wgdG8gaGF2ZSBhIHZhbHVlIG9mIGEgY2VydGFpbiBmb3JtYXQuXHJcbiAgICpcclxuICAgKiBUaGlzIHZhbGlkYXRvciBjdXJyZW50bHkgY2hlY2tzIHRoZSBmb2xsb3dpbmcgZm9ybXN0czpcclxuICAgKiAgIGRhdGUsIHRpbWUsIGRhdGUtdGltZSwgZW1haWwsIGhvc3RuYW1lLCBpcHY0LCBpcHY2LFxyXG4gICAqICAgdXJpLCB1cmktcmVmZXJlbmNlLCB1cmktdGVtcGxhdGUsIHVybCwgdXVpZCwgY29sb3IsXHJcbiAgICogICBqc29uLXBvaW50ZXIsIHJlbGF0aXZlLWpzb24tcG9pbnRlciwgcmVnZXhcclxuICAgKlxyXG4gICAqIEZhc3QgZm9ybWF0IHJlZ3VsYXIgZXhwcmVzc2lvbnMgY29waWVkIGZyb20gQUpWOlxyXG4gICAqIGh0dHBzOi8vZ2l0aHViLmNvbS9lcG9iZXJlemtpbi9hanYvYmxvYi9tYXN0ZXIvbGliL2NvbXBpbGUvZm9ybWF0cy5qc1xyXG4gICAqXHJcbiAgICogLy8ge0pzb25TY2hlbWFGb3JtYXROYW1lc30gcmVxdWlyZWRGb3JtYXQgLSBmb3JtYXQgdG8gY2hlY2tcclxuICAgKiAvLyB7SVZhbGlkYXRvckZufVxyXG4gICAqL1xyXG4gIHN0YXRpYyBmb3JtYXQocmVxdWlyZWRGb3JtYXQ6IEpzb25TY2hlbWFGb3JtYXROYW1lcyk6IElWYWxpZGF0b3JGbiB7XHJcbiAgICBpZiAoIWhhc1ZhbHVlKHJlcXVpcmVkRm9ybWF0KSkgeyByZXR1cm4gSnNvblZhbGlkYXRvcnMubnVsbFZhbGlkYXRvcjsgfVxyXG4gICAgcmV0dXJuIChjb250cm9sOiBBYnN0cmFjdENvbnRyb2wsIGludmVydCA9IGZhbHNlKTogVmFsaWRhdGlvbkVycm9ycyB8IG51bGwgPT4ge1xyXG4gICAgICBpZiAoaXNFbXB0eShjb250cm9sLnZhbHVlKSkgeyByZXR1cm4gbnVsbDsgfVxyXG4gICAgICBsZXQgaXNWYWxpZDogYm9vbGVhbjtcclxuICAgICAgY29uc3QgY3VycmVudFZhbHVlOiBzdHJpbmcgfCBEYXRlID0gY29udHJvbC52YWx1ZTtcclxuICAgICAgaWYgKGlzU3RyaW5nKGN1cnJlbnRWYWx1ZSkpIHtcclxuICAgICAgICBjb25zdCBmb3JtYXRUZXN0OiBGdW5jdGlvbiB8IFJlZ0V4cCA9IGpzb25TY2hlbWFGb3JtYXRUZXN0c1tyZXF1aXJlZEZvcm1hdF07XHJcbiAgICAgICAgaWYgKHR5cGVvZiBmb3JtYXRUZXN0ID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgaXNWYWxpZCA9ICg8UmVnRXhwPmZvcm1hdFRlc3QpLnRlc3QoPHN0cmluZz5jdXJyZW50VmFsdWUpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGZvcm1hdFRlc3QgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgIGlzVmFsaWQgPSAoPEZ1bmN0aW9uPmZvcm1hdFRlc3QpKDxzdHJpbmc+Y3VycmVudFZhbHVlKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY29uc29sZS5lcnJvcihgZm9ybWF0IHZhbGlkYXRvciBlcnJvcjogXCIke3JlcXVpcmVkRm9ybWF0fVwiIGlzIG5vdCBhIHJlY29nbml6ZWQgZm9ybWF0LmApO1xyXG4gICAgICAgICAgaXNWYWxpZCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIEFsbG93IEphdmFTY3JpcHQgRGF0ZSBvYmplY3RzXHJcbiAgICAgICAgaXNWYWxpZCA9IFsnZGF0ZScsICd0aW1lJywgJ2RhdGUtdGltZSddLmluY2x1ZGVzKHJlcXVpcmVkRm9ybWF0KSAmJlxyXG4gICAgICAgICAgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGN1cnJlbnRWYWx1ZSkgPT09ICdbb2JqZWN0IERhdGVdJztcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4geG9yKGlzVmFsaWQsIGludmVydCkgP1xyXG4gICAgICAgIG51bGwgOiB7ICdmb3JtYXQnOiB7IHJlcXVpcmVkRm9ybWF0LCBjdXJyZW50VmFsdWUgfSB9O1xyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqICdtaW5pbXVtJyB2YWxpZGF0b3JcclxuICAgKlxyXG4gICAqIFJlcXVpcmVzIGEgY29udHJvbCdzIG51bWVyaWMgdmFsdWUgdG8gYmUgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvXHJcbiAgICogYSBtaW5pbXVtIGFtb3VudC5cclxuICAgKlxyXG4gICAqIEFueSBub24tbnVtZXJpYyB2YWx1ZSBpcyBhbHNvIHZhbGlkIChhY2NvcmRpbmcgdG8gdGhlIEhUTUwgZm9ybXMgc3BlYyxcclxuICAgKiBhIG5vbi1udW1lcmljIHZhbHVlIGRvZXNuJ3QgaGF2ZSBhIG1pbmltdW0pLlxyXG4gICAqIGh0dHBzOi8vd3d3LnczLm9yZy9UUi9odG1sNS9mb3Jtcy5odG1sI2F0dHItaW5wdXQtbWF4XHJcbiAgICpcclxuICAgKiAvLyB7bnVtYmVyfSBtaW5pbXVtIC0gbWluaW11bSBhbGxvd2VkIHZhbHVlXHJcbiAgICogLy8ge0lWYWxpZGF0b3JGbn1cclxuICAgKi9cclxuICBzdGF0aWMgbWluaW11bShtaW5pbXVtVmFsdWU6IG51bWJlcik6IElWYWxpZGF0b3JGbiB7XHJcbiAgICBpZiAoIWhhc1ZhbHVlKG1pbmltdW1WYWx1ZSkpIHsgcmV0dXJuIEpzb25WYWxpZGF0b3JzLm51bGxWYWxpZGF0b3I7IH1cclxuICAgIHJldHVybiAoY29udHJvbDogQWJzdHJhY3RDb250cm9sLCBpbnZlcnQgPSBmYWxzZSk6IFZhbGlkYXRpb25FcnJvcnMgfCBudWxsID0+IHtcclxuICAgICAgaWYgKGlzRW1wdHkoY29udHJvbC52YWx1ZSkpIHsgcmV0dXJuIG51bGw7IH1cclxuICAgICAgY29uc3QgY3VycmVudFZhbHVlID0gY29udHJvbC52YWx1ZTtcclxuICAgICAgY29uc3QgaXNWYWxpZCA9ICFpc051bWJlcihjdXJyZW50VmFsdWUpIHx8IGN1cnJlbnRWYWx1ZSA+PSBtaW5pbXVtVmFsdWU7XHJcbiAgICAgIHJldHVybiB4b3IoaXNWYWxpZCwgaW52ZXJ0KSA/XHJcbiAgICAgICAgbnVsbCA6IHsgJ21pbmltdW0nOiB7IG1pbmltdW1WYWx1ZSwgY3VycmVudFZhbHVlIH0gfTtcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiAnZXhjbHVzaXZlTWluaW11bScgdmFsaWRhdG9yXHJcbiAgICpcclxuICAgKiBSZXF1aXJlcyBhIGNvbnRyb2wncyBudW1lcmljIHZhbHVlIHRvIGJlIGxlc3MgdGhhbiBhIG1heGltdW0gYW1vdW50LlxyXG4gICAqXHJcbiAgICogQW55IG5vbi1udW1lcmljIHZhbHVlIGlzIGFsc28gdmFsaWQgKGFjY29yZGluZyB0byB0aGUgSFRNTCBmb3JtcyBzcGVjLFxyXG4gICAqIGEgbm9uLW51bWVyaWMgdmFsdWUgZG9lc24ndCBoYXZlIGEgbWF4aW11bSkuXHJcbiAgICogaHR0cHM6Ly93d3cudzMub3JnL1RSL2h0bWw1L2Zvcm1zLmh0bWwjYXR0ci1pbnB1dC1tYXhcclxuICAgKlxyXG4gICAqIC8vIHtudW1iZXJ9IGV4Y2x1c2l2ZU1pbmltdW1WYWx1ZSAtIG1heGltdW0gYWxsb3dlZCB2YWx1ZVxyXG4gICAqIC8vIHtJVmFsaWRhdG9yRm59XHJcbiAgICovXHJcbiAgc3RhdGljIGV4Y2x1c2l2ZU1pbmltdW0oZXhjbHVzaXZlTWluaW11bVZhbHVlOiBudW1iZXIpOiBJVmFsaWRhdG9yRm4ge1xyXG4gICAgaWYgKCFoYXNWYWx1ZShleGNsdXNpdmVNaW5pbXVtVmFsdWUpKSB7IHJldHVybiBKc29uVmFsaWRhdG9ycy5udWxsVmFsaWRhdG9yOyB9XHJcbiAgICByZXR1cm4gKGNvbnRyb2w6IEFic3RyYWN0Q29udHJvbCwgaW52ZXJ0ID0gZmFsc2UpOiBWYWxpZGF0aW9uRXJyb3JzIHwgbnVsbCA9PiB7XHJcbiAgICAgIGlmIChpc0VtcHR5KGNvbnRyb2wudmFsdWUpKSB7IHJldHVybiBudWxsOyB9XHJcbiAgICAgIGNvbnN0IGN1cnJlbnRWYWx1ZSA9IGNvbnRyb2wudmFsdWU7XHJcbiAgICAgIGNvbnN0IGlzVmFsaWQgPSAhaXNOdW1iZXIoY3VycmVudFZhbHVlKSB8fCArY3VycmVudFZhbHVlIDwgZXhjbHVzaXZlTWluaW11bVZhbHVlO1xyXG4gICAgICByZXR1cm4geG9yKGlzVmFsaWQsIGludmVydCkgP1xyXG4gICAgICAgIG51bGwgOiB7ICdleGNsdXNpdmVNaW5pbXVtJzogeyBleGNsdXNpdmVNaW5pbXVtVmFsdWUsIGN1cnJlbnRWYWx1ZSB9IH07XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogJ21heGltdW0nIHZhbGlkYXRvclxyXG4gICAqXHJcbiAgICogUmVxdWlyZXMgYSBjb250cm9sJ3MgbnVtZXJpYyB2YWx1ZSB0byBiZSBsZXNzIHRoYW4gb3IgZXF1YWwgdG9cclxuICAgKiBhIG1heGltdW0gYW1vdW50LlxyXG4gICAqXHJcbiAgICogQW55IG5vbi1udW1lcmljIHZhbHVlIGlzIGFsc28gdmFsaWQgKGFjY29yZGluZyB0byB0aGUgSFRNTCBmb3JtcyBzcGVjLFxyXG4gICAqIGEgbm9uLW51bWVyaWMgdmFsdWUgZG9lc24ndCBoYXZlIGEgbWF4aW11bSkuXHJcbiAgICogaHR0cHM6Ly93d3cudzMub3JnL1RSL2h0bWw1L2Zvcm1zLmh0bWwjYXR0ci1pbnB1dC1tYXhcclxuICAgKlxyXG4gICAqIC8vIHtudW1iZXJ9IG1heGltdW1WYWx1ZSAtIG1heGltdW0gYWxsb3dlZCB2YWx1ZVxyXG4gICAqIC8vIHtJVmFsaWRhdG9yRm59XHJcbiAgICovXHJcbiAgc3RhdGljIG1heGltdW0obWF4aW11bVZhbHVlOiBudW1iZXIpOiBJVmFsaWRhdG9yRm4ge1xyXG4gICAgaWYgKCFoYXNWYWx1ZShtYXhpbXVtVmFsdWUpKSB7IHJldHVybiBKc29uVmFsaWRhdG9ycy5udWxsVmFsaWRhdG9yOyB9XHJcbiAgICByZXR1cm4gKGNvbnRyb2w6IEFic3RyYWN0Q29udHJvbCwgaW52ZXJ0ID0gZmFsc2UpOiBWYWxpZGF0aW9uRXJyb3JzIHwgbnVsbCA9PiB7XHJcbiAgICAgIGlmIChpc0VtcHR5KGNvbnRyb2wudmFsdWUpKSB7IHJldHVybiBudWxsOyB9XHJcbiAgICAgIGNvbnN0IGN1cnJlbnRWYWx1ZSA9IGNvbnRyb2wudmFsdWU7XHJcbiAgICAgIGNvbnN0IGlzVmFsaWQgPSAhaXNOdW1iZXIoY3VycmVudFZhbHVlKSB8fCArY3VycmVudFZhbHVlIDw9IG1heGltdW1WYWx1ZTtcclxuICAgICAgcmV0dXJuIHhvcihpc1ZhbGlkLCBpbnZlcnQpID9cclxuICAgICAgICBudWxsIDogeyAnbWF4aW11bSc6IHsgbWF4aW11bVZhbHVlLCBjdXJyZW50VmFsdWUgfSB9O1xyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqICdleGNsdXNpdmVNYXhpbXVtJyB2YWxpZGF0b3JcclxuICAgKlxyXG4gICAqIFJlcXVpcmVzIGEgY29udHJvbCdzIG51bWVyaWMgdmFsdWUgdG8gYmUgbGVzcyB0aGFuIGEgbWF4aW11bSBhbW91bnQuXHJcbiAgICpcclxuICAgKiBBbnkgbm9uLW51bWVyaWMgdmFsdWUgaXMgYWxzbyB2YWxpZCAoYWNjb3JkaW5nIHRvIHRoZSBIVE1MIGZvcm1zIHNwZWMsXHJcbiAgICogYSBub24tbnVtZXJpYyB2YWx1ZSBkb2Vzbid0IGhhdmUgYSBtYXhpbXVtKS5cclxuICAgKiBodHRwczovL3d3dy53My5vcmcvVFIvaHRtbDUvZm9ybXMuaHRtbCNhdHRyLWlucHV0LW1heFxyXG4gICAqXHJcbiAgICogLy8ge251bWJlcn0gZXhjbHVzaXZlTWF4aW11bVZhbHVlIC0gbWF4aW11bSBhbGxvd2VkIHZhbHVlXHJcbiAgICogLy8ge0lWYWxpZGF0b3JGbn1cclxuICAgKi9cclxuICBzdGF0aWMgZXhjbHVzaXZlTWF4aW11bShleGNsdXNpdmVNYXhpbXVtVmFsdWU6IG51bWJlcik6IElWYWxpZGF0b3JGbiB7XHJcbiAgICBpZiAoIWhhc1ZhbHVlKGV4Y2x1c2l2ZU1heGltdW1WYWx1ZSkpIHsgcmV0dXJuIEpzb25WYWxpZGF0b3JzLm51bGxWYWxpZGF0b3I7IH1cclxuICAgIHJldHVybiAoY29udHJvbDogQWJzdHJhY3RDb250cm9sLCBpbnZlcnQgPSBmYWxzZSk6IFZhbGlkYXRpb25FcnJvcnMgfCBudWxsID0+IHtcclxuICAgICAgaWYgKGlzRW1wdHkoY29udHJvbC52YWx1ZSkpIHsgcmV0dXJuIG51bGw7IH1cclxuICAgICAgY29uc3QgY3VycmVudFZhbHVlID0gY29udHJvbC52YWx1ZTtcclxuICAgICAgY29uc3QgaXNWYWxpZCA9ICFpc051bWJlcihjdXJyZW50VmFsdWUpIHx8ICtjdXJyZW50VmFsdWUgPCBleGNsdXNpdmVNYXhpbXVtVmFsdWU7XHJcbiAgICAgIHJldHVybiB4b3IoaXNWYWxpZCwgaW52ZXJ0KSA/XHJcbiAgICAgICAgbnVsbCA6IHsgJ2V4Y2x1c2l2ZU1heGltdW0nOiB7IGV4Y2x1c2l2ZU1heGltdW1WYWx1ZSwgY3VycmVudFZhbHVlIH0gfTtcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiAnbXVsdGlwbGVPZicgdmFsaWRhdG9yXHJcbiAgICpcclxuICAgKiBSZXF1aXJlcyBhIGNvbnRyb2wgdG8gaGF2ZSBhIG51bWVyaWMgdmFsdWUgdGhhdCBpcyBhIG11bHRpcGxlXHJcbiAgICogb2YgYSBzcGVjaWZpZWQgbnVtYmVyLlxyXG4gICAqXHJcbiAgICogLy8ge251bWJlcn0gbXVsdGlwbGVPZlZhbHVlIC0gbnVtYmVyIHZhbHVlIG11c3QgYmUgYSBtdWx0aXBsZSBvZlxyXG4gICAqIC8vIHtJVmFsaWRhdG9yRm59XHJcbiAgICovXHJcbiAgc3RhdGljIG11bHRpcGxlT2YobXVsdGlwbGVPZlZhbHVlOiBudW1iZXIpOiBJVmFsaWRhdG9yRm4ge1xyXG4gICAgaWYgKCFoYXNWYWx1ZShtdWx0aXBsZU9mVmFsdWUpKSB7IHJldHVybiBKc29uVmFsaWRhdG9ycy5udWxsVmFsaWRhdG9yOyB9XHJcbiAgICByZXR1cm4gKGNvbnRyb2w6IEFic3RyYWN0Q29udHJvbCwgaW52ZXJ0ID0gZmFsc2UpOiBWYWxpZGF0aW9uRXJyb3JzIHwgbnVsbCA9PiB7XHJcbiAgICAgIGlmIChpc0VtcHR5KGNvbnRyb2wudmFsdWUpKSB7IHJldHVybiBudWxsOyB9XHJcbiAgICAgIGNvbnN0IGN1cnJlbnRWYWx1ZSA9IChjb250cm9sLnZhbHVlIHx8ICcnKS50b1N0cmluZygpLnJlcGxhY2UoJywnLCAnLicpO1xyXG4gICAgICBjb25zdCBwYXJzZWRNdWx0aXBsZU9mVmFsdWUgPSAoY29udHJvbC52YWx1ZSB8fCAnJykudG9TdHJpbmcoKS5yZXBsYWNlKCcsJywgJy4nKTtcclxuXHJcbiAgICAgIGNvbnN0IGxlbmd0aEFmdGVyQ29tYU9mQ3VycmVudFZhbHVlID0gKGN1cnJlbnRWYWx1ZS50b1N0cmluZygpLnNwbGl0KCcuJylbMV0gfHwgJycpLmxlbmd0aDtcclxuXHJcbiAgICAgIGNvbnN0IGxlbmd0aEFmdGVyQ29tYU9mTXVsdGlwbGVPZlZhbHVlXHJcbiAgICAgICAgPSAocGFyc2VkTXVsdGlwbGVPZlZhbHVlLnRvU3RyaW5nKCkuc3BsaXQoJy4nKVsxXSB8fCAnJykubGVuZ3RoO1xyXG4gICAgICBjb25zdCBtYXhEZWNpbWFsUG9pbnRcclxuICAgICAgICA9IE1hdGgubWF4KGxlbmd0aEFmdGVyQ29tYU9mQ3VycmVudFZhbHVlLCBsZW5ndGhBZnRlckNvbWFPZk11bHRpcGxlT2ZWYWx1ZSk7XHJcblxyXG4gICAgICBjb25zdCBmaXhlZE11bHRpcGxlT2ZWYWx1ZSA9IG11bHRpcGxlT2ZWYWx1ZSAqIE1hdGgucG93KDEwLCBtYXhEZWNpbWFsUG9pbnQpO1xyXG4gICAgICBjb25zdCBmaXhlZEN1cnJlbnRWYWx1ZSA9IGN1cnJlbnRWYWx1ZSAqIE1hdGgucG93KDEwLCBtYXhEZWNpbWFsUG9pbnQpO1xyXG5cclxuICAgICAgY29uc3QgaXNWYWxpZCA9IGlzTnVtYmVyKGN1cnJlbnRWYWx1ZSkgJiZcclxuICAgICAgICBmaXhlZEN1cnJlbnRWYWx1ZSAlIGZpeGVkTXVsdGlwbGVPZlZhbHVlID09PSAwO1xyXG4gICAgICByZXR1cm4geG9yKGlzVmFsaWQsIGludmVydCkgP1xyXG4gICAgICAgIG51bGwgOiB7ICdtdWx0aXBsZU9mJzogeyBtdWx0aXBsZU9mVmFsdWUsIGN1cnJlbnRWYWx1ZSB9IH07XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogJ21pblByb3BlcnRpZXMnIHZhbGlkYXRvclxyXG4gICAqXHJcbiAgICogUmVxdWlyZXMgYSBmb3JtIGdyb3VwIHRvIGhhdmUgYSBtaW5pbXVtIG51bWJlciBvZiBwcm9wZXJ0aWVzIChpLmUuIGhhdmVcclxuICAgKiB2YWx1ZXMgZW50ZXJlZCBpbiBhIG1pbmltdW0gbnVtYmVyIG9mIGNvbnRyb2xzIHdpdGhpbiB0aGUgZ3JvdXApLlxyXG4gICAqXHJcbiAgICogLy8ge251bWJlcn0gbWluaW11bVByb3BlcnRpZXMgLSBtaW5pbXVtIG51bWJlciBvZiBwcm9wZXJ0aWVzIGFsbG93ZWRcclxuICAgKiAvLyB7SVZhbGlkYXRvckZufVxyXG4gICAqL1xyXG4gIHN0YXRpYyBtaW5Qcm9wZXJ0aWVzKG1pbmltdW1Qcm9wZXJ0aWVzOiBudW1iZXIpOiBJVmFsaWRhdG9yRm4ge1xyXG4gICAgaWYgKCFoYXNWYWx1ZShtaW5pbXVtUHJvcGVydGllcykpIHsgcmV0dXJuIEpzb25WYWxpZGF0b3JzLm51bGxWYWxpZGF0b3I7IH1cclxuICAgIHJldHVybiAoY29udHJvbDogQWJzdHJhY3RDb250cm9sLCBpbnZlcnQgPSBmYWxzZSk6IFZhbGlkYXRpb25FcnJvcnMgfCBudWxsID0+IHtcclxuICAgICAgaWYgKGlzRW1wdHkoY29udHJvbC52YWx1ZSkpIHsgcmV0dXJuIG51bGw7IH1cclxuICAgICAgY29uc3QgY3VycmVudFByb3BlcnRpZXMgPSBPYmplY3Qua2V5cyhjb250cm9sLnZhbHVlKS5sZW5ndGggfHwgMDtcclxuICAgICAgY29uc3QgaXNWYWxpZCA9IGN1cnJlbnRQcm9wZXJ0aWVzID49IG1pbmltdW1Qcm9wZXJ0aWVzO1xyXG4gICAgICByZXR1cm4geG9yKGlzVmFsaWQsIGludmVydCkgP1xyXG4gICAgICAgIG51bGwgOiB7ICdtaW5Qcm9wZXJ0aWVzJzogeyBtaW5pbXVtUHJvcGVydGllcywgY3VycmVudFByb3BlcnRpZXMgfSB9O1xyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqICdtYXhQcm9wZXJ0aWVzJyB2YWxpZGF0b3JcclxuICAgKlxyXG4gICAqIFJlcXVpcmVzIGEgZm9ybSBncm91cCB0byBoYXZlIGEgbWF4aW11bSBudW1iZXIgb2YgcHJvcGVydGllcyAoaS5lLiBoYXZlXHJcbiAgICogdmFsdWVzIGVudGVyZWQgaW4gYSBtYXhpbXVtIG51bWJlciBvZiBjb250cm9scyB3aXRoaW4gdGhlIGdyb3VwKS5cclxuICAgKlxyXG4gICAqIE5vdGU6IEhhcyBubyBlZmZlY3QgaWYgdGhlIGZvcm0gZ3JvdXAgZG9lcyBub3QgY29udGFpbiBtb3JlIHRoYW4gdGhlXHJcbiAgICogbWF4aW11bSBudW1iZXIgb2YgY29udHJvbHMuXHJcbiAgICpcclxuICAgKiAvLyB7bnVtYmVyfSBtYXhpbXVtUHJvcGVydGllcyAtIG1heGltdW0gbnVtYmVyIG9mIHByb3BlcnRpZXMgYWxsb3dlZFxyXG4gICAqIC8vIHtJVmFsaWRhdG9yRm59XHJcbiAgICovXHJcbiAgc3RhdGljIG1heFByb3BlcnRpZXMobWF4aW11bVByb3BlcnRpZXM6IG51bWJlcik6IElWYWxpZGF0b3JGbiB7XHJcbiAgICBpZiAoIWhhc1ZhbHVlKG1heGltdW1Qcm9wZXJ0aWVzKSkgeyByZXR1cm4gSnNvblZhbGlkYXRvcnMubnVsbFZhbGlkYXRvcjsgfVxyXG4gICAgcmV0dXJuIChjb250cm9sOiBBYnN0cmFjdENvbnRyb2wsIGludmVydCA9IGZhbHNlKTogVmFsaWRhdGlvbkVycm9ycyB8IG51bGwgPT4ge1xyXG4gICAgICBjb25zdCBjdXJyZW50UHJvcGVydGllcyA9IE9iamVjdC5rZXlzKGNvbnRyb2wudmFsdWUpLmxlbmd0aCB8fCAwO1xyXG4gICAgICBjb25zdCBpc1ZhbGlkID0gY3VycmVudFByb3BlcnRpZXMgPD0gbWF4aW11bVByb3BlcnRpZXM7XHJcbiAgICAgIHJldHVybiB4b3IoaXNWYWxpZCwgaW52ZXJ0KSA/XHJcbiAgICAgICAgbnVsbCA6IHsgJ21heFByb3BlcnRpZXMnOiB7IG1heGltdW1Qcm9wZXJ0aWVzLCBjdXJyZW50UHJvcGVydGllcyB9IH07XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogJ2RlcGVuZGVuY2llcycgdmFsaWRhdG9yXHJcbiAgICpcclxuICAgKiBSZXF1aXJlcyB0aGUgY29udHJvbHMgaW4gYSBmb3JtIGdyb3VwIHRvIG1lZXQgYWRkaXRpb25hbCB2YWxpZGF0aW9uXHJcbiAgICogY3JpdGVyaWEsIGRlcGVuZGluZyBvbiB0aGUgdmFsdWVzIG9mIG90aGVyIGNvbnRyb2xzIGluIHRoZSBncm91cC5cclxuICAgKlxyXG4gICAqIEV4YW1wbGVzOlxyXG4gICAqIGh0dHBzOi8vc3BhY2V0ZWxlc2NvcGUuZ2l0aHViLmlvL3VuZGVyc3RhbmRpbmctanNvbi1zY2hlbWEvcmVmZXJlbmNlL29iamVjdC5odG1sI2RlcGVuZGVuY2llc1xyXG4gICAqXHJcbiAgICogLy8ge2FueX0gZGVwZW5kZW5jaWVzIC0gcmVxdWlyZWQgZGVwZW5kZW5jaWVzXHJcbiAgICogLy8ge0lWYWxpZGF0b3JGbn1cclxuICAgKi9cclxuICBzdGF0aWMgZGVwZW5kZW5jaWVzKGRlcGVuZGVuY2llczogYW55KTogSVZhbGlkYXRvckZuIHtcclxuICAgIGlmIChnZXRUeXBlKGRlcGVuZGVuY2llcykgIT09ICdvYmplY3QnIHx8IGlzRW1wdHkoZGVwZW5kZW5jaWVzKSkge1xyXG4gICAgICByZXR1cm4gSnNvblZhbGlkYXRvcnMubnVsbFZhbGlkYXRvcjtcclxuICAgIH1cclxuICAgIHJldHVybiAoY29udHJvbDogQWJzdHJhY3RDb250cm9sLCBpbnZlcnQgPSBmYWxzZSk6IFZhbGlkYXRpb25FcnJvcnMgfCBudWxsID0+IHtcclxuICAgICAgaWYgKGlzRW1wdHkoY29udHJvbC52YWx1ZSkpIHsgcmV0dXJuIG51bGw7IH1cclxuICAgICAgY29uc3QgYWxsRXJyb3JzID0gX21lcmdlT2JqZWN0cyhcclxuICAgICAgICBmb3JFYWNoQ29weShkZXBlbmRlbmNpZXMsICh2YWx1ZSwgcmVxdWlyaW5nRmllbGQpID0+IHtcclxuICAgICAgICAgIGlmICghaGFzVmFsdWUoY29udHJvbC52YWx1ZVtyZXF1aXJpbmdGaWVsZF0pKSB7IHJldHVybiBudWxsOyB9XHJcbiAgICAgICAgICBsZXQgcmVxdWlyaW5nRmllbGRFcnJvcnM6IFZhbGlkYXRpb25FcnJvcnMgPSB7fTtcclxuICAgICAgICAgIGxldCByZXF1aXJlZEZpZWxkczogc3RyaW5nW107XHJcbiAgICAgICAgICBsZXQgcHJvcGVydGllczogVmFsaWRhdGlvbkVycm9ycyA9IHt9O1xyXG4gICAgICAgICAgaWYgKGdldFR5cGUoZGVwZW5kZW5jaWVzW3JlcXVpcmluZ0ZpZWxkXSkgPT09ICdhcnJheScpIHtcclxuICAgICAgICAgICAgcmVxdWlyZWRGaWVsZHMgPSBkZXBlbmRlbmNpZXNbcmVxdWlyaW5nRmllbGRdO1xyXG4gICAgICAgICAgfSBlbHNlIGlmIChnZXRUeXBlKGRlcGVuZGVuY2llc1tyZXF1aXJpbmdGaWVsZF0pID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICByZXF1aXJlZEZpZWxkcyA9IGRlcGVuZGVuY2llc1tyZXF1aXJpbmdGaWVsZF1bJ3JlcXVpcmVkJ10gfHwgW107XHJcbiAgICAgICAgICAgIHByb3BlcnRpZXMgPSBkZXBlbmRlbmNpZXNbcmVxdWlyaW5nRmllbGRdWydwcm9wZXJ0aWVzJ10gfHwge307XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gVmFsaWRhdGUgcHJvcGVydHkgZGVwZW5kZW5jaWVzXHJcbiAgICAgICAgICBmb3IgKGNvbnN0IHJlcXVpcmVkRmllbGQgb2YgcmVxdWlyZWRGaWVsZHMpIHtcclxuICAgICAgICAgICAgaWYgKHhvcighaGFzVmFsdWUoY29udHJvbC52YWx1ZVtyZXF1aXJlZEZpZWxkXSksIGludmVydCkpIHtcclxuICAgICAgICAgICAgICByZXF1aXJpbmdGaWVsZEVycm9yc1tyZXF1aXJlZEZpZWxkXSA9IHsgJ3JlcXVpcmVkJzogdHJ1ZSB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gVmFsaWRhdGUgc2NoZW1hIGRlcGVuZGVuY2llc1xyXG4gICAgICAgICAgcmVxdWlyaW5nRmllbGRFcnJvcnMgPSBfbWVyZ2VPYmplY3RzKHJlcXVpcmluZ0ZpZWxkRXJyb3JzLFxyXG4gICAgICAgICAgICBmb3JFYWNoQ29weShwcm9wZXJ0aWVzLCAocmVxdWlyZW1lbnRzLCByZXF1aXJlZEZpZWxkKSA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc3QgcmVxdWlyZWRGaWVsZEVycm9ycyA9IF9tZXJnZU9iamVjdHMoXHJcbiAgICAgICAgICAgICAgICBmb3JFYWNoQ29weShyZXF1aXJlbWVudHMsIChyZXF1aXJlbWVudCwgcGFyYW1ldGVyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgIGxldCB2YWxpZGF0b3I6IElWYWxpZGF0b3JGbiA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgIGlmIChyZXF1aXJlbWVudCA9PT0gJ21heGltdW0nIHx8IHJlcXVpcmVtZW50ID09PSAnbWluaW11bScpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBleGNsdXNpdmUgPSAhIXJlcXVpcmVtZW50c1snZXhjbHVzaXZlTScgKyByZXF1aXJlbWVudC5zbGljZSgxKV07XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsaWRhdG9yID0gSnNvblZhbGlkYXRvcnNbcmVxdWlyZW1lbnRdKHBhcmFtZXRlciwgZXhjbHVzaXZlKTtcclxuICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgSnNvblZhbGlkYXRvcnNbcmVxdWlyZW1lbnRdID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsaWRhdG9yID0gSnNvblZhbGlkYXRvcnNbcmVxdWlyZW1lbnRdKHBhcmFtZXRlcik7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgcmV0dXJuICFpc0RlZmluZWQodmFsaWRhdG9yKSA/XHJcbiAgICAgICAgICAgICAgICAgICAgbnVsbCA6IHZhbGlkYXRvcihjb250cm9sLnZhbHVlW3JlcXVpcmVkRmllbGRdKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICByZXR1cm4gaXNFbXB0eShyZXF1aXJlZEZpZWxkRXJyb3JzKSA/XHJcbiAgICAgICAgICAgICAgICBudWxsIDogeyBbcmVxdWlyZWRGaWVsZF06IHJlcXVpcmVkRmllbGRFcnJvcnMgfTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgICByZXR1cm4gaXNFbXB0eShyZXF1aXJpbmdGaWVsZEVycm9ycykgP1xyXG4gICAgICAgICAgICBudWxsIDogeyBbcmVxdWlyaW5nRmllbGRdOiByZXF1aXJpbmdGaWVsZEVycm9ycyB9O1xyXG4gICAgICAgIH0pXHJcbiAgICAgICk7XHJcbiAgICAgIHJldHVybiBpc0VtcHR5KGFsbEVycm9ycykgPyBudWxsIDogYWxsRXJyb3JzO1xyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqICdtaW5JdGVtcycgdmFsaWRhdG9yXHJcbiAgICpcclxuICAgKiBSZXF1aXJlcyBhIGZvcm0gYXJyYXkgdG8gaGF2ZSBhIG1pbmltdW0gbnVtYmVyIG9mIHZhbHVlcy5cclxuICAgKlxyXG4gICAqIC8vIHtudW1iZXJ9IG1pbmltdW1JdGVtcyAtIG1pbmltdW0gbnVtYmVyIG9mIGl0ZW1zIGFsbG93ZWRcclxuICAgKiAvLyB7SVZhbGlkYXRvckZufVxyXG4gICAqL1xyXG4gIHN0YXRpYyBtaW5JdGVtcyhtaW5pbXVtSXRlbXM6IG51bWJlcik6IElWYWxpZGF0b3JGbiB7XHJcbiAgICBpZiAoIWhhc1ZhbHVlKG1pbmltdW1JdGVtcykpIHsgcmV0dXJuIEpzb25WYWxpZGF0b3JzLm51bGxWYWxpZGF0b3I7IH1cclxuICAgIHJldHVybiAoY29udHJvbDogQWJzdHJhY3RDb250cm9sLCBpbnZlcnQgPSBmYWxzZSk6IFZhbGlkYXRpb25FcnJvcnMgfCBudWxsID0+IHtcclxuICAgICAgaWYgKGlzRW1wdHkoY29udHJvbC52YWx1ZSkpIHsgcmV0dXJuIG51bGw7IH1cclxuICAgICAgY29uc3QgY3VycmVudEl0ZW1zID0gaXNBcnJheShjb250cm9sLnZhbHVlKSA/IGNvbnRyb2wudmFsdWUubGVuZ3RoIDogMDtcclxuICAgICAgY29uc3QgaXNWYWxpZCA9IGN1cnJlbnRJdGVtcyA+PSBtaW5pbXVtSXRlbXM7XHJcbiAgICAgIHJldHVybiB4b3IoaXNWYWxpZCwgaW52ZXJ0KSA/XHJcbiAgICAgICAgbnVsbCA6IHsgJ21pbkl0ZW1zJzogeyBtaW5pbXVtSXRlbXMsIGN1cnJlbnRJdGVtcyB9IH07XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogJ21heEl0ZW1zJyB2YWxpZGF0b3JcclxuICAgKlxyXG4gICAqIFJlcXVpcmVzIGEgZm9ybSBhcnJheSB0byBoYXZlIGEgbWF4aW11bSBudW1iZXIgb2YgdmFsdWVzLlxyXG4gICAqXHJcbiAgICogLy8ge251bWJlcn0gbWF4aW11bUl0ZW1zIC0gbWF4aW11bSBudW1iZXIgb2YgaXRlbXMgYWxsb3dlZFxyXG4gICAqIC8vIHtJVmFsaWRhdG9yRm59XHJcbiAgICovXHJcbiAgc3RhdGljIG1heEl0ZW1zKG1heGltdW1JdGVtczogbnVtYmVyKTogSVZhbGlkYXRvckZuIHtcclxuICAgIGlmICghaGFzVmFsdWUobWF4aW11bUl0ZW1zKSkgeyByZXR1cm4gSnNvblZhbGlkYXRvcnMubnVsbFZhbGlkYXRvcjsgfVxyXG4gICAgcmV0dXJuIChjb250cm9sOiBBYnN0cmFjdENvbnRyb2wsIGludmVydCA9IGZhbHNlKTogVmFsaWRhdGlvbkVycm9ycyB8IG51bGwgPT4ge1xyXG4gICAgICBjb25zdCBjdXJyZW50SXRlbXMgPSBpc0FycmF5KGNvbnRyb2wudmFsdWUpID8gY29udHJvbC52YWx1ZS5sZW5ndGggOiAwO1xyXG4gICAgICBjb25zdCBpc1ZhbGlkID0gY3VycmVudEl0ZW1zIDw9IG1heGltdW1JdGVtcztcclxuICAgICAgcmV0dXJuIHhvcihpc1ZhbGlkLCBpbnZlcnQpID9cclxuICAgICAgICBudWxsIDogeyAnbWF4SXRlbXMnOiB7IG1heGltdW1JdGVtcywgY3VycmVudEl0ZW1zIH0gfTtcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiAndW5pcXVlSXRlbXMnIHZhbGlkYXRvclxyXG4gICAqXHJcbiAgICogUmVxdWlyZXMgdmFsdWVzIGluIGEgZm9ybSBhcnJheSB0byBiZSB1bmlxdWUuXHJcbiAgICpcclxuICAgKiAvLyB7Ym9vbGVhbiA9IHRydWV9IHVuaXF1ZT8gLSB0cnVlIHRvIHZhbGlkYXRlLCBmYWxzZSB0byBkaXNhYmxlXHJcbiAgICogLy8ge0lWYWxpZGF0b3JGbn1cclxuICAgKi9cclxuICBzdGF0aWMgdW5pcXVlSXRlbXModW5pcXVlID0gdHJ1ZSk6IElWYWxpZGF0b3JGbiB7XHJcbiAgICBpZiAoIXVuaXF1ZSkgeyByZXR1cm4gSnNvblZhbGlkYXRvcnMubnVsbFZhbGlkYXRvcjsgfVxyXG4gICAgcmV0dXJuIChjb250cm9sOiBBYnN0cmFjdENvbnRyb2wsIGludmVydCA9IGZhbHNlKTogVmFsaWRhdGlvbkVycm9ycyB8IG51bGwgPT4ge1xyXG4gICAgICBpZiAoaXNFbXB0eShjb250cm9sLnZhbHVlKSkgeyByZXR1cm4gbnVsbDsgfVxyXG4gICAgICBjb25zdCBzb3J0ZWQ6IGFueVtdID0gY29udHJvbC52YWx1ZS5zbGljZSgpLnNvcnQoKTtcclxuICAgICAgY29uc3QgZHVwbGljYXRlSXRlbXMgPSBbXTtcclxuICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBzb3J0ZWQubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBpZiAoc29ydGVkW2kgLSAxXSA9PT0gc29ydGVkW2ldICYmIGR1cGxpY2F0ZUl0ZW1zLmluY2x1ZGVzKHNvcnRlZFtpXSkpIHtcclxuICAgICAgICAgIGR1cGxpY2F0ZUl0ZW1zLnB1c2goc29ydGVkW2ldKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgaXNWYWxpZCA9ICFkdXBsaWNhdGVJdGVtcy5sZW5ndGg7XHJcbiAgICAgIHJldHVybiB4b3IoaXNWYWxpZCwgaW52ZXJ0KSA/XHJcbiAgICAgICAgbnVsbCA6IHsgJ3VuaXF1ZUl0ZW1zJzogeyBkdXBsaWNhdGVJdGVtcyB9IH07XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogJ2NvbnRhaW5zJyB2YWxpZGF0b3JcclxuICAgKlxyXG4gICAqIFRPRE86IENvbXBsZXRlIHRoaXMgdmFsaWRhdG9yXHJcbiAgICpcclxuICAgKiBSZXF1aXJlcyB2YWx1ZXMgaW4gYSBmb3JtIGFycmF5IHRvIGJlIHVuaXF1ZS5cclxuICAgKlxyXG4gICAqIC8vIHtib29sZWFuID0gdHJ1ZX0gdW5pcXVlPyAtIHRydWUgdG8gdmFsaWRhdGUsIGZhbHNlIHRvIGRpc2FibGVcclxuICAgKiAvLyB7SVZhbGlkYXRvckZufVxyXG4gICAqL1xyXG4gIHN0YXRpYyBjb250YWlucyhyZXF1aXJlZEl0ZW0gPSB0cnVlKTogSVZhbGlkYXRvckZuIHtcclxuICAgIGlmICghcmVxdWlyZWRJdGVtKSB7IHJldHVybiBKc29uVmFsaWRhdG9ycy5udWxsVmFsaWRhdG9yOyB9XHJcbiAgICByZXR1cm4gKGNvbnRyb2w6IEFic3RyYWN0Q29udHJvbCwgaW52ZXJ0ID0gZmFsc2UpOiBWYWxpZGF0aW9uRXJyb3JzIHwgbnVsbCA9PiB7XHJcbiAgICAgIGlmIChpc0VtcHR5KGNvbnRyb2wudmFsdWUpIHx8ICFpc0FycmF5KGNvbnRyb2wudmFsdWUpKSB7IHJldHVybiBudWxsOyB9XHJcbiAgICAgIGNvbnN0IGN1cnJlbnRJdGVtcyA9IGNvbnRyb2wudmFsdWU7XHJcbiAgICAgIC8vIGNvbnN0IGlzVmFsaWQgPSBjdXJyZW50SXRlbXMuc29tZShpdGVtID0+XHJcbiAgICAgIC8vXHJcbiAgICAgIC8vICk7XHJcbiAgICAgIGNvbnN0IGlzVmFsaWQgPSB0cnVlO1xyXG4gICAgICByZXR1cm4geG9yKGlzVmFsaWQsIGludmVydCkgP1xyXG4gICAgICAgIG51bGwgOiB7ICdjb250YWlucyc6IHsgcmVxdWlyZWRJdGVtLCBjdXJyZW50SXRlbXMgfSB9O1xyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE5vLW9wIHZhbGlkYXRvci4gSW5jbHVkZWQgZm9yIGJhY2t3YXJkIGNvbXBhdGliaWxpdHkuXHJcbiAgICovXHJcbiAgc3RhdGljIG51bGxWYWxpZGF0b3IoY29udHJvbDogQWJzdHJhY3RDb250cm9sKTogVmFsaWRhdGlvbkVycm9ycyB8IG51bGwge1xyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBWYWxpZGF0b3IgdHJhbnNmb3JtYXRpb24gZnVuY3Rpb25zOlxyXG4gICAqIGNvbXBvc2VBbnlPZiwgY29tcG9zZU9uZU9mLCBjb21wb3NlQWxsT2YsIGNvbXBvc2VOb3QsXHJcbiAgICogY29tcG9zZSwgY29tcG9zZUFzeW5jXHJcbiAgICpcclxuICAgKiBUT0RPOiBBZGQgY29tcG9zZUFueU9mQXN5bmMsIGNvbXBvc2VPbmVPZkFzeW5jLFxyXG4gICAqICAgICAgICAgICBjb21wb3NlQWxsT2ZBc3luYywgY29tcG9zZU5vdEFzeW5jXHJcbiAgICovXHJcblxyXG4gIC8qKlxyXG4gICAqICdjb21wb3NlQW55T2YnIHZhbGlkYXRvciBjb21iaW5hdGlvbiBmdW5jdGlvblxyXG4gICAqXHJcbiAgICogQWNjZXB0cyBhbiBhcnJheSBvZiB2YWxpZGF0b3JzIGFuZCByZXR1cm5zIGEgc2luZ2xlIHZhbGlkYXRvciB0aGF0XHJcbiAgICogZXZhbHVhdGVzIHRvIHZhbGlkIGlmIGFueSBvbmUgb3IgbW9yZSBvZiB0aGUgc3VibWl0dGVkIHZhbGlkYXRvcnMgYXJlXHJcbiAgICogdmFsaWQuIElmIGV2ZXJ5IHZhbGlkYXRvciBpcyBpbnZhbGlkLCBpdCByZXR1cm5zIGNvbWJpbmVkIGVycm9ycyBmcm9tXHJcbiAgICogYWxsIHZhbGlkYXRvcnMuXHJcbiAgICpcclxuICAgKiAvLyB7SVZhbGlkYXRvckZuW119IHZhbGlkYXRvcnMgLSBhcnJheSBvZiB2YWxpZGF0b3JzIHRvIGNvbWJpbmVcclxuICAgKiAvLyB7SVZhbGlkYXRvckZufSAtIHNpbmdsZSBjb21iaW5lZCB2YWxpZGF0b3IgZnVuY3Rpb25cclxuICAgKi9cclxuICBzdGF0aWMgY29tcG9zZUFueU9mKHZhbGlkYXRvcnM6IElWYWxpZGF0b3JGbltdKTogSVZhbGlkYXRvckZuIHtcclxuICAgIGlmICghdmFsaWRhdG9ycykgeyByZXR1cm4gbnVsbDsgfVxyXG4gICAgY29uc3QgcHJlc2VudFZhbGlkYXRvcnMgPSB2YWxpZGF0b3JzLmZpbHRlcihpc0RlZmluZWQpO1xyXG4gICAgaWYgKHByZXNlbnRWYWxpZGF0b3JzLmxlbmd0aCA9PT0gMCkgeyByZXR1cm4gbnVsbDsgfVxyXG4gICAgcmV0dXJuIChjb250cm9sOiBBYnN0cmFjdENvbnRyb2wsIGludmVydCA9IGZhbHNlKTogVmFsaWRhdGlvbkVycm9ycyB8IG51bGwgPT4ge1xyXG4gICAgICBjb25zdCBhcnJheU9mRXJyb3JzID1cclxuICAgICAgICBfZXhlY3V0ZVZhbGlkYXRvcnMoY29udHJvbCwgcHJlc2VudFZhbGlkYXRvcnMsIGludmVydCkuZmlsdGVyKGlzRGVmaW5lZCk7XHJcbiAgICAgIGNvbnN0IGlzVmFsaWQgPSB2YWxpZGF0b3JzLmxlbmd0aCA+IGFycmF5T2ZFcnJvcnMubGVuZ3RoO1xyXG4gICAgICByZXR1cm4geG9yKGlzVmFsaWQsIGludmVydCkgP1xyXG4gICAgICAgIG51bGwgOiBfbWVyZ2VPYmplY3RzKC4uLmFycmF5T2ZFcnJvcnMsIHsgJ2FueU9mJzogIWludmVydCB9KTtcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiAnY29tcG9zZU9uZU9mJyB2YWxpZGF0b3IgY29tYmluYXRpb24gZnVuY3Rpb25cclxuICAgKlxyXG4gICAqIEFjY2VwdHMgYW4gYXJyYXkgb2YgdmFsaWRhdG9ycyBhbmQgcmV0dXJucyBhIHNpbmdsZSB2YWxpZGF0b3IgdGhhdFxyXG4gICAqIGV2YWx1YXRlcyB0byB2YWxpZCBvbmx5IGlmIGV4YWN0bHkgb25lIG9mIHRoZSBzdWJtaXR0ZWQgdmFsaWRhdG9yc1xyXG4gICAqIGlzIHZhbGlkLiBPdGhlcndpc2UgcmV0dXJucyBjb21iaW5lZCBpbmZvcm1hdGlvbiBmcm9tIGFsbCB2YWxpZGF0b3JzLFxyXG4gICAqIGJvdGggdmFsaWQgYW5kIGludmFsaWQuXHJcbiAgICpcclxuICAgKiAvLyB7SVZhbGlkYXRvckZuW119IHZhbGlkYXRvcnMgLSBhcnJheSBvZiB2YWxpZGF0b3JzIHRvIGNvbWJpbmVcclxuICAgKiAvLyB7SVZhbGlkYXRvckZufSAtIHNpbmdsZSBjb21iaW5lZCB2YWxpZGF0b3IgZnVuY3Rpb25cclxuICAgKi9cclxuICBzdGF0aWMgY29tcG9zZU9uZU9mKHZhbGlkYXRvcnM6IElWYWxpZGF0b3JGbltdKTogSVZhbGlkYXRvckZuIHtcclxuICAgIGlmICghdmFsaWRhdG9ycykgeyByZXR1cm4gbnVsbDsgfVxyXG4gICAgY29uc3QgcHJlc2VudFZhbGlkYXRvcnMgPSB2YWxpZGF0b3JzLmZpbHRlcihpc0RlZmluZWQpO1xyXG4gICAgaWYgKHByZXNlbnRWYWxpZGF0b3JzLmxlbmd0aCA9PT0gMCkgeyByZXR1cm4gbnVsbDsgfVxyXG4gICAgcmV0dXJuIChjb250cm9sOiBBYnN0cmFjdENvbnRyb2wsIGludmVydCA9IGZhbHNlKTogVmFsaWRhdGlvbkVycm9ycyB8IG51bGwgPT4ge1xyXG4gICAgICBjb25zdCBhcnJheU9mRXJyb3JzID1cclxuICAgICAgICBfZXhlY3V0ZVZhbGlkYXRvcnMoY29udHJvbCwgcHJlc2VudFZhbGlkYXRvcnMpO1xyXG4gICAgICBjb25zdCB2YWxpZENvbnRyb2xzID1cclxuICAgICAgICB2YWxpZGF0b3JzLmxlbmd0aCAtIGFycmF5T2ZFcnJvcnMuZmlsdGVyKGlzRGVmaW5lZCkubGVuZ3RoO1xyXG4gICAgICBjb25zdCBpc1ZhbGlkID0gdmFsaWRDb250cm9scyA9PT0gMTtcclxuICAgICAgaWYgKHhvcihpc1ZhbGlkLCBpbnZlcnQpKSB7IHJldHVybiBudWxsOyB9XHJcbiAgICAgIGNvbnN0IGFycmF5T2ZWYWxpZHMgPVxyXG4gICAgICAgIF9leGVjdXRlVmFsaWRhdG9ycyhjb250cm9sLCBwcmVzZW50VmFsaWRhdG9ycywgaW52ZXJ0KTtcclxuICAgICAgcmV0dXJuIF9tZXJnZU9iamVjdHMoLi4uYXJyYXlPZkVycm9ycywgLi4uYXJyYXlPZlZhbGlkcywgeyAnb25lT2YnOiAhaW52ZXJ0IH0pO1xyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqICdjb21wb3NlQWxsT2YnIHZhbGlkYXRvciBjb21iaW5hdGlvbiBmdW5jdGlvblxyXG4gICAqXHJcbiAgICogQWNjZXB0cyBhbiBhcnJheSBvZiB2YWxpZGF0b3JzIGFuZCByZXR1cm5zIGEgc2luZ2xlIHZhbGlkYXRvciB0aGF0XHJcbiAgICogZXZhbHVhdGVzIHRvIHZhbGlkIG9ubHkgaWYgYWxsIHRoZSBzdWJtaXR0ZWQgdmFsaWRhdG9ycyBhcmUgaW5kaXZpZHVhbGx5XHJcbiAgICogdmFsaWQuIE90aGVyd2lzZSBpdCByZXR1cm5zIGNvbWJpbmVkIGVycm9ycyBmcm9tIGFsbCBpbnZhbGlkIHZhbGlkYXRvcnMuXHJcbiAgICpcclxuICAgKiAvLyB7SVZhbGlkYXRvckZuW119IHZhbGlkYXRvcnMgLSBhcnJheSBvZiB2YWxpZGF0b3JzIHRvIGNvbWJpbmVcclxuICAgKiAvLyB7SVZhbGlkYXRvckZufSAtIHNpbmdsZSBjb21iaW5lZCB2YWxpZGF0b3IgZnVuY3Rpb25cclxuICAgKi9cclxuICBzdGF0aWMgY29tcG9zZUFsbE9mKHZhbGlkYXRvcnM6IElWYWxpZGF0b3JGbltdKTogSVZhbGlkYXRvckZuIHtcclxuICAgIGlmICghdmFsaWRhdG9ycykgeyByZXR1cm4gbnVsbDsgfVxyXG4gICAgY29uc3QgcHJlc2VudFZhbGlkYXRvcnMgPSB2YWxpZGF0b3JzLmZpbHRlcihpc0RlZmluZWQpO1xyXG4gICAgaWYgKHByZXNlbnRWYWxpZGF0b3JzLmxlbmd0aCA9PT0gMCkgeyByZXR1cm4gbnVsbDsgfVxyXG4gICAgcmV0dXJuIChjb250cm9sOiBBYnN0cmFjdENvbnRyb2wsIGludmVydCA9IGZhbHNlKTogVmFsaWRhdGlvbkVycm9ycyB8IG51bGwgPT4ge1xyXG4gICAgICBjb25zdCBjb21iaW5lZEVycm9ycyA9IF9tZXJnZUVycm9ycyhcclxuICAgICAgICBfZXhlY3V0ZVZhbGlkYXRvcnMoY29udHJvbCwgcHJlc2VudFZhbGlkYXRvcnMsIGludmVydClcclxuICAgICAgKTtcclxuICAgICAgY29uc3QgaXNWYWxpZCA9IGNvbWJpbmVkRXJyb3JzID09PSBudWxsO1xyXG4gICAgICByZXR1cm4gKHhvcihpc1ZhbGlkLCBpbnZlcnQpKSA/XHJcbiAgICAgICAgbnVsbCA6IF9tZXJnZU9iamVjdHMoY29tYmluZWRFcnJvcnMsIHsgJ2FsbE9mJzogIWludmVydCB9KTtcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiAnY29tcG9zZU5vdCcgdmFsaWRhdG9yIGludmVyc2lvbiBmdW5jdGlvblxyXG4gICAqXHJcbiAgICogQWNjZXB0cyBhIHNpbmdsZSB2YWxpZGF0b3IgZnVuY3Rpb24gYW5kIGludmVydHMgaXRzIHJlc3VsdC5cclxuICAgKiBSZXR1cm5zIHZhbGlkIGlmIHRoZSBzdWJtaXR0ZWQgdmFsaWRhdG9yIGlzIGludmFsaWQsIGFuZFxyXG4gICAqIHJldHVybnMgaW52YWxpZCBpZiB0aGUgc3VibWl0dGVkIHZhbGlkYXRvciBpcyB2YWxpZC5cclxuICAgKiAoTm90ZTogdGhpcyBmdW5jdGlvbiBjYW4gaXRzZWxmIGJlIGludmVydGVkXHJcbiAgICogICAtIGUuZy4gY29tcG9zZU5vdChjb21wb3NlTm90KHZhbGlkYXRvcikpIC1cclxuICAgKiAgIGJ1dCB0aGlzIGNhbiBiZSBjb25mdXNpbmcgYW5kIGlzIHRoZXJlZm9yZSBub3QgcmVjb21tZW5kZWQuKVxyXG4gICAqXHJcbiAgICogLy8ge0lWYWxpZGF0b3JGbltdfSB2YWxpZGF0b3JzIC0gdmFsaWRhdG9yKHMpIHRvIGludmVydFxyXG4gICAqIC8vIHtJVmFsaWRhdG9yRm59IC0gbmV3IHZhbGlkYXRvciBmdW5jdGlvbiB0aGF0IHJldHVybnMgb3Bwb3NpdGUgcmVzdWx0XHJcbiAgICovXHJcbiAgc3RhdGljIGNvbXBvc2VOb3QodmFsaWRhdG9yOiBJVmFsaWRhdG9yRm4pOiBJVmFsaWRhdG9yRm4ge1xyXG4gICAgaWYgKCF2YWxpZGF0b3IpIHsgcmV0dXJuIG51bGw7IH1cclxuICAgIHJldHVybiAoY29udHJvbDogQWJzdHJhY3RDb250cm9sLCBpbnZlcnQgPSBmYWxzZSk6IFZhbGlkYXRpb25FcnJvcnMgfCBudWxsID0+IHtcclxuICAgICAgaWYgKGlzRW1wdHkoY29udHJvbC52YWx1ZSkpIHsgcmV0dXJuIG51bGw7IH1cclxuICAgICAgY29uc3QgZXJyb3IgPSB2YWxpZGF0b3IoY29udHJvbCwgIWludmVydCk7XHJcbiAgICAgIGNvbnN0IGlzVmFsaWQgPSBlcnJvciA9PT0gbnVsbDtcclxuICAgICAgcmV0dXJuICh4b3IoaXNWYWxpZCwgaW52ZXJ0KSkgP1xyXG4gICAgICAgIG51bGwgOiBfbWVyZ2VPYmplY3RzKGVycm9yLCB7ICdub3QnOiAhaW52ZXJ0IH0pO1xyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqICdjb21wb3NlJyB2YWxpZGF0b3IgY29tYmluYXRpb24gZnVuY3Rpb25cclxuICAgKlxyXG4gICAqIC8vIHtJVmFsaWRhdG9yRm5bXX0gdmFsaWRhdG9ycyAtIGFycmF5IG9mIHZhbGlkYXRvcnMgdG8gY29tYmluZVxyXG4gICAqIC8vIHtJVmFsaWRhdG9yRm59IC0gc2luZ2xlIGNvbWJpbmVkIHZhbGlkYXRvciBmdW5jdGlvblxyXG4gICAqL1xyXG4gIHN0YXRpYyBjb21wb3NlKHZhbGlkYXRvcnM6IElWYWxpZGF0b3JGbltdKTogSVZhbGlkYXRvckZuIHtcclxuICAgIGlmICghdmFsaWRhdG9ycykgeyByZXR1cm4gbnVsbDsgfVxyXG4gICAgY29uc3QgcHJlc2VudFZhbGlkYXRvcnMgPSB2YWxpZGF0b3JzLmZpbHRlcihpc0RlZmluZWQpO1xyXG4gICAgaWYgKHByZXNlbnRWYWxpZGF0b3JzLmxlbmd0aCA9PT0gMCkgeyByZXR1cm4gbnVsbDsgfVxyXG4gICAgcmV0dXJuIChjb250cm9sOiBBYnN0cmFjdENvbnRyb2wsIGludmVydCA9IGZhbHNlKTogVmFsaWRhdGlvbkVycm9ycyB8IG51bGwgPT5cclxuICAgICAgX21lcmdlRXJyb3JzKF9leGVjdXRlVmFsaWRhdG9ycyhjb250cm9sLCBwcmVzZW50VmFsaWRhdG9ycywgaW52ZXJ0KSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiAnY29tcG9zZUFzeW5jJyBhc3luYyB2YWxpZGF0b3IgY29tYmluYXRpb24gZnVuY3Rpb25cclxuICAgKlxyXG4gICAqIC8vIHtBc3luY0lWYWxpZGF0b3JGbltdfSBhc3luYyB2YWxpZGF0b3JzIC0gYXJyYXkgb2YgYXN5bmMgdmFsaWRhdG9yc1xyXG4gICAqIC8vIHtBc3luY0lWYWxpZGF0b3JGbn0gLSBzaW5nbGUgY29tYmluZWQgYXN5bmMgdmFsaWRhdG9yIGZ1bmN0aW9uXHJcbiAgICovXHJcbiAgc3RhdGljIGNvbXBvc2VBc3luYyh2YWxpZGF0b3JzOiBBc3luY0lWYWxpZGF0b3JGbltdKTogQXN5bmNJVmFsaWRhdG9yRm4ge1xyXG4gICAgaWYgKCF2YWxpZGF0b3JzKSB7IHJldHVybiBudWxsOyB9XHJcbiAgICBjb25zdCBwcmVzZW50VmFsaWRhdG9ycyA9IHZhbGlkYXRvcnMuZmlsdGVyKGlzRGVmaW5lZCk7XHJcbiAgICBpZiAocHJlc2VudFZhbGlkYXRvcnMubGVuZ3RoID09PSAwKSB7IHJldHVybiBudWxsOyB9XHJcbiAgICByZXR1cm4gKGNvbnRyb2w6IEFic3RyYWN0Q29udHJvbCkgPT4ge1xyXG4gICAgICBjb25zdCBvYnNlcnZhYmxlcyA9XHJcbiAgICAgICAgX2V4ZWN1dGVBc3luY1ZhbGlkYXRvcnMoY29udHJvbCwgcHJlc2VudFZhbGlkYXRvcnMpLm1hcCh0b09ic2VydmFibGUpO1xyXG4gICAgICByZXR1cm4gbWFwLmNhbGwoZm9ya0pvaW4ob2JzZXJ2YWJsZXMpLCBfbWVyZ2VFcnJvcnMpO1xyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8vIEFkZGl0aW9uYWwgYW5ndWxhciB2YWxpZGF0b3JzIChub3QgdXNlZCBieSBBbmd1YWxyIEpTT04gU2NoZW1hIEZvcm0pXHJcbiAgLy8gRnJvbSBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL2Jsb2IvbWFzdGVyL3BhY2thZ2VzL2Zvcm1zL3NyYy92YWxpZGF0b3JzLnRzXHJcblxyXG4gIC8qKlxyXG4gICAqIFZhbGlkYXRvciB0aGF0IHJlcXVpcmVzIGNvbnRyb2xzIHRvIGhhdmUgYSB2YWx1ZSBncmVhdGVyIHRoYW4gYSBudW1iZXIuXHJcbiAgICovXHJcbiAgc3RhdGljIG1pbihtaW46IG51bWJlcik6IFZhbGlkYXRvckZuIHtcclxuICAgIGlmICghaGFzVmFsdWUobWluKSkgeyByZXR1cm4gSnNvblZhbGlkYXRvcnMubnVsbFZhbGlkYXRvcjsgfVxyXG4gICAgcmV0dXJuIChjb250cm9sOiBBYnN0cmFjdENvbnRyb2wpOiBWYWxpZGF0aW9uRXJyb3JzIHwgbnVsbCA9PiB7XHJcbiAgICAgIC8vIGRvbid0IHZhbGlkYXRlIGVtcHR5IHZhbHVlcyB0byBhbGxvdyBvcHRpb25hbCBjb250cm9sc1xyXG4gICAgICBpZiAoaXNFbXB0eShjb250cm9sLnZhbHVlKSB8fCBpc0VtcHR5KG1pbikpIHsgcmV0dXJuIG51bGw7IH1cclxuICAgICAgY29uc3QgdmFsdWUgPSBwYXJzZUZsb2F0KGNvbnRyb2wudmFsdWUpO1xyXG4gICAgICBjb25zdCBhY3R1YWwgPSBjb250cm9sLnZhbHVlO1xyXG4gICAgICAvLyBDb250cm9scyB3aXRoIE5hTiB2YWx1ZXMgYWZ0ZXIgcGFyc2luZyBzaG91bGQgYmUgdHJlYXRlZCBhcyBub3QgaGF2aW5nIGFcclxuICAgICAgLy8gbWluaW11bSwgcGVyIHRoZSBIVE1MIGZvcm1zIHNwZWM6IGh0dHBzOi8vd3d3LnczLm9yZy9UUi9odG1sNS9mb3Jtcy5odG1sI2F0dHItaW5wdXQtbWluXHJcbiAgICAgIHJldHVybiBpc05hTih2YWx1ZSkgfHwgdmFsdWUgPj0gbWluID8gbnVsbCA6IHsgJ21pbic6IHsgbWluLCBhY3R1YWwgfSB9O1xyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFZhbGlkYXRvciB0aGF0IHJlcXVpcmVzIGNvbnRyb2xzIHRvIGhhdmUgYSB2YWx1ZSBsZXNzIHRoYW4gYSBudW1iZXIuXHJcbiAgICovXHJcbiAgc3RhdGljIG1heChtYXg6IG51bWJlcik6IFZhbGlkYXRvckZuIHtcclxuICAgIGlmICghaGFzVmFsdWUobWF4KSkgeyByZXR1cm4gSnNvblZhbGlkYXRvcnMubnVsbFZhbGlkYXRvcjsgfVxyXG4gICAgcmV0dXJuIChjb250cm9sOiBBYnN0cmFjdENvbnRyb2wpOiBWYWxpZGF0aW9uRXJyb3JzIHwgbnVsbCA9PiB7XHJcbiAgICAgIC8vIGRvbid0IHZhbGlkYXRlIGVtcHR5IHZhbHVlcyB0byBhbGxvdyBvcHRpb25hbCBjb250cm9sc1xyXG4gICAgICBpZiAoaXNFbXB0eShjb250cm9sLnZhbHVlKSB8fCBpc0VtcHR5KG1heCkpIHsgcmV0dXJuIG51bGw7IH1cclxuICAgICAgY29uc3QgdmFsdWUgPSBwYXJzZUZsb2F0KGNvbnRyb2wudmFsdWUpO1xyXG4gICAgICBjb25zdCBhY3R1YWwgPSBjb250cm9sLnZhbHVlO1xyXG4gICAgICAvLyBDb250cm9scyB3aXRoIE5hTiB2YWx1ZXMgYWZ0ZXIgcGFyc2luZyBzaG91bGQgYmUgdHJlYXRlZCBhcyBub3QgaGF2aW5nIGFcclxuICAgICAgLy8gbWF4aW11bSwgcGVyIHRoZSBIVE1MIGZvcm1zIHNwZWM6IGh0dHBzOi8vd3d3LnczLm9yZy9UUi9odG1sNS9mb3Jtcy5odG1sI2F0dHItaW5wdXQtbWF4XHJcbiAgICAgIHJldHVybiBpc05hTih2YWx1ZSkgfHwgdmFsdWUgPD0gbWF4ID8gbnVsbCA6IHsgJ21heCc6IHsgbWF4LCBhY3R1YWwgfSB9O1xyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFZhbGlkYXRvciB0aGF0IHJlcXVpcmVzIGNvbnRyb2wgdmFsdWUgdG8gYmUgdHJ1ZS5cclxuICAgKi9cclxuICBzdGF0aWMgcmVxdWlyZWRUcnVlKGNvbnRyb2w6IEFic3RyYWN0Q29udHJvbCk6IFZhbGlkYXRpb25FcnJvcnMgfCBudWxsIHtcclxuICAgIGlmICghY29udHJvbCkgeyByZXR1cm4gSnNvblZhbGlkYXRvcnMubnVsbFZhbGlkYXRvcjsgfVxyXG4gICAgcmV0dXJuIGNvbnRyb2wudmFsdWUgPT09IHRydWUgPyBudWxsIDogeyAncmVxdWlyZWQnOiB0cnVlIH07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBWYWxpZGF0b3IgdGhhdCBwZXJmb3JtcyBlbWFpbCB2YWxpZGF0aW9uLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBlbWFpbChjb250cm9sOiBBYnN0cmFjdENvbnRyb2wpOiBWYWxpZGF0aW9uRXJyb3JzIHwgbnVsbCB7XHJcbiAgICBpZiAoIWNvbnRyb2wpIHsgcmV0dXJuIEpzb25WYWxpZGF0b3JzLm51bGxWYWxpZGF0b3I7IH1cclxuICAgIGNvbnN0IEVNQUlMX1JFR0VYUCA9XHJcbiAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTptYXgtbGluZS1sZW5ndGhcclxuICAgICAgL14oPz0uezEsMjU0fSQpKD89LnsxLDY0fUApWy0hIyQlJicqKy8wLTk9P0EtWl5fYGEtent8fX5dKyhcXC5bLSEjJCUmJyorLzAtOT0/QS1aXl9gYS16e3x9fl0rKSpAW0EtWmEtejAtOV0oW0EtWmEtejAtOS1dezAsNjF9W0EtWmEtejAtOV0pPyhcXC5bQS1aYS16MC05XShbQS1aYS16MC05LV17MCw2MX1bQS1aYS16MC05XSk/KSokLztcclxuICAgIHJldHVybiBFTUFJTF9SRUdFWFAudGVzdChjb250cm9sLnZhbHVlKSA/IG51bGwgOiB7ICdlbWFpbCc6IHRydWUgfTtcclxuICB9XHJcbn1cclxuIl19