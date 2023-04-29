import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import cloneDeep from 'lodash/cloneDeep';
import Ajv from 'ajv';
import jsonDraft6 from 'ajv/lib/refs/json-schema-draft-06.json';
import { buildFormGroup, buildFormGroupTemplate, formatFormData, getControl, fixTitle, forEach, hasOwn, toTitleCase, buildLayout, getLayoutNode, buildSchemaFromData, buildSchemaFromLayout, removeRecursiveReferences, hasValue, isArray, isDefined, isEmpty, isObject, JsonPointer } from './shared';
import { deValidationMessages, enValidationMessages, esValidationMessages, frValidationMessages, itValidationMessages, ptValidationMessages, zhValidationMessages } from './locale';
import * as i0 from "@angular/core";
export class JsonSchemaFormService {
    constructor() {
        this.JsonFormCompatibility = false;
        this.ReactJsonSchemaFormCompatibility = false;
        this.AngularSchemaFormCompatibility = false;
        this.tpldata = {};
        this.ajvOptions = {
            allErrors: true,
            jsonPointers: true,
            unknownFormats: 'ignore'
        };
        this.ajv = new Ajv(this.ajvOptions); // AJV: Another JSON Schema Validator
        this.validateFormData = null; // Compiled AJV function to validate active form's schema
        this.formValues = {}; // Internal form data (may not have correct types)
        this.data = {}; // Output form data (formValues, formatted with correct data types)
        this.schema = {}; // Internal JSON Schema
        this.layout = []; // Internal form layout
        this.formGroupTemplate = {}; // Template used to create formGroup
        this.formGroup = null; // Angular formGroup, which powers the reactive form
        this.framework = null; // Active framework component
        this.validData = null; // Valid form data (or null) (=== isValid ? data : null)
        this.isValid = null; // Is current form data valid?
        this.ajvErrors = null; // Ajv errors for current data
        this.validationErrors = null; // Any validation errors for current data
        this.dataErrors = new Map(); //
        this.formValueSubscription = null; // Subscription to formGroup.valueChanges observable (for un- and re-subscribing)
        this.dataChanges = new Subject(); // Form data observable
        this.isValidChanges = new Subject(); // isValid observable
        this.validationErrorChanges = new Subject(); // validationErrors observable
        this.arrayMap = new Map(); // Maps arrays in data object and number of tuple values
        this.dataMap = new Map(); // Maps paths in form data to schema and formGroup paths
        this.dataRecursiveRefMap = new Map(); // Maps recursive reference points in form data
        this.schemaRecursiveRefMap = new Map(); // Maps recursive reference points in schema
        this.schemaRefLibrary = {}; // Library of schemas for resolving schema $refs
        this.layoutRefLibrary = { '': null }; // Library of layout nodes for adding to form
        this.templateRefLibrary = {}; // Library of formGroup templates for adding to form
        this.hasRootReference = false; // Does the form include a recursive reference to itself?
        this.language = 'en-US'; // Does the form include a recursive reference to itself?
        // Default global form options
        this.defaultFormOptions = {
            autocomplete: true,
            addSubmit: 'auto',
            // for addSubmit: true = always, false = never,
            // 'auto' = only if layout is undefined (form is built from schema alone)
            debug: false,
            disableInvalidSubmit: true,
            formDisabled: false,
            formReadonly: false,
            fieldsRequired: false,
            framework: 'no-framework',
            loadExternalAssets: false,
            pristine: { errors: true, success: true },
            supressPropertyTitles: false,
            setSchemaDefaults: 'auto',
            // true = always set (unless overridden by layout default or formValues)
            // false = never set
            // 'auto' = set in addable components, and everywhere if formValues not set
            setLayoutDefaults: 'auto',
            // true = always set (unless overridden by formValues)
            // false = never set
            // 'auto' = set in addable components, and everywhere if formValues not set
            validateOnRender: 'auto',
            // true = validate all fields immediately
            // false = only validate fields after they are touched by user
            // 'auto' = validate fields with values immediately, empty fields after they are touched
            widgets: {},
            defautWidgetOptions: {
                // Default options for form control widgets
                listItems: 1,
                addable: true,
                orderable: true,
                removable: true,
                enableErrorState: true,
                // disableErrorState: false, // Don't apply 'has-error' class when field fails validation?
                enableSuccessState: true,
                // disableSuccessState: false, // Don't apply 'has-success' class when field validates?
                feedback: false,
                feedbackOnRender: false,
                notitle: false,
                disabled: false,
                readonly: false,
                returnEmptyFields: true,
                validationMessages: {} // set by setLanguage()
            }
        };
        this.setLanguage(this.language);
        this.ajv.addMetaSchema(jsonDraft6);
    }
    setLanguage(language = 'en-US') {
        this.language = language;
        const languageValidationMessages = {
            de: deValidationMessages,
            en: enValidationMessages,
            es: esValidationMessages,
            fr: frValidationMessages,
            it: itValidationMessages,
            pt: ptValidationMessages,
            zh: zhValidationMessages,
        };
        const languageCode = language.slice(0, 2);
        const validationMessages = languageValidationMessages[languageCode];
        this.defaultFormOptions.defautWidgetOptions.validationMessages = cloneDeep(validationMessages);
    }
    getData() {
        return this.data;
    }
    getSchema() {
        return this.schema;
    }
    getLayout() {
        return this.layout;
    }
    resetAllValues() {
        this.JsonFormCompatibility = false;
        this.ReactJsonSchemaFormCompatibility = false;
        this.AngularSchemaFormCompatibility = false;
        this.tpldata = {};
        this.validateFormData = null;
        this.formValues = {};
        this.schema = {};
        this.layout = [];
        this.formGroupTemplate = {};
        this.formGroup = null;
        this.framework = null;
        this.data = {};
        this.validData = null;
        this.isValid = null;
        this.validationErrors = null;
        this.arrayMap = new Map();
        this.dataMap = new Map();
        this.dataRecursiveRefMap = new Map();
        this.schemaRecursiveRefMap = new Map();
        this.layoutRefLibrary = {};
        this.schemaRefLibrary = {};
        this.templateRefLibrary = {};
        this.formOptions = cloneDeep(this.defaultFormOptions);
    }
    /**
     * 'buildRemoteError' function
     *
     * Example errors:
     * {
     *   last_name: [ {
     *     message: 'Last name must by start with capital letter.',
     *     code: 'capital_letter'
     *   } ],
     *   email: [ {
     *     message: 'Email must be from example.com domain.',
     *     code: 'special_domain'
     *   }, {
     *     message: 'Email must contain an @ symbol.',
     *     code: 'at_symbol'
     *   } ]
     * }
     * //{ErrorMessages} errors
     */
    buildRemoteError(errors) {
        forEach(errors, (value, key) => {
            if (key in this.formGroup.controls) {
                for (const error of value) {
                    const err = {};
                    err[error['code']] = error['message'];
                    this.formGroup.get(key).setErrors(err, { emitEvent: true });
                }
            }
        });
    }
    validateData(newValue, updateSubscriptions = true) {
        // Format raw form data to correct data types
        this.data = formatFormData(newValue, this.dataMap, this.dataRecursiveRefMap, this.arrayMap, this.formOptions.returnEmptyFields);
        this.isValid = this.validateFormData(this.data);
        this.validData = this.isValid ? this.data : null;
        const compileErrors = errors => {
            const compiledErrors = {};
            (errors || []).forEach(error => {
                if (!compiledErrors[error.dataPath]) {
                    compiledErrors[error.dataPath] = [];
                }
                compiledErrors[error.dataPath].push(error.message);
            });
            return compiledErrors;
        };
        this.ajvErrors = this.validateFormData.errors;
        this.validationErrors = compileErrors(this.validateFormData.errors);
        if (updateSubscriptions) {
            this.dataChanges.next(this.data);
            this.isValidChanges.next(this.isValid);
            this.validationErrorChanges.next(this.ajvErrors);
        }
    }
    buildFormGroupTemplate(formValues = null, setValues = true) {
        this.formGroupTemplate = buildFormGroupTemplate(this, formValues, setValues);
    }
    buildFormGroup() {
        this.formGroup = buildFormGroup(this.formGroupTemplate);
        if (this.formGroup) {
            this.compileAjvSchema();
            this.validateData(this.formGroup.value);
            // Set up observables to emit data and validation info when form data changes
            if (this.formValueSubscription) {
                this.formValueSubscription.unsubscribe();
            }
            this.formValueSubscription = this.formGroup.valueChanges.subscribe(formValue => this.validateData(formValue));
        }
    }
    buildLayout(widgetLibrary) {
        this.layout = buildLayout(this, widgetLibrary);
    }
    setOptions(newOptions) {
        if (isObject(newOptions)) {
            const addOptions = cloneDeep(newOptions);
            // Backward compatibility for 'defaultOptions' (renamed 'defautWidgetOptions')
            if (isObject(addOptions.defaultOptions)) {
                Object.assign(this.formOptions.defautWidgetOptions, addOptions.defaultOptions);
                delete addOptions.defaultOptions;
            }
            if (isObject(addOptions.defautWidgetOptions)) {
                Object.assign(this.formOptions.defautWidgetOptions, addOptions.defautWidgetOptions);
                delete addOptions.defautWidgetOptions;
            }
            Object.assign(this.formOptions, addOptions);
            // convert disableErrorState / disableSuccessState to enable...
            const globalDefaults = this.formOptions.defautWidgetOptions;
            ['ErrorState', 'SuccessState']
                .filter(suffix => hasOwn(globalDefaults, 'disable' + suffix))
                .forEach(suffix => {
                globalDefaults['enable' + suffix] = !globalDefaults['disable' + suffix];
                delete globalDefaults['disable' + suffix];
            });
        }
    }
    compileAjvSchema() {
        if (!this.validateFormData) {
            // if 'ui:order' exists in properties, move it to root before compiling with ajv
            if (Array.isArray(this.schema.properties['ui:order'])) {
                this.schema['ui:order'] = this.schema.properties['ui:order'];
                delete this.schema.properties['ui:order'];
            }
            this.ajv.removeSchema(this.schema);
            this.validateFormData = this.ajv.compile(this.schema);
        }
    }
    buildSchemaFromData(data, requireAllFields = false) {
        if (data) {
            return buildSchemaFromData(data, requireAllFields);
        }
        this.schema = buildSchemaFromData(this.formValues, requireAllFields);
    }
    buildSchemaFromLayout(layout) {
        if (layout) {
            return buildSchemaFromLayout(layout);
        }
        this.schema = buildSchemaFromLayout(this.layout);
    }
    setTpldata(newTpldata = {}) {
        this.tpldata = newTpldata;
    }
    parseText(text = '', value = {}, values = {}, key = null) {
        if (!text || !/{{.+?}}/.test(text)) {
            return text;
        }
        return text.replace(/{{(.+?)}}/g, (...a) => this.parseExpression(a[1], value, values, key, this.tpldata));
    }
    parseExpression(expression = '', value = {}, values = {}, key = null, tpldata = null) {
        if (typeof expression !== 'string') {
            return '';
        }
        const index = typeof key === 'number' ? key + 1 + '' : key || '';
        expression = expression.trim();
        if ((expression[0] === "'" || expression[0] === '"') &&
            expression[0] === expression[expression.length - 1] &&
            expression.slice(1, expression.length - 1).indexOf(expression[0]) === -1) {
            return expression.slice(1, expression.length - 1);
        }
        if (expression === 'idx' || expression === '$index') {
            return index;
        }
        if (expression === 'value' && !hasOwn(values, 'value')) {
            return value;
        }
        if (['"', "'", ' ', '||', '&&', '+'].every(delim => expression.indexOf(delim) === -1)) {
            const pointer = JsonPointer.parseObjectPath(expression);
            return pointer[0] === 'value' && JsonPointer.has(value, pointer.slice(1))
                ? JsonPointer.get(value, pointer.slice(1))
                : pointer[0] === 'values' && JsonPointer.has(values, pointer.slice(1))
                    ? JsonPointer.get(values, pointer.slice(1))
                    : pointer[0] === 'tpldata' && JsonPointer.has(tpldata, pointer.slice(1))
                        ? JsonPointer.get(tpldata, pointer.slice(1))
                        : JsonPointer.has(values, pointer)
                            ? JsonPointer.get(values, pointer)
                            : '';
        }
        if (expression.indexOf('[idx]') > -1) {
            expression = expression.replace(/\[idx\]/g, index);
        }
        if (expression.indexOf('[$index]') > -1) {
            expression = expression.replace(/\[$index\]/g, index);
        }
        // TODO: Improve expression evaluation by parsing quoted strings first
        // let expressionArray = expression.match(/([^"']+|"[^"]+"|'[^']+')/g);
        if (expression.indexOf('||') > -1) {
            return expression
                .split('||')
                .reduce((all, term) => all || this.parseExpression(term, value, values, key, tpldata), '');
        }
        if (expression.indexOf('&&') > -1) {
            return expression
                .split('&&')
                .reduce((all, term) => all && this.parseExpression(term, value, values, key, tpldata), ' ')
                .trim();
        }
        if (expression.indexOf('+') > -1) {
            return expression
                .split('+')
                .map(term => this.parseExpression(term, value, values, key, tpldata))
                .join('');
        }
        return '';
    }
    setArrayItemTitle(parentCtx = {}, childNode = null, index = null) {
        const parentNode = parentCtx.layoutNode;
        const parentValues = this.getFormControlValue(parentCtx);
        const isArrayItem = (parentNode.type || '').slice(-5) === 'array' && isArray(parentValues);
        const text = JsonPointer.getFirst(isArrayItem && childNode.type !== '$ref'
            ? [
                [childNode, '/options/legend'],
                [childNode, '/options/title'],
                [parentNode, '/options/title'],
                [parentNode, '/options/legend']
            ]
            : [
                [childNode, '/options/title'],
                [childNode, '/options/legend'],
                [parentNode, '/options/title'],
                [parentNode, '/options/legend']
            ]);
        if (!text) {
            return text;
        }
        const childValue = isArray(parentValues) && index < parentValues.length
            ? parentValues[index]
            : parentValues;
        return this.parseText(text, childValue, parentValues, index);
    }
    setItemTitle(ctx) {
        return !ctx.options.title && /^(\d+|-)$/.test(ctx.layoutNode.name)
            ? null
            : this.parseText(ctx.options.title || toTitleCase(ctx.layoutNode.name), this.getFormControlValue(this), (this.getFormControlGroup(this) || {}).value, ctx.dataIndex[ctx.dataIndex.length - 1]);
    }
    evaluateCondition(layoutNode, dataIndex) {
        const arrayIndex = dataIndex && dataIndex[dataIndex.length - 1];
        let result = true;
        if (hasValue((layoutNode.options || {}).condition)) {
            if (typeof layoutNode.options.condition === 'string') {
                let pointer = layoutNode.options.condition;
                if (hasValue(arrayIndex)) {
                    pointer = pointer.replace('[arrayIndex]', `[${arrayIndex}]`);
                }
                pointer = JsonPointer.parseObjectPath(pointer);
                result = !!JsonPointer.get(this.data, pointer);
                if (!result && pointer[0] === 'model') {
                    result = !!JsonPointer.get({ model: this.data }, pointer);
                }
            }
            else if (typeof layoutNode.options.condition === 'function') {
                result = layoutNode.options.condition(this.data);
            }
            else if (typeof layoutNode.options.condition.functionBody === 'string') {
                try {
                    const dynFn = new Function('model', 'arrayIndices', layoutNode.options.condition.functionBody);
                    result = dynFn(this.data, dataIndex);
                }
                catch (e) {
                    result = true;
                    console.error('condition functionBody errored out on evaluation: ' +
                        layoutNode.options.condition.functionBody);
                }
            }
        }
        return result;
    }
    initializeControl(ctx, bind = true) {
        if (!isObject(ctx)) {
            return false;
        }
        if (isEmpty(ctx.options)) {
            ctx.options = !isEmpty((ctx.layoutNode || {}).options)
                ? ctx.layoutNode.options
                : cloneDeep(this.formOptions);
        }
        ctx.formControl = this.getFormControl(ctx);
        ctx.boundControl = bind && !!ctx.formControl;
        if (ctx.formControl) {
            ctx.controlName = this.getFormControlName(ctx);
            ctx.controlValue = ctx.formControl.value;
            ctx.controlDisabled = ctx.formControl.disabled;
            ctx.options.errorMessage =
                ctx.formControl.status === 'VALID'
                    ? null
                    : this.formatErrors(ctx.formControl.errors, ctx.options.validationMessages);
            ctx.options.showErrors =
                this.formOptions.validateOnRender === true ||
                    (this.formOptions.validateOnRender === 'auto' &&
                        hasValue(ctx.controlValue));
            ctx.formControl.statusChanges.subscribe(status => (ctx.options.errorMessage =
                status === 'VALID'
                    ? null
                    : this.formatErrors(ctx.formControl.errors, ctx.options.validationMessages)));
            ctx.formControl.valueChanges.subscribe(value => {
                if (!!value) {
                    ctx.controlValue = value;
                }
            });
        }
        else {
            ctx.controlName = ctx.layoutNode.name;
            ctx.controlValue = ctx.layoutNode.value || null;
            const dataPointer = this.getDataPointer(ctx);
            if (bind && dataPointer) {
                console.error(`warning: control "${dataPointer}" is not bound to the Angular FormGroup.`);
            }
        }
        return ctx.boundControl;
    }
    formatErrors(errors, validationMessages = {}) {
        if (isEmpty(errors)) {
            return null;
        }
        if (!isObject(validationMessages)) {
            validationMessages = {};
        }
        const addSpaces = string => string[0].toUpperCase() +
            (string.slice(1) || '')
                .replace(/([a-z])([A-Z])/g, '$1 $2')
                .replace(/_/g, ' ');
        const formatError = error => typeof error === 'object'
            ? Object.keys(error)
                .map(key => error[key] === true
                ? addSpaces(key)
                : error[key] === false
                    ? 'Not ' + addSpaces(key)
                    : addSpaces(key) + ': ' + formatError(error[key]))
                .join(', ')
            : addSpaces(error.toString());
        const messages = [];
        return (Object.keys(errors)
            // Hide 'required' error, unless it is the only one
            .filter(errorKey => errorKey !== 'required' || Object.keys(errors).length === 1)
            .map(errorKey => 
        // If validationMessages is a string, return it
        typeof validationMessages === 'string'
            ? validationMessages
            : // If custom error message is a function, return function result
                typeof validationMessages[errorKey] === 'function'
                    ? validationMessages[errorKey](errors[errorKey])
                    : // If custom error message is a string, replace placeholders and return
                        typeof validationMessages[errorKey] === 'string'
                            ? // Does error message have any {{property}} placeholders?
                                !/{{.+?}}/.test(validationMessages[errorKey])
                                    ? validationMessages[errorKey]
                                    : // Replace {{property}} placeholders with values
                                        Object.keys(errors[errorKey]).reduce((errorMessage, errorProperty) => errorMessage.replace(new RegExp('{{' + errorProperty + '}}', 'g'), errors[errorKey][errorProperty]), validationMessages[errorKey])
                            : // If no custom error message, return formatted error data instead
                                addSpaces(errorKey) + ' Error: ' + formatError(errors[errorKey]))
            .join('<br>'));
    }
    updateValue(ctx, value) {
        // Set value of current control
        ctx.controlValue = value;
        if (ctx.boundControl) {
            ctx.formControl.setValue(value);
            ctx.formControl.markAsDirty();
        }
        ctx.layoutNode.value = value;
        // Set values of any related controls in copyValueTo array
        if (isArray(ctx.options.copyValueTo)) {
            for (const item of ctx.options.copyValueTo) {
                const targetControl = getControl(this.formGroup, item);
                if (isObject(targetControl) &&
                    typeof targetControl.setValue === 'function') {
                    targetControl.setValue(value);
                    targetControl.markAsDirty();
                }
            }
        }
    }
    updateArrayCheckboxList(ctx, checkboxList) {
        const formArray = this.getFormControl(ctx);
        // Remove all existing items
        while (formArray.value.length) {
            formArray.removeAt(0);
        }
        // Re-add an item for each checked box
        const refPointer = removeRecursiveReferences(ctx.layoutNode.dataPointer + '/-', this.dataRecursiveRefMap, this.arrayMap);
        for (const checkboxItem of checkboxList) {
            if (checkboxItem.checked) {
                const newFormControl = buildFormGroup(this.templateRefLibrary[refPointer]);
                newFormControl.setValue(checkboxItem.value);
                formArray.push(newFormControl);
            }
        }
        formArray.markAsDirty();
    }
    getFormControl(ctx) {
        if (!ctx.layoutNode ||
            !isDefined(ctx.layoutNode.dataPointer) ||
            ctx.layoutNode.type === '$ref') {
            return null;
        }
        return getControl(this.formGroup, this.getDataPointer(ctx));
    }
    getFormControlValue(ctx) {
        if (!ctx.layoutNode ||
            !isDefined(ctx.layoutNode.dataPointer) ||
            ctx.layoutNode.type === '$ref') {
            return null;
        }
        const control = getControl(this.formGroup, this.getDataPointer(ctx));
        return control ? control.value : null;
    }
    getFormControlGroup(ctx) {
        if (!ctx.layoutNode || !isDefined(ctx.layoutNode.dataPointer)) {
            return null;
        }
        return getControl(this.formGroup, this.getDataPointer(ctx), true);
    }
    getFormControlName(ctx) {
        if (!ctx.layoutNode ||
            !isDefined(ctx.layoutNode.dataPointer) ||
            !hasValue(ctx.dataIndex)) {
            return null;
        }
        return JsonPointer.toKey(this.getDataPointer(ctx));
    }
    getLayoutArray(ctx) {
        return JsonPointer.get(this.layout, this.getLayoutPointer(ctx), 0, -1);
    }
    getParentNode(ctx) {
        return JsonPointer.get(this.layout, this.getLayoutPointer(ctx), 0, -2);
    }
    getDataPointer(ctx) {
        if (!ctx.layoutNode ||
            !isDefined(ctx.layoutNode.dataPointer) ||
            !hasValue(ctx.dataIndex)) {
            return null;
        }
        return JsonPointer.toIndexedPointer(ctx.layoutNode.dataPointer, ctx.dataIndex, this.arrayMap);
    }
    getLayoutPointer(ctx) {
        if (!hasValue(ctx.layoutIndex)) {
            return null;
        }
        return '/' + ctx.layoutIndex.join('/items/');
    }
    isControlBound(ctx) {
        if (!ctx.layoutNode ||
            !isDefined(ctx.layoutNode.dataPointer) ||
            !hasValue(ctx.dataIndex)) {
            return false;
        }
        const controlGroup = this.getFormControlGroup(ctx);
        const name = this.getFormControlName(ctx);
        return controlGroup ? hasOwn(controlGroup.controls, name) : false;
    }
    addItem(ctx, name) {
        if (!ctx.layoutNode ||
            !isDefined(ctx.layoutNode.$ref) ||
            !hasValue(ctx.dataIndex) ||
            !hasValue(ctx.layoutIndex)) {
            return false;
        }
        // Create a new Angular form control from a template in templateRefLibrary
        const newFormGroup = buildFormGroup(this.templateRefLibrary[ctx.layoutNode.$ref]);
        // Add the new form control to the parent formArray or formGroup
        if (ctx.layoutNode.arrayItem) {
            // Add new array item to formArray
            this.getFormControlGroup(ctx).push(newFormGroup);
        }
        else {
            // Add new $ref item to formGroup
            this.getFormControlGroup(ctx).addControl(name || this.getFormControlName(ctx), newFormGroup);
        }
        // Copy a new layoutNode from layoutRefLibrary
        const newLayoutNode = getLayoutNode(ctx.layoutNode, this);
        newLayoutNode.arrayItem = ctx.layoutNode.arrayItem;
        if (ctx.layoutNode.arrayItemType) {
            newLayoutNode.arrayItemType = ctx.layoutNode.arrayItemType;
        }
        else {
            delete newLayoutNode.arrayItemType;
        }
        if (name) {
            newLayoutNode.name = name;
            newLayoutNode.dataPointer += '/' + JsonPointer.escape(name);
            newLayoutNode.options.title = fixTitle(name);
        }
        // Add the new layoutNode to the form layout
        JsonPointer.insert(this.layout, this.getLayoutPointer(ctx), newLayoutNode);
        return true;
    }
    moveArrayItem(ctx, oldIndex, newIndex) {
        if (!ctx.layoutNode ||
            !isDefined(ctx.layoutNode.dataPointer) ||
            !hasValue(ctx.dataIndex) ||
            !hasValue(ctx.layoutIndex) ||
            !isDefined(oldIndex) ||
            !isDefined(newIndex) ||
            oldIndex === newIndex) {
            return false;
        }
        // Move item in the formArray
        const formArray = this.getFormControlGroup(ctx);
        const arrayItem = formArray.at(oldIndex);
        formArray.removeAt(oldIndex);
        formArray.insert(newIndex, arrayItem);
        formArray.updateValueAndValidity();
        // Move layout item
        const layoutArray = this.getLayoutArray(ctx);
        layoutArray.splice(newIndex, 0, layoutArray.splice(oldIndex, 1)[0]);
        return true;
    }
    removeItem(ctx) {
        if (!ctx.layoutNode ||
            !isDefined(ctx.layoutNode.dataPointer) ||
            !hasValue(ctx.dataIndex) ||
            !hasValue(ctx.layoutIndex)) {
            return false;
        }
        // Remove the Angular form control from the parent formArray or formGroup
        if (ctx.layoutNode.arrayItem) {
            // Remove array item from formArray
            this.getFormControlGroup(ctx).removeAt(ctx.dataIndex[ctx.dataIndex.length - 1]);
        }
        else {
            // Remove $ref item from formGroup
            this.getFormControlGroup(ctx).removeControl(this.getFormControlName(ctx));
        }
        // Remove layoutNode from layout
        JsonPointer.remove(this.layout, this.getLayoutPointer(ctx));
        return true;
    }
}
JsonSchemaFormService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.2.0", ngImport: i0, type: JsonSchemaFormService, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
JsonSchemaFormService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "14.2.0", ngImport: i0, type: JsonSchemaFormService });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.2.0", ngImport: i0, type: JsonSchemaFormService, decorators: [{
            type: Injectable
        }], ctorParameters: function () { return []; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbi1zY2hlbWEtZm9ybS5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvYWpzZi1jb3JlL3NyYy9saWIvanNvbi1zY2hlbWEtZm9ybS5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFFM0MsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLE1BQU0sQ0FBQztBQUMvQixPQUFPLFNBQVMsTUFBTSxrQkFBa0IsQ0FBQztBQUN6QyxPQUFPLEdBQUcsTUFBTSxLQUFLLENBQUM7QUFDdEIsT0FBTyxVQUFVLE1BQU0sd0NBQXdDLENBQUM7QUFDaEUsT0FBTyxFQUNMLGNBQWMsRUFDZCxzQkFBc0IsRUFDdEIsY0FBYyxFQUNkLFVBQVUsRUFDVixRQUFRLEVBQ1IsT0FBTyxFQUNQLE1BQU0sRUFDTixXQUFXLEVBQ1gsV0FBVyxFQUNYLGFBQWEsRUFDYixtQkFBbUIsRUFDbkIscUJBQXFCLEVBQ3JCLHlCQUF5QixFQUN6QixRQUFRLEVBQ1IsT0FBTyxFQUNQLFNBQVMsRUFDVCxPQUFPLEVBQ1AsUUFBUSxFQUNSLFdBQVcsRUFDWixNQUFNLFVBQVUsQ0FBQztBQUNsQixPQUFPLEVBQ0wsb0JBQW9CLEVBQ3BCLG9CQUFvQixFQUNwQixvQkFBb0IsRUFDcEIsb0JBQW9CLEVBQ3BCLG9CQUFvQixFQUNwQixvQkFBb0IsRUFDcEIsb0JBQW9CLEVBQ3JCLE1BQU0sVUFBVSxDQUFDOztBQWtCbEIsTUFBTSxPQUFPLHFCQUFxQjtJQTRGaEM7UUEzRkEsMEJBQXFCLEdBQUcsS0FBSyxDQUFDO1FBQzlCLHFDQUFnQyxHQUFHLEtBQUssQ0FBQztRQUN6QyxtQ0FBOEIsR0FBRyxLQUFLLENBQUM7UUFDdkMsWUFBTyxHQUFRLEVBQUUsQ0FBQztRQUVsQixlQUFVLEdBQVE7WUFDaEIsU0FBUyxFQUFFLElBQUk7WUFDZixZQUFZLEVBQUUsSUFBSTtZQUNsQixjQUFjLEVBQUUsUUFBUTtTQUN6QixDQUFDO1FBQ0YsUUFBRyxHQUFRLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLHFDQUFxQztRQUMxRSxxQkFBZ0IsR0FBUSxJQUFJLENBQUMsQ0FBQyx5REFBeUQ7UUFFdkYsZUFBVSxHQUFRLEVBQUUsQ0FBQyxDQUFDLGtEQUFrRDtRQUN4RSxTQUFJLEdBQVEsRUFBRSxDQUFDLENBQUMsbUVBQW1FO1FBQ25GLFdBQU0sR0FBUSxFQUFFLENBQUMsQ0FBQyx1QkFBdUI7UUFDekMsV0FBTSxHQUFVLEVBQUUsQ0FBQyxDQUFDLHVCQUF1QjtRQUMzQyxzQkFBaUIsR0FBUSxFQUFFLENBQUMsQ0FBQyxvQ0FBb0M7UUFDakUsY0FBUyxHQUFRLElBQUksQ0FBQyxDQUFDLG9EQUFvRDtRQUMzRSxjQUFTLEdBQVEsSUFBSSxDQUFDLENBQUMsNkJBQTZCO1FBR3BELGNBQVMsR0FBUSxJQUFJLENBQUMsQ0FBQyx3REFBd0Q7UUFDL0UsWUFBTyxHQUFZLElBQUksQ0FBQyxDQUFDLDhCQUE4QjtRQUN2RCxjQUFTLEdBQVEsSUFBSSxDQUFDLENBQUMsOEJBQThCO1FBQ3JELHFCQUFnQixHQUFRLElBQUksQ0FBQyxDQUFDLHlDQUF5QztRQUN2RSxlQUFVLEdBQVEsSUFBSSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUU7UUFDL0IsMEJBQXFCLEdBQVEsSUFBSSxDQUFDLENBQUMsaUZBQWlGO1FBQ3BILGdCQUFXLEdBQWlCLElBQUksT0FBTyxFQUFFLENBQUMsQ0FBQyx1QkFBdUI7UUFDbEUsbUJBQWMsR0FBaUIsSUFBSSxPQUFPLEVBQUUsQ0FBQyxDQUFDLHFCQUFxQjtRQUNuRSwyQkFBc0IsR0FBaUIsSUFBSSxPQUFPLEVBQUUsQ0FBQyxDQUFDLDhCQUE4QjtRQUVwRixhQUFRLEdBQXdCLElBQUksR0FBRyxFQUFFLENBQUMsQ0FBQyx3REFBd0Q7UUFDbkcsWUFBTyxHQUFxQixJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUMsd0RBQXdEO1FBQy9GLHdCQUFtQixHQUF3QixJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUMsK0NBQStDO1FBQ3JHLDBCQUFxQixHQUF3QixJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUMsNENBQTRDO1FBQ3BHLHFCQUFnQixHQUFRLEVBQUUsQ0FBQyxDQUFDLGdEQUFnRDtRQUM1RSxxQkFBZ0IsR0FBUSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLDZDQUE2QztRQUNuRix1QkFBa0IsR0FBUSxFQUFFLENBQUMsQ0FBQyxvREFBb0Q7UUFDbEYscUJBQWdCLEdBQUcsS0FBSyxDQUFDLENBQUMseURBQXlEO1FBRW5GLGFBQVEsR0FBRyxPQUFPLENBQUMsQ0FBQyx5REFBeUQ7UUFFN0UsOEJBQThCO1FBQzlCLHVCQUFrQixHQUFRO1lBQ3hCLFlBQVksRUFBRSxJQUFJO1lBQ2xCLFNBQVMsRUFBRSxNQUFNO1lBQ2pCLCtDQUErQztZQUMvQyx5RUFBeUU7WUFDekUsS0FBSyxFQUFFLEtBQUs7WUFDWixvQkFBb0IsRUFBRSxJQUFJO1lBQzFCLFlBQVksRUFBRSxLQUFLO1lBQ25CLFlBQVksRUFBRSxLQUFLO1lBQ25CLGNBQWMsRUFBRSxLQUFLO1lBQ3JCLFNBQVMsRUFBRSxjQUFjO1lBQ3pCLGtCQUFrQixFQUFFLEtBQUs7WUFDekIsUUFBUSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFO1lBQ3pDLHFCQUFxQixFQUFFLEtBQUs7WUFDNUIsaUJBQWlCLEVBQUUsTUFBTTtZQUN6Qix3RUFBd0U7WUFDeEUsb0JBQW9CO1lBQ3BCLDJFQUEyRTtZQUMzRSxpQkFBaUIsRUFBRSxNQUFNO1lBQ3pCLHNEQUFzRDtZQUN0RCxvQkFBb0I7WUFDcEIsMkVBQTJFO1lBQzNFLGdCQUFnQixFQUFFLE1BQU07WUFDeEIseUNBQXlDO1lBQ3pDLDhEQUE4RDtZQUM5RCx3RkFBd0Y7WUFDeEYsT0FBTyxFQUFFLEVBQUU7WUFDWCxtQkFBbUIsRUFBRTtnQkFDbkIsMkNBQTJDO2dCQUMzQyxTQUFTLEVBQUUsQ0FBQztnQkFDWixPQUFPLEVBQUUsSUFBSTtnQkFDYixTQUFTLEVBQUUsSUFBSTtnQkFDZixTQUFTLEVBQUUsSUFBSTtnQkFDZixnQkFBZ0IsRUFBRSxJQUFJO2dCQUN0QiwwRkFBMEY7Z0JBQzFGLGtCQUFrQixFQUFFLElBQUk7Z0JBQ3hCLHVGQUF1RjtnQkFDdkYsUUFBUSxFQUFFLEtBQUs7Z0JBQ2YsZ0JBQWdCLEVBQUUsS0FBSztnQkFDdkIsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsUUFBUSxFQUFFLEtBQUs7Z0JBQ2YsUUFBUSxFQUFFLEtBQUs7Z0JBQ2YsaUJBQWlCLEVBQUUsSUFBSTtnQkFDdkIsa0JBQWtCLEVBQUUsRUFBRSxDQUFDLHVCQUF1QjthQUMvQztTQUNGLENBQUM7UUFHQSxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNoQyxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNyQyxDQUFDO0lBRUQsV0FBVyxDQUFDLFdBQW1CLE9BQU87UUFDcEMsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFDekIsTUFBTSwwQkFBMEIsR0FBRztZQUNqQyxFQUFFLEVBQUUsb0JBQW9CO1lBQ3hCLEVBQUUsRUFBRSxvQkFBb0I7WUFDeEIsRUFBRSxFQUFFLG9CQUFvQjtZQUN4QixFQUFFLEVBQUUsb0JBQW9CO1lBQ3hCLEVBQUUsRUFBRSxvQkFBb0I7WUFDeEIsRUFBRSxFQUFFLG9CQUFvQjtZQUN4QixFQUFFLEVBQUUsb0JBQW9CO1NBQ3pCLENBQUM7UUFDRixNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUUxQyxNQUFNLGtCQUFrQixHQUFHLDBCQUEwQixDQUFDLFlBQVksQ0FBQyxDQUFDO1FBRXBFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxtQkFBbUIsQ0FBQyxrQkFBa0IsR0FBRyxTQUFTLENBQ3hFLGtCQUFrQixDQUNuQixDQUFDO0lBQ0osQ0FBQztJQUVELE9BQU87UUFDTCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUM7SUFDbkIsQ0FBQztJQUVELFNBQVM7UUFDUCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDckIsQ0FBQztJQUVELFNBQVM7UUFDUCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDckIsQ0FBQztJQUVELGNBQWM7UUFDWixJQUFJLENBQUMscUJBQXFCLEdBQUcsS0FBSyxDQUFDO1FBQ25DLElBQUksQ0FBQyxnQ0FBZ0MsR0FBRyxLQUFLLENBQUM7UUFDOUMsSUFBSSxDQUFDLDhCQUE4QixHQUFHLEtBQUssQ0FBQztRQUM1QyxJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNsQixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO1FBQzdCLElBQUksQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO1FBQ2pCLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO1FBQ2pCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxFQUFFLENBQUM7UUFDNUIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7UUFDdEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7UUFDdEIsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7UUFDZixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztRQUN0QixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztRQUNwQixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO1FBQzdCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUMxQixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFDekIsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFDckMsSUFBSSxDQUFDLHFCQUFxQixHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFDdkMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLEVBQUUsQ0FBQztRQUMzQixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsRUFBRSxDQUFDO1FBQzNCLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxFQUFFLENBQUM7UUFDN0IsSUFBSSxDQUFDLFdBQVcsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7SUFDeEQsQ0FBQztJQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7T0FrQkc7SUFDSCxnQkFBZ0IsQ0FBQyxNQUFxQjtRQUNwQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxFQUFFO1lBQzdCLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFO2dCQUNsQyxLQUFLLE1BQU0sS0FBSyxJQUFJLEtBQUssRUFBRTtvQkFDekIsTUFBTSxHQUFHLEdBQUcsRUFBRSxDQUFDO29CQUNmLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQ3RDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztpQkFDN0Q7YUFDRjtRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELFlBQVksQ0FBQyxRQUFhLEVBQUUsbUJBQW1CLEdBQUcsSUFBSTtRQUNwRCw2Q0FBNkM7UUFDN0MsSUFBSSxDQUFDLElBQUksR0FBRyxjQUFjLENBQ3hCLFFBQVEsRUFDUixJQUFJLENBQUMsT0FBTyxFQUNaLElBQUksQ0FBQyxtQkFBbUIsRUFDeEIsSUFBSSxDQUFDLFFBQVEsRUFDYixJQUFJLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUNuQyxDQUFDO1FBQ0YsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hELElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQ2pELE1BQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyxFQUFFO1lBQzdCLE1BQU0sY0FBYyxHQUFHLEVBQUUsQ0FBQztZQUMxQixDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQzdCLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFO29CQUNuQyxjQUFjLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQztpQkFDckM7Z0JBQ0QsY0FBYyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3JELENBQUMsQ0FBQyxDQUFDO1lBQ0gsT0FBTyxjQUFjLENBQUM7UUFDeEIsQ0FBQyxDQUFDO1FBQ0YsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDO1FBQzlDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3BFLElBQUksbUJBQW1CLEVBQUU7WUFDdkIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2pDLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN2QyxJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUNsRDtJQUNILENBQUM7SUFFRCxzQkFBc0IsQ0FBQyxhQUFrQixJQUFJLEVBQUUsU0FBUyxHQUFHLElBQUk7UUFDN0QsSUFBSSxDQUFDLGlCQUFpQixHQUFHLHNCQUFzQixDQUM3QyxJQUFJLEVBQ0osVUFBVSxFQUNWLFNBQVMsQ0FDVixDQUFDO0lBQ0osQ0FBQztJQUVELGNBQWM7UUFDWixJQUFJLENBQUMsU0FBUyxHQUFxQixjQUFjLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDMUUsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ2xCLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQ3hCLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUV4Qyw2RUFBNkU7WUFDN0UsSUFBSSxJQUFJLENBQUMscUJBQXFCLEVBQUU7Z0JBQzlCLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxXQUFXLEVBQUUsQ0FBQzthQUMxQztZQUNELElBQUksQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQ2hFLFNBQVMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FDMUMsQ0FBQztTQUNIO0lBQ0gsQ0FBQztJQUVELFdBQVcsQ0FBQyxhQUFrQjtRQUM1QixJQUFJLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLENBQUM7SUFDakQsQ0FBQztJQUVELFVBQVUsQ0FBQyxVQUFlO1FBQ3hCLElBQUksUUFBUSxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQ3hCLE1BQU0sVUFBVSxHQUFHLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUN6Qyw4RUFBOEU7WUFDOUUsSUFBSSxRQUFRLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQyxFQUFFO2dCQUN2QyxNQUFNLENBQUMsTUFBTSxDQUNYLElBQUksQ0FBQyxXQUFXLENBQUMsbUJBQW1CLEVBQ3BDLFVBQVUsQ0FBQyxjQUFjLENBQzFCLENBQUM7Z0JBQ0YsT0FBTyxVQUFVLENBQUMsY0FBYyxDQUFDO2FBQ2xDO1lBQ0QsSUFBSSxRQUFRLENBQUMsVUFBVSxDQUFDLG1CQUFtQixDQUFDLEVBQUU7Z0JBQzVDLE1BQU0sQ0FBQyxNQUFNLENBQ1gsSUFBSSxDQUFDLFdBQVcsQ0FBQyxtQkFBbUIsRUFDcEMsVUFBVSxDQUFDLG1CQUFtQixDQUMvQixDQUFDO2dCQUNGLE9BQU8sVUFBVSxDQUFDLG1CQUFtQixDQUFDO2FBQ3ZDO1lBQ0QsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBRTVDLCtEQUErRDtZQUMvRCxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLG1CQUFtQixDQUFDO1lBQzVELENBQUMsWUFBWSxFQUFFLGNBQWMsQ0FBQztpQkFDM0IsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLGNBQWMsRUFBRSxTQUFTLEdBQUcsTUFBTSxDQUFDLENBQUM7aUJBQzVELE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDaEIsY0FBYyxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FDakQsU0FBUyxHQUFHLE1BQU0sQ0FDbkIsQ0FBQztnQkFDRixPQUFPLGNBQWMsQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLENBQUM7WUFDNUMsQ0FBQyxDQUFDLENBQUM7U0FDTjtJQUNILENBQUM7SUFFRCxnQkFBZ0I7UUFDZCxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFO1lBQzFCLGdGQUFnRjtZQUNoRixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRTtnQkFDckQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDN0QsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQzthQUMzQztZQUNELElBQUksQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNuQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ3ZEO0lBQ0gsQ0FBQztJQUVELG1CQUFtQixDQUFDLElBQVUsRUFBRSxnQkFBZ0IsR0FBRyxLQUFLO1FBQ3RELElBQUksSUFBSSxFQUFFO1lBQ1IsT0FBTyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztTQUNwRDtRQUNELElBQUksQ0FBQyxNQUFNLEdBQUcsbUJBQW1CLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ3ZFLENBQUM7SUFFRCxxQkFBcUIsQ0FBQyxNQUFZO1FBQ2hDLElBQUksTUFBTSxFQUFFO1lBQ1YsT0FBTyxxQkFBcUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUN0QztRQUNELElBQUksQ0FBQyxNQUFNLEdBQUcscUJBQXFCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ25ELENBQUM7SUFFRCxVQUFVLENBQUMsYUFBa0IsRUFBRTtRQUM3QixJQUFJLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQztJQUM1QixDQUFDO0lBRUQsU0FBUyxDQUNQLElBQUksR0FBRyxFQUFFLEVBQ1QsUUFBYSxFQUFFLEVBQ2YsU0FBYyxFQUFFLEVBQ2hCLE1BQXVCLElBQUk7UUFFM0IsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDbEMsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUNELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQ3pDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FDN0QsQ0FBQztJQUNKLENBQUM7SUFFRCxlQUFlLENBQ2IsVUFBVSxHQUFHLEVBQUUsRUFDZixRQUFhLEVBQUUsRUFDZixTQUFjLEVBQUUsRUFDaEIsTUFBdUIsSUFBSSxFQUMzQixVQUFlLElBQUk7UUFFbkIsSUFBSSxPQUFPLFVBQVUsS0FBSyxRQUFRLEVBQUU7WUFDbEMsT0FBTyxFQUFFLENBQUM7U0FDWDtRQUNELE1BQU0sS0FBSyxHQUFHLE9BQU8sR0FBRyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUM7UUFDakUsVUFBVSxHQUFHLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUMvQixJQUNFLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDO1lBQ2hELFVBQVUsQ0FBQyxDQUFDLENBQUMsS0FBSyxVQUFVLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7WUFDbkQsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQ3hFO1lBQ0EsT0FBTyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO1NBQ25EO1FBQ0QsSUFBSSxVQUFVLEtBQUssS0FBSyxJQUFJLFVBQVUsS0FBSyxRQUFRLEVBQUU7WUFDbkQsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUNELElBQUksVUFBVSxLQUFLLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLEVBQUU7WUFDdEQsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUNELElBQ0UsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FDcEMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUMxQyxFQUNEO1lBQ0EsTUFBTSxPQUFPLEdBQUcsV0FBVyxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUN4RCxPQUFPLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxPQUFPLElBQUksV0FBVyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdkUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssUUFBUSxJQUFJLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3BFLENBQUMsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUMzQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLFNBQVMsSUFBSSxXQUFXLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUN0RSxDQUFDLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDNUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQzs0QkFDaEMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQzs0QkFDbEMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztTQUNkO1FBQ0QsSUFBSSxVQUFVLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFO1lBQ3BDLFVBQVUsR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBVSxLQUFLLENBQUMsQ0FBQztTQUM1RDtRQUNELElBQUksVUFBVSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRTtZQUN2QyxVQUFVLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQVUsS0FBSyxDQUFDLENBQUM7U0FDL0Q7UUFDRCxzRUFBc0U7UUFDdEUsdUVBQXVFO1FBQ3ZFLElBQUksVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRTtZQUNqQyxPQUFPLFVBQVU7aUJBQ2QsS0FBSyxDQUFDLElBQUksQ0FBQztpQkFDWCxNQUFNLENBQ0wsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FDWixHQUFHLElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsT0FBTyxDQUFDLEVBQ2hFLEVBQUUsQ0FDSCxDQUFDO1NBQ0w7UUFDRCxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUU7WUFDakMsT0FBTyxVQUFVO2lCQUNkLEtBQUssQ0FBQyxJQUFJLENBQUM7aUJBQ1gsTUFBTSxDQUNMLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFLENBQ1osR0FBRyxJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLE9BQU8sQ0FBQyxFQUNoRSxHQUFHLENBQ0o7aUJBQ0EsSUFBSSxFQUFFLENBQUM7U0FDWDtRQUNELElBQUksVUFBVSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRTtZQUNoQyxPQUFPLFVBQVU7aUJBQ2QsS0FBSyxDQUFDLEdBQUcsQ0FBQztpQkFDVixHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztpQkFDcEUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1NBQ2I7UUFDRCxPQUFPLEVBQUUsQ0FBQztJQUNaLENBQUM7SUFFRCxpQkFBaUIsQ0FDZixZQUFpQixFQUFFLEVBQ25CLFlBQWlCLElBQUksRUFDckIsUUFBZ0IsSUFBSTtRQUVwQixNQUFNLFVBQVUsR0FBRyxTQUFTLENBQUMsVUFBVSxDQUFDO1FBQ3hDLE1BQU0sWUFBWSxHQUFRLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUM5RCxNQUFNLFdBQVcsR0FDZixDQUFDLFVBQVUsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssT0FBTyxJQUFJLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUN6RSxNQUFNLElBQUksR0FBRyxXQUFXLENBQUMsUUFBUSxDQUMvQixXQUFXLElBQUksU0FBUyxDQUFDLElBQUksS0FBSyxNQUFNO1lBQ3RDLENBQUMsQ0FBQztnQkFDQSxDQUFDLFNBQVMsRUFBRSxpQkFBaUIsQ0FBQztnQkFDOUIsQ0FBQyxTQUFTLEVBQUUsZ0JBQWdCLENBQUM7Z0JBQzdCLENBQUMsVUFBVSxFQUFFLGdCQUFnQixDQUFDO2dCQUM5QixDQUFDLFVBQVUsRUFBRSxpQkFBaUIsQ0FBQzthQUNoQztZQUNELENBQUMsQ0FBQztnQkFDQSxDQUFDLFNBQVMsRUFBRSxnQkFBZ0IsQ0FBQztnQkFDN0IsQ0FBQyxTQUFTLEVBQUUsaUJBQWlCLENBQUM7Z0JBQzlCLENBQUMsVUFBVSxFQUFFLGdCQUFnQixDQUFDO2dCQUM5QixDQUFDLFVBQVUsRUFBRSxpQkFBaUIsQ0FBQzthQUNoQyxDQUNKLENBQUM7UUFDRixJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ1QsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUNELE1BQU0sVUFBVSxHQUNkLE9BQU8sQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLEdBQUcsWUFBWSxDQUFDLE1BQU07WUFDbEQsQ0FBQyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7WUFDckIsQ0FBQyxDQUFDLFlBQVksQ0FBQztRQUNuQixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDL0QsQ0FBQztJQUVELFlBQVksQ0FBQyxHQUFRO1FBQ25CLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssSUFBSSxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO1lBQ2hFLENBQUMsQ0FBQyxJQUFJO1lBQ04sQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQ2QsR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLElBQUksV0FBVyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQ3JELElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsRUFDOUIsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLElBQVMsRUFBRSxDQUFDLENBQUMsS0FBSyxFQUNqRCxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUN4QyxDQUFDO0lBQ04sQ0FBQztJQUVELGlCQUFpQixDQUFDLFVBQWUsRUFBRSxTQUFtQjtRQUNwRCxNQUFNLFVBQVUsR0FBRyxTQUFTLElBQUksU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDaEUsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLElBQUksUUFBUSxDQUFDLENBQUMsVUFBVSxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsRUFBRTtZQUNsRCxJQUFJLE9BQU8sVUFBVSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEtBQUssUUFBUSxFQUFFO2dCQUNwRCxJQUFJLE9BQU8sR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQztnQkFDM0MsSUFBSSxRQUFRLENBQUMsVUFBVSxDQUFDLEVBQUU7b0JBQ3hCLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRSxJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUM7aUJBQzlEO2dCQUNELE9BQU8sR0FBRyxXQUFXLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUMvQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDL0MsSUFBSSxDQUFDLE1BQU0sSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssT0FBTyxFQUFFO29CQUNyQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2lCQUMzRDthQUNGO2lCQUFNLElBQUksT0FBTyxVQUFVLENBQUMsT0FBTyxDQUFDLFNBQVMsS0FBSyxVQUFVLEVBQUU7Z0JBQzdELE1BQU0sR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDbEQ7aUJBQU0sSUFDTCxPQUFPLFVBQVUsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLFlBQVksS0FBSyxRQUFRLEVBQzdEO2dCQUNBLElBQUk7b0JBQ0YsTUFBTSxLQUFLLEdBQUcsSUFBSSxRQUFRLENBQ3hCLE9BQU8sRUFDUCxjQUFjLEVBQ2QsVUFBVSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUMxQyxDQUFDO29CQUNGLE1BQU0sR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztpQkFDdEM7Z0JBQUMsT0FBTyxDQUFDLEVBQUU7b0JBQ1YsTUFBTSxHQUFHLElBQUksQ0FBQztvQkFDZCxPQUFPLENBQUMsS0FBSyxDQUNYLG9EQUFvRDt3QkFDcEQsVUFBVSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUMxQyxDQUFDO2lCQUNIO2FBQ0Y7U0FDRjtRQUNELE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFFRCxpQkFBaUIsQ0FBQyxHQUFRLEVBQUUsSUFBSSxHQUFHLElBQUk7UUFDckMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUNsQixPQUFPLEtBQUssQ0FBQztTQUNkO1FBQ0QsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ3hCLEdBQUcsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQztnQkFDcEQsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsT0FBTztnQkFDeEIsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7U0FDakM7UUFDRCxHQUFHLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDM0MsR0FBRyxDQUFDLFlBQVksR0FBRyxJQUFJLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUM7UUFDN0MsSUFBSSxHQUFHLENBQUMsV0FBVyxFQUFFO1lBQ25CLEdBQUcsQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQy9DLEdBQUcsQ0FBQyxZQUFZLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUM7WUFDekMsR0FBRyxDQUFDLGVBQWUsR0FBRyxHQUFHLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQztZQUMvQyxHQUFHLENBQUMsT0FBTyxDQUFDLFlBQVk7Z0JBQ3RCLEdBQUcsQ0FBQyxXQUFXLENBQUMsTUFBTSxLQUFLLE9BQU87b0JBQ2hDLENBQUMsQ0FBQyxJQUFJO29CQUNOLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUNqQixHQUFHLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFDdEIsR0FBRyxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FDL0IsQ0FBQztZQUNOLEdBQUcsQ0FBQyxPQUFPLENBQUMsVUFBVTtnQkFDcEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsS0FBSyxJQUFJO29CQUMxQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLEtBQUssTUFBTTt3QkFDM0MsUUFBUSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBQ2hDLEdBQUcsQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FDckMsTUFBTSxDQUFDLEVBQUUsQ0FDUCxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsWUFBWTtnQkFDdkIsTUFBTSxLQUFLLE9BQU87b0JBQ2hCLENBQUMsQ0FBQyxJQUFJO29CQUNOLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUNqQixHQUFHLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFDdEIsR0FBRyxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FDL0IsQ0FBQyxDQUNULENBQUM7WUFDRixHQUFHLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQzdDLElBQUksQ0FBQyxDQUFDLEtBQUssRUFBRTtvQkFDWCxHQUFHLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztpQkFDMUI7WUFDSCxDQUFDLENBQUMsQ0FBQztTQUNKO2FBQU07WUFDTCxHQUFHLENBQUMsV0FBVyxHQUFHLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO1lBQ3RDLEdBQUcsQ0FBQyxZQUFZLEdBQUcsR0FBRyxDQUFDLFVBQVUsQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDO1lBQ2hELE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDN0MsSUFBSSxJQUFJLElBQUksV0FBVyxFQUFFO2dCQUN2QixPQUFPLENBQUMsS0FBSyxDQUNYLHFCQUFxQixXQUFXLDBDQUEwQyxDQUMzRSxDQUFDO2FBQ0g7U0FDRjtRQUNELE9BQU8sR0FBRyxDQUFDLFlBQVksQ0FBQztJQUMxQixDQUFDO0lBRUQsWUFBWSxDQUFDLE1BQVcsRUFBRSxxQkFBMEIsRUFBRTtRQUNwRCxJQUFJLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUNuQixPQUFPLElBQUksQ0FBQztTQUNiO1FBQ0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFO1lBQ2pDLGtCQUFrQixHQUFHLEVBQUUsQ0FBQztTQUN6QjtRQUNELE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxFQUFFLENBQ3pCLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUU7WUFDdkIsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztpQkFDcEIsT0FBTyxDQUFDLGlCQUFpQixFQUFFLE9BQU8sQ0FBQztpQkFDbkMsT0FBTyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztRQUN4QixNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsRUFBRSxDQUMxQixPQUFPLEtBQUssS0FBSyxRQUFRO1lBQ3ZCLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztpQkFDakIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQ1QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLElBQUk7Z0JBQ2pCLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDO2dCQUNoQixDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEtBQUs7b0JBQ3BCLENBQUMsQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQztvQkFDekIsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUN0RDtpQkFDQSxJQUFJLENBQUMsSUFBSSxDQUFDO1lBQ2IsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUNsQyxNQUFNLFFBQVEsR0FBRyxFQUFFLENBQUM7UUFDcEIsT0FBTyxDQUNMLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ2pCLG1EQUFtRDthQUNsRCxNQUFNLENBQ0wsUUFBUSxDQUFDLEVBQUUsQ0FDVCxRQUFRLEtBQUssVUFBVSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FDOUQ7YUFDQSxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDZCwrQ0FBK0M7UUFDL0MsT0FBTyxrQkFBa0IsS0FBSyxRQUFRO1lBQ3BDLENBQUMsQ0FBQyxrQkFBa0I7WUFDcEIsQ0FBQyxDQUFDLGdFQUFnRTtnQkFDbEUsT0FBTyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsS0FBSyxVQUFVO29CQUNoRCxDQUFDLENBQUMsa0JBQWtCLENBQUMsUUFBUSxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUNoRCxDQUFDLENBQUMsdUVBQXVFO3dCQUN6RSxPQUFPLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxLQUFLLFFBQVE7NEJBQzlDLENBQUMsQ0FBQyx5REFBeUQ7Z0NBQzNELENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztvQ0FDM0MsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLFFBQVEsQ0FBQztvQ0FDOUIsQ0FBQyxDQUFDLGdEQUFnRDt3Q0FDbEQsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQ2xDLENBQUMsWUFBWSxFQUFFLGFBQWEsRUFBRSxFQUFFLENBQzlCLFlBQVksQ0FBQyxPQUFPLENBQ2xCLElBQUksTUFBTSxDQUFDLElBQUksR0FBRyxhQUFhLEdBQUcsSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUM1QyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsYUFBYSxDQUFDLENBQ2hDLEVBQ0gsa0JBQWtCLENBQUMsUUFBUSxDQUFDLENBQzdCOzRCQUNILENBQUMsQ0FBQyxrRUFBa0U7Z0NBQ3BFLFNBQVMsQ0FBQyxRQUFRLENBQUMsR0FBRyxVQUFVLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUN2RTthQUNBLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FDaEIsQ0FBQztJQUNKLENBQUM7SUFFRCxXQUFXLENBQUMsR0FBUSxFQUFFLEtBQVU7UUFDOUIsK0JBQStCO1FBQy9CLEdBQUcsQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO1FBQ3pCLElBQUksR0FBRyxDQUFDLFlBQVksRUFBRTtZQUNwQixHQUFHLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNoQyxHQUFHLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxDQUFDO1NBQy9CO1FBQ0QsR0FBRyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBRTdCLDBEQUEwRDtRQUMxRCxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQ3BDLEtBQUssTUFBTSxJQUFJLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUU7Z0JBQzFDLE1BQU0sYUFBYSxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUN2RCxJQUNFLFFBQVEsQ0FBQyxhQUFhLENBQUM7b0JBQ3ZCLE9BQU8sYUFBYSxDQUFDLFFBQVEsS0FBSyxVQUFVLEVBQzVDO29CQUNBLGFBQWEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQzlCLGFBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztpQkFDN0I7YUFDRjtTQUNGO0lBQ0gsQ0FBQztJQUVELHVCQUF1QixDQUFDLEdBQVEsRUFBRSxZQUE0QjtRQUM1RCxNQUFNLFNBQVMsR0FBcUIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUU3RCw0QkFBNEI7UUFDNUIsT0FBTyxTQUFTLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRTtZQUM3QixTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3ZCO1FBRUQsc0NBQXNDO1FBQ3RDLE1BQU0sVUFBVSxHQUFHLHlCQUF5QixDQUMxQyxHQUFHLENBQUMsVUFBVSxDQUFDLFdBQVcsR0FBRyxJQUFJLEVBQ2pDLElBQUksQ0FBQyxtQkFBbUIsRUFDeEIsSUFBSSxDQUFDLFFBQVEsQ0FDZCxDQUFDO1FBQ0YsS0FBSyxNQUFNLFlBQVksSUFBSSxZQUFZLEVBQUU7WUFDdkMsSUFBSSxZQUFZLENBQUMsT0FBTyxFQUFFO2dCQUN4QixNQUFNLGNBQWMsR0FBRyxjQUFjLENBQ25DLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsQ0FDcEMsQ0FBQztnQkFDRixjQUFjLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDNUMsU0FBUyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQzthQUNoQztTQUNGO1FBQ0QsU0FBUyxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQzFCLENBQUM7SUFFRCxjQUFjLENBQUMsR0FBUTtRQUNyQixJQUNFLENBQUMsR0FBRyxDQUFDLFVBQVU7WUFDZixDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQztZQUN0QyxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksS0FBSyxNQUFNLEVBQzlCO1lBQ0EsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUNELE9BQU8sVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQzlELENBQUM7SUFFRCxtQkFBbUIsQ0FBQyxHQUFRO1FBQzFCLElBQ0UsQ0FBQyxHQUFHLENBQUMsVUFBVTtZQUNmLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDO1lBQ3RDLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFDOUI7WUFDQSxPQUFPLElBQUksQ0FBQztTQUNiO1FBQ0QsTUFBTSxPQUFPLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3JFLE9BQU8sT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDeEMsQ0FBQztJQUVELG1CQUFtQixDQUFDLEdBQVE7UUFDMUIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsRUFBRTtZQUM3RCxPQUFPLElBQUksQ0FBQztTQUNiO1FBQ0QsT0FBTyxVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3BFLENBQUM7SUFFRCxrQkFBa0IsQ0FBQyxHQUFRO1FBQ3pCLElBQ0UsQ0FBQyxHQUFHLENBQUMsVUFBVTtZQUNmLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDO1lBQ3RDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFDeEI7WUFDQSxPQUFPLElBQUksQ0FBQztTQUNiO1FBQ0QsT0FBTyxXQUFXLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUNyRCxDQUFDO0lBRUQsY0FBYyxDQUFDLEdBQVE7UUFDckIsT0FBTyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3pFLENBQUM7SUFFRCxhQUFhLENBQUMsR0FBUTtRQUNwQixPQUFPLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDekUsQ0FBQztJQUVELGNBQWMsQ0FBQyxHQUFRO1FBQ3JCLElBQ0UsQ0FBQyxHQUFHLENBQUMsVUFBVTtZQUNmLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDO1lBQ3RDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFDeEI7WUFDQSxPQUFPLElBQUksQ0FBQztTQUNiO1FBQ0QsT0FBTyxXQUFXLENBQUMsZ0JBQWdCLENBQ2pDLEdBQUcsQ0FBQyxVQUFVLENBQUMsV0FBVyxFQUMxQixHQUFHLENBQUMsU0FBUyxFQUNiLElBQUksQ0FBQyxRQUFRLENBQ2QsQ0FBQztJQUNKLENBQUM7SUFFRCxnQkFBZ0IsQ0FBQyxHQUFRO1FBQ3ZCLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQzlCLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFDRCxPQUFPLEdBQUcsR0FBRyxHQUFHLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBRUQsY0FBYyxDQUFDLEdBQVE7UUFDckIsSUFDRSxDQUFDLEdBQUcsQ0FBQyxVQUFVO1lBQ2YsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUM7WUFDdEMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUN4QjtZQUNBLE9BQU8sS0FBSyxDQUFDO1NBQ2Q7UUFDRCxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbkQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzFDLE9BQU8sWUFBWSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0lBQ3BFLENBQUM7SUFFRCxPQUFPLENBQUMsR0FBUSxFQUFFLElBQWE7UUFDN0IsSUFDRSxDQUFDLEdBQUcsQ0FBQyxVQUFVO1lBQ2YsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUM7WUFDL0IsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQztZQUN4QixDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEVBQzFCO1lBQ0EsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUVELDBFQUEwRTtRQUMxRSxNQUFNLFlBQVksR0FBRyxjQUFjLENBQ2pDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUM3QyxDQUFDO1FBRUYsZ0VBQWdFO1FBQ2hFLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxTQUFTLEVBQUU7WUFDNUIsa0NBQWtDO1lBQ2YsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBRSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztTQUN0RTthQUFNO1lBQ0wsaUNBQWlDO1lBQ2QsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBRSxDQUFDLFVBQVUsQ0FDMUQsSUFBSSxJQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsRUFDcEMsWUFBWSxDQUNiLENBQUM7U0FDSDtRQUVELDhDQUE4QztRQUM5QyxNQUFNLGFBQWEsR0FBRyxhQUFhLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMxRCxhQUFhLENBQUMsU0FBUyxHQUFHLEdBQUcsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDO1FBQ25ELElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxhQUFhLEVBQUU7WUFDaEMsYUFBYSxDQUFDLGFBQWEsR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQztTQUM1RDthQUFNO1lBQ0wsT0FBTyxhQUFhLENBQUMsYUFBYSxDQUFDO1NBQ3BDO1FBQ0QsSUFBSSxJQUFJLEVBQUU7WUFDUixhQUFhLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztZQUMxQixhQUFhLENBQUMsV0FBVyxJQUFJLEdBQUcsR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzVELGFBQWEsQ0FBQyxPQUFPLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUM5QztRQUVELDRDQUE0QztRQUM1QyxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBRTNFLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELGFBQWEsQ0FBQyxHQUFRLEVBQUUsUUFBZ0IsRUFBRSxRQUFnQjtRQUN4RCxJQUNFLENBQUMsR0FBRyxDQUFDLFVBQVU7WUFDZixDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQztZQUN0QyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDO1lBQ3hCLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUM7WUFDMUIsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDO1lBQ3BCLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQztZQUNwQixRQUFRLEtBQUssUUFBUSxFQUNyQjtZQUNBLE9BQU8sS0FBSyxDQUFDO1NBQ2Q7UUFFRCw2QkFBNkI7UUFDN0IsTUFBTSxTQUFTLEdBQXFCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNsRSxNQUFNLFNBQVMsR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3pDLFNBQVMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDN0IsU0FBUyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDdEMsU0FBUyxDQUFDLHNCQUFzQixFQUFFLENBQUM7UUFFbkMsbUJBQW1CO1FBQ25CLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDN0MsV0FBVyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEUsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQsVUFBVSxDQUFDLEdBQVE7UUFDakIsSUFDRSxDQUFDLEdBQUcsQ0FBQyxVQUFVO1lBQ2YsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUM7WUFDdEMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQztZQUN4QixDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEVBQzFCO1lBQ0EsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUVELHlFQUF5RTtRQUN6RSxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsU0FBUyxFQUFFO1lBQzVCLG1DQUFtQztZQUNoQixJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFFLENBQUMsUUFBUSxDQUN4RCxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUN4QyxDQUFDO1NBQ0g7YUFBTTtZQUNMLGtDQUFrQztZQUNmLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUUsQ0FBQyxhQUFhLENBQzdELElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsQ0FDN0IsQ0FBQztTQUNIO1FBRUQsZ0NBQWdDO1FBQ2hDLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUM1RCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7O2tIQTV6QlUscUJBQXFCO3NIQUFyQixxQkFBcUI7MkZBQXJCLHFCQUFxQjtrQkFEakMsVUFBVSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEluamVjdGFibGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcclxuaW1wb3J0IHsgQWJzdHJhY3RDb250cm9sLCBVbnR5cGVkRm9ybUFycmF5LCBVbnR5cGVkRm9ybUdyb3VwIH0gZnJvbSAnQGFuZ3VsYXIvZm9ybXMnO1xyXG5pbXBvcnQgeyBTdWJqZWN0IH0gZnJvbSAncnhqcyc7XHJcbmltcG9ydCBjbG9uZURlZXAgZnJvbSAnbG9kYXNoL2Nsb25lRGVlcCc7XHJcbmltcG9ydCBBanYgZnJvbSAnYWp2JztcclxuaW1wb3J0IGpzb25EcmFmdDYgZnJvbSAnYWp2L2xpYi9yZWZzL2pzb24tc2NoZW1hLWRyYWZ0LTA2Lmpzb24nO1xyXG5pbXBvcnQge1xyXG4gIGJ1aWxkRm9ybUdyb3VwLFxyXG4gIGJ1aWxkRm9ybUdyb3VwVGVtcGxhdGUsXHJcbiAgZm9ybWF0Rm9ybURhdGEsXHJcbiAgZ2V0Q29udHJvbCxcclxuICBmaXhUaXRsZSxcclxuICBmb3JFYWNoLFxyXG4gIGhhc093bixcclxuICB0b1RpdGxlQ2FzZSxcclxuICBidWlsZExheW91dCxcclxuICBnZXRMYXlvdXROb2RlLFxyXG4gIGJ1aWxkU2NoZW1hRnJvbURhdGEsXHJcbiAgYnVpbGRTY2hlbWFGcm9tTGF5b3V0LFxyXG4gIHJlbW92ZVJlY3Vyc2l2ZVJlZmVyZW5jZXMsXHJcbiAgaGFzVmFsdWUsXHJcbiAgaXNBcnJheSxcclxuICBpc0RlZmluZWQsXHJcbiAgaXNFbXB0eSxcclxuICBpc09iamVjdCxcclxuICBKc29uUG9pbnRlclxyXG59IGZyb20gJy4vc2hhcmVkJztcclxuaW1wb3J0IHtcclxuICBkZVZhbGlkYXRpb25NZXNzYWdlcyxcclxuICBlblZhbGlkYXRpb25NZXNzYWdlcyxcclxuICBlc1ZhbGlkYXRpb25NZXNzYWdlcyxcclxuICBmclZhbGlkYXRpb25NZXNzYWdlcyxcclxuICBpdFZhbGlkYXRpb25NZXNzYWdlcyxcclxuICBwdFZhbGlkYXRpb25NZXNzYWdlcyxcclxuICB6aFZhbGlkYXRpb25NZXNzYWdlc1xyXG59IGZyb20gJy4vbG9jYWxlJztcclxuXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFRpdGxlTWFwSXRlbSB7XHJcbiAgbmFtZT86IHN0cmluZztcclxuICB2YWx1ZT86IGFueTtcclxuICBjaGVja2VkPzogYm9vbGVhbjtcclxuICBncm91cD86IHN0cmluZztcclxuICBpdGVtcz86IFRpdGxlTWFwSXRlbVtdO1xyXG59XHJcbmV4cG9ydCBpbnRlcmZhY2UgRXJyb3JNZXNzYWdlcyB7XHJcbiAgW2NvbnRyb2xfbmFtZTogc3RyaW5nXToge1xyXG4gICAgbWVzc2FnZTogc3RyaW5nIHwgRnVuY3Rpb24gfCBPYmplY3Q7XHJcbiAgICBjb2RlOiBzdHJpbmc7XHJcbiAgfVtdO1xyXG59XHJcblxyXG5ASW5qZWN0YWJsZSgpXHJcbmV4cG9ydCBjbGFzcyBKc29uU2NoZW1hRm9ybVNlcnZpY2Uge1xyXG4gIEpzb25Gb3JtQ29tcGF0aWJpbGl0eSA9IGZhbHNlO1xyXG4gIFJlYWN0SnNvblNjaGVtYUZvcm1Db21wYXRpYmlsaXR5ID0gZmFsc2U7XHJcbiAgQW5ndWxhclNjaGVtYUZvcm1Db21wYXRpYmlsaXR5ID0gZmFsc2U7XHJcbiAgdHBsZGF0YTogYW55ID0ge307XHJcblxyXG4gIGFqdk9wdGlvbnM6IGFueSA9IHtcclxuICAgIGFsbEVycm9yczogdHJ1ZSxcclxuICAgIGpzb25Qb2ludGVyczogdHJ1ZSxcclxuICAgIHVua25vd25Gb3JtYXRzOiAnaWdub3JlJ1xyXG4gIH07XHJcbiAgYWp2OiBhbnkgPSBuZXcgQWp2KHRoaXMuYWp2T3B0aW9ucyk7IC8vIEFKVjogQW5vdGhlciBKU09OIFNjaGVtYSBWYWxpZGF0b3JcclxuICB2YWxpZGF0ZUZvcm1EYXRhOiBhbnkgPSBudWxsOyAvLyBDb21waWxlZCBBSlYgZnVuY3Rpb24gdG8gdmFsaWRhdGUgYWN0aXZlIGZvcm0ncyBzY2hlbWFcclxuXHJcbiAgZm9ybVZhbHVlczogYW55ID0ge307IC8vIEludGVybmFsIGZvcm0gZGF0YSAobWF5IG5vdCBoYXZlIGNvcnJlY3QgdHlwZXMpXHJcbiAgZGF0YTogYW55ID0ge307IC8vIE91dHB1dCBmb3JtIGRhdGEgKGZvcm1WYWx1ZXMsIGZvcm1hdHRlZCB3aXRoIGNvcnJlY3QgZGF0YSB0eXBlcylcclxuICBzY2hlbWE6IGFueSA9IHt9OyAvLyBJbnRlcm5hbCBKU09OIFNjaGVtYVxyXG4gIGxheW91dDogYW55W10gPSBbXTsgLy8gSW50ZXJuYWwgZm9ybSBsYXlvdXRcclxuICBmb3JtR3JvdXBUZW1wbGF0ZTogYW55ID0ge307IC8vIFRlbXBsYXRlIHVzZWQgdG8gY3JlYXRlIGZvcm1Hcm91cFxyXG4gIGZvcm1Hcm91cDogYW55ID0gbnVsbDsgLy8gQW5ndWxhciBmb3JtR3JvdXAsIHdoaWNoIHBvd2VycyB0aGUgcmVhY3RpdmUgZm9ybVxyXG4gIGZyYW1ld29yazogYW55ID0gbnVsbDsgLy8gQWN0aXZlIGZyYW1ld29yayBjb21wb25lbnRcclxuICBmb3JtT3B0aW9uczogYW55OyAvLyBBY3RpdmUgb3B0aW9ucywgdXNlZCB0byBjb25maWd1cmUgdGhlIGZvcm1cclxuXHJcbiAgdmFsaWREYXRhOiBhbnkgPSBudWxsOyAvLyBWYWxpZCBmb3JtIGRhdGEgKG9yIG51bGwpICg9PT0gaXNWYWxpZCA/IGRhdGEgOiBudWxsKVxyXG4gIGlzVmFsaWQ6IGJvb2xlYW4gPSBudWxsOyAvLyBJcyBjdXJyZW50IGZvcm0gZGF0YSB2YWxpZD9cclxuICBhanZFcnJvcnM6IGFueSA9IG51bGw7IC8vIEFqdiBlcnJvcnMgZm9yIGN1cnJlbnQgZGF0YVxyXG4gIHZhbGlkYXRpb25FcnJvcnM6IGFueSA9IG51bGw7IC8vIEFueSB2YWxpZGF0aW9uIGVycm9ycyBmb3IgY3VycmVudCBkYXRhXHJcbiAgZGF0YUVycm9yczogYW55ID0gbmV3IE1hcCgpOyAvL1xyXG4gIGZvcm1WYWx1ZVN1YnNjcmlwdGlvbjogYW55ID0gbnVsbDsgLy8gU3Vic2NyaXB0aW9uIHRvIGZvcm1Hcm91cC52YWx1ZUNoYW5nZXMgb2JzZXJ2YWJsZSAoZm9yIHVuLSBhbmQgcmUtc3Vic2NyaWJpbmcpXHJcbiAgZGF0YUNoYW5nZXM6IFN1YmplY3Q8YW55PiA9IG5ldyBTdWJqZWN0KCk7IC8vIEZvcm0gZGF0YSBvYnNlcnZhYmxlXHJcbiAgaXNWYWxpZENoYW5nZXM6IFN1YmplY3Q8YW55PiA9IG5ldyBTdWJqZWN0KCk7IC8vIGlzVmFsaWQgb2JzZXJ2YWJsZVxyXG4gIHZhbGlkYXRpb25FcnJvckNoYW5nZXM6IFN1YmplY3Q8YW55PiA9IG5ldyBTdWJqZWN0KCk7IC8vIHZhbGlkYXRpb25FcnJvcnMgb2JzZXJ2YWJsZVxyXG5cclxuICBhcnJheU1hcDogTWFwPHN0cmluZywgbnVtYmVyPiA9IG5ldyBNYXAoKTsgLy8gTWFwcyBhcnJheXMgaW4gZGF0YSBvYmplY3QgYW5kIG51bWJlciBvZiB0dXBsZSB2YWx1ZXNcclxuICBkYXRhTWFwOiBNYXA8c3RyaW5nLCBhbnk+ID0gbmV3IE1hcCgpOyAvLyBNYXBzIHBhdGhzIGluIGZvcm0gZGF0YSB0byBzY2hlbWEgYW5kIGZvcm1Hcm91cCBwYXRoc1xyXG4gIGRhdGFSZWN1cnNpdmVSZWZNYXA6IE1hcDxzdHJpbmcsIHN0cmluZz4gPSBuZXcgTWFwKCk7IC8vIE1hcHMgcmVjdXJzaXZlIHJlZmVyZW5jZSBwb2ludHMgaW4gZm9ybSBkYXRhXHJcbiAgc2NoZW1hUmVjdXJzaXZlUmVmTWFwOiBNYXA8c3RyaW5nLCBzdHJpbmc+ID0gbmV3IE1hcCgpOyAvLyBNYXBzIHJlY3Vyc2l2ZSByZWZlcmVuY2UgcG9pbnRzIGluIHNjaGVtYVxyXG4gIHNjaGVtYVJlZkxpYnJhcnk6IGFueSA9IHt9OyAvLyBMaWJyYXJ5IG9mIHNjaGVtYXMgZm9yIHJlc29sdmluZyBzY2hlbWEgJHJlZnNcclxuICBsYXlvdXRSZWZMaWJyYXJ5OiBhbnkgPSB7ICcnOiBudWxsIH07IC8vIExpYnJhcnkgb2YgbGF5b3V0IG5vZGVzIGZvciBhZGRpbmcgdG8gZm9ybVxyXG4gIHRlbXBsYXRlUmVmTGlicmFyeTogYW55ID0ge307IC8vIExpYnJhcnkgb2YgZm9ybUdyb3VwIHRlbXBsYXRlcyBmb3IgYWRkaW5nIHRvIGZvcm1cclxuICBoYXNSb290UmVmZXJlbmNlID0gZmFsc2U7IC8vIERvZXMgdGhlIGZvcm0gaW5jbHVkZSBhIHJlY3Vyc2l2ZSByZWZlcmVuY2UgdG8gaXRzZWxmP1xyXG5cclxuICBsYW5ndWFnZSA9ICdlbi1VUyc7IC8vIERvZXMgdGhlIGZvcm0gaW5jbHVkZSBhIHJlY3Vyc2l2ZSByZWZlcmVuY2UgdG8gaXRzZWxmP1xyXG5cclxuICAvLyBEZWZhdWx0IGdsb2JhbCBmb3JtIG9wdGlvbnNcclxuICBkZWZhdWx0Rm9ybU9wdGlvbnM6IGFueSA9IHtcclxuICAgIGF1dG9jb21wbGV0ZTogdHJ1ZSwgLy8gQWxsb3cgdGhlIHdlYiBicm93c2VyIHRvIHJlbWVtYmVyIHByZXZpb3VzIGZvcm0gc3VibWlzc2lvbiB2YWx1ZXMgYXMgZGVmYXVsdHNcclxuICAgIGFkZFN1Ym1pdDogJ2F1dG8nLCAvLyBBZGQgYSBzdWJtaXQgYnV0dG9uIGlmIGxheW91dCBkb2VzIG5vdCBoYXZlIG9uZT9cclxuICAgIC8vIGZvciBhZGRTdWJtaXQ6IHRydWUgPSBhbHdheXMsIGZhbHNlID0gbmV2ZXIsXHJcbiAgICAvLyAnYXV0bycgPSBvbmx5IGlmIGxheW91dCBpcyB1bmRlZmluZWQgKGZvcm0gaXMgYnVpbHQgZnJvbSBzY2hlbWEgYWxvbmUpXHJcbiAgICBkZWJ1ZzogZmFsc2UsIC8vIFNob3cgZGVidWdnaW5nIG91dHB1dD9cclxuICAgIGRpc2FibGVJbnZhbGlkU3VibWl0OiB0cnVlLCAvLyBEaXNhYmxlIHN1Ym1pdCBpZiBmb3JtIGludmFsaWQ/XHJcbiAgICBmb3JtRGlzYWJsZWQ6IGZhbHNlLCAvLyBTZXQgZW50aXJlIGZvcm0gYXMgZGlzYWJsZWQ/IChub3QgZWRpdGFibGUsIGFuZCBkaXNhYmxlcyBvdXRwdXRzKVxyXG4gICAgZm9ybVJlYWRvbmx5OiBmYWxzZSwgLy8gU2V0IGVudGlyZSBmb3JtIGFzIHJlYWQgb25seT8gKG5vdCBlZGl0YWJsZSwgYnV0IG91dHB1dHMgc3RpbGwgZW5hYmxlZClcclxuICAgIGZpZWxkc1JlcXVpcmVkOiBmYWxzZSwgLy8gKHNldCBhdXRvbWF0aWNhbGx5KSBBcmUgdGhlcmUgYW55IHJlcXVpcmVkIGZpZWxkcyBpbiB0aGUgZm9ybT9cclxuICAgIGZyYW1ld29yazogJ25vLWZyYW1ld29yaycsIC8vIFRoZSBmcmFtZXdvcmsgdG8gbG9hZFxyXG4gICAgbG9hZEV4dGVybmFsQXNzZXRzOiBmYWxzZSwgLy8gTG9hZCBleHRlcm5hbCBjc3MgYW5kIEphdmFTY3JpcHQgZm9yIGZyYW1ld29yaz9cclxuICAgIHByaXN0aW5lOiB7IGVycm9yczogdHJ1ZSwgc3VjY2VzczogdHJ1ZSB9LFxyXG4gICAgc3VwcmVzc1Byb3BlcnR5VGl0bGVzOiBmYWxzZSxcclxuICAgIHNldFNjaGVtYURlZmF1bHRzOiAnYXV0bycsIC8vIFNldCBmZWZhdWx0IHZhbHVlcyBmcm9tIHNjaGVtYT9cclxuICAgIC8vIHRydWUgPSBhbHdheXMgc2V0ICh1bmxlc3Mgb3ZlcnJpZGRlbiBieSBsYXlvdXQgZGVmYXVsdCBvciBmb3JtVmFsdWVzKVxyXG4gICAgLy8gZmFsc2UgPSBuZXZlciBzZXRcclxuICAgIC8vICdhdXRvJyA9IHNldCBpbiBhZGRhYmxlIGNvbXBvbmVudHMsIGFuZCBldmVyeXdoZXJlIGlmIGZvcm1WYWx1ZXMgbm90IHNldFxyXG4gICAgc2V0TGF5b3V0RGVmYXVsdHM6ICdhdXRvJywgLy8gU2V0IGZlZmF1bHQgdmFsdWVzIGZyb20gbGF5b3V0P1xyXG4gICAgLy8gdHJ1ZSA9IGFsd2F5cyBzZXQgKHVubGVzcyBvdmVycmlkZGVuIGJ5IGZvcm1WYWx1ZXMpXHJcbiAgICAvLyBmYWxzZSA9IG5ldmVyIHNldFxyXG4gICAgLy8gJ2F1dG8nID0gc2V0IGluIGFkZGFibGUgY29tcG9uZW50cywgYW5kIGV2ZXJ5d2hlcmUgaWYgZm9ybVZhbHVlcyBub3Qgc2V0XHJcbiAgICB2YWxpZGF0ZU9uUmVuZGVyOiAnYXV0bycsIC8vIFZhbGlkYXRlIGZpZWxkcyBpbW1lZGlhdGVseSwgYmVmb3JlIHRoZXkgYXJlIHRvdWNoZWQ/XHJcbiAgICAvLyB0cnVlID0gdmFsaWRhdGUgYWxsIGZpZWxkcyBpbW1lZGlhdGVseVxyXG4gICAgLy8gZmFsc2UgPSBvbmx5IHZhbGlkYXRlIGZpZWxkcyBhZnRlciB0aGV5IGFyZSB0b3VjaGVkIGJ5IHVzZXJcclxuICAgIC8vICdhdXRvJyA9IHZhbGlkYXRlIGZpZWxkcyB3aXRoIHZhbHVlcyBpbW1lZGlhdGVseSwgZW1wdHkgZmllbGRzIGFmdGVyIHRoZXkgYXJlIHRvdWNoZWRcclxuICAgIHdpZGdldHM6IHt9LCAvLyBBbnkgY3VzdG9tIHdpZGdldHMgdG8gbG9hZFxyXG4gICAgZGVmYXV0V2lkZ2V0T3B0aW9uczoge1xyXG4gICAgICAvLyBEZWZhdWx0IG9wdGlvbnMgZm9yIGZvcm0gY29udHJvbCB3aWRnZXRzXHJcbiAgICAgIGxpc3RJdGVtczogMSwgLy8gTnVtYmVyIG9mIGxpc3QgaXRlbXMgdG8gaW5pdGlhbGx5IGFkZCB0byBhcnJheXMgd2l0aCBubyBkZWZhdWx0IHZhbHVlXHJcbiAgICAgIGFkZGFibGU6IHRydWUsIC8vIEFsbG93IGFkZGluZyBpdGVtcyB0byBhbiBhcnJheSBvciAkcmVmIHBvaW50P1xyXG4gICAgICBvcmRlcmFibGU6IHRydWUsIC8vIEFsbG93IHJlb3JkZXJpbmcgaXRlbXMgd2l0aGluIGFuIGFycmF5P1xyXG4gICAgICByZW1vdmFibGU6IHRydWUsIC8vIEFsbG93IHJlbW92aW5nIGl0ZW1zIGZyb20gYW4gYXJyYXkgb3IgJHJlZiBwb2ludD9cclxuICAgICAgZW5hYmxlRXJyb3JTdGF0ZTogdHJ1ZSwgLy8gQXBwbHkgJ2hhcy1lcnJvcicgY2xhc3Mgd2hlbiBmaWVsZCBmYWlscyB2YWxpZGF0aW9uP1xyXG4gICAgICAvLyBkaXNhYmxlRXJyb3JTdGF0ZTogZmFsc2UsIC8vIERvbid0IGFwcGx5ICdoYXMtZXJyb3InIGNsYXNzIHdoZW4gZmllbGQgZmFpbHMgdmFsaWRhdGlvbj9cclxuICAgICAgZW5hYmxlU3VjY2Vzc1N0YXRlOiB0cnVlLCAvLyBBcHBseSAnaGFzLXN1Y2Nlc3MnIGNsYXNzIHdoZW4gZmllbGQgdmFsaWRhdGVzP1xyXG4gICAgICAvLyBkaXNhYmxlU3VjY2Vzc1N0YXRlOiBmYWxzZSwgLy8gRG9uJ3QgYXBwbHkgJ2hhcy1zdWNjZXNzJyBjbGFzcyB3aGVuIGZpZWxkIHZhbGlkYXRlcz9cclxuICAgICAgZmVlZGJhY2s6IGZhbHNlLCAvLyBTaG93IGlubGluZSBmZWVkYmFjayBpY29ucz9cclxuICAgICAgZmVlZGJhY2tPblJlbmRlcjogZmFsc2UsIC8vIFNob3cgZXJyb3JNZXNzYWdlIG9uIFJlbmRlcj9cclxuICAgICAgbm90aXRsZTogZmFsc2UsIC8vIEhpZGUgdGl0bGU/XHJcbiAgICAgIGRpc2FibGVkOiBmYWxzZSwgLy8gU2V0IGNvbnRyb2wgYXMgZGlzYWJsZWQ/IChub3QgZWRpdGFibGUsIGFuZCBleGNsdWRlZCBmcm9tIG91dHB1dClcclxuICAgICAgcmVhZG9ubHk6IGZhbHNlLCAvLyBTZXQgY29udHJvbCBhcyByZWFkIG9ubHk/IChub3QgZWRpdGFibGUsIGJ1dCBpbmNsdWRlZCBpbiBvdXRwdXQpXHJcbiAgICAgIHJldHVybkVtcHR5RmllbGRzOiB0cnVlLCAvLyByZXR1cm4gdmFsdWVzIGZvciBmaWVsZHMgdGhhdCBjb250YWluIG5vIGRhdGE/XHJcbiAgICAgIHZhbGlkYXRpb25NZXNzYWdlczoge30gLy8gc2V0IGJ5IHNldExhbmd1YWdlKClcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBjb25zdHJ1Y3RvcigpIHtcclxuICAgIHRoaXMuc2V0TGFuZ3VhZ2UodGhpcy5sYW5ndWFnZSk7XHJcbiAgICB0aGlzLmFqdi5hZGRNZXRhU2NoZW1hKGpzb25EcmFmdDYpO1xyXG4gIH1cclxuXHJcbiAgc2V0TGFuZ3VhZ2UobGFuZ3VhZ2U6IHN0cmluZyA9ICdlbi1VUycpIHtcclxuICAgIHRoaXMubGFuZ3VhZ2UgPSBsYW5ndWFnZTtcclxuICAgIGNvbnN0IGxhbmd1YWdlVmFsaWRhdGlvbk1lc3NhZ2VzID0ge1xyXG4gICAgICBkZTogZGVWYWxpZGF0aW9uTWVzc2FnZXMsXHJcbiAgICAgIGVuOiBlblZhbGlkYXRpb25NZXNzYWdlcyxcclxuICAgICAgZXM6IGVzVmFsaWRhdGlvbk1lc3NhZ2VzLFxyXG4gICAgICBmcjogZnJWYWxpZGF0aW9uTWVzc2FnZXMsXHJcbiAgICAgIGl0OiBpdFZhbGlkYXRpb25NZXNzYWdlcyxcclxuICAgICAgcHQ6IHB0VmFsaWRhdGlvbk1lc3NhZ2VzLFxyXG4gICAgICB6aDogemhWYWxpZGF0aW9uTWVzc2FnZXMsXHJcbiAgICB9O1xyXG4gICAgY29uc3QgbGFuZ3VhZ2VDb2RlID0gbGFuZ3VhZ2Uuc2xpY2UoMCwgMik7XHJcblxyXG4gICAgY29uc3QgdmFsaWRhdGlvbk1lc3NhZ2VzID0gbGFuZ3VhZ2VWYWxpZGF0aW9uTWVzc2FnZXNbbGFuZ3VhZ2VDb2RlXTtcclxuXHJcbiAgICB0aGlzLmRlZmF1bHRGb3JtT3B0aW9ucy5kZWZhdXRXaWRnZXRPcHRpb25zLnZhbGlkYXRpb25NZXNzYWdlcyA9IGNsb25lRGVlcChcclxuICAgICAgdmFsaWRhdGlvbk1lc3NhZ2VzXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgZ2V0RGF0YSgpIHtcclxuICAgIHJldHVybiB0aGlzLmRhdGE7XHJcbiAgfVxyXG5cclxuICBnZXRTY2hlbWEoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zY2hlbWE7XHJcbiAgfVxyXG5cclxuICBnZXRMYXlvdXQoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5sYXlvdXQ7XHJcbiAgfVxyXG5cclxuICByZXNldEFsbFZhbHVlcygpIHtcclxuICAgIHRoaXMuSnNvbkZvcm1Db21wYXRpYmlsaXR5ID0gZmFsc2U7XHJcbiAgICB0aGlzLlJlYWN0SnNvblNjaGVtYUZvcm1Db21wYXRpYmlsaXR5ID0gZmFsc2U7XHJcbiAgICB0aGlzLkFuZ3VsYXJTY2hlbWFGb3JtQ29tcGF0aWJpbGl0eSA9IGZhbHNlO1xyXG4gICAgdGhpcy50cGxkYXRhID0ge307XHJcbiAgICB0aGlzLnZhbGlkYXRlRm9ybURhdGEgPSBudWxsO1xyXG4gICAgdGhpcy5mb3JtVmFsdWVzID0ge307XHJcbiAgICB0aGlzLnNjaGVtYSA9IHt9O1xyXG4gICAgdGhpcy5sYXlvdXQgPSBbXTtcclxuICAgIHRoaXMuZm9ybUdyb3VwVGVtcGxhdGUgPSB7fTtcclxuICAgIHRoaXMuZm9ybUdyb3VwID0gbnVsbDtcclxuICAgIHRoaXMuZnJhbWV3b3JrID0gbnVsbDtcclxuICAgIHRoaXMuZGF0YSA9IHt9O1xyXG4gICAgdGhpcy52YWxpZERhdGEgPSBudWxsO1xyXG4gICAgdGhpcy5pc1ZhbGlkID0gbnVsbDtcclxuICAgIHRoaXMudmFsaWRhdGlvbkVycm9ycyA9IG51bGw7XHJcbiAgICB0aGlzLmFycmF5TWFwID0gbmV3IE1hcCgpO1xyXG4gICAgdGhpcy5kYXRhTWFwID0gbmV3IE1hcCgpO1xyXG4gICAgdGhpcy5kYXRhUmVjdXJzaXZlUmVmTWFwID0gbmV3IE1hcCgpO1xyXG4gICAgdGhpcy5zY2hlbWFSZWN1cnNpdmVSZWZNYXAgPSBuZXcgTWFwKCk7XHJcbiAgICB0aGlzLmxheW91dFJlZkxpYnJhcnkgPSB7fTtcclxuICAgIHRoaXMuc2NoZW1hUmVmTGlicmFyeSA9IHt9O1xyXG4gICAgdGhpcy50ZW1wbGF0ZVJlZkxpYnJhcnkgPSB7fTtcclxuICAgIHRoaXMuZm9ybU9wdGlvbnMgPSBjbG9uZURlZXAodGhpcy5kZWZhdWx0Rm9ybU9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogJ2J1aWxkUmVtb3RlRXJyb3InIGZ1bmN0aW9uXHJcbiAgICpcclxuICAgKiBFeGFtcGxlIGVycm9yczpcclxuICAgKiB7XHJcbiAgICogICBsYXN0X25hbWU6IFsge1xyXG4gICAqICAgICBtZXNzYWdlOiAnTGFzdCBuYW1lIG11c3QgYnkgc3RhcnQgd2l0aCBjYXBpdGFsIGxldHRlci4nLFxyXG4gICAqICAgICBjb2RlOiAnY2FwaXRhbF9sZXR0ZXInXHJcbiAgICogICB9IF0sXHJcbiAgICogICBlbWFpbDogWyB7XHJcbiAgICogICAgIG1lc3NhZ2U6ICdFbWFpbCBtdXN0IGJlIGZyb20gZXhhbXBsZS5jb20gZG9tYWluLicsXHJcbiAgICogICAgIGNvZGU6ICdzcGVjaWFsX2RvbWFpbidcclxuICAgKiAgIH0sIHtcclxuICAgKiAgICAgbWVzc2FnZTogJ0VtYWlsIG11c3QgY29udGFpbiBhbiBAIHN5bWJvbC4nLFxyXG4gICAqICAgICBjb2RlOiAnYXRfc3ltYm9sJ1xyXG4gICAqICAgfSBdXHJcbiAgICogfVxyXG4gICAqIC8ve0Vycm9yTWVzc2FnZXN9IGVycm9yc1xyXG4gICAqL1xyXG4gIGJ1aWxkUmVtb3RlRXJyb3IoZXJyb3JzOiBFcnJvck1lc3NhZ2VzKSB7XHJcbiAgICBmb3JFYWNoKGVycm9ycywgKHZhbHVlLCBrZXkpID0+IHtcclxuICAgICAgaWYgKGtleSBpbiB0aGlzLmZvcm1Hcm91cC5jb250cm9scykge1xyXG4gICAgICAgIGZvciAoY29uc3QgZXJyb3Igb2YgdmFsdWUpIHtcclxuICAgICAgICAgIGNvbnN0IGVyciA9IHt9O1xyXG4gICAgICAgICAgZXJyW2Vycm9yWydjb2RlJ11dID0gZXJyb3JbJ21lc3NhZ2UnXTtcclxuICAgICAgICAgIHRoaXMuZm9ybUdyb3VwLmdldChrZXkpLnNldEVycm9ycyhlcnIsIHsgZW1pdEV2ZW50OiB0cnVlIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICB2YWxpZGF0ZURhdGEobmV3VmFsdWU6IGFueSwgdXBkYXRlU3Vic2NyaXB0aW9ucyA9IHRydWUpOiB2b2lkIHtcclxuICAgIC8vIEZvcm1hdCByYXcgZm9ybSBkYXRhIHRvIGNvcnJlY3QgZGF0YSB0eXBlc1xyXG4gICAgdGhpcy5kYXRhID0gZm9ybWF0Rm9ybURhdGEoXHJcbiAgICAgIG5ld1ZhbHVlLFxyXG4gICAgICB0aGlzLmRhdGFNYXAsXHJcbiAgICAgIHRoaXMuZGF0YVJlY3Vyc2l2ZVJlZk1hcCxcclxuICAgICAgdGhpcy5hcnJheU1hcCxcclxuICAgICAgdGhpcy5mb3JtT3B0aW9ucy5yZXR1cm5FbXB0eUZpZWxkc1xyXG4gICAgKTtcclxuICAgIHRoaXMuaXNWYWxpZCA9IHRoaXMudmFsaWRhdGVGb3JtRGF0YSh0aGlzLmRhdGEpO1xyXG4gICAgdGhpcy52YWxpZERhdGEgPSB0aGlzLmlzVmFsaWQgPyB0aGlzLmRhdGEgOiBudWxsO1xyXG4gICAgY29uc3QgY29tcGlsZUVycm9ycyA9IGVycm9ycyA9PiB7XHJcbiAgICAgIGNvbnN0IGNvbXBpbGVkRXJyb3JzID0ge307XHJcbiAgICAgIChlcnJvcnMgfHwgW10pLmZvckVhY2goZXJyb3IgPT4ge1xyXG4gICAgICAgIGlmICghY29tcGlsZWRFcnJvcnNbZXJyb3IuZGF0YVBhdGhdKSB7XHJcbiAgICAgICAgICBjb21waWxlZEVycm9yc1tlcnJvci5kYXRhUGF0aF0gPSBbXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29tcGlsZWRFcnJvcnNbZXJyb3IuZGF0YVBhdGhdLnB1c2goZXJyb3IubWVzc2FnZSk7XHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm4gY29tcGlsZWRFcnJvcnM7XHJcbiAgICB9O1xyXG4gICAgdGhpcy5hanZFcnJvcnMgPSB0aGlzLnZhbGlkYXRlRm9ybURhdGEuZXJyb3JzO1xyXG4gICAgdGhpcy52YWxpZGF0aW9uRXJyb3JzID0gY29tcGlsZUVycm9ycyh0aGlzLnZhbGlkYXRlRm9ybURhdGEuZXJyb3JzKTtcclxuICAgIGlmICh1cGRhdGVTdWJzY3JpcHRpb25zKSB7XHJcbiAgICAgIHRoaXMuZGF0YUNoYW5nZXMubmV4dCh0aGlzLmRhdGEpO1xyXG4gICAgICB0aGlzLmlzVmFsaWRDaGFuZ2VzLm5leHQodGhpcy5pc1ZhbGlkKTtcclxuICAgICAgdGhpcy52YWxpZGF0aW9uRXJyb3JDaGFuZ2VzLm5leHQodGhpcy5hanZFcnJvcnMpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgYnVpbGRGb3JtR3JvdXBUZW1wbGF0ZShmb3JtVmFsdWVzOiBhbnkgPSBudWxsLCBzZXRWYWx1ZXMgPSB0cnVlKSB7XHJcbiAgICB0aGlzLmZvcm1Hcm91cFRlbXBsYXRlID0gYnVpbGRGb3JtR3JvdXBUZW1wbGF0ZShcclxuICAgICAgdGhpcyxcclxuICAgICAgZm9ybVZhbHVlcyxcclxuICAgICAgc2V0VmFsdWVzXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgYnVpbGRGb3JtR3JvdXAoKSB7XHJcbiAgICB0aGlzLmZvcm1Hcm91cCA9IDxVbnR5cGVkRm9ybUdyb3VwPmJ1aWxkRm9ybUdyb3VwKHRoaXMuZm9ybUdyb3VwVGVtcGxhdGUpO1xyXG4gICAgaWYgKHRoaXMuZm9ybUdyb3VwKSB7XHJcbiAgICAgIHRoaXMuY29tcGlsZUFqdlNjaGVtYSgpO1xyXG4gICAgICB0aGlzLnZhbGlkYXRlRGF0YSh0aGlzLmZvcm1Hcm91cC52YWx1ZSk7XHJcblxyXG4gICAgICAvLyBTZXQgdXAgb2JzZXJ2YWJsZXMgdG8gZW1pdCBkYXRhIGFuZCB2YWxpZGF0aW9uIGluZm8gd2hlbiBmb3JtIGRhdGEgY2hhbmdlc1xyXG4gICAgICBpZiAodGhpcy5mb3JtVmFsdWVTdWJzY3JpcHRpb24pIHtcclxuICAgICAgICB0aGlzLmZvcm1WYWx1ZVN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuZm9ybVZhbHVlU3Vic2NyaXB0aW9uID0gdGhpcy5mb3JtR3JvdXAudmFsdWVDaGFuZ2VzLnN1YnNjcmliZShcclxuICAgICAgICBmb3JtVmFsdWUgPT4gdGhpcy52YWxpZGF0ZURhdGEoZm9ybVZhbHVlKVxyXG4gICAgICApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgYnVpbGRMYXlvdXQod2lkZ2V0TGlicmFyeTogYW55KSB7XHJcbiAgICB0aGlzLmxheW91dCA9IGJ1aWxkTGF5b3V0KHRoaXMsIHdpZGdldExpYnJhcnkpO1xyXG4gIH1cclxuXHJcbiAgc2V0T3B0aW9ucyhuZXdPcHRpb25zOiBhbnkpIHtcclxuICAgIGlmIChpc09iamVjdChuZXdPcHRpb25zKSkge1xyXG4gICAgICBjb25zdCBhZGRPcHRpb25zID0gY2xvbmVEZWVwKG5ld09wdGlvbnMpO1xyXG4gICAgICAvLyBCYWNrd2FyZCBjb21wYXRpYmlsaXR5IGZvciAnZGVmYXVsdE9wdGlvbnMnIChyZW5hbWVkICdkZWZhdXRXaWRnZXRPcHRpb25zJylcclxuICAgICAgaWYgKGlzT2JqZWN0KGFkZE9wdGlvbnMuZGVmYXVsdE9wdGlvbnMpKSB7XHJcbiAgICAgICAgT2JqZWN0LmFzc2lnbihcclxuICAgICAgICAgIHRoaXMuZm9ybU9wdGlvbnMuZGVmYXV0V2lkZ2V0T3B0aW9ucyxcclxuICAgICAgICAgIGFkZE9wdGlvbnMuZGVmYXVsdE9wdGlvbnNcclxuICAgICAgICApO1xyXG4gICAgICAgIGRlbGV0ZSBhZGRPcHRpb25zLmRlZmF1bHRPcHRpb25zO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChpc09iamVjdChhZGRPcHRpb25zLmRlZmF1dFdpZGdldE9wdGlvbnMpKSB7XHJcbiAgICAgICAgT2JqZWN0LmFzc2lnbihcclxuICAgICAgICAgIHRoaXMuZm9ybU9wdGlvbnMuZGVmYXV0V2lkZ2V0T3B0aW9ucyxcclxuICAgICAgICAgIGFkZE9wdGlvbnMuZGVmYXV0V2lkZ2V0T3B0aW9uc1xyXG4gICAgICAgICk7XHJcbiAgICAgICAgZGVsZXRlIGFkZE9wdGlvbnMuZGVmYXV0V2lkZ2V0T3B0aW9ucztcclxuICAgICAgfVxyXG4gICAgICBPYmplY3QuYXNzaWduKHRoaXMuZm9ybU9wdGlvbnMsIGFkZE9wdGlvbnMpO1xyXG5cclxuICAgICAgLy8gY29udmVydCBkaXNhYmxlRXJyb3JTdGF0ZSAvIGRpc2FibGVTdWNjZXNzU3RhdGUgdG8gZW5hYmxlLi4uXHJcbiAgICAgIGNvbnN0IGdsb2JhbERlZmF1bHRzID0gdGhpcy5mb3JtT3B0aW9ucy5kZWZhdXRXaWRnZXRPcHRpb25zO1xyXG4gICAgICBbJ0Vycm9yU3RhdGUnLCAnU3VjY2Vzc1N0YXRlJ11cclxuICAgICAgICAuZmlsdGVyKHN1ZmZpeCA9PiBoYXNPd24oZ2xvYmFsRGVmYXVsdHMsICdkaXNhYmxlJyArIHN1ZmZpeCkpXHJcbiAgICAgICAgLmZvckVhY2goc3VmZml4ID0+IHtcclxuICAgICAgICAgIGdsb2JhbERlZmF1bHRzWydlbmFibGUnICsgc3VmZml4XSA9ICFnbG9iYWxEZWZhdWx0c1tcclxuICAgICAgICAgICAgJ2Rpc2FibGUnICsgc3VmZml4XHJcbiAgICAgICAgICBdO1xyXG4gICAgICAgICAgZGVsZXRlIGdsb2JhbERlZmF1bHRzWydkaXNhYmxlJyArIHN1ZmZpeF07XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBjb21waWxlQWp2U2NoZW1hKCkge1xyXG4gICAgaWYgKCF0aGlzLnZhbGlkYXRlRm9ybURhdGEpIHtcclxuICAgICAgLy8gaWYgJ3VpOm9yZGVyJyBleGlzdHMgaW4gcHJvcGVydGllcywgbW92ZSBpdCB0byByb290IGJlZm9yZSBjb21waWxpbmcgd2l0aCBhanZcclxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkodGhpcy5zY2hlbWEucHJvcGVydGllc1sndWk6b3JkZXInXSkpIHtcclxuICAgICAgICB0aGlzLnNjaGVtYVsndWk6b3JkZXInXSA9IHRoaXMuc2NoZW1hLnByb3BlcnRpZXNbJ3VpOm9yZGVyJ107XHJcbiAgICAgICAgZGVsZXRlIHRoaXMuc2NoZW1hLnByb3BlcnRpZXNbJ3VpOm9yZGVyJ107XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5hanYucmVtb3ZlU2NoZW1hKHRoaXMuc2NoZW1hKTtcclxuICAgICAgdGhpcy52YWxpZGF0ZUZvcm1EYXRhID0gdGhpcy5hanYuY29tcGlsZSh0aGlzLnNjaGVtYSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBidWlsZFNjaGVtYUZyb21EYXRhKGRhdGE/OiBhbnksIHJlcXVpcmVBbGxGaWVsZHMgPSBmYWxzZSk6IGFueSB7XHJcbiAgICBpZiAoZGF0YSkge1xyXG4gICAgICByZXR1cm4gYnVpbGRTY2hlbWFGcm9tRGF0YShkYXRhLCByZXF1aXJlQWxsRmllbGRzKTtcclxuICAgIH1cclxuICAgIHRoaXMuc2NoZW1hID0gYnVpbGRTY2hlbWFGcm9tRGF0YSh0aGlzLmZvcm1WYWx1ZXMsIHJlcXVpcmVBbGxGaWVsZHMpO1xyXG4gIH1cclxuXHJcbiAgYnVpbGRTY2hlbWFGcm9tTGF5b3V0KGxheW91dD86IGFueSk6IGFueSB7XHJcbiAgICBpZiAobGF5b3V0KSB7XHJcbiAgICAgIHJldHVybiBidWlsZFNjaGVtYUZyb21MYXlvdXQobGF5b3V0KTtcclxuICAgIH1cclxuICAgIHRoaXMuc2NoZW1hID0gYnVpbGRTY2hlbWFGcm9tTGF5b3V0KHRoaXMubGF5b3V0KTtcclxuICB9XHJcblxyXG4gIHNldFRwbGRhdGEobmV3VHBsZGF0YTogYW55ID0ge30pOiB2b2lkIHtcclxuICAgIHRoaXMudHBsZGF0YSA9IG5ld1RwbGRhdGE7XHJcbiAgfVxyXG5cclxuICBwYXJzZVRleHQoXHJcbiAgICB0ZXh0ID0gJycsXHJcbiAgICB2YWx1ZTogYW55ID0ge30sXHJcbiAgICB2YWx1ZXM6IGFueSA9IHt9LFxyXG4gICAga2V5OiBudW1iZXIgfCBzdHJpbmcgPSBudWxsXHJcbiAgKTogc3RyaW5nIHtcclxuICAgIGlmICghdGV4dCB8fCAhL3t7Lis/fX0vLnRlc3QodGV4dCkpIHtcclxuICAgICAgcmV0dXJuIHRleHQ7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGV4dC5yZXBsYWNlKC97eyguKz8pfX0vZywgKC4uLmEpID0+XHJcbiAgICAgIHRoaXMucGFyc2VFeHByZXNzaW9uKGFbMV0sIHZhbHVlLCB2YWx1ZXMsIGtleSwgdGhpcy50cGxkYXRhKVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIHBhcnNlRXhwcmVzc2lvbihcclxuICAgIGV4cHJlc3Npb24gPSAnJyxcclxuICAgIHZhbHVlOiBhbnkgPSB7fSxcclxuICAgIHZhbHVlczogYW55ID0ge30sXHJcbiAgICBrZXk6IG51bWJlciB8IHN0cmluZyA9IG51bGwsXHJcbiAgICB0cGxkYXRhOiBhbnkgPSBudWxsXHJcbiAgKSB7XHJcbiAgICBpZiAodHlwZW9mIGV4cHJlc3Npb24gIT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIHJldHVybiAnJztcclxuICAgIH1cclxuICAgIGNvbnN0IGluZGV4ID0gdHlwZW9mIGtleSA9PT0gJ251bWJlcicgPyBrZXkgKyAxICsgJycgOiBrZXkgfHwgJyc7XHJcbiAgICBleHByZXNzaW9uID0gZXhwcmVzc2lvbi50cmltKCk7XHJcbiAgICBpZiAoXHJcbiAgICAgIChleHByZXNzaW9uWzBdID09PSBcIidcIiB8fCBleHByZXNzaW9uWzBdID09PSAnXCInKSAmJlxyXG4gICAgICBleHByZXNzaW9uWzBdID09PSBleHByZXNzaW9uW2V4cHJlc3Npb24ubGVuZ3RoIC0gMV0gJiZcclxuICAgICAgZXhwcmVzc2lvbi5zbGljZSgxLCBleHByZXNzaW9uLmxlbmd0aCAtIDEpLmluZGV4T2YoZXhwcmVzc2lvblswXSkgPT09IC0xXHJcbiAgICApIHtcclxuICAgICAgcmV0dXJuIGV4cHJlc3Npb24uc2xpY2UoMSwgZXhwcmVzc2lvbi5sZW5ndGggLSAxKTtcclxuICAgIH1cclxuICAgIGlmIChleHByZXNzaW9uID09PSAnaWR4JyB8fCBleHByZXNzaW9uID09PSAnJGluZGV4Jykge1xyXG4gICAgICByZXR1cm4gaW5kZXg7XHJcbiAgICB9XHJcbiAgICBpZiAoZXhwcmVzc2lvbiA9PT0gJ3ZhbHVlJyAmJiAhaGFzT3duKHZhbHVlcywgJ3ZhbHVlJykpIHtcclxuICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgfVxyXG4gICAgaWYgKFxyXG4gICAgICBbJ1wiJywgXCInXCIsICcgJywgJ3x8JywgJyYmJywgJysnXS5ldmVyeShcclxuICAgICAgICBkZWxpbSA9PiBleHByZXNzaW9uLmluZGV4T2YoZGVsaW0pID09PSAtMVxyXG4gICAgICApXHJcbiAgICApIHtcclxuICAgICAgY29uc3QgcG9pbnRlciA9IEpzb25Qb2ludGVyLnBhcnNlT2JqZWN0UGF0aChleHByZXNzaW9uKTtcclxuICAgICAgcmV0dXJuIHBvaW50ZXJbMF0gPT09ICd2YWx1ZScgJiYgSnNvblBvaW50ZXIuaGFzKHZhbHVlLCBwb2ludGVyLnNsaWNlKDEpKVxyXG4gICAgICAgID8gSnNvblBvaW50ZXIuZ2V0KHZhbHVlLCBwb2ludGVyLnNsaWNlKDEpKVxyXG4gICAgICAgIDogcG9pbnRlclswXSA9PT0gJ3ZhbHVlcycgJiYgSnNvblBvaW50ZXIuaGFzKHZhbHVlcywgcG9pbnRlci5zbGljZSgxKSlcclxuICAgICAgICAgID8gSnNvblBvaW50ZXIuZ2V0KHZhbHVlcywgcG9pbnRlci5zbGljZSgxKSlcclxuICAgICAgICAgIDogcG9pbnRlclswXSA9PT0gJ3RwbGRhdGEnICYmIEpzb25Qb2ludGVyLmhhcyh0cGxkYXRhLCBwb2ludGVyLnNsaWNlKDEpKVxyXG4gICAgICAgICAgICA/IEpzb25Qb2ludGVyLmdldCh0cGxkYXRhLCBwb2ludGVyLnNsaWNlKDEpKVxyXG4gICAgICAgICAgICA6IEpzb25Qb2ludGVyLmhhcyh2YWx1ZXMsIHBvaW50ZXIpXHJcbiAgICAgICAgICAgICAgPyBKc29uUG9pbnRlci5nZXQodmFsdWVzLCBwb2ludGVyKVxyXG4gICAgICAgICAgICAgIDogJyc7XHJcbiAgICB9XHJcbiAgICBpZiAoZXhwcmVzc2lvbi5pbmRleE9mKCdbaWR4XScpID4gLTEpIHtcclxuICAgICAgZXhwcmVzc2lvbiA9IGV4cHJlc3Npb24ucmVwbGFjZSgvXFxbaWR4XFxdL2csIDxzdHJpbmc+aW5kZXgpO1xyXG4gICAgfVxyXG4gICAgaWYgKGV4cHJlc3Npb24uaW5kZXhPZignWyRpbmRleF0nKSA+IC0xKSB7XHJcbiAgICAgIGV4cHJlc3Npb24gPSBleHByZXNzaW9uLnJlcGxhY2UoL1xcWyRpbmRleFxcXS9nLCA8c3RyaW5nPmluZGV4KTtcclxuICAgIH1cclxuICAgIC8vIFRPRE86IEltcHJvdmUgZXhwcmVzc2lvbiBldmFsdWF0aW9uIGJ5IHBhcnNpbmcgcXVvdGVkIHN0cmluZ3MgZmlyc3RcclxuICAgIC8vIGxldCBleHByZXNzaW9uQXJyYXkgPSBleHByZXNzaW9uLm1hdGNoKC8oW15cIiddK3xcIlteXCJdK1wifCdbXiddKycpL2cpO1xyXG4gICAgaWYgKGV4cHJlc3Npb24uaW5kZXhPZignfHwnKSA+IC0xKSB7XHJcbiAgICAgIHJldHVybiBleHByZXNzaW9uXHJcbiAgICAgICAgLnNwbGl0KCd8fCcpXHJcbiAgICAgICAgLnJlZHVjZShcclxuICAgICAgICAgIChhbGwsIHRlcm0pID0+XHJcbiAgICAgICAgICAgIGFsbCB8fCB0aGlzLnBhcnNlRXhwcmVzc2lvbih0ZXJtLCB2YWx1ZSwgdmFsdWVzLCBrZXksIHRwbGRhdGEpLFxyXG4gICAgICAgICAgJydcclxuICAgICAgICApO1xyXG4gICAgfVxyXG4gICAgaWYgKGV4cHJlc3Npb24uaW5kZXhPZignJiYnKSA+IC0xKSB7XHJcbiAgICAgIHJldHVybiBleHByZXNzaW9uXHJcbiAgICAgICAgLnNwbGl0KCcmJicpXHJcbiAgICAgICAgLnJlZHVjZShcclxuICAgICAgICAgIChhbGwsIHRlcm0pID0+XHJcbiAgICAgICAgICAgIGFsbCAmJiB0aGlzLnBhcnNlRXhwcmVzc2lvbih0ZXJtLCB2YWx1ZSwgdmFsdWVzLCBrZXksIHRwbGRhdGEpLFxyXG4gICAgICAgICAgJyAnXHJcbiAgICAgICAgKVxyXG4gICAgICAgIC50cmltKCk7XHJcbiAgICB9XHJcbiAgICBpZiAoZXhwcmVzc2lvbi5pbmRleE9mKCcrJykgPiAtMSkge1xyXG4gICAgICByZXR1cm4gZXhwcmVzc2lvblxyXG4gICAgICAgIC5zcGxpdCgnKycpXHJcbiAgICAgICAgLm1hcCh0ZXJtID0+IHRoaXMucGFyc2VFeHByZXNzaW9uKHRlcm0sIHZhbHVlLCB2YWx1ZXMsIGtleSwgdHBsZGF0YSkpXHJcbiAgICAgICAgLmpvaW4oJycpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuICcnO1xyXG4gIH1cclxuXHJcbiAgc2V0QXJyYXlJdGVtVGl0bGUoXHJcbiAgICBwYXJlbnRDdHg6IGFueSA9IHt9LFxyXG4gICAgY2hpbGROb2RlOiBhbnkgPSBudWxsLFxyXG4gICAgaW5kZXg6IG51bWJlciA9IG51bGxcclxuICApOiBzdHJpbmcge1xyXG4gICAgY29uc3QgcGFyZW50Tm9kZSA9IHBhcmVudEN0eC5sYXlvdXROb2RlO1xyXG4gICAgY29uc3QgcGFyZW50VmFsdWVzOiBhbnkgPSB0aGlzLmdldEZvcm1Db250cm9sVmFsdWUocGFyZW50Q3R4KTtcclxuICAgIGNvbnN0IGlzQXJyYXlJdGVtID1cclxuICAgICAgKHBhcmVudE5vZGUudHlwZSB8fCAnJykuc2xpY2UoLTUpID09PSAnYXJyYXknICYmIGlzQXJyYXkocGFyZW50VmFsdWVzKTtcclxuICAgIGNvbnN0IHRleHQgPSBKc29uUG9pbnRlci5nZXRGaXJzdChcclxuICAgICAgaXNBcnJheUl0ZW0gJiYgY2hpbGROb2RlLnR5cGUgIT09ICckcmVmJ1xyXG4gICAgICAgID8gW1xyXG4gICAgICAgICAgW2NoaWxkTm9kZSwgJy9vcHRpb25zL2xlZ2VuZCddLFxyXG4gICAgICAgICAgW2NoaWxkTm9kZSwgJy9vcHRpb25zL3RpdGxlJ10sXHJcbiAgICAgICAgICBbcGFyZW50Tm9kZSwgJy9vcHRpb25zL3RpdGxlJ10sXHJcbiAgICAgICAgICBbcGFyZW50Tm9kZSwgJy9vcHRpb25zL2xlZ2VuZCddXHJcbiAgICAgICAgXVxyXG4gICAgICAgIDogW1xyXG4gICAgICAgICAgW2NoaWxkTm9kZSwgJy9vcHRpb25zL3RpdGxlJ10sXHJcbiAgICAgICAgICBbY2hpbGROb2RlLCAnL29wdGlvbnMvbGVnZW5kJ10sXHJcbiAgICAgICAgICBbcGFyZW50Tm9kZSwgJy9vcHRpb25zL3RpdGxlJ10sXHJcbiAgICAgICAgICBbcGFyZW50Tm9kZSwgJy9vcHRpb25zL2xlZ2VuZCddXHJcbiAgICAgICAgXVxyXG4gICAgKTtcclxuICAgIGlmICghdGV4dCkge1xyXG4gICAgICByZXR1cm4gdGV4dDtcclxuICAgIH1cclxuICAgIGNvbnN0IGNoaWxkVmFsdWUgPVxyXG4gICAgICBpc0FycmF5KHBhcmVudFZhbHVlcykgJiYgaW5kZXggPCBwYXJlbnRWYWx1ZXMubGVuZ3RoXHJcbiAgICAgICAgPyBwYXJlbnRWYWx1ZXNbaW5kZXhdXHJcbiAgICAgICAgOiBwYXJlbnRWYWx1ZXM7XHJcbiAgICByZXR1cm4gdGhpcy5wYXJzZVRleHQodGV4dCwgY2hpbGRWYWx1ZSwgcGFyZW50VmFsdWVzLCBpbmRleCk7XHJcbiAgfVxyXG5cclxuICBzZXRJdGVtVGl0bGUoY3R4OiBhbnkpIHtcclxuICAgIHJldHVybiAhY3R4Lm9wdGlvbnMudGl0bGUgJiYgL14oXFxkK3wtKSQvLnRlc3QoY3R4LmxheW91dE5vZGUubmFtZSlcclxuICAgICAgPyBudWxsXHJcbiAgICAgIDogdGhpcy5wYXJzZVRleHQoXHJcbiAgICAgICAgY3R4Lm9wdGlvbnMudGl0bGUgfHwgdG9UaXRsZUNhc2UoY3R4LmxheW91dE5vZGUubmFtZSksXHJcbiAgICAgICAgdGhpcy5nZXRGb3JtQ29udHJvbFZhbHVlKHRoaXMpLFxyXG4gICAgICAgICh0aGlzLmdldEZvcm1Db250cm9sR3JvdXAodGhpcykgfHwgPGFueT57fSkudmFsdWUsXHJcbiAgICAgICAgY3R4LmRhdGFJbmRleFtjdHguZGF0YUluZGV4Lmxlbmd0aCAtIDFdXHJcbiAgICAgICk7XHJcbiAgfVxyXG5cclxuICBldmFsdWF0ZUNvbmRpdGlvbihsYXlvdXROb2RlOiBhbnksIGRhdGFJbmRleDogbnVtYmVyW10pOiBib29sZWFuIHtcclxuICAgIGNvbnN0IGFycmF5SW5kZXggPSBkYXRhSW5kZXggJiYgZGF0YUluZGV4W2RhdGFJbmRleC5sZW5ndGggLSAxXTtcclxuICAgIGxldCByZXN1bHQgPSB0cnVlO1xyXG4gICAgaWYgKGhhc1ZhbHVlKChsYXlvdXROb2RlLm9wdGlvbnMgfHwge30pLmNvbmRpdGlvbikpIHtcclxuICAgICAgaWYgKHR5cGVvZiBsYXlvdXROb2RlLm9wdGlvbnMuY29uZGl0aW9uID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgIGxldCBwb2ludGVyID0gbGF5b3V0Tm9kZS5vcHRpb25zLmNvbmRpdGlvbjtcclxuICAgICAgICBpZiAoaGFzVmFsdWUoYXJyYXlJbmRleCkpIHtcclxuICAgICAgICAgIHBvaW50ZXIgPSBwb2ludGVyLnJlcGxhY2UoJ1thcnJheUluZGV4XScsIGBbJHthcnJheUluZGV4fV1gKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcG9pbnRlciA9IEpzb25Qb2ludGVyLnBhcnNlT2JqZWN0UGF0aChwb2ludGVyKTtcclxuICAgICAgICByZXN1bHQgPSAhIUpzb25Qb2ludGVyLmdldCh0aGlzLmRhdGEsIHBvaW50ZXIpO1xyXG4gICAgICAgIGlmICghcmVzdWx0ICYmIHBvaW50ZXJbMF0gPT09ICdtb2RlbCcpIHtcclxuICAgICAgICAgIHJlc3VsdCA9ICEhSnNvblBvaW50ZXIuZ2V0KHsgbW9kZWw6IHRoaXMuZGF0YSB9LCBwb2ludGVyKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGxheW91dE5vZGUub3B0aW9ucy5jb25kaXRpb24gPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICByZXN1bHQgPSBsYXlvdXROb2RlLm9wdGlvbnMuY29uZGl0aW9uKHRoaXMuZGF0YSk7XHJcbiAgICAgIH0gZWxzZSBpZiAoXHJcbiAgICAgICAgdHlwZW9mIGxheW91dE5vZGUub3B0aW9ucy5jb25kaXRpb24uZnVuY3Rpb25Cb2R5ID09PSAnc3RyaW5nJ1xyXG4gICAgICApIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgY29uc3QgZHluRm4gPSBuZXcgRnVuY3Rpb24oXHJcbiAgICAgICAgICAgICdtb2RlbCcsXHJcbiAgICAgICAgICAgICdhcnJheUluZGljZXMnLFxyXG4gICAgICAgICAgICBsYXlvdXROb2RlLm9wdGlvbnMuY29uZGl0aW9uLmZ1bmN0aW9uQm9keVxyXG4gICAgICAgICAgKTtcclxuICAgICAgICAgIHJlc3VsdCA9IGR5bkZuKHRoaXMuZGF0YSwgZGF0YUluZGV4KTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICByZXN1bHQgPSB0cnVlO1xyXG4gICAgICAgICAgY29uc29sZS5lcnJvcihcclxuICAgICAgICAgICAgJ2NvbmRpdGlvbiBmdW5jdGlvbkJvZHkgZXJyb3JlZCBvdXQgb24gZXZhbHVhdGlvbjogJyArXHJcbiAgICAgICAgICAgIGxheW91dE5vZGUub3B0aW9ucy5jb25kaXRpb24uZnVuY3Rpb25Cb2R5XHJcbiAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9XHJcblxyXG4gIGluaXRpYWxpemVDb250cm9sKGN0eDogYW55LCBiaW5kID0gdHJ1ZSk6IGJvb2xlYW4ge1xyXG4gICAgaWYgKCFpc09iamVjdChjdHgpKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIGlmIChpc0VtcHR5KGN0eC5vcHRpb25zKSkge1xyXG4gICAgICBjdHgub3B0aW9ucyA9ICFpc0VtcHR5KChjdHgubGF5b3V0Tm9kZSB8fCB7fSkub3B0aW9ucylcclxuICAgICAgICA/IGN0eC5sYXlvdXROb2RlLm9wdGlvbnNcclxuICAgICAgICA6IGNsb25lRGVlcCh0aGlzLmZvcm1PcHRpb25zKTtcclxuICAgIH1cclxuICAgIGN0eC5mb3JtQ29udHJvbCA9IHRoaXMuZ2V0Rm9ybUNvbnRyb2woY3R4KTtcclxuICAgIGN0eC5ib3VuZENvbnRyb2wgPSBiaW5kICYmICEhY3R4LmZvcm1Db250cm9sO1xyXG4gICAgaWYgKGN0eC5mb3JtQ29udHJvbCkge1xyXG4gICAgICBjdHguY29udHJvbE5hbWUgPSB0aGlzLmdldEZvcm1Db250cm9sTmFtZShjdHgpO1xyXG4gICAgICBjdHguY29udHJvbFZhbHVlID0gY3R4LmZvcm1Db250cm9sLnZhbHVlO1xyXG4gICAgICBjdHguY29udHJvbERpc2FibGVkID0gY3R4LmZvcm1Db250cm9sLmRpc2FibGVkO1xyXG4gICAgICBjdHgub3B0aW9ucy5lcnJvck1lc3NhZ2UgPVxyXG4gICAgICAgIGN0eC5mb3JtQ29udHJvbC5zdGF0dXMgPT09ICdWQUxJRCdcclxuICAgICAgICAgID8gbnVsbFxyXG4gICAgICAgICAgOiB0aGlzLmZvcm1hdEVycm9ycyhcclxuICAgICAgICAgICAgY3R4LmZvcm1Db250cm9sLmVycm9ycyxcclxuICAgICAgICAgICAgY3R4Lm9wdGlvbnMudmFsaWRhdGlvbk1lc3NhZ2VzXHJcbiAgICAgICAgICApO1xyXG4gICAgICBjdHgub3B0aW9ucy5zaG93RXJyb3JzID1cclxuICAgICAgICB0aGlzLmZvcm1PcHRpb25zLnZhbGlkYXRlT25SZW5kZXIgPT09IHRydWUgfHxcclxuICAgICAgICAodGhpcy5mb3JtT3B0aW9ucy52YWxpZGF0ZU9uUmVuZGVyID09PSAnYXV0bycgJiZcclxuICAgICAgICAgIGhhc1ZhbHVlKGN0eC5jb250cm9sVmFsdWUpKTtcclxuICAgICAgY3R4LmZvcm1Db250cm9sLnN0YXR1c0NoYW5nZXMuc3Vic2NyaWJlKFxyXG4gICAgICAgIHN0YXR1cyA9PlxyXG4gICAgICAgICAgKGN0eC5vcHRpb25zLmVycm9yTWVzc2FnZSA9XHJcbiAgICAgICAgICAgIHN0YXR1cyA9PT0gJ1ZBTElEJ1xyXG4gICAgICAgICAgICAgID8gbnVsbFxyXG4gICAgICAgICAgICAgIDogdGhpcy5mb3JtYXRFcnJvcnMoXHJcbiAgICAgICAgICAgICAgICBjdHguZm9ybUNvbnRyb2wuZXJyb3JzLFxyXG4gICAgICAgICAgICAgICAgY3R4Lm9wdGlvbnMudmFsaWRhdGlvbk1lc3NhZ2VzXHJcbiAgICAgICAgICAgICAgKSlcclxuICAgICAgKTtcclxuICAgICAgY3R4LmZvcm1Db250cm9sLnZhbHVlQ2hhbmdlcy5zdWJzY3JpYmUodmFsdWUgPT4ge1xyXG4gICAgICAgIGlmICghIXZhbHVlKSB7XHJcbiAgICAgICAgICBjdHguY29udHJvbFZhbHVlID0gdmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGN0eC5jb250cm9sTmFtZSA9IGN0eC5sYXlvdXROb2RlLm5hbWU7XHJcbiAgICAgIGN0eC5jb250cm9sVmFsdWUgPSBjdHgubGF5b3V0Tm9kZS52YWx1ZSB8fCBudWxsO1xyXG4gICAgICBjb25zdCBkYXRhUG9pbnRlciA9IHRoaXMuZ2V0RGF0YVBvaW50ZXIoY3R4KTtcclxuICAgICAgaWYgKGJpbmQgJiYgZGF0YVBvaW50ZXIpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFxyXG4gICAgICAgICAgYHdhcm5pbmc6IGNvbnRyb2wgXCIke2RhdGFQb2ludGVyfVwiIGlzIG5vdCBib3VuZCB0byB0aGUgQW5ndWxhciBGb3JtR3JvdXAuYFxyXG4gICAgICAgICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBjdHguYm91bmRDb250cm9sO1xyXG4gIH1cclxuXHJcbiAgZm9ybWF0RXJyb3JzKGVycm9yczogYW55LCB2YWxpZGF0aW9uTWVzc2FnZXM6IGFueSA9IHt9KTogc3RyaW5nIHtcclxuICAgIGlmIChpc0VtcHR5KGVycm9ycykpIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICBpZiAoIWlzT2JqZWN0KHZhbGlkYXRpb25NZXNzYWdlcykpIHtcclxuICAgICAgdmFsaWRhdGlvbk1lc3NhZ2VzID0ge307XHJcbiAgICB9XHJcbiAgICBjb25zdCBhZGRTcGFjZXMgPSBzdHJpbmcgPT5cclxuICAgICAgc3RyaW5nWzBdLnRvVXBwZXJDYXNlKCkgK1xyXG4gICAgICAoc3RyaW5nLnNsaWNlKDEpIHx8ICcnKVxyXG4gICAgICAgIC5yZXBsYWNlKC8oW2Etel0pKFtBLVpdKS9nLCAnJDEgJDInKVxyXG4gICAgICAgIC5yZXBsYWNlKC9fL2csICcgJyk7XHJcbiAgICBjb25zdCBmb3JtYXRFcnJvciA9IGVycm9yID0+XHJcbiAgICAgIHR5cGVvZiBlcnJvciA9PT0gJ29iamVjdCdcclxuICAgICAgICA/IE9iamVjdC5rZXlzKGVycm9yKVxyXG4gICAgICAgICAgLm1hcChrZXkgPT5cclxuICAgICAgICAgICAgZXJyb3Jba2V5XSA9PT0gdHJ1ZVxyXG4gICAgICAgICAgICAgID8gYWRkU3BhY2VzKGtleSlcclxuICAgICAgICAgICAgICA6IGVycm9yW2tleV0gPT09IGZhbHNlXHJcbiAgICAgICAgICAgICAgICA/ICdOb3QgJyArIGFkZFNwYWNlcyhrZXkpXHJcbiAgICAgICAgICAgICAgICA6IGFkZFNwYWNlcyhrZXkpICsgJzogJyArIGZvcm1hdEVycm9yKGVycm9yW2tleV0pXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgICAuam9pbignLCAnKVxyXG4gICAgICAgIDogYWRkU3BhY2VzKGVycm9yLnRvU3RyaW5nKCkpO1xyXG4gICAgY29uc3QgbWVzc2FnZXMgPSBbXTtcclxuICAgIHJldHVybiAoXHJcbiAgICAgIE9iamVjdC5rZXlzKGVycm9ycylcclxuICAgICAgICAvLyBIaWRlICdyZXF1aXJlZCcgZXJyb3IsIHVubGVzcyBpdCBpcyB0aGUgb25seSBvbmVcclxuICAgICAgICAuZmlsdGVyKFxyXG4gICAgICAgICAgZXJyb3JLZXkgPT5cclxuICAgICAgICAgICAgZXJyb3JLZXkgIT09ICdyZXF1aXJlZCcgfHwgT2JqZWN0LmtleXMoZXJyb3JzKS5sZW5ndGggPT09IDFcclxuICAgICAgICApXHJcbiAgICAgICAgLm1hcChlcnJvcktleSA9PlxyXG4gICAgICAgICAgLy8gSWYgdmFsaWRhdGlvbk1lc3NhZ2VzIGlzIGEgc3RyaW5nLCByZXR1cm4gaXRcclxuICAgICAgICAgIHR5cGVvZiB2YWxpZGF0aW9uTWVzc2FnZXMgPT09ICdzdHJpbmcnXHJcbiAgICAgICAgICAgID8gdmFsaWRhdGlvbk1lc3NhZ2VzXHJcbiAgICAgICAgICAgIDogLy8gSWYgY3VzdG9tIGVycm9yIG1lc3NhZ2UgaXMgYSBmdW5jdGlvbiwgcmV0dXJuIGZ1bmN0aW9uIHJlc3VsdFxyXG4gICAgICAgICAgICB0eXBlb2YgdmFsaWRhdGlvbk1lc3NhZ2VzW2Vycm9yS2V5XSA9PT0gJ2Z1bmN0aW9uJ1xyXG4gICAgICAgICAgICAgID8gdmFsaWRhdGlvbk1lc3NhZ2VzW2Vycm9yS2V5XShlcnJvcnNbZXJyb3JLZXldKVxyXG4gICAgICAgICAgICAgIDogLy8gSWYgY3VzdG9tIGVycm9yIG1lc3NhZ2UgaXMgYSBzdHJpbmcsIHJlcGxhY2UgcGxhY2Vob2xkZXJzIGFuZCByZXR1cm5cclxuICAgICAgICAgICAgICB0eXBlb2YgdmFsaWRhdGlvbk1lc3NhZ2VzW2Vycm9yS2V5XSA9PT0gJ3N0cmluZydcclxuICAgICAgICAgICAgICAgID8gLy8gRG9lcyBlcnJvciBtZXNzYWdlIGhhdmUgYW55IHt7cHJvcGVydHl9fSBwbGFjZWhvbGRlcnM/XHJcbiAgICAgICAgICAgICAgICAhL3t7Lis/fX0vLnRlc3QodmFsaWRhdGlvbk1lc3NhZ2VzW2Vycm9yS2V5XSlcclxuICAgICAgICAgICAgICAgICAgPyB2YWxpZGF0aW9uTWVzc2FnZXNbZXJyb3JLZXldXHJcbiAgICAgICAgICAgICAgICAgIDogLy8gUmVwbGFjZSB7e3Byb3BlcnR5fX0gcGxhY2Vob2xkZXJzIHdpdGggdmFsdWVzXHJcbiAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGVycm9yc1tlcnJvcktleV0pLnJlZHVjZShcclxuICAgICAgICAgICAgICAgICAgICAoZXJyb3JNZXNzYWdlLCBlcnJvclByb3BlcnR5KSA9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgZXJyb3JNZXNzYWdlLnJlcGxhY2UoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBSZWdFeHAoJ3t7JyArIGVycm9yUHJvcGVydHkgKyAnfX0nLCAnZycpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcnNbZXJyb3JLZXldW2Vycm9yUHJvcGVydHldXHJcbiAgICAgICAgICAgICAgICAgICAgICApLFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbGlkYXRpb25NZXNzYWdlc1tlcnJvcktleV1cclxuICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgOiAvLyBJZiBubyBjdXN0b20gZXJyb3IgbWVzc2FnZSwgcmV0dXJuIGZvcm1hdHRlZCBlcnJvciBkYXRhIGluc3RlYWRcclxuICAgICAgICAgICAgICAgIGFkZFNwYWNlcyhlcnJvcktleSkgKyAnIEVycm9yOiAnICsgZm9ybWF0RXJyb3IoZXJyb3JzW2Vycm9yS2V5XSlcclxuICAgICAgICApXHJcbiAgICAgICAgLmpvaW4oJzxicj4nKVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIHVwZGF0ZVZhbHVlKGN0eDogYW55LCB2YWx1ZTogYW55KTogdm9pZCB7XHJcbiAgICAvLyBTZXQgdmFsdWUgb2YgY3VycmVudCBjb250cm9sXHJcbiAgICBjdHguY29udHJvbFZhbHVlID0gdmFsdWU7XHJcbiAgICBpZiAoY3R4LmJvdW5kQ29udHJvbCkge1xyXG4gICAgICBjdHguZm9ybUNvbnRyb2wuc2V0VmFsdWUodmFsdWUpO1xyXG4gICAgICBjdHguZm9ybUNvbnRyb2wubWFya0FzRGlydHkoKTtcclxuICAgIH1cclxuICAgIGN0eC5sYXlvdXROb2RlLnZhbHVlID0gdmFsdWU7XHJcblxyXG4gICAgLy8gU2V0IHZhbHVlcyBvZiBhbnkgcmVsYXRlZCBjb250cm9scyBpbiBjb3B5VmFsdWVUbyBhcnJheVxyXG4gICAgaWYgKGlzQXJyYXkoY3R4Lm9wdGlvbnMuY29weVZhbHVlVG8pKSB7XHJcbiAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBjdHgub3B0aW9ucy5jb3B5VmFsdWVUbykge1xyXG4gICAgICAgIGNvbnN0IHRhcmdldENvbnRyb2wgPSBnZXRDb250cm9sKHRoaXMuZm9ybUdyb3VwLCBpdGVtKTtcclxuICAgICAgICBpZiAoXHJcbiAgICAgICAgICBpc09iamVjdCh0YXJnZXRDb250cm9sKSAmJlxyXG4gICAgICAgICAgdHlwZW9mIHRhcmdldENvbnRyb2wuc2V0VmFsdWUgPT09ICdmdW5jdGlvbidcclxuICAgICAgICApIHtcclxuICAgICAgICAgIHRhcmdldENvbnRyb2wuc2V0VmFsdWUodmFsdWUpO1xyXG4gICAgICAgICAgdGFyZ2V0Q29udHJvbC5tYXJrQXNEaXJ0eSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgdXBkYXRlQXJyYXlDaGVja2JveExpc3QoY3R4OiBhbnksIGNoZWNrYm94TGlzdDogVGl0bGVNYXBJdGVtW10pOiB2b2lkIHtcclxuICAgIGNvbnN0IGZvcm1BcnJheSA9IDxVbnR5cGVkRm9ybUFycmF5PnRoaXMuZ2V0Rm9ybUNvbnRyb2woY3R4KTtcclxuXHJcbiAgICAvLyBSZW1vdmUgYWxsIGV4aXN0aW5nIGl0ZW1zXHJcbiAgICB3aGlsZSAoZm9ybUFycmF5LnZhbHVlLmxlbmd0aCkge1xyXG4gICAgICBmb3JtQXJyYXkucmVtb3ZlQXQoMCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUmUtYWRkIGFuIGl0ZW0gZm9yIGVhY2ggY2hlY2tlZCBib3hcclxuICAgIGNvbnN0IHJlZlBvaW50ZXIgPSByZW1vdmVSZWN1cnNpdmVSZWZlcmVuY2VzKFxyXG4gICAgICBjdHgubGF5b3V0Tm9kZS5kYXRhUG9pbnRlciArICcvLScsXHJcbiAgICAgIHRoaXMuZGF0YVJlY3Vyc2l2ZVJlZk1hcCxcclxuICAgICAgdGhpcy5hcnJheU1hcFxyXG4gICAgKTtcclxuICAgIGZvciAoY29uc3QgY2hlY2tib3hJdGVtIG9mIGNoZWNrYm94TGlzdCkge1xyXG4gICAgICBpZiAoY2hlY2tib3hJdGVtLmNoZWNrZWQpIHtcclxuICAgICAgICBjb25zdCBuZXdGb3JtQ29udHJvbCA9IGJ1aWxkRm9ybUdyb3VwKFxyXG4gICAgICAgICAgdGhpcy50ZW1wbGF0ZVJlZkxpYnJhcnlbcmVmUG9pbnRlcl1cclxuICAgICAgICApO1xyXG4gICAgICAgIG5ld0Zvcm1Db250cm9sLnNldFZhbHVlKGNoZWNrYm94SXRlbS52YWx1ZSk7XHJcbiAgICAgICAgZm9ybUFycmF5LnB1c2gobmV3Rm9ybUNvbnRyb2wpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBmb3JtQXJyYXkubWFya0FzRGlydHkoKTtcclxuICB9XHJcblxyXG4gIGdldEZvcm1Db250cm9sKGN0eDogYW55KTogQWJzdHJhY3RDb250cm9sIHtcclxuICAgIGlmIChcclxuICAgICAgIWN0eC5sYXlvdXROb2RlIHx8XHJcbiAgICAgICFpc0RlZmluZWQoY3R4LmxheW91dE5vZGUuZGF0YVBvaW50ZXIpIHx8XHJcbiAgICAgIGN0eC5sYXlvdXROb2RlLnR5cGUgPT09ICckcmVmJ1xyXG4gICAgKSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGdldENvbnRyb2wodGhpcy5mb3JtR3JvdXAsIHRoaXMuZ2V0RGF0YVBvaW50ZXIoY3R4KSk7XHJcbiAgfVxyXG5cclxuICBnZXRGb3JtQ29udHJvbFZhbHVlKGN0eDogYW55KTogQWJzdHJhY3RDb250cm9sIHtcclxuICAgIGlmIChcclxuICAgICAgIWN0eC5sYXlvdXROb2RlIHx8XHJcbiAgICAgICFpc0RlZmluZWQoY3R4LmxheW91dE5vZGUuZGF0YVBvaW50ZXIpIHx8XHJcbiAgICAgIGN0eC5sYXlvdXROb2RlLnR5cGUgPT09ICckcmVmJ1xyXG4gICAgKSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgY29uc3QgY29udHJvbCA9IGdldENvbnRyb2wodGhpcy5mb3JtR3JvdXAsIHRoaXMuZ2V0RGF0YVBvaW50ZXIoY3R4KSk7XHJcbiAgICByZXR1cm4gY29udHJvbCA/IGNvbnRyb2wudmFsdWUgOiBudWxsO1xyXG4gIH1cclxuXHJcbiAgZ2V0Rm9ybUNvbnRyb2xHcm91cChjdHg6IGFueSk6IFVudHlwZWRGb3JtQXJyYXkgfCBVbnR5cGVkRm9ybUdyb3VwIHtcclxuICAgIGlmICghY3R4LmxheW91dE5vZGUgfHwgIWlzRGVmaW5lZChjdHgubGF5b3V0Tm9kZS5kYXRhUG9pbnRlcikpIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZ2V0Q29udHJvbCh0aGlzLmZvcm1Hcm91cCwgdGhpcy5nZXREYXRhUG9pbnRlcihjdHgpLCB0cnVlKTtcclxuICB9XHJcblxyXG4gIGdldEZvcm1Db250cm9sTmFtZShjdHg6IGFueSk6IHN0cmluZyB7XHJcbiAgICBpZiAoXHJcbiAgICAgICFjdHgubGF5b3V0Tm9kZSB8fFxyXG4gICAgICAhaXNEZWZpbmVkKGN0eC5sYXlvdXROb2RlLmRhdGFQb2ludGVyKSB8fFxyXG4gICAgICAhaGFzVmFsdWUoY3R4LmRhdGFJbmRleClcclxuICAgICkge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuICAgIHJldHVybiBKc29uUG9pbnRlci50b0tleSh0aGlzLmdldERhdGFQb2ludGVyKGN0eCkpO1xyXG4gIH1cclxuXHJcbiAgZ2V0TGF5b3V0QXJyYXkoY3R4OiBhbnkpOiBhbnlbXSB7XHJcbiAgICByZXR1cm4gSnNvblBvaW50ZXIuZ2V0KHRoaXMubGF5b3V0LCB0aGlzLmdldExheW91dFBvaW50ZXIoY3R4KSwgMCwgLTEpO1xyXG4gIH1cclxuXHJcbiAgZ2V0UGFyZW50Tm9kZShjdHg6IGFueSk6IGFueSB7XHJcbiAgICByZXR1cm4gSnNvblBvaW50ZXIuZ2V0KHRoaXMubGF5b3V0LCB0aGlzLmdldExheW91dFBvaW50ZXIoY3R4KSwgMCwgLTIpO1xyXG4gIH1cclxuXHJcbiAgZ2V0RGF0YVBvaW50ZXIoY3R4OiBhbnkpOiBzdHJpbmcge1xyXG4gICAgaWYgKFxyXG4gICAgICAhY3R4LmxheW91dE5vZGUgfHxcclxuICAgICAgIWlzRGVmaW5lZChjdHgubGF5b3V0Tm9kZS5kYXRhUG9pbnRlcikgfHxcclxuICAgICAgIWhhc1ZhbHVlKGN0eC5kYXRhSW5kZXgpXHJcbiAgICApIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gSnNvblBvaW50ZXIudG9JbmRleGVkUG9pbnRlcihcclxuICAgICAgY3R4LmxheW91dE5vZGUuZGF0YVBvaW50ZXIsXHJcbiAgICAgIGN0eC5kYXRhSW5kZXgsXHJcbiAgICAgIHRoaXMuYXJyYXlNYXBcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBnZXRMYXlvdXRQb2ludGVyKGN0eDogYW55KTogc3RyaW5nIHtcclxuICAgIGlmICghaGFzVmFsdWUoY3R4LmxheW91dEluZGV4KSkge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuICAgIHJldHVybiAnLycgKyBjdHgubGF5b3V0SW5kZXguam9pbignL2l0ZW1zLycpO1xyXG4gIH1cclxuXHJcbiAgaXNDb250cm9sQm91bmQoY3R4OiBhbnkpOiBib29sZWFuIHtcclxuICAgIGlmIChcclxuICAgICAgIWN0eC5sYXlvdXROb2RlIHx8XHJcbiAgICAgICFpc0RlZmluZWQoY3R4LmxheW91dE5vZGUuZGF0YVBvaW50ZXIpIHx8XHJcbiAgICAgICFoYXNWYWx1ZShjdHguZGF0YUluZGV4KVxyXG4gICAgKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIGNvbnN0IGNvbnRyb2xHcm91cCA9IHRoaXMuZ2V0Rm9ybUNvbnRyb2xHcm91cChjdHgpO1xyXG4gICAgY29uc3QgbmFtZSA9IHRoaXMuZ2V0Rm9ybUNvbnRyb2xOYW1lKGN0eCk7XHJcbiAgICByZXR1cm4gY29udHJvbEdyb3VwID8gaGFzT3duKGNvbnRyb2xHcm91cC5jb250cm9scywgbmFtZSkgOiBmYWxzZTtcclxuICB9XHJcblxyXG4gIGFkZEl0ZW0oY3R4OiBhbnksIG5hbWU/OiBzdHJpbmcpOiBib29sZWFuIHtcclxuICAgIGlmIChcclxuICAgICAgIWN0eC5sYXlvdXROb2RlIHx8XHJcbiAgICAgICFpc0RlZmluZWQoY3R4LmxheW91dE5vZGUuJHJlZikgfHxcclxuICAgICAgIWhhc1ZhbHVlKGN0eC5kYXRhSW5kZXgpIHx8XHJcbiAgICAgICFoYXNWYWx1ZShjdHgubGF5b3V0SW5kZXgpXHJcbiAgICApIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENyZWF0ZSBhIG5ldyBBbmd1bGFyIGZvcm0gY29udHJvbCBmcm9tIGEgdGVtcGxhdGUgaW4gdGVtcGxhdGVSZWZMaWJyYXJ5XHJcbiAgICBjb25zdCBuZXdGb3JtR3JvdXAgPSBidWlsZEZvcm1Hcm91cChcclxuICAgICAgdGhpcy50ZW1wbGF0ZVJlZkxpYnJhcnlbY3R4LmxheW91dE5vZGUuJHJlZl1cclxuICAgICk7XHJcblxyXG4gICAgLy8gQWRkIHRoZSBuZXcgZm9ybSBjb250cm9sIHRvIHRoZSBwYXJlbnQgZm9ybUFycmF5IG9yIGZvcm1Hcm91cFxyXG4gICAgaWYgKGN0eC5sYXlvdXROb2RlLmFycmF5SXRlbSkge1xyXG4gICAgICAvLyBBZGQgbmV3IGFycmF5IGl0ZW0gdG8gZm9ybUFycmF5XHJcbiAgICAgICg8VW50eXBlZEZvcm1BcnJheT50aGlzLmdldEZvcm1Db250cm9sR3JvdXAoY3R4KSkucHVzaChuZXdGb3JtR3JvdXApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gQWRkIG5ldyAkcmVmIGl0ZW0gdG8gZm9ybUdyb3VwXHJcbiAgICAgICg8VW50eXBlZEZvcm1Hcm91cD50aGlzLmdldEZvcm1Db250cm9sR3JvdXAoY3R4KSkuYWRkQ29udHJvbChcclxuICAgICAgICBuYW1lIHx8IHRoaXMuZ2V0Rm9ybUNvbnRyb2xOYW1lKGN0eCksXHJcbiAgICAgICAgbmV3Rm9ybUdyb3VwXHJcbiAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ29weSBhIG5ldyBsYXlvdXROb2RlIGZyb20gbGF5b3V0UmVmTGlicmFyeVxyXG4gICAgY29uc3QgbmV3TGF5b3V0Tm9kZSA9IGdldExheW91dE5vZGUoY3R4LmxheW91dE5vZGUsIHRoaXMpO1xyXG4gICAgbmV3TGF5b3V0Tm9kZS5hcnJheUl0ZW0gPSBjdHgubGF5b3V0Tm9kZS5hcnJheUl0ZW07XHJcbiAgICBpZiAoY3R4LmxheW91dE5vZGUuYXJyYXlJdGVtVHlwZSkge1xyXG4gICAgICBuZXdMYXlvdXROb2RlLmFycmF5SXRlbVR5cGUgPSBjdHgubGF5b3V0Tm9kZS5hcnJheUl0ZW1UeXBlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZGVsZXRlIG5ld0xheW91dE5vZGUuYXJyYXlJdGVtVHlwZTtcclxuICAgIH1cclxuICAgIGlmIChuYW1lKSB7XHJcbiAgICAgIG5ld0xheW91dE5vZGUubmFtZSA9IG5hbWU7XHJcbiAgICAgIG5ld0xheW91dE5vZGUuZGF0YVBvaW50ZXIgKz0gJy8nICsgSnNvblBvaW50ZXIuZXNjYXBlKG5hbWUpO1xyXG4gICAgICBuZXdMYXlvdXROb2RlLm9wdGlvbnMudGl0bGUgPSBmaXhUaXRsZShuYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBBZGQgdGhlIG5ldyBsYXlvdXROb2RlIHRvIHRoZSBmb3JtIGxheW91dFxyXG4gICAgSnNvblBvaW50ZXIuaW5zZXJ0KHRoaXMubGF5b3V0LCB0aGlzLmdldExheW91dFBvaW50ZXIoY3R4KSwgbmV3TGF5b3V0Tm9kZSk7XHJcblxyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG5cclxuICBtb3ZlQXJyYXlJdGVtKGN0eDogYW55LCBvbGRJbmRleDogbnVtYmVyLCBuZXdJbmRleDogbnVtYmVyKTogYm9vbGVhbiB7XHJcbiAgICBpZiAoXHJcbiAgICAgICFjdHgubGF5b3V0Tm9kZSB8fFxyXG4gICAgICAhaXNEZWZpbmVkKGN0eC5sYXlvdXROb2RlLmRhdGFQb2ludGVyKSB8fFxyXG4gICAgICAhaGFzVmFsdWUoY3R4LmRhdGFJbmRleCkgfHxcclxuICAgICAgIWhhc1ZhbHVlKGN0eC5sYXlvdXRJbmRleCkgfHxcclxuICAgICAgIWlzRGVmaW5lZChvbGRJbmRleCkgfHxcclxuICAgICAgIWlzRGVmaW5lZChuZXdJbmRleCkgfHxcclxuICAgICAgb2xkSW5kZXggPT09IG5ld0luZGV4XHJcbiAgICApIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE1vdmUgaXRlbSBpbiB0aGUgZm9ybUFycmF5XHJcbiAgICBjb25zdCBmb3JtQXJyYXkgPSA8VW50eXBlZEZvcm1BcnJheT50aGlzLmdldEZvcm1Db250cm9sR3JvdXAoY3R4KTtcclxuICAgIGNvbnN0IGFycmF5SXRlbSA9IGZvcm1BcnJheS5hdChvbGRJbmRleCk7XHJcbiAgICBmb3JtQXJyYXkucmVtb3ZlQXQob2xkSW5kZXgpO1xyXG4gICAgZm9ybUFycmF5Lmluc2VydChuZXdJbmRleCwgYXJyYXlJdGVtKTtcclxuICAgIGZvcm1BcnJheS51cGRhdGVWYWx1ZUFuZFZhbGlkaXR5KCk7XHJcblxyXG4gICAgLy8gTW92ZSBsYXlvdXQgaXRlbVxyXG4gICAgY29uc3QgbGF5b3V0QXJyYXkgPSB0aGlzLmdldExheW91dEFycmF5KGN0eCk7XHJcbiAgICBsYXlvdXRBcnJheS5zcGxpY2UobmV3SW5kZXgsIDAsIGxheW91dEFycmF5LnNwbGljZShvbGRJbmRleCwgMSlbMF0pO1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG5cclxuICByZW1vdmVJdGVtKGN0eDogYW55KTogYm9vbGVhbiB7XHJcbiAgICBpZiAoXHJcbiAgICAgICFjdHgubGF5b3V0Tm9kZSB8fFxyXG4gICAgICAhaXNEZWZpbmVkKGN0eC5sYXlvdXROb2RlLmRhdGFQb2ludGVyKSB8fFxyXG4gICAgICAhaGFzVmFsdWUoY3R4LmRhdGFJbmRleCkgfHxcclxuICAgICAgIWhhc1ZhbHVlKGN0eC5sYXlvdXRJbmRleClcclxuICAgICkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUmVtb3ZlIHRoZSBBbmd1bGFyIGZvcm0gY29udHJvbCBmcm9tIHRoZSBwYXJlbnQgZm9ybUFycmF5IG9yIGZvcm1Hcm91cFxyXG4gICAgaWYgKGN0eC5sYXlvdXROb2RlLmFycmF5SXRlbSkge1xyXG4gICAgICAvLyBSZW1vdmUgYXJyYXkgaXRlbSBmcm9tIGZvcm1BcnJheVxyXG4gICAgICAoPFVudHlwZWRGb3JtQXJyYXk+dGhpcy5nZXRGb3JtQ29udHJvbEdyb3VwKGN0eCkpLnJlbW92ZUF0KFxyXG4gICAgICAgIGN0eC5kYXRhSW5kZXhbY3R4LmRhdGFJbmRleC5sZW5ndGggLSAxXVxyXG4gICAgICApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gUmVtb3ZlICRyZWYgaXRlbSBmcm9tIGZvcm1Hcm91cFxyXG4gICAgICAoPFVudHlwZWRGb3JtR3JvdXA+dGhpcy5nZXRGb3JtQ29udHJvbEdyb3VwKGN0eCkpLnJlbW92ZUNvbnRyb2woXHJcbiAgICAgICAgdGhpcy5nZXRGb3JtQ29udHJvbE5hbWUoY3R4KVxyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFJlbW92ZSBsYXlvdXROb2RlIGZyb20gbGF5b3V0XHJcbiAgICBKc29uUG9pbnRlci5yZW1vdmUodGhpcy5sYXlvdXQsIHRoaXMuZ2V0TGF5b3V0UG9pbnRlcihjdHgpKTtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxufVxyXG4iXX0=