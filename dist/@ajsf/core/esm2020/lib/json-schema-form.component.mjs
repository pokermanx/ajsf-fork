import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import { ChangeDetectionStrategy, Component, EventEmitter, forwardRef, Input, Output, } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { convertSchemaToDraft6 } from './shared/convert-schema-to-draft6.function';
import { forEach, hasOwn } from './shared/utility.functions';
import { hasValue, inArray, isArray, isEmpty, isObject } from './shared/validator.functions';
import { JsonPointer } from './shared/jsonpointer.functions';
import { JsonSchemaFormService } from './json-schema-form.service';
import { resolveSchemaReferences } from './shared/json-schema.functions';
import * as i0 from "@angular/core";
import * as i1 from "./framework-library/framework-library.service";
import * as i2 from "./widget-library/widget-library.service";
import * as i3 from "./json-schema-form.service";
import * as i4 from "@angular/common";
import * as i5 from "@angular/forms";
import * as i6 from "./widget-library/root.component";
export const JSON_SCHEMA_FORM_VALUE_ACCESSOR = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => JsonSchemaFormComponent),
    multi: true,
};
/**
 * @module 'JsonSchemaFormComponent' - Angular JSON Schema Form
 *
 * Root module of the Angular JSON Schema Form client-side library,
 * an Angular library which generates an HTML form from a JSON schema
 * structured data model and/or a JSON Schema Form layout description.
 *
 * This library also validates input data by the user, using both validators on
 * individual controls to provide real-time feedback while the user is filling
 * out the form, and then validating the entire input against the schema when
 * the form is submitted to make sure the returned JSON data object is valid.
 *
 * This library is similar to, and mostly API compatible with:
 *
 * - JSON Schema Form's Angular Schema Form library for AngularJs
 *   http://schemaform.io
 *   http://schemaform.io/examples/bootstrap-example.html (examples)
 *
 * - Mozilla's react-jsonschema-form library for React
 *   https://github.com/mozilla-services/react-jsonschema-form
 *   https://mozilla-services.github.io/react-jsonschema-form (examples)
 *
 * - Joshfire's JSON Form library for jQuery
 *   https://github.com/joshfire/jsonform
 *   http://ulion.github.io/jsonform/playground (examples)
 *
 * This library depends on:
 *  - Angular (obviously)                  https://angular.io
 *  - lodash, JavaScript utility library   https://github.com/lodash/lodash
 *  - ajv, Another JSON Schema validator   https://github.com/epoberezkin/ajv
 *
 * In addition, the Example Playground also depends on:
 *  - brace, Browserified Ace editor       http://thlorenz.github.io/brace
 */
export class JsonSchemaFormComponent {
    constructor(changeDetector, frameworkLibrary, widgetLibrary, jsf) {
        this.changeDetector = changeDetector;
        this.frameworkLibrary = frameworkLibrary;
        this.widgetLibrary = widgetLibrary;
        this.jsf = jsf;
        // TODO: quickfix to avoid subscribing twice to the same emitters
        this.unsubscribeOnActivateForm$ = new Subject();
        this.formValueSubscription = null;
        this.formInitialized = false;
        this.objectWrap = false; // Is non-object input schema wrapped in an object?
        this.previousInputs = {
            schema: null, layout: null, data: null, options: null, framework: null,
            widgets: null, form: null, model: null, JSONSchema: null, UISchema: null,
            formData: null, loadExternalAssets: null, debug: null,
        };
        // Outputs
        this.onChanges = new EventEmitter(); // Live unvalidated internal form data
        this.onSubmit = new EventEmitter(); // Complete validated form data
        this.isValid = new EventEmitter(); // Is current data valid?
        this.validationErrors = new EventEmitter(); // Validation errors (if any)
        this.formSchema = new EventEmitter(); // Final schema used to create form
        this.formLayout = new EventEmitter(); // Final layout used to create form
        // Outputs for possible 2-way data binding
        // Only the one input providing the initial form data will be bound.
        // If there is no inital data, input '{}' to activate 2-way data binding.
        // There is no 2-way binding if inital data is combined inside the 'form' input.
        this.dataChange = new EventEmitter();
        this.modelChange = new EventEmitter();
        this.formDataChange = new EventEmitter();
        this.ngModelChange = new EventEmitter();
    }
    get value() {
        return this.objectWrap ? this.jsf.data['1'] : this.jsf.data;
    }
    set value(value) {
        this.setFormValues(value, false);
    }
    resetScriptsAndStyleSheets() {
        document.querySelectorAll('.ajsf').forEach(element => element.remove());
    }
    loadScripts() {
        const scripts = this.frameworkLibrary.getFrameworkScripts();
        scripts.map(script => {
            const scriptTag = document.createElement('script');
            scriptTag.src = script;
            scriptTag.type = 'text/javascript';
            scriptTag.async = true;
            scriptTag.setAttribute('class', 'ajsf');
            document.getElementsByTagName('head')[0].appendChild(scriptTag);
        });
    }
    loadStyleSheets() {
        const stylesheets = this.frameworkLibrary.getFrameworkStylesheets();
        stylesheets.map(stylesheet => {
            const linkTag = document.createElement('link');
            linkTag.rel = 'stylesheet';
            linkTag.href = stylesheet;
            linkTag.setAttribute('class', 'ajsf');
            document.getElementsByTagName('head')[0].appendChild(linkTag);
        });
    }
    loadAssets() {
        this.resetScriptsAndStyleSheets();
        this.loadScripts();
        this.loadStyleSheets();
    }
    ngOnInit() {
        this.updateForm();
        this.loadAssets();
    }
    ngOnChanges(changes) {
        this.updateForm();
        // Check if there's changes in Framework then load assets if that's the
        if (changes.framework) {
            if (!changes.framework.isFirstChange() &&
                (changes.framework.previousValue !== changes.framework.currentValue)) {
                this.loadAssets();
            }
        }
    }
    writeValue(value) {
        this.setFormValues(value, false);
        if (!this.formValuesInput) {
            this.formValuesInput = 'ngModel';
        }
    }
    registerOnChange(fn) {
        this.onChange = fn;
    }
    registerOnTouched(fn) {
        this.onTouched = fn;
    }
    setDisabledState(isDisabled) {
        if (this.jsf.formOptions.formDisabled !== !!isDisabled) {
            this.jsf.formOptions.formDisabled = !!isDisabled;
            this.initializeForm();
        }
    }
    updateForm() {
        if (!this.formInitialized || !this.formValuesInput ||
            (this.language && this.language !== this.jsf.language)) {
            this.initializeForm();
        }
        else {
            if (this.language && this.language !== this.jsf.language) {
                this.jsf.setLanguage(this.language);
            }
            // Get names of changed inputs
            let changedInput = Object.keys(this.previousInputs)
                .filter(input => this.previousInputs[input] !== this[input]);
            let resetFirst = true;
            if (changedInput.length === 1 && changedInput[0] === 'form' &&
                this.formValuesInput.startsWith('form.')) {
                // If only 'form' input changed, get names of changed keys
                changedInput = Object.keys(this.previousInputs.form || {})
                    .filter(key => !isEqual(this.previousInputs.form[key], this.form[key]))
                    .map(key => `form.${key}`);
                resetFirst = false;
            }
            // If only input values have changed, update the form values
            if (changedInput.length === 1 && changedInput[0] === this.formValuesInput) {
                if (this.formValuesInput.indexOf('.') === -1) {
                    this.setFormValues(this[this.formValuesInput], resetFirst);
                }
                else {
                    const [input, key] = this.formValuesInput.split('.');
                    this.setFormValues(this[input][key], resetFirst);
                }
                // If anything else has changed, re-render the entire form
            }
            else if (changedInput.length) {
                this.initializeForm();
                if (this.onChange) {
                    this.onChange(this.jsf.formValues);
                }
                if (this.onTouched) {
                    this.onTouched(this.jsf.formValues);
                }
            }
            // Update previous inputs
            Object.keys(this.previousInputs)
                .filter(input => this.previousInputs[input] !== this[input])
                .forEach(input => this.previousInputs[input] = this[input]);
        }
    }
    setFormValues(formValues, resetFirst = true) {
        if (formValues) {
            const newFormValues = this.objectWrap ? formValues['1'] : formValues;
            if (!this.jsf.formGroup) {
                this.jsf.formValues = formValues;
                this.activateForm();
            }
            else if (resetFirst) {
                this.jsf.formGroup.reset();
            }
            if (this.jsf.formGroup) {
                this.jsf.formGroup.patchValue(newFormValues);
            }
            if (this.onChange) {
                this.onChange(newFormValues);
            }
            if (this.onTouched) {
                this.onTouched(newFormValues);
            }
        }
        else {
            this.jsf.formGroup.reset();
        }
    }
    submitForm() {
        const validData = this.jsf.validData;
        this.onSubmit.emit(this.objectWrap ? validData['1'] : validData);
    }
    /**
     * 'initializeForm' function
     *
     * - Update 'schema', 'layout', and 'formValues', from inputs.
     *
     * - Create 'schemaRefLibrary' and 'schemaRecursiveRefMap'
     *   to resolve schema $ref links, including recursive $ref links.
     *
     * - Create 'dataRecursiveRefMap' to resolve recursive links in data
     *   and corectly set output formats for recursively nested values.
     *
     * - Create 'layoutRefLibrary' and 'templateRefLibrary' to store
     *   new layout nodes and formGroup elements to use when dynamically
     *   adding form components to arrays and recursive $ref points.
     *
     * - Create 'dataMap' to map the data to the schema and template.
     *
     * - Create the master 'formGroupTemplate' then from it 'formGroup'
     *   the Angular formGroup used to control the reactive form.
     */
    initializeForm() {
        if (this.schema || this.layout || this.data || this.form || this.model ||
            this.JSONSchema || this.UISchema || this.formData || this.ngModel ||
            this.jsf.data) {
            this.jsf.resetAllValues(); // Reset all form values to defaults
            this.initializeOptions(); // Update options
            this.initializeSchema(); // Update schema, schemaRefLibrary,
            // schemaRecursiveRefMap, & dataRecursiveRefMap
            this.initializeLayout(); // Update layout, layoutRefLibrary,
            this.initializeData(); // Update formValues
            this.activateForm(); // Update dataMap, templateRefLibrary,
            // formGroupTemplate, formGroup
            // Uncomment individual lines to output debugging information to console:
            // (These always work.)
            // console.log('loading form...');
            // console.log('schema', this.jsf.schema);
            // console.log('layout', this.jsf.layout);
            // console.log('options', this.options);
            // console.log('formValues', this.jsf.formValues);
            // console.log('formGroupTemplate', this.jsf.formGroupTemplate);
            // console.log('formGroup', this.jsf.formGroup);
            // console.log('formGroup.value', this.jsf.formGroup.value);
            // console.log('schemaRefLibrary', this.jsf.schemaRefLibrary);
            // console.log('layoutRefLibrary', this.jsf.layoutRefLibrary);
            // console.log('templateRefLibrary', this.jsf.templateRefLibrary);
            // console.log('dataMap', this.jsf.dataMap);
            // console.log('arrayMap', this.jsf.arrayMap);
            // console.log('schemaRecursiveRefMap', this.jsf.schemaRecursiveRefMap);
            // console.log('dataRecursiveRefMap', this.jsf.dataRecursiveRefMap);
            // Uncomment individual lines to output debugging information to browser:
            // (These only work if the 'debug' option has also been set to 'true'.)
            if (this.debug || this.jsf.formOptions.debug) {
                const vars = [];
                // vars.push(this.jsf.schema);
                // vars.push(this.jsf.layout);
                // vars.push(this.options);
                // vars.push(this.jsf.formValues);
                // vars.push(this.jsf.formGroup.value);
                // vars.push(this.jsf.formGroupTemplate);
                // vars.push(this.jsf.formGroup);
                // vars.push(this.jsf.schemaRefLibrary);
                // vars.push(this.jsf.layoutRefLibrary);
                // vars.push(this.jsf.templateRefLibrary);
                // vars.push(this.jsf.dataMap);
                // vars.push(this.jsf.arrayMap);
                // vars.push(this.jsf.schemaRecursiveRefMap);
                // vars.push(this.jsf.dataRecursiveRefMap);
                this.debugOutput = vars.map(v => JSON.stringify(v, null, 2)).join('\n');
            }
            this.formInitialized = true;
        }
    }
    /**
     * 'initializeOptions' function
     *
     * Initialize 'options' (global form options) and set framework
     * Combine available inputs:
     * 1. options - recommended
     * 2. form.options - Single input style
     */
    initializeOptions() {
        if (this.language && this.language !== this.jsf.language) {
            this.jsf.setLanguage(this.language);
        }
        this.jsf.setOptions({ debug: !!this.debug });
        let loadExternalAssets = this.loadExternalAssets || false;
        let framework = this.framework || 'default';
        if (isObject(this.options)) {
            this.jsf.setOptions(this.options);
            loadExternalAssets = this.options.loadExternalAssets || loadExternalAssets;
            framework = this.options.framework || framework;
        }
        if (isObject(this.form) && isObject(this.form.options)) {
            this.jsf.setOptions(this.form.options);
            loadExternalAssets = this.form.options.loadExternalAssets || loadExternalAssets;
            framework = this.form.options.framework || framework;
        }
        if (isObject(this.widgets)) {
            this.jsf.setOptions({ widgets: this.widgets });
        }
        this.frameworkLibrary.setLoadExternalAssets(loadExternalAssets);
        this.frameworkLibrary.setFramework(framework);
        this.jsf.framework = this.frameworkLibrary.getFramework();
        if (isObject(this.jsf.formOptions.widgets)) {
            for (const widget of Object.keys(this.jsf.formOptions.widgets)) {
                this.widgetLibrary.registerWidget(widget, this.jsf.formOptions.widgets[widget]);
            }
        }
        if (isObject(this.form) && isObject(this.form.tpldata)) {
            this.jsf.setTpldata(this.form.tpldata);
        }
    }
    /**
     * 'initializeSchema' function
     *
     * Initialize 'schema'
     * Use first available input:
     * 1. schema - recommended / Angular Schema Form style
     * 2. form.schema - Single input / JSON Form style
     * 3. JSONSchema - React JSON Schema Form style
     * 4. form.JSONSchema - For testing single input React JSON Schema Forms
     * 5. form - For testing single schema-only inputs
     *
     * ... if no schema input found, the 'activateForm' function, below,
     *     will make two additional attempts to build a schema
     * 6. If layout input - build schema from layout
     * 7. If data input - build schema from data
     */
    initializeSchema() {
        // TODO: update to allow non-object schemas
        if (isObject(this.schema)) {
            this.jsf.AngularSchemaFormCompatibility = true;
            this.jsf.schema = cloneDeep(this.schema);
        }
        else if (hasOwn(this.form, 'schema') && isObject(this.form.schema)) {
            this.jsf.schema = cloneDeep(this.form.schema);
        }
        else if (isObject(this.JSONSchema)) {
            this.jsf.ReactJsonSchemaFormCompatibility = true;
            this.jsf.schema = cloneDeep(this.JSONSchema);
        }
        else if (hasOwn(this.form, 'JSONSchema') && isObject(this.form.JSONSchema)) {
            this.jsf.ReactJsonSchemaFormCompatibility = true;
            this.jsf.schema = cloneDeep(this.form.JSONSchema);
        }
        else if (hasOwn(this.form, 'properties') && isObject(this.form.properties)) {
            this.jsf.schema = cloneDeep(this.form);
        }
        else if (isObject(this.form)) {
            // TODO: Handle other types of form input
        }
        if (!isEmpty(this.jsf.schema)) {
            // If other types also allowed, render schema as an object
            if (inArray('object', this.jsf.schema.type)) {
                this.jsf.schema.type = 'object';
            }
            // Wrap non-object schemas in object.
            if (hasOwn(this.jsf.schema, 'type') && this.jsf.schema.type !== 'object') {
                this.jsf.schema = {
                    'type': 'object',
                    'properties': { 1: this.jsf.schema }
                };
                this.objectWrap = true;
            }
            else if (!hasOwn(this.jsf.schema, 'type')) {
                // Add type = 'object' if missing
                if (isObject(this.jsf.schema.properties) ||
                    isObject(this.jsf.schema.patternProperties) ||
                    isObject(this.jsf.schema.additionalProperties)) {
                    this.jsf.schema.type = 'object';
                    // Fix JSON schema shorthand (JSON Form style)
                }
                else {
                    this.jsf.JsonFormCompatibility = true;
                    this.jsf.schema = {
                        'type': 'object',
                        'properties': this.jsf.schema
                    };
                }
            }
            // If needed, update JSON Schema to draft 6 format, including
            // draft 3 (JSON Form style) and draft 4 (Angular Schema Form style)
            this.jsf.schema = convertSchemaToDraft6(this.jsf.schema);
            // Initialize ajv and compile schema
            this.jsf.compileAjvSchema();
            // Create schemaRefLibrary, schemaRecursiveRefMap, dataRecursiveRefMap, & arrayMap
            this.jsf.schema = resolveSchemaReferences(this.jsf.schema, this.jsf.schemaRefLibrary, this.jsf.schemaRecursiveRefMap, this.jsf.dataRecursiveRefMap, this.jsf.arrayMap);
            if (hasOwn(this.jsf.schemaRefLibrary, '')) {
                this.jsf.hasRootReference = true;
            }
            // TODO: (?) Resolve external $ref links
            // // Create schemaRefLibrary & schemaRecursiveRefMap
            // this.parser.bundle(this.schema)
            //   .then(schema => this.schema = resolveSchemaReferences(
            //     schema, this.jsf.schemaRefLibrary,
            //     this.jsf.schemaRecursiveRefMap, this.jsf.dataRecursiveRefMap
            //   ));
        }
    }
    /**
     * 'initializeData' function
     *
     * Initialize 'formValues'
     * defulat or previously submitted values used to populate form
     * Use first available input:
     * 1. data - recommended
     * 2. model - Angular Schema Form style
     * 3. form.value - JSON Form style
     * 4. form.data - Single input style
     * 5. formData - React JSON Schema Form style
     * 6. form.formData - For easier testing of React JSON Schema Forms
     * 7. (none) no data - initialize data from schema and layout defaults only
     */
    initializeData() {
        if (hasValue(this.data)) {
            this.jsf.formValues = cloneDeep(this.data);
            this.formValuesInput = 'data';
        }
        else if (hasValue(this.model)) {
            this.jsf.AngularSchemaFormCompatibility = true;
            this.jsf.formValues = cloneDeep(this.model);
            this.formValuesInput = 'model';
        }
        else if (hasValue(this.ngModel)) {
            this.jsf.AngularSchemaFormCompatibility = true;
            this.jsf.formValues = cloneDeep(this.ngModel);
            this.formValuesInput = 'ngModel';
        }
        else if (isObject(this.form) && hasValue(this.form.value)) {
            this.jsf.JsonFormCompatibility = true;
            this.jsf.formValues = cloneDeep(this.form.value);
            this.formValuesInput = 'form.value';
        }
        else if (isObject(this.form) && hasValue(this.form.data)) {
            this.jsf.formValues = cloneDeep(this.form.data);
            this.formValuesInput = 'form.data';
        }
        else if (hasValue(this.formData)) {
            this.jsf.ReactJsonSchemaFormCompatibility = true;
            this.formValuesInput = 'formData';
        }
        else if (hasOwn(this.form, 'formData') && hasValue(this.form.formData)) {
            this.jsf.ReactJsonSchemaFormCompatibility = true;
            this.jsf.formValues = cloneDeep(this.form.formData);
            this.formValuesInput = 'form.formData';
        }
        else {
            this.formValuesInput = null;
        }
    }
    /**
     * 'initializeLayout' function
     *
     * Initialize 'layout'
     * Use first available array input:
     * 1. layout - recommended
     * 2. form - Angular Schema Form style
     * 3. form.form - JSON Form style
     * 4. form.layout - Single input style
     * 5. (none) no layout - set default layout instead
     *    (full layout will be built later from the schema)
     *
     * Also, if alternate layout formats are available,
     * import from 'UISchema' or 'customFormItems'
     * used for React JSON Schema Form and JSON Form API compatibility
     * Use first available input:
     * 1. UISchema - React JSON Schema Form style
     * 2. form.UISchema - For testing single input React JSON Schema Forms
     * 2. form.customFormItems - JSON Form style
     * 3. (none) no input - don't import
     */
    initializeLayout() {
        // Rename JSON Form-style 'options' lists to
        // Angular Schema Form-style 'titleMap' lists.
        const fixJsonFormOptions = (layout) => {
            if (isObject(layout) || isArray(layout)) {
                forEach(layout, (value, key) => {
                    if (hasOwn(value, 'options') && isObject(value.options)) {
                        value.titleMap = value.options;
                        delete value.options;
                    }
                }, 'top-down');
            }
            return layout;
        };
        // Check for layout inputs and, if found, initialize form layout
        if (isArray(this.layout)) {
            this.jsf.layout = cloneDeep(this.layout);
        }
        else if (isArray(this.form)) {
            this.jsf.AngularSchemaFormCompatibility = true;
            this.jsf.layout = cloneDeep(this.form);
        }
        else if (this.form && isArray(this.form.form)) {
            this.jsf.JsonFormCompatibility = true;
            this.jsf.layout = fixJsonFormOptions(cloneDeep(this.form.form));
        }
        else if (this.form && isArray(this.form.layout)) {
            this.jsf.layout = cloneDeep(this.form.layout);
        }
        else {
            this.jsf.layout = ['*'];
        }
        // Check for alternate layout inputs
        let alternateLayout = null;
        if (isObject(this.UISchema)) {
            this.jsf.ReactJsonSchemaFormCompatibility = true;
            alternateLayout = cloneDeep(this.UISchema);
        }
        else if (hasOwn(this.form, 'UISchema')) {
            this.jsf.ReactJsonSchemaFormCompatibility = true;
            alternateLayout = cloneDeep(this.form.UISchema);
        }
        else if (hasOwn(this.form, 'uiSchema')) {
            this.jsf.ReactJsonSchemaFormCompatibility = true;
            alternateLayout = cloneDeep(this.form.uiSchema);
        }
        else if (hasOwn(this.form, 'customFormItems')) {
            this.jsf.JsonFormCompatibility = true;
            alternateLayout = fixJsonFormOptions(cloneDeep(this.form.customFormItems));
        }
        // if alternate layout found, copy alternate layout options into schema
        if (alternateLayout) {
            JsonPointer.forEachDeep(alternateLayout, (value, pointer) => {
                const schemaPointer = pointer
                    .replace(/\//g, '/properties/')
                    .replace(/\/properties\/items\/properties\//g, '/items/properties/')
                    .replace(/\/properties\/titleMap\/properties\//g, '/titleMap/properties/');
                if (hasValue(value) && hasValue(pointer)) {
                    let key = JsonPointer.toKey(pointer);
                    const groupPointer = (JsonPointer.parse(schemaPointer) || []).slice(0, -2);
                    let itemPointer;
                    // If 'ui:order' object found, copy into object schema root
                    if (key.toLowerCase() === 'ui:order') {
                        itemPointer = [...groupPointer, 'ui:order'];
                        // Copy other alternate layout options to schema 'x-schema-form',
                        // (like Angular Schema Form options) and remove any 'ui:' prefixes
                    }
                    else {
                        if (key.slice(0, 3).toLowerCase() === 'ui:') {
                            key = key.slice(3);
                        }
                        itemPointer = [...groupPointer, 'x-schema-form', key];
                    }
                    if (JsonPointer.has(this.jsf.schema, groupPointer) &&
                        !JsonPointer.has(this.jsf.schema, itemPointer)) {
                        JsonPointer.set(this.jsf.schema, itemPointer, value);
                    }
                }
            });
        }
    }
    /**
     * 'activateForm' function
     *
     * ...continued from 'initializeSchema' function, above
     * If 'schema' has not been initialized (i.e. no schema input found)
     * 6. If layout input - build schema from layout input
     * 7. If data input - build schema from data input
     *
     * Create final layout,
     * build the FormGroup template and the Angular FormGroup,
     * subscribe to changes,
     * and activate the form.
     */
    activateForm() {
        this.unsubscribeOnActivateForm$.next();
        // If 'schema' not initialized
        if (isEmpty(this.jsf.schema)) {
            // TODO: If full layout input (with no '*'), build schema from layout
            // if (!this.jsf.layout.includes('*')) {
            //   this.jsf.buildSchemaFromLayout();
            // } else
            // If data input, build schema from data
            if (!isEmpty(this.jsf.formValues)) {
                this.jsf.buildSchemaFromData();
            }
        }
        if (!isEmpty(this.jsf.schema)) {
            // If not already initialized, initialize ajv and compile schema
            this.jsf.compileAjvSchema();
            // Update all layout elements, add values, widgets, and validators,
            // replace any '*' with a layout built from all schema elements,
            // and update the FormGroup template with any new validators
            this.jsf.buildLayout(this.widgetLibrary);
            // Build the Angular FormGroup template from the schema
            this.jsf.buildFormGroupTemplate(this.jsf.formValues);
            // Build the real Angular FormGroup from the FormGroup template
            this.jsf.buildFormGroup();
        }
        if (this.jsf.formGroup) {
            // Reset initial form values
            if (!isEmpty(this.jsf.formValues) &&
                this.jsf.formOptions.setSchemaDefaults !== true &&
                this.jsf.formOptions.setLayoutDefaults !== true) {
                this.setFormValues(this.jsf.formValues);
            }
            // TODO: Figure out how to display calculated values without changing object data
            // See http://ulion.github.io/jsonform/playground/?example=templating-values
            // Calculate references to other fields
            // if (!isEmpty(this.jsf.formGroup.value)) {
            //   forEach(this.jsf.formGroup.value, (value, key, object, rootObject) => {
            //     if (typeof value === 'string') {
            //       object[key] = this.jsf.parseText(value, value, rootObject, key);
            //     }
            //   }, 'top-down');
            // }
            // Subscribe to form changes to output live data, validation, and errors
            this.jsf.dataChanges.pipe(takeUntil(this.unsubscribeOnActivateForm$)).subscribe(data => {
                this.onChanges.emit(this.objectWrap ? data['1'] : data);
                if (this.formValuesInput && this.formValuesInput.indexOf('.') === -1) {
                    this[`${this.formValuesInput}Change`].emit(this.objectWrap ? data['1'] : data);
                }
            });
            // Trigger change detection on statusChanges to show updated errors
            this.jsf.formGroup.statusChanges.pipe(takeUntil(this.unsubscribeOnActivateForm$)).subscribe(() => this.changeDetector.markForCheck());
            this.jsf.isValidChanges.pipe(takeUntil(this.unsubscribeOnActivateForm$)).subscribe(isValid => this.isValid.emit(isValid));
            this.jsf.validationErrorChanges.pipe(takeUntil(this.unsubscribeOnActivateForm$)).subscribe(err => this.validationErrors.emit(err));
            // Output final schema, final layout, and initial data
            this.formSchema.emit(this.jsf.schema);
            this.formLayout.emit(this.jsf.layout);
            this.onChanges.emit(this.objectWrap ? this.jsf.data['1'] : this.jsf.data);
            // If validateOnRender, output initial validation and any errors
            const validateOnRender = JsonPointer.get(this.jsf, '/formOptions/validateOnRender');
            if (validateOnRender) { // validateOnRender === 'auto' || true
                const touchAll = (control) => {
                    if (validateOnRender === true || hasValue(control.value)) {
                        control.markAsTouched();
                    }
                    Object.keys(control.controls || {})
                        .forEach(key => touchAll(control.controls[key]));
                };
                touchAll(this.jsf.formGroup);
                this.isValid.emit(this.jsf.isValid);
                this.validationErrors.emit(this.jsf.ajvErrors);
            }
        }
    }
}
JsonSchemaFormComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.2.0", ngImport: i0, type: JsonSchemaFormComponent, deps: [{ token: i0.ChangeDetectorRef }, { token: i1.FrameworkLibraryService }, { token: i2.WidgetLibraryService }, { token: i3.JsonSchemaFormService }], target: i0.ɵɵFactoryTarget.Component });
JsonSchemaFormComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "14.2.0", type: JsonSchemaFormComponent, selector: "json-schema-form", inputs: { schema: "schema", layout: "layout", data: "data", options: "options", framework: "framework", widgets: "widgets", form: "form", model: "model", JSONSchema: "JSONSchema", UISchema: "UISchema", formData: "formData", ngModel: "ngModel", language: "language", loadExternalAssets: "loadExternalAssets", debug: "debug", value: "value" }, outputs: { onChanges: "onChanges", onSubmit: "onSubmit", isValid: "isValid", validationErrors: "validationErrors", formSchema: "formSchema", formLayout: "formLayout", dataChange: "dataChange", modelChange: "modelChange", formDataChange: "formDataChange", ngModelChange: "ngModelChange" }, providers: [JsonSchemaFormService, JSON_SCHEMA_FORM_VALUE_ACCESSOR], usesOnChanges: true, ngImport: i0, template: "<form [autocomplete]=\"jsf?.formOptions?.autocomplete ? 'on' : 'off'\" class=\"json-schema-form\" (ngSubmit)=\"submitForm()\">\r\n  <root-widget [layout]=\"jsf?.layout\"></root-widget>\r\n</form>\r\n<div *ngIf=\"debug || jsf?.formOptions?.debug\">\r\n  Debug output:\r\n  <pre>{{debugOutput}}</pre>\r\n</div>", dependencies: [{ kind: "directive", type: i4.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { kind: "directive", type: i5.ɵNgNoValidate, selector: "form:not([ngNoForm]):not([ngNativeValidate])" }, { kind: "directive", type: i5.NgControlStatusGroup, selector: "[formGroupName],[formArrayName],[ngModelGroup],[formGroup],form:not([ngNoForm]),[ngForm]" }, { kind: "directive", type: i5.NgForm, selector: "form:not([ngNoForm]):not([formGroup]),ng-form,[ngForm]", inputs: ["ngFormOptions"], outputs: ["ngSubmit"], exportAs: ["ngForm"] }, { kind: "component", type: i6.RootComponent, selector: "root-widget", inputs: ["dataIndex", "layoutIndex", "layout", "isOrderable", "isFlexItem"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.2.0", ngImport: i0, type: JsonSchemaFormComponent, decorators: [{
            type: Component,
            args: [{ selector: 'json-schema-form', changeDetection: ChangeDetectionStrategy.OnPush, providers: [JsonSchemaFormService, JSON_SCHEMA_FORM_VALUE_ACCESSOR], template: "<form [autocomplete]=\"jsf?.formOptions?.autocomplete ? 'on' : 'off'\" class=\"json-schema-form\" (ngSubmit)=\"submitForm()\">\r\n  <root-widget [layout]=\"jsf?.layout\"></root-widget>\r\n</form>\r\n<div *ngIf=\"debug || jsf?.formOptions?.debug\">\r\n  Debug output:\r\n  <pre>{{debugOutput}}</pre>\r\n</div>" }]
        }], ctorParameters: function () { return [{ type: i0.ChangeDetectorRef }, { type: i1.FrameworkLibraryService }, { type: i2.WidgetLibraryService }, { type: i3.JsonSchemaFormService }]; }, propDecorators: { schema: [{
                type: Input
            }], layout: [{
                type: Input
            }], data: [{
                type: Input
            }], options: [{
                type: Input
            }], framework: [{
                type: Input
            }], widgets: [{
                type: Input
            }], form: [{
                type: Input
            }], model: [{
                type: Input
            }], JSONSchema: [{
                type: Input
            }], UISchema: [{
                type: Input
            }], formData: [{
                type: Input
            }], ngModel: [{
                type: Input
            }], language: [{
                type: Input
            }], loadExternalAssets: [{
                type: Input
            }], debug: [{
                type: Input
            }], value: [{
                type: Input
            }], onChanges: [{
                type: Output
            }], onSubmit: [{
                type: Output
            }], isValid: [{
                type: Output
            }], validationErrors: [{
                type: Output
            }], formSchema: [{
                type: Output
            }], formLayout: [{
                type: Output
            }], dataChange: [{
                type: Output
            }], modelChange: [{
                type: Output
            }], formDataChange: [{
                type: Output
            }], ngModelChange: [{
                type: Output
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbi1zY2hlbWEtZm9ybS5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9hanNmLWNvcmUvc3JjL2xpYi9qc29uLXNjaGVtYS1mb3JtLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2Fqc2YtY29yZS9zcmMvbGliL2pzb24tc2NoZW1hLWZvcm0uY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxTQUFTLE1BQU0sa0JBQWtCLENBQUM7QUFDekMsT0FBTyxPQUFPLE1BQU0sZ0JBQWdCLENBQUM7QUFFckMsT0FBTyxFQUNMLHVCQUF1QixFQUV2QixTQUFTLEVBQ1QsWUFBWSxFQUNaLFVBQVUsRUFDVixLQUFLLEVBR0wsTUFBTSxHQUVQLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBd0IsaUJBQWlCLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUN6RSxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBQy9CLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUMzQyxPQUFPLEVBQUUscUJBQXFCLEVBQUUsTUFBTSw0Q0FBNEMsQ0FBQztBQUNuRixPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBRTdELE9BQU8sRUFDTCxRQUFRLEVBQ1IsT0FBTyxFQUNQLE9BQU8sRUFDUCxPQUFPLEVBQ1AsUUFBUSxFQUNULE1BQU0sOEJBQThCLENBQUM7QUFDdEMsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBQzdELE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBQ25FLE9BQU8sRUFBRSx1QkFBdUIsRUFBRSxNQUFNLGdDQUFnQyxDQUFDOzs7Ozs7OztBQUd6RSxNQUFNLENBQUMsTUFBTSwrQkFBK0IsR0FBUTtJQUNs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QUF1QixrcUJBRnRCLENBQUUscUJBQXFCLEVBQUUsK0JBQStCLENBQUUsK0NDaEZ4RSxzVEFNTTsyRkQ0RU8sdUJBQXVCO2tCQVRuQyxTQUFTOytCQUVFLGtCQUFrQixtQkFFWCx1QkFBdUIsQ0FBQyxNQUFNLGFBR25DLENBQUUscUJBQXFCLEVBQUUsK0JBQStCLENBQUU7cU5BdUI3RCxNQUFNO3NCQUFkLEtBQUs7Z0JBQ0csTUFBTTtzQkFBZCxLQUFLO2dCQUNHLElBQUk7c0JBQVosS0FBSztnQkFDRyxPQUFPO3NCQUFmLEtBQUs7Z0JBQ0csU0FBUztzQkFBakIsS0FBSztnQkFDRyxPQUFPO3NCQUFmLEtBQUs7Z0JBR0csSUFBSTtzQkFBWixLQUFLO2dCQUdHLEtBQUs7c0JBQWIsS0FBSztnQkFHRyxVQUFVO3NCQUFsQixLQUFLO2dCQUNHLFFBQVE7c0JBQWhCLEtBQUs7Z0JBQ0csUUFBUTtzQkFBaEIsS0FBSztnQkFFRyxPQUFPO3NCQUFmLEtBQUs7Z0JBRUcsUUFBUTtzQkFBaEIsS0FBSztnQkFHRyxrQkFBa0I7c0JBQTFCLEtBQUs7Z0JBQ0csS0FBSztzQkFBYixLQUFLO2dCQUdGLEtBQUs7c0JBRFIsS0FBSztnQkFTSSxTQUFTO3NCQUFsQixNQUFNO2dCQUNHLFFBQVE7c0JBQWpCLE1BQU07Z0JBQ0csT0FBTztzQkFBaEIsTUFBTTtnQkFDRyxnQkFBZ0I7c0JBQXpCLE1BQU07Z0JBQ0csVUFBVTtzQkFBbkIsTUFBTTtnQkFDRyxVQUFVO3NCQUFuQixNQUFNO2dCQU1HLFVBQVU7c0JBQW5CLE1BQU07Z0JBQ0csV0FBVztzQkFBcEIsTUFBTTtnQkFDRyxjQUFjO3NCQUF2QixNQUFNO2dCQUNHLGFBQWE7c0JBQXRCLE1BQU0iLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY2xvbmVEZWVwIGZyb20gJ2xvZGFzaC9jbG9uZURlZXAnO1xyXG5pbXBvcnQgaXNFcXVhbCBmcm9tICdsb2Rhc2gvaXNFcXVhbCc7XHJcblxyXG5pbXBvcnQge1xyXG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxyXG4gIENoYW5nZURldGVjdG9yUmVmLFxyXG4gIENvbXBvbmVudCxcclxuICBFdmVudEVtaXR0ZXIsXHJcbiAgZm9yd2FyZFJlZixcclxuICBJbnB1dCxcclxuICBPbkNoYW5nZXMsXHJcbiAgT25Jbml0LFxyXG4gIE91dHB1dCxcclxuICBTaW1wbGVDaGFuZ2VzLFxyXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQgeyBDb250cm9sVmFsdWVBY2Nlc3NvciwgTkdfVkFMVUVfQUNDRVNTT1IgfSBmcm9tICdAYW5ndWxhci9mb3Jtcyc7XHJcbmltcG9ydCB7IFN1YmplY3QgfSBmcm9tICdyeGpzJztcclxuaW1wb3J0IHsgdGFrZVVudGlsIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xyXG5pbXBvcnQgeyBjb252ZXJ0U2NoZW1hVG9EcmFmdDYgfSBmcm9tICcuL3NoYXJlZC9jb252ZXJ0LXNjaGVtYS10by1kcmFmdDYuZnVuY3Rpb24nO1xyXG5pbXBvcnQgeyBmb3JFYWNoLCBoYXNPd24gfSBmcm9tICcuL3NoYXJlZC91dGlsaXR5LmZ1bmN0aW9ucyc7XHJcbmltcG9ydCB7IEZyYW1ld29ya0xpYnJhcnlTZXJ2aWNlIH0gZnJvbSAnLi9mcmFtZXdvcmstbGlicmFyeS9mcmFtZXdvcmstbGlicmFyeS5zZXJ2aWNlJztcclxuaW1wb3J0IHtcclxuICBoYXNWYWx1ZSxcclxuICBpbkFycmF5LFxyXG4gIGlzQXJyYXksXHJcbiAgaXNFbXB0eSxcclxuICBpc09iamVjdFxyXG59IGZyb20gJy4vc2hhcmVkL3ZhbGlkYXRvci5mdW5jdGlvbnMnO1xyXG5pbXBvcnQgeyBKc29uUG9pbnRlciB9IGZyb20gJy4vc2hhcmVkL2pzb25wb2ludGVyLmZ1bmN0aW9ucyc7XHJcbmltcG9ydCB7IEpzb25TY2hlbWFGb3JtU2VydmljZSB9IGZyb20gJy4vanNvbi1zY2hlbWEtZm9ybS5zZXJ2aWNlJztcclxuaW1wb3J0IHsgcmVzb2x2ZVNjaGVtYVJlZmVyZW5jZXMgfSBmcm9tICcuL3NoYXJlZC9qc29uLXNjaGVtYS5mdW5jdGlvbnMnO1xyXG5pbXBvcnQgeyBXaWRnZXRMaWJyYXJ5U2VydmljZSB9IGZyb20gJy4vd2lkZ2V0LWxpYnJhcnkvd2lkZ2V0LWxpYnJhcnkuc2VydmljZSc7XHJcblxyXG5leHBvcnQgY29uc3QgSlNPTl9TQ0hFTUFfRk9STV9WQUxVRV9BQ0NFU1NPUjogYW55ID0ge1xyXG4gIHByb3ZpZGU6IE5HX1ZBTFVFX0FDQ0VTU09SLFxyXG4gIHVzZUV4aXN0aW5nOiBmb3J3YXJkUmVmKCgpID0+IEpzb25TY2hlbWFGb3JtQ29tcG9uZW50KSxcclxuICBtdWx0aTogdHJ1ZSxcclxufTtcclxuXHJcbi8qKlxyXG4gKiBAbW9kdWxlICdKc29uU2NoZW1hRm9ybUNvbXBvbmVudCcgLSBBbmd1bGFyIEpTT04gU2NoZW1hIEZvcm1cclxuICpcclxuICogUm9vdCBtb2R1bGUgb2YgdGhlIEFuZ3VsYXIgSlNPTiBTY2hlbWEgRm9ybSBjbGllbnQtc2lkZSBsaWJyYXJ5LFxyXG4gKiBhbiBBbmd1bGFyIGxpYnJhcnkgd2hpY2ggZ2VuZXJhdGVzIGFuIEhUTUwgZm9ybSBmcm9tIGEgSlNPTiBzY2hlbWFcclxuICogc3RydWN0dXJlZCBkYXRhIG1vZGVsIGFuZC9vciBhIEpTT04gU2NoZW1hIEZvcm0gbGF5b3V0IGRlc2NyaXB0aW9uLlxyXG4gKlxyXG4gKiBUaGlzIGxpYnJhcnkgYWxzbyB2YWxpZGF0ZXMgaW5wdXQgZGF0YSBieSB0aGUgdXNlciwgdXNpbmcgYm90aCB2YWxpZGF0b3JzIG9uXHJcbiAqIGluZGl2aWR1YWwgY29udHJvbHMgdG8gcHJvdmlkZSByZWFsLXRpbWUgZmVlZGJhY2sgd2hpbGUgdGhlIHVzZXIgaXMgZmlsbGluZ1xyXG4gKiBvdXQgdGhlIGZvcm0sIGFuZCB0aGVuIHZhbGlkYXRpbmcgdGhlIGVudGlyZSBpbnB1dCBhZ2FpbnN0IHRoZSBzY2hlbWEgd2hlblxyXG4gKiB0aGUgZm9ybSBpcyBzdWJtaXR0ZWQgdG8gbWFrZSBzdXJlIHRoZSByZXR1cm5lZCBKU09OIGRhdGEgb2JqZWN0IGlzIHZhbGlkLlxyXG4gKlxyXG4gKiBUaGlzIGxpYnJhcnkgaXMgc2ltaWxhciB0bywgYW5kIG1vc3RseSBBUEkgY29tcGF0aWJsZSB3aXRoOlxyXG4gKlxyXG4gKiAtIEpTT04gU2NoZW1hIEZvcm0ncyBBbmd1bGFyIFNjaGVtYSBGb3JtIGxpYnJhcnkgZm9yIEFuZ3VsYXJKc1xyXG4gKiAgIGh0dHA6Ly9zY2hlbWFmb3JtLmlvXHJcbiAqICAgaHR0cDovL3NjaGVtYWZvcm0uaW8vZXhhbXBsZXMvYm9vdHN0cmFwLWV4YW1wbGUuaHRtbCAoZXhhbXBsZXMpXHJcbiAqXHJcbiAqIC0gTW96aWxsYSdzIHJlYWN0LWpzb25zY2hlbWEtZm9ybSBsaWJyYXJ5IGZvciBSZWFjdFxyXG4gKiAgIGh0dHBzOi8vZ2l0aHViLmNvbS9tb3ppbGxhLXNlcnZpY2VzL3JlYWN0LWpzb25zY2hlbWEtZm9ybVxyXG4gKiAgIGh0dHBzOi8vbW96aWxsYS1zZXJ2aWNlcy5naXRodWIuaW8vcmVhY3QtanNvbnNjaGVtYS1mb3JtIChleGFtcGxlcylcclxuICpcclxuICogLSBKb3NoZmlyZSdzIEpTT04gRm9ybSBsaWJyYXJ5IGZvciBqUXVlcnlcclxuICogICBodHRwczovL2dpdGh1Yi5jb20vam9zaGZpcmUvanNvbmZvcm1cclxuICogICBodHRwOi8vdWxpb24uZ2l0aHViLmlvL2pzb25mb3JtL3BsYXlncm91bmQgKGV4YW1wbGVzKVxyXG4gKlxyXG4gKiBUaGlzIGxpYnJhcnkgZGVwZW5kcyBvbjpcclxuICogIC0gQW5ndWxhciAob2J2aW91c2x5KSAgICAgICAgICAgICAgICAgIGh0dHBzOi8vYW5ndWxhci5pb1xyXG4gKiAgLSBsb2Rhc2gsIEphdmFTY3JpcHQgdXRpbGl0eSBsaWJyYXJ5ICAgaHR0cHM6Ly9naXRodWIuY29tL2xvZGFzaC9sb2Rhc2hcclxuICogIC0gYWp2LCBBbm90aGVyIEpTT04gU2NoZW1hIHZhbGlkYXRvciAgIGh0dHBzOi8vZ2l0aHViLmNvbS9lcG9iZXJlemtpbi9hanZcclxuICpcclxuICogSW4gYWRkaXRpb24sIHRoZSBFeGFtcGxlIFBsYXlncm91bmQgYWxzbyBkZXBlbmRzIG9uOlxyXG4gKiAgLSBicmFjZSwgQnJvd3NlcmlmaWVkIEFjZSBlZGl0b3IgICAgICAgaHR0cDovL3RobG9yZW56LmdpdGh1Yi5pby9icmFjZVxyXG4gKi9cclxuQENvbXBvbmVudCh7XHJcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOmNvbXBvbmVudC1zZWxlY3RvclxyXG4gIHNlbGVjdG9yOiAnanNvbi1zY2hlbWEtZm9ybScsXHJcbiAgdGVtcGxhdGVVcmw6ICcuL2pzb24tc2NoZW1hLWZvcm0uY29tcG9uZW50Lmh0bWwnLFxyXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoLFxyXG4gIC8vIEFkZGluZyAnSnNvblNjaGVtYUZvcm1TZXJ2aWNlJyBoZXJlLCBpbnN0ZWFkIG9mIGluIHRoZSBtb2R1bGUsXHJcbiAgLy8gY3JlYXRlcyBhIHNlcGFyYXRlIGluc3RhbmNlIG9mIHRoZSBzZXJ2aWNlIGZvciBlYWNoIGNvbXBvbmVudFxyXG4gIHByb3ZpZGVyczogIFsgSnNvblNjaGVtYUZvcm1TZXJ2aWNlLCBKU09OX1NDSEVNQV9GT1JNX1ZBTFVFX0FDQ0VTU09SIF0sXHJcbn0pXHJcbmV4cG9ydCBjbGFzcyBKc29uU2NoZW1hRm9ybUNvbXBvbmVudCBpbXBsZW1lbnRzIENvbnRyb2xWYWx1ZUFjY2Vzc29yLCBPbkNoYW5nZXMsIE9uSW5pdCB7XHJcbiAgLy8gVE9ETzogcXVpY2tmaXggdG8gYXZvaWQgc3Vic2NyaWJpbmcgdHdpY2UgdG8gdGhlIHNhbWUgZW1pdHRlcnNcclxuICBwcml2YXRlIHVuc3Vic2NyaWJlT25BY3RpdmF0ZUZvcm0kID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcclxuXHJcbiAgZGVidWdPdXRwdXQ6IGFueTsgLy8gRGVidWcgaW5mb3JtYXRpb24sIGlmIHJlcXVlc3RlZFxyXG4gIGZvcm1WYWx1ZVN1YnNjcmlwdGlvbjogYW55ID0gbnVsbDtcclxuICBmb3JtSW5pdGlhbGl6ZWQgPSBmYWxzZTtcclxuICBvYmplY3RXcmFwID0gZmFsc2U7IC8vIElzIG5vbi1vYmplY3QgaW5wdXQgc2NoZW1hIHdyYXBwZWQgaW4gYW4gb2JqZWN0P1xyXG5cclxuICBmb3JtVmFsdWVzSW5wdXQ6IHN0cmluZzsgLy8gTmFtZSBvZiB0aGUgaW5wdXQgcHJvdmlkaW5nIHRoZSBmb3JtIGRhdGFcclxuICBwcmV2aW91c0lucHV0czogeyAvLyBQcmV2aW91cyBpbnB1dCB2YWx1ZXMsIHRvIGRldGVjdCB3aGljaCBpbnB1dCB0cmlnZ2VycyBvbkNoYW5nZXNcclxuICAgIHNjaGVtYTogYW55LCBsYXlvdXQ6IGFueVtdLCBkYXRhOiBhbnksIG9wdGlvbnM6IGFueSwgZnJhbWV3b3JrOiBhbnkgfCBzdHJpbmcsXHJcbiAgICB3aWRnZXRzOiBhbnksIGZvcm06IGFueSwgbW9kZWw6IGFueSwgSlNPTlNjaGVtYTogYW55LCBVSVNjaGVtYTogYW55LFxyXG4gICAgZm9ybURhdGE6IGFueSwgbG9hZEV4dGVybmFsQXNzZXRzOiBib29sZWFuLCBkZWJ1ZzogYm9vbGVhbixcclxuICB9ID0ge1xyXG4gICAgICBzY2hlbWE6IG51bGwsIGxheW91dDogbnVsbCwgZGF0YTogbnVsbCwgb3B0aW9uczogbnVsbCwgZnJhbWV3b3JrOiBudWxsLFxyXG4gICAgICB3aWRnZXRzOiBudWxsLCBmb3JtOiBudWxsLCBtb2RlbDogbnVsbCwgSlNPTlNjaGVtYTogbnVsbCwgVUlTY2hlbWE6IG51bGwsXHJcbiAgICAgIGZvcm1EYXRhOiBudWxsLCBsb2FkRXh0ZXJuYWxBc3NldHM6IG51bGwsIGRlYnVnOiBudWxsLFxyXG4gICAgfTtcclxuXHJcbiAgLy8gUmVjb21tZW5kZWQgaW5wdXRzXHJcbiAgQElucHV0KCkgc2NoZW1hOiBhbnk7IC8vIFRoZSBKU09OIFNjaGVtYVxyXG4gIEBJbnB1dCgpIGxheW91dDogYW55W107IC8vIFRoZSBmb3JtIGxheW91dFxyXG4gIEBJbnB1dCgpIGRhdGE6IGFueTsgLy8gVGhlIGZvcm0gZGF0YVxyXG4gIEBJbnB1dCgpIG9wdGlvbnM6IGFueTsgLy8gVGhlIGdsb2JhbCBmb3JtIG9wdGlvbnNcclxuICBASW5wdXQoKSBmcmFtZXdvcms6IGFueSB8IHN0cmluZzsgLy8gVGhlIGZyYW1ld29yayB0byBsb2FkXHJcbiAgQElucHV0KCkgd2lkZ2V0czogYW55OyAvLyBBbnkgY3VzdG9tIHdpZGdldHMgdG8gbG9hZFxyXG5cclxuICAvLyBBbHRlcm5hdGUgY29tYmluZWQgc2luZ2xlIGlucHV0XHJcbiAgQElucHV0KCkgZm9ybTogYW55OyAvLyBGb3IgdGVzdGluZywgYW5kIEpTT04gU2NoZW1hIEZvcm0gQVBJIGNvbXBhdGliaWxpdHlcclxuXHJcbiAgLy8gQW5ndWxhciBTY2hlbWEgRm9ybSBBUEkgY29tcGF0aWJpbGl0eSBpbnB1dFxyXG4gIEBJbnB1dCgpIG1vZGVsOiBhbnk7IC8vIEFsdGVybmF0ZSBpbnB1dCBmb3IgZm9ybSBkYXRhXHJcblxyXG4gIC8vIFJlYWN0IEpTT04gU2NoZW1hIEZvcm0gQVBJIGNvbXBhdGliaWxpdHkgaW5wdXRzXHJcbiAgQElucHV0KCkgSlNPTlNjaGVtYTogYW55OyAvLyBBbHRlcm5hdGUgaW5wdXQgZm9yIEpTT04gU2NoZW1hXHJcbiAgQElucHV0KCkgVUlTY2hlbWE6IGFueTsgLy8gVUkgc2NoZW1hIC0gYWx0ZXJuYXRlIGZvcm0gbGF5b3V0IGZvcm1hdFxyXG4gIEBJbnB1dCgpIGZvcm1EYXRhOiBhbnk7IC8vIEFsdGVybmF0ZSBpbnB1dCBmb3IgZm9ybSBkYXRhXHJcblxyXG4gIEBJbnB1dCgpIG5nTW9kZWw6IGFueTsgLy8gQWx0ZXJuYXRlIGlucHV0IGZvciBBbmd1bGFyIGZvcm1zXHJcblxyXG4gIEBJbnB1dCgpIGxhbmd1YWdlOiBzdHJpbmc7IC8vIExhbmd1YWdlXHJcblxyXG4gIC8vIERldmVsb3BtZW50IGlucHV0cywgZm9yIHRlc3RpbmcgYW5kIGRlYnVnZ2luZ1xyXG4gIEBJbnB1dCgpIGxvYWRFeHRlcm5hbEFzc2V0czogYm9vbGVhbjsgLy8gTG9hZCBleHRlcm5hbCBmcmFtZXdvcmsgYXNzZXRzP1xyXG4gIEBJbnB1dCgpIGRlYnVnOiBib29sZWFuOyAvLyBTaG93IGRlYnVnIGluZm9ybWF0aW9uP1xyXG5cclxuICBASW5wdXQoKVxyXG4gIGdldCB2YWx1ZSgpOiBhbnkge1xyXG4gICAgcmV0dXJuIHRoaXMub2JqZWN0V3JhcCA/IHRoaXMuanNmLmRhdGFbJzEnXSA6IHRoaXMuanNmLmRhdGE7XHJcbiAgfVxyXG4gIHNldCB2YWx1ZSh2YWx1ZTogYW55KSB7XHJcbiAgICB0aGlzLnNldEZvcm1WYWx1ZXModmFsdWUsIGZhbHNlKTtcclxuICB9XHJcblxyXG4gIC8vIE91dHB1dHNcclxuICBAT3V0cHV0KCkgb25DaGFuZ2VzID0gbmV3IEV2ZW50RW1pdHRlcjxhbnk+KCk7IC8vIExpdmUgdW52YWxpZGF0ZWQgaW50ZXJuYWwgZm9ybSBkYXRhXHJcbiAgQE91dHB1dCgpIG9uU3VibWl0ID0gbmV3IEV2ZW50RW1pdHRlcjxhbnk+KCk7IC8vIENvbXBsZXRlIHZhbGlkYXRlZCBmb3JtIGRhdGFcclxuICBAT3V0cHV0KCkgaXNWYWxpZCA9IG5ldyBFdmVudEVtaXR0ZXI8Ym9vbGVhbj4oKTsgLy8gSXMgY3VycmVudCBkYXRhIHZhbGlkP1xyXG4gIEBPdXRwdXQoKSB2YWxpZGF0aW9uRXJyb3JzID0gbmV3IEV2ZW50RW1pdHRlcjxhbnk+KCk7IC8vIFZhbGlkYXRpb24gZXJyb3JzIChpZiBhbnkpXHJcbiAgQE91dHB1dCgpIGZvcm1TY2hlbWEgPSBuZXcgRXZlbnRFbWl0dGVyPGFueT4oKTsgLy8gRmluYWwgc2NoZW1hIHVzZWQgdG8gY3JlYXRlIGZvcm1cclxuICBAT3V0cHV0KCkgZm9ybUxheW91dCA9IG5ldyBFdmVudEVtaXR0ZXI8YW55PigpOyAvLyBGaW5hbCBsYXlvdXQgdXNlZCB0byBjcmVhdGUgZm9ybVxyXG5cclxuICAvLyBPdXRwdXRzIGZvciBwb3NzaWJsZSAyLXdheSBkYXRhIGJpbmRpbmdcclxuICAvLyBPbmx5IHRoZSBvbmUgaW5wdXQgcHJvdmlkaW5nIHRoZSBpbml0aWFsIGZvcm0gZGF0YSB3aWxsIGJlIGJvdW5kLlxyXG4gIC8vIElmIHRoZXJlIGlzIG5vIGluaXRhbCBkYXRhLCBpbnB1dCAne30nIHRvIGFjdGl2YXRlIDItd2F5IGRhdGEgYmluZGluZy5cclxuICAvLyBUaGVyZSBpcyBubyAyLXdheSBiaW5kaW5nIGlmIGluaXRhbCBkYXRhIGlzIGNvbWJpbmVkIGluc2lkZSB0aGUgJ2Zvcm0nIGlucHV0LlxyXG4gIEBPdXRwdXQoKSBkYXRhQ2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxhbnk+KCk7XHJcbiAgQE91dHB1dCgpIG1vZGVsQ2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxhbnk+KCk7XHJcbiAgQE91dHB1dCgpIGZvcm1EYXRhQ2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxhbnk+KCk7XHJcbiAgQE91dHB1dCgpIG5nTW9kZWxDaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPGFueT4oKTtcclxuXHJcbiAgb25DaGFuZ2U6IEZ1bmN0aW9uO1xyXG4gIG9uVG91Y2hlZDogRnVuY3Rpb247XHJcblxyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgcHJpdmF0ZSBjaGFuZ2VEZXRlY3RvcjogQ2hhbmdlRGV0ZWN0b3JSZWYsXHJcbiAgICBwcml2YXRlIGZyYW1ld29ya0xpYnJhcnk6IEZyYW1ld29ya0xpYnJhcnlTZXJ2aWNlLFxyXG4gICAgcHJpdmF0ZSB3aWRnZXRMaWJyYXJ5OiBXaWRnZXRMaWJyYXJ5U2VydmljZSxcclxuICAgIHB1YmxpYyBqc2Y6IEpzb25TY2hlbWFGb3JtU2VydmljZSxcclxuICApIHsgfVxyXG5cclxuICBwcml2YXRlIHJlc2V0U2NyaXB0c0FuZFN0eWxlU2hlZXRzKCkge1xyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmFqc2YnKS5mb3JFYWNoKGVsZW1lbnQgPT4gZWxlbWVudC5yZW1vdmUoKSk7XHJcbiAgfVxyXG4gIHByaXZhdGUgbG9hZFNjcmlwdHMoKSB7XHJcbiAgICBjb25zdCBzY3JpcHRzID0gdGhpcy5mcmFtZXdvcmtMaWJyYXJ5LmdldEZyYW1ld29ya1NjcmlwdHMoKTtcclxuICAgIHNjcmlwdHMubWFwKHNjcmlwdCA9PiB7XHJcbiAgICAgIGNvbnN0IHNjcmlwdFRhZzogSFRNTFNjcmlwdEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcclxuICAgICAgc2NyaXB0VGFnLnNyYyA9IHNjcmlwdDtcclxuICAgICAgc2NyaXB0VGFnLnR5cGUgPSAndGV4dC9qYXZhc2NyaXB0JztcclxuICAgICAgc2NyaXB0VGFnLmFzeW5jID0gdHJ1ZTtcclxuICAgICAgc2NyaXB0VGFnLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnYWpzZicpO1xyXG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLmFwcGVuZENoaWxkKHNjcmlwdFRhZyk7XHJcbiAgICB9KTtcclxuICB9XHJcbiAgcHJpdmF0ZSBsb2FkU3R5bGVTaGVldHMoKSB7XHJcbiAgICBjb25zdCBzdHlsZXNoZWV0cyA9IHRoaXMuZnJhbWV3b3JrTGlicmFyeS5nZXRGcmFtZXdvcmtTdHlsZXNoZWV0cygpO1xyXG4gICAgc3R5bGVzaGVldHMubWFwKHN0eWxlc2hlZXQgPT4ge1xyXG4gICAgICBjb25zdCBsaW5rVGFnOiBIVE1MTGlua0VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaW5rJyk7XHJcbiAgICAgIGxpbmtUYWcucmVsID0gJ3N0eWxlc2hlZXQnO1xyXG4gICAgICBsaW5rVGFnLmhyZWYgPSBzdHlsZXNoZWV0O1xyXG4gICAgICBsaW5rVGFnLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnYWpzZicpO1xyXG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLmFwcGVuZENoaWxkKGxpbmtUYWcpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHByaXZhdGUgbG9hZEFzc2V0cygpIHtcclxuICAgIHRoaXMucmVzZXRTY3JpcHRzQW5kU3R5bGVTaGVldHMoKTtcclxuICAgIHRoaXMubG9hZFNjcmlwdHMoKTtcclxuICAgIHRoaXMubG9hZFN0eWxlU2hlZXRzKCk7XHJcbiAgfVxyXG4gIG5nT25Jbml0KCkge1xyXG4gICAgdGhpcy51cGRhdGVGb3JtKCk7XHJcbiAgICB0aGlzLmxvYWRBc3NldHMoKTtcclxuICB9XHJcblxyXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpIHtcclxuICAgIHRoaXMudXBkYXRlRm9ybSgpO1xyXG4gICAgLy8gQ2hlY2sgaWYgdGhlcmUncyBjaGFuZ2VzIGluIEZyYW1ld29yayB0aGVuIGxvYWQgYXNzZXRzIGlmIHRoYXQncyB0aGVcclxuICAgIGlmIChjaGFuZ2VzLmZyYW1ld29yaykge1xyXG4gICAgICBpZiAoIWNoYW5nZXMuZnJhbWV3b3JrLmlzRmlyc3RDaGFuZ2UoKSAmJlxyXG4gICAgICAgIChjaGFuZ2VzLmZyYW1ld29yay5wcmV2aW91c1ZhbHVlICE9PSBjaGFuZ2VzLmZyYW1ld29yay5jdXJyZW50VmFsdWUpKSB7XHJcbiAgICAgICAgdGhpcy5sb2FkQXNzZXRzKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHdyaXRlVmFsdWUodmFsdWU6IGFueSkge1xyXG4gICAgdGhpcy5zZXRGb3JtVmFsdWVzKHZhbHVlLCBmYWxzZSk7XHJcbiAgICBpZiAoIXRoaXMuZm9ybVZhbHVlc0lucHV0KSB7IHRoaXMuZm9ybVZhbHVlc0lucHV0ID0gJ25nTW9kZWwnOyB9XHJcbiAgfVxyXG5cclxuICByZWdpc3Rlck9uQ2hhbmdlKGZuOiBGdW5jdGlvbikge1xyXG4gICAgdGhpcy5vbkNoYW5nZSA9IGZuO1xyXG4gIH1cclxuXHJcbiAgcmVnaXN0ZXJPblRvdWNoZWQoZm46IEZ1bmN0aW9uKSB7XHJcbiAgICB0aGlzLm9uVG91Y2hlZCA9IGZuO1xyXG4gIH1cclxuXHJcbiAgc2V0RGlzYWJsZWRTdGF0ZShpc0Rpc2FibGVkOiBib29sZWFuKSB7XHJcbiAgICBpZiAodGhpcy5qc2YuZm9ybU9wdGlvbnMuZm9ybURpc2FibGVkICE9PSAhIWlzRGlzYWJsZWQpIHtcclxuICAgICAgdGhpcy5qc2YuZm9ybU9wdGlvbnMuZm9ybURpc2FibGVkID0gISFpc0Rpc2FibGVkO1xyXG4gICAgICB0aGlzLmluaXRpYWxpemVGb3JtKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB1cGRhdGVGb3JtKCkge1xyXG4gICAgaWYgKCF0aGlzLmZvcm1Jbml0aWFsaXplZCB8fCAhdGhpcy5mb3JtVmFsdWVzSW5wdXQgfHxcclxuICAgICAgKHRoaXMubGFuZ3VhZ2UgJiYgdGhpcy5sYW5ndWFnZSAhPT0gdGhpcy5qc2YubGFuZ3VhZ2UpXHJcbiAgICApIHtcclxuICAgICAgdGhpcy5pbml0aWFsaXplRm9ybSgpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKHRoaXMubGFuZ3VhZ2UgJiYgdGhpcy5sYW5ndWFnZSAhPT0gdGhpcy5qc2YubGFuZ3VhZ2UpIHtcclxuICAgICAgICB0aGlzLmpzZi5zZXRMYW5ndWFnZSh0aGlzLmxhbmd1YWdlKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gR2V0IG5hbWVzIG9mIGNoYW5nZWQgaW5wdXRzXHJcbiAgICAgIGxldCBjaGFuZ2VkSW5wdXQgPSBPYmplY3Qua2V5cyh0aGlzLnByZXZpb3VzSW5wdXRzKVxyXG4gICAgICAgIC5maWx0ZXIoaW5wdXQgPT4gdGhpcy5wcmV2aW91c0lucHV0c1tpbnB1dF0gIT09IHRoaXNbaW5wdXRdKTtcclxuICAgICAgbGV0IHJlc2V0Rmlyc3QgPSB0cnVlO1xyXG4gICAgICBpZiAoY2hhbmdlZElucHV0Lmxlbmd0aCA9PT0gMSAmJiBjaGFuZ2VkSW5wdXRbMF0gPT09ICdmb3JtJyAmJlxyXG4gICAgICAgIHRoaXMuZm9ybVZhbHVlc0lucHV0LnN0YXJ0c1dpdGgoJ2Zvcm0uJylcclxuICAgICAgKSB7XHJcbiAgICAgICAgLy8gSWYgb25seSAnZm9ybScgaW5wdXQgY2hhbmdlZCwgZ2V0IG5hbWVzIG9mIGNoYW5nZWQga2V5c1xyXG4gICAgICAgIGNoYW5nZWRJbnB1dCA9IE9iamVjdC5rZXlzKHRoaXMucHJldmlvdXNJbnB1dHMuZm9ybSB8fCB7fSlcclxuICAgICAgICAgIC5maWx0ZXIoa2V5ID0+ICFpc0VxdWFsKHRoaXMucHJldmlvdXNJbnB1dHMuZm9ybVtrZXldLCB0aGlzLmZvcm1ba2V5XSkpXHJcbiAgICAgICAgICAubWFwKGtleSA9PiBgZm9ybS4ke2tleX1gKTtcclxuICAgICAgICByZXNldEZpcnN0ID0gZmFsc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIElmIG9ubHkgaW5wdXQgdmFsdWVzIGhhdmUgY2hhbmdlZCwgdXBkYXRlIHRoZSBmb3JtIHZhbHVlc1xyXG4gICAgICBpZiAoY2hhbmdlZElucHV0Lmxlbmd0aCA9PT0gMSAmJiBjaGFuZ2VkSW5wdXRbMF0gPT09IHRoaXMuZm9ybVZhbHVlc0lucHV0KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuZm9ybVZhbHVlc0lucHV0LmluZGV4T2YoJy4nKSA9PT0gLTEpIHtcclxuICAgICAgICAgIHRoaXMuc2V0Rm9ybVZhbHVlcyh0aGlzW3RoaXMuZm9ybVZhbHVlc0lucHV0XSwgcmVzZXRGaXJzdCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGNvbnN0IFtpbnB1dCwga2V5XSA9IHRoaXMuZm9ybVZhbHVlc0lucHV0LnNwbGl0KCcuJyk7XHJcbiAgICAgICAgICB0aGlzLnNldEZvcm1WYWx1ZXModGhpc1tpbnB1dF1ba2V5XSwgcmVzZXRGaXJzdCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJZiBhbnl0aGluZyBlbHNlIGhhcyBjaGFuZ2VkLCByZS1yZW5kZXIgdGhlIGVudGlyZSBmb3JtXHJcbiAgICAgIH0gZWxzZSBpZiAoY2hhbmdlZElucHV0Lmxlbmd0aCkge1xyXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZUZvcm0oKTtcclxuICAgICAgICBpZiAodGhpcy5vbkNoYW5nZSkgeyB0aGlzLm9uQ2hhbmdlKHRoaXMuanNmLmZvcm1WYWx1ZXMpOyB9XHJcbiAgICAgICAgaWYgKHRoaXMub25Ub3VjaGVkKSB7IHRoaXMub25Ub3VjaGVkKHRoaXMuanNmLmZvcm1WYWx1ZXMpOyB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFVwZGF0ZSBwcmV2aW91cyBpbnB1dHNcclxuICAgICAgT2JqZWN0LmtleXModGhpcy5wcmV2aW91c0lucHV0cylcclxuICAgICAgICAuZmlsdGVyKGlucHV0ID0+IHRoaXMucHJldmlvdXNJbnB1dHNbaW5wdXRdICE9PSB0aGlzW2lucHV0XSlcclxuICAgICAgICAuZm9yRWFjaChpbnB1dCA9PiB0aGlzLnByZXZpb3VzSW5wdXRzW2lucHV0XSA9IHRoaXNbaW5wdXRdKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHNldEZvcm1WYWx1ZXMoZm9ybVZhbHVlczogYW55LCByZXNldEZpcnN0ID0gdHJ1ZSkge1xyXG4gICAgaWYgKGZvcm1WYWx1ZXMpIHtcclxuICAgICAgY29uc3QgbmV3Rm9ybVZhbHVlcyA9IHRoaXMub2JqZWN0V3JhcCA/IGZvcm1WYWx1ZXNbJzEnXSA6IGZvcm1WYWx1ZXM7XHJcbiAgICAgIGlmICghdGhpcy5qc2YuZm9ybUdyb3VwKSB7XHJcbiAgICAgICAgdGhpcy5qc2YuZm9ybVZhbHVlcyA9IGZvcm1WYWx1ZXM7XHJcbiAgICAgICAgdGhpcy5hY3RpdmF0ZUZvcm0oKTtcclxuICAgICAgfSBlbHNlIGlmIChyZXNldEZpcnN0KSB7XHJcbiAgICAgICAgdGhpcy5qc2YuZm9ybUdyb3VwLnJlc2V0KCk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHRoaXMuanNmLmZvcm1Hcm91cCkge1xyXG4gICAgICAgIHRoaXMuanNmLmZvcm1Hcm91cC5wYXRjaFZhbHVlKG5ld0Zvcm1WYWx1ZXMpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICh0aGlzLm9uQ2hhbmdlKSB7IHRoaXMub25DaGFuZ2UobmV3Rm9ybVZhbHVlcyk7IH1cclxuICAgICAgaWYgKHRoaXMub25Ub3VjaGVkKSB7IHRoaXMub25Ub3VjaGVkKG5ld0Zvcm1WYWx1ZXMpOyB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmpzZi5mb3JtR3JvdXAucmVzZXQoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHN1Ym1pdEZvcm0oKSB7XHJcbiAgICBjb25zdCB2YWxpZERhdGEgPSB0aGlzLmpzZi52YWxpZERhdGE7XHJcbiAgICB0aGlzLm9uU3VibWl0LmVtaXQodGhpcy5vYmplY3RXcmFwID8gdmFsaWREYXRhWycxJ10gOiB2YWxpZERhdGEpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogJ2luaXRpYWxpemVGb3JtJyBmdW5jdGlvblxyXG4gICAqXHJcbiAgICogLSBVcGRhdGUgJ3NjaGVtYScsICdsYXlvdXQnLCBhbmQgJ2Zvcm1WYWx1ZXMnLCBmcm9tIGlucHV0cy5cclxuICAgKlxyXG4gICAqIC0gQ3JlYXRlICdzY2hlbWFSZWZMaWJyYXJ5JyBhbmQgJ3NjaGVtYVJlY3Vyc2l2ZVJlZk1hcCdcclxuICAgKiAgIHRvIHJlc29sdmUgc2NoZW1hICRyZWYgbGlua3MsIGluY2x1ZGluZyByZWN1cnNpdmUgJHJlZiBsaW5rcy5cclxuICAgKlxyXG4gICAqIC0gQ3JlYXRlICdkYXRhUmVjdXJzaXZlUmVmTWFwJyB0byByZXNvbHZlIHJlY3Vyc2l2ZSBsaW5rcyBpbiBkYXRhXHJcbiAgICogICBhbmQgY29yZWN0bHkgc2V0IG91dHB1dCBmb3JtYXRzIGZvciByZWN1cnNpdmVseSBuZXN0ZWQgdmFsdWVzLlxyXG4gICAqXHJcbiAgICogLSBDcmVhdGUgJ2xheW91dFJlZkxpYnJhcnknIGFuZCAndGVtcGxhdGVSZWZMaWJyYXJ5JyB0byBzdG9yZVxyXG4gICAqICAgbmV3IGxheW91dCBub2RlcyBhbmQgZm9ybUdyb3VwIGVsZW1lbnRzIHRvIHVzZSB3aGVuIGR5bmFtaWNhbGx5XHJcbiAgICogICBhZGRpbmcgZm9ybSBjb21wb25lbnRzIHRvIGFycmF5cyBhbmQgcmVjdXJzaXZlICRyZWYgcG9pbnRzLlxyXG4gICAqXHJcbiAgICogLSBDcmVhdGUgJ2RhdGFNYXAnIHRvIG1hcCB0aGUgZGF0YSB0byB0aGUgc2NoZW1hIGFuZCB0ZW1wbGF0ZS5cclxuICAgKlxyXG4gICAqIC0gQ3JlYXRlIHRoZSBtYXN0ZXIgJ2Zvcm1Hcm91cFRlbXBsYXRlJyB0aGVuIGZyb20gaXQgJ2Zvcm1Hcm91cCdcclxuICAgKiAgIHRoZSBBbmd1bGFyIGZvcm1Hcm91cCB1c2VkIHRvIGNvbnRyb2wgdGhlIHJlYWN0aXZlIGZvcm0uXHJcbiAgICovXHJcbiAgaW5pdGlhbGl6ZUZvcm0oKSB7XHJcbiAgICBpZiAoXHJcbiAgICAgIHRoaXMuc2NoZW1hIHx8IHRoaXMubGF5b3V0IHx8IHRoaXMuZGF0YSB8fCB0aGlzLmZvcm0gfHwgdGhpcy5tb2RlbCB8fFxyXG4gICAgICB0aGlzLkpTT05TY2hlbWEgfHwgdGhpcy5VSVNjaGVtYSB8fCB0aGlzLmZvcm1EYXRhIHx8IHRoaXMubmdNb2RlbCB8fFxyXG4gICAgICB0aGlzLmpzZi5kYXRhXHJcbiAgICApIHtcclxuXHJcbiAgICAgIHRoaXMuanNmLnJlc2V0QWxsVmFsdWVzKCk7ICAvLyBSZXNldCBhbGwgZm9ybSB2YWx1ZXMgdG8gZGVmYXVsdHNcclxuICAgICAgdGhpcy5pbml0aWFsaXplT3B0aW9ucygpOyAgIC8vIFVwZGF0ZSBvcHRpb25zXHJcbiAgICAgIHRoaXMuaW5pdGlhbGl6ZVNjaGVtYSgpOyAgICAvLyBVcGRhdGUgc2NoZW1hLCBzY2hlbWFSZWZMaWJyYXJ5LFxyXG4gICAgICAvLyBzY2hlbWFSZWN1cnNpdmVSZWZNYXAsICYgZGF0YVJlY3Vyc2l2ZVJlZk1hcFxyXG4gICAgICB0aGlzLmluaXRpYWxpemVMYXlvdXQoKTsgICAgLy8gVXBkYXRlIGxheW91dCwgbGF5b3V0UmVmTGlicmFyeSxcclxuICAgICAgdGhpcy5pbml0aWFsaXplRGF0YSgpOyAgICAgIC8vIFVwZGF0ZSBmb3JtVmFsdWVzXHJcbiAgICAgIHRoaXMuYWN0aXZhdGVGb3JtKCk7ICAgICAgICAvLyBVcGRhdGUgZGF0YU1hcCwgdGVtcGxhdGVSZWZMaWJyYXJ5LFxyXG4gICAgICAvLyBmb3JtR3JvdXBUZW1wbGF0ZSwgZm9ybUdyb3VwXHJcblxyXG4gICAgICAvLyBVbmNvbW1lbnQgaW5kaXZpZHVhbCBsaW5lcyB0byBvdXRwdXQgZGVidWdnaW5nIGluZm9ybWF0aW9uIHRvIGNvbnNvbGU6XHJcbiAgICAgIC8vIChUaGVzZSBhbHdheXMgd29yay4pXHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdsb2FkaW5nIGZvcm0uLi4nKTtcclxuICAgICAgLy8gY29uc29sZS5sb2coJ3NjaGVtYScsIHRoaXMuanNmLnNjaGVtYSk7XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdsYXlvdXQnLCB0aGlzLmpzZi5sYXlvdXQpO1xyXG4gICAgICAvLyBjb25zb2xlLmxvZygnb3B0aW9ucycsIHRoaXMub3B0aW9ucyk7XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdmb3JtVmFsdWVzJywgdGhpcy5qc2YuZm9ybVZhbHVlcyk7XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdmb3JtR3JvdXBUZW1wbGF0ZScsIHRoaXMuanNmLmZvcm1Hcm91cFRlbXBsYXRlKTtcclxuICAgICAgLy8gY29uc29sZS5sb2coJ2Zvcm1Hcm91cCcsIHRoaXMuanNmLmZvcm1Hcm91cCk7XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdmb3JtR3JvdXAudmFsdWUnLCB0aGlzLmpzZi5mb3JtR3JvdXAudmFsdWUpO1xyXG4gICAgICAvLyBjb25zb2xlLmxvZygnc2NoZW1hUmVmTGlicmFyeScsIHRoaXMuanNmLnNjaGVtYVJlZkxpYnJhcnkpO1xyXG4gICAgICAvLyBjb25zb2xlLmxvZygnbGF5b3V0UmVmTGlicmFyeScsIHRoaXMuanNmLmxheW91dFJlZkxpYnJhcnkpO1xyXG4gICAgICAvLyBjb25zb2xlLmxvZygndGVtcGxhdGVSZWZMaWJyYXJ5JywgdGhpcy5qc2YudGVtcGxhdGVSZWZMaWJyYXJ5KTtcclxuICAgICAgLy8gY29uc29sZS5sb2coJ2RhdGFNYXAnLCB0aGlzLmpzZi5kYXRhTWFwKTtcclxuICAgICAgLy8gY29uc29sZS5sb2coJ2FycmF5TWFwJywgdGhpcy5qc2YuYXJyYXlNYXApO1xyXG4gICAgICAvLyBjb25zb2xlLmxvZygnc2NoZW1hUmVjdXJzaXZlUmVmTWFwJywgdGhpcy5qc2Yuc2NoZW1hUmVjdXJzaXZlUmVmTWFwKTtcclxuICAgICAgLy8gY29uc29sZS5sb2coJ2RhdGFSZWN1cnNpdmVSZWZNYXAnLCB0aGlzLmpzZi5kYXRhUmVjdXJzaXZlUmVmTWFwKTtcclxuXHJcbiAgICAgIC8vIFVuY29tbWVudCBpbmRpdmlkdWFsIGxpbmVzIHRvIG91dHB1dCBkZWJ1Z2dpbmcgaW5mb3JtYXRpb24gdG8gYnJvd3NlcjpcclxuICAgICAgLy8gKFRoZXNlIG9ubHkgd29yayBpZiB0aGUgJ2RlYnVnJyBvcHRpb24gaGFzIGFsc28gYmVlbiBzZXQgdG8gJ3RydWUnLilcclxuICAgICAgaWYgKHRoaXMuZGVidWcgfHwgdGhpcy5qc2YuZm9ybU9wdGlvbnMuZGVidWcpIHtcclxuICAgICAgICBjb25zdCB2YXJzOiBhbnlbXSA9IFtdO1xyXG4gICAgICAgIC8vIHZhcnMucHVzaCh0aGlzLmpzZi5zY2hlbWEpO1xyXG4gICAgICAgIC8vIHZhcnMucHVzaCh0aGlzLmpzZi5sYXlvdXQpO1xyXG4gICAgICAgIC8vIHZhcnMucHVzaCh0aGlzLm9wdGlvbnMpO1xyXG4gICAgICAgIC8vIHZhcnMucHVzaCh0aGlzLmpzZi5mb3JtVmFsdWVzKTtcclxuICAgICAgICAvLyB2YXJzLnB1c2godGhpcy5qc2YuZm9ybUdyb3VwLnZhbHVlKTtcclxuICAgICAgICAvLyB2YXJzLnB1c2godGhpcy5qc2YuZm9ybUdyb3VwVGVtcGxhdGUpO1xyXG4gICAgICAgIC8vIHZhcnMucHVzaCh0aGlzLmpzZi5mb3JtR3JvdXApO1xyXG4gICAgICAgIC8vIHZhcnMucHVzaCh0aGlzLmpzZi5zY2hlbWFSZWZMaWJyYXJ5KTtcclxuICAgICAgICAvLyB2YXJzLnB1c2godGhpcy5qc2YubGF5b3V0UmVmTGlicmFyeSk7XHJcbiAgICAgICAgLy8gdmFycy5wdXNoKHRoaXMuanNmLnRlbXBsYXRlUmVmTGlicmFyeSk7XHJcbiAgICAgICAgLy8gdmFycy5wdXNoKHRoaXMuanNmLmRhdGFNYXApO1xyXG4gICAgICAgIC8vIHZhcnMucHVzaCh0aGlzLmpzZi5hcnJheU1hcCk7XHJcbiAgICAgICAgLy8gdmFycy5wdXNoKHRoaXMuanNmLnNjaGVtYVJlY3Vyc2l2ZVJlZk1hcCk7XHJcbiAgICAgICAgLy8gdmFycy5wdXNoKHRoaXMuanNmLmRhdGFSZWN1cnNpdmVSZWZNYXApO1xyXG4gICAgICAgIHRoaXMuZGVidWdPdXRwdXQgPSB2YXJzLm1hcCh2ID0+IEpTT04uc3RyaW5naWZ5KHYsIG51bGwsIDIpKS5qb2luKCdcXG4nKTtcclxuICAgICAgfVxyXG4gICAgICB0aGlzLmZvcm1Jbml0aWFsaXplZCA9IHRydWU7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiAnaW5pdGlhbGl6ZU9wdGlvbnMnIGZ1bmN0aW9uXHJcbiAgICpcclxuICAgKiBJbml0aWFsaXplICdvcHRpb25zJyAoZ2xvYmFsIGZvcm0gb3B0aW9ucykgYW5kIHNldCBmcmFtZXdvcmtcclxuICAgKiBDb21iaW5lIGF2YWlsYWJsZSBpbnB1dHM6XHJcbiAgICogMS4gb3B0aW9ucyAtIHJlY29tbWVuZGVkXHJcbiAgICogMi4gZm9ybS5vcHRpb25zIC0gU2luZ2xlIGlucHV0IHN0eWxlXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBpbml0aWFsaXplT3B0aW9ucygpIHtcclxuICAgIGlmICh0aGlzLmxhbmd1YWdlICYmIHRoaXMubGFuZ3VhZ2UgIT09IHRoaXMuanNmLmxhbmd1YWdlKSB7XHJcbiAgICAgIHRoaXMuanNmLnNldExhbmd1YWdlKHRoaXMubGFuZ3VhZ2UpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5qc2Yuc2V0T3B0aW9ucyh7IGRlYnVnOiAhIXRoaXMuZGVidWcgfSk7XHJcbiAgICBsZXQgbG9hZEV4dGVybmFsQXNzZXRzOiBib29sZWFuID0gdGhpcy5sb2FkRXh0ZXJuYWxBc3NldHMgfHwgZmFsc2U7XHJcbiAgICBsZXQgZnJhbWV3b3JrOiBhbnkgPSB0aGlzLmZyYW1ld29yayB8fCAnZGVmYXVsdCc7XHJcbiAgICBpZiAoaXNPYmplY3QodGhpcy5vcHRpb25zKSkge1xyXG4gICAgICB0aGlzLmpzZi5zZXRPcHRpb25zKHRoaXMub3B0aW9ucyk7XHJcbiAgICAgIGxvYWRFeHRlcm5hbEFzc2V0cyA9IHRoaXMub3B0aW9ucy5sb2FkRXh0ZXJuYWxBc3NldHMgfHwgbG9hZEV4dGVybmFsQXNzZXRzO1xyXG4gICAgICBmcmFtZXdvcmsgPSB0aGlzLm9wdGlvbnMuZnJhbWV3b3JrIHx8IGZyYW1ld29yaztcclxuICAgIH1cclxuICAgIGlmIChpc09iamVjdCh0aGlzLmZvcm0pICYmIGlzT2JqZWN0KHRoaXMuZm9ybS5vcHRpb25zKSkge1xyXG4gICAgICB0aGlzLmpzZi5zZXRPcHRpb25zKHRoaXMuZm9ybS5vcHRpb25zKTtcclxuICAgICAgbG9hZEV4dGVybmFsQXNzZXRzID0gdGhpcy5mb3JtLm9wdGlvbnMubG9hZEV4dGVybmFsQXNzZXRzIHx8IGxvYWRFeHRlcm5hbEFzc2V0cztcclxuICAgICAgZnJhbWV3b3JrID0gdGhpcy5mb3JtLm9wdGlvbnMuZnJhbWV3b3JrIHx8IGZyYW1ld29yaztcclxuICAgIH1cclxuICAgIGlmIChpc09iamVjdCh0aGlzLndpZGdldHMpKSB7XHJcbiAgICAgIHRoaXMuanNmLnNldE9wdGlvbnMoeyB3aWRnZXRzOiB0aGlzLndpZGdldHMgfSk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmZyYW1ld29ya0xpYnJhcnkuc2V0TG9hZEV4dGVybmFsQXNzZXRzKGxvYWRFeHRlcm5hbEFzc2V0cyk7XHJcbiAgICB0aGlzLmZyYW1ld29ya0xpYnJhcnkuc2V0RnJhbWV3b3JrKGZyYW1ld29yayk7XHJcbiAgICB0aGlzLmpzZi5mcmFtZXdvcmsgPSB0aGlzLmZyYW1ld29ya0xpYnJhcnkuZ2V0RnJhbWV3b3JrKCk7XHJcbiAgICBpZiAoaXNPYmplY3QodGhpcy5qc2YuZm9ybU9wdGlvbnMud2lkZ2V0cykpIHtcclxuICAgICAgZm9yIChjb25zdCB3aWRnZXQgb2YgT2JqZWN0LmtleXModGhpcy5qc2YuZm9ybU9wdGlvbnMud2lkZ2V0cykpIHtcclxuICAgICAgICB0aGlzLndpZGdldExpYnJhcnkucmVnaXN0ZXJXaWRnZXQod2lkZ2V0LCB0aGlzLmpzZi5mb3JtT3B0aW9ucy53aWRnZXRzW3dpZGdldF0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAoaXNPYmplY3QodGhpcy5mb3JtKSAmJiBpc09iamVjdCh0aGlzLmZvcm0udHBsZGF0YSkpIHtcclxuICAgICAgdGhpcy5qc2Yuc2V0VHBsZGF0YSh0aGlzLmZvcm0udHBsZGF0YSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiAnaW5pdGlhbGl6ZVNjaGVtYScgZnVuY3Rpb25cclxuICAgKlxyXG4gICAqIEluaXRpYWxpemUgJ3NjaGVtYSdcclxuICAgKiBVc2UgZmlyc3QgYXZhaWxhYmxlIGlucHV0OlxyXG4gICAqIDEuIHNjaGVtYSAtIHJlY29tbWVuZGVkIC8gQW5ndWxhciBTY2hlbWEgRm9ybSBzdHlsZVxyXG4gICAqIDIuIGZvcm0uc2NoZW1hIC0gU2luZ2xlIGlucHV0IC8gSlNPTiBGb3JtIHN0eWxlXHJcbiAgICogMy4gSlNPTlNjaGVtYSAtIFJlYWN0IEpTT04gU2NoZW1hIEZvcm0gc3R5bGVcclxuICAgKiA0LiBmb3JtLkpTT05TY2hlbWEgLSBGb3IgdGVzdGluZyBzaW5nbGUgaW5wdXQgUmVhY3QgSlNPTiBTY2hlbWEgRm9ybXNcclxuICAgKiA1LiBmb3JtIC0gRm9yIHRlc3Rpbmcgc2luZ2xlIHNjaGVtYS1vbmx5IGlucHV0c1xyXG4gICAqXHJcbiAgICogLi4uIGlmIG5vIHNjaGVtYSBpbnB1dCBmb3VuZCwgdGhlICdhY3RpdmF0ZUZvcm0nIGZ1bmN0aW9uLCBiZWxvdyxcclxuICAgKiAgICAgd2lsbCBtYWtlIHR3byBhZGRpdGlvbmFsIGF0dGVtcHRzIHRvIGJ1aWxkIGEgc2NoZW1hXHJcbiAgICogNi4gSWYgbGF5b3V0IGlucHV0IC0gYnVpbGQgc2NoZW1hIGZyb20gbGF5b3V0XHJcbiAgICogNy4gSWYgZGF0YSBpbnB1dCAtIGJ1aWxkIHNjaGVtYSBmcm9tIGRhdGFcclxuICAgKi9cclxuICBwcml2YXRlIGluaXRpYWxpemVTY2hlbWEoKSB7XHJcblxyXG4gICAgLy8gVE9ETzogdXBkYXRlIHRvIGFsbG93IG5vbi1vYmplY3Qgc2NoZW1hc1xyXG5cclxuICAgIGlmIChpc09iamVjdCh0aGlzLnNjaGVtYSkpIHtcclxuICAgICAgdGhpcy5qc2YuQW5ndWxhclNjaGVtYUZvcm1Db21wYXRpYmlsaXR5ID0gdHJ1ZTtcclxuICAgICAgdGhpcy5qc2Yuc2NoZW1hID0gY2xvbmVEZWVwKHRoaXMuc2NoZW1hKTtcclxuICAgIH0gZWxzZSBpZiAoaGFzT3duKHRoaXMuZm9ybSwgJ3NjaGVtYScpICYmIGlzT2JqZWN0KHRoaXMuZm9ybS5zY2hlbWEpKSB7XHJcbiAgICAgIHRoaXMuanNmLnNjaGVtYSA9IGNsb25lRGVlcCh0aGlzLmZvcm0uc2NoZW1hKTtcclxuICAgIH0gZWxzZSBpZiAoaXNPYmplY3QodGhpcy5KU09OU2NoZW1hKSkge1xyXG4gICAgICB0aGlzLmpzZi5SZWFjdEpzb25TY2hlbWFGb3JtQ29tcGF0aWJpbGl0eSA9IHRydWU7XHJcbiAgICAgIHRoaXMuanNmLnNjaGVtYSA9IGNsb25lRGVlcCh0aGlzLkpTT05TY2hlbWEpO1xyXG4gICAgfSBlbHNlIGlmIChoYXNPd24odGhpcy5mb3JtLCAnSlNPTlNjaGVtYScpICYmIGlzT2JqZWN0KHRoaXMuZm9ybS5KU09OU2NoZW1hKSkge1xyXG4gICAgICB0aGlzLmpzZi5SZWFjdEpzb25TY2hlbWFGb3JtQ29tcGF0aWJpbGl0eSA9IHRydWU7XHJcbiAgICAgIHRoaXMuanNmLnNjaGVtYSA9IGNsb25lRGVlcCh0aGlzLmZvcm0uSlNPTlNjaGVtYSk7XHJcbiAgICB9IGVsc2UgaWYgKGhhc093bih0aGlzLmZvcm0sICdwcm9wZXJ0aWVzJykgJiYgaXNPYmplY3QodGhpcy5mb3JtLnByb3BlcnRpZXMpKSB7XHJcbiAgICAgIHRoaXMuanNmLnNjaGVtYSA9IGNsb25lRGVlcCh0aGlzLmZvcm0pO1xyXG4gICAgfSBlbHNlIGlmIChpc09iamVjdCh0aGlzLmZvcm0pKSB7XHJcbiAgICAgIC8vIFRPRE86IEhhbmRsZSBvdGhlciB0eXBlcyBvZiBmb3JtIGlucHV0XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFpc0VtcHR5KHRoaXMuanNmLnNjaGVtYSkpIHtcclxuXHJcbiAgICAgIC8vIElmIG90aGVyIHR5cGVzIGFsc28gYWxsb3dlZCwgcmVuZGVyIHNjaGVtYSBhcyBhbiBvYmplY3RcclxuICAgICAgaWYgKGluQXJyYXkoJ29iamVjdCcsIHRoaXMuanNmLnNjaGVtYS50eXBlKSkge1xyXG4gICAgICAgIHRoaXMuanNmLnNjaGVtYS50eXBlID0gJ29iamVjdCc7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFdyYXAgbm9uLW9iamVjdCBzY2hlbWFzIGluIG9iamVjdC5cclxuICAgICAgaWYgKGhhc093bih0aGlzLmpzZi5zY2hlbWEsICd0eXBlJykgJiYgdGhpcy5qc2Yuc2NoZW1hLnR5cGUgIT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgdGhpcy5qc2Yuc2NoZW1hID0ge1xyXG4gICAgICAgICAgJ3R5cGUnOiAnb2JqZWN0JyxcclxuICAgICAgICAgICdwcm9wZXJ0aWVzJzogeyAxOiB0aGlzLmpzZi5zY2hlbWEgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5vYmplY3RXcmFwID0gdHJ1ZTtcclxuICAgICAgfSBlbHNlIGlmICghaGFzT3duKHRoaXMuanNmLnNjaGVtYSwgJ3R5cGUnKSkge1xyXG5cclxuICAgICAgICAvLyBBZGQgdHlwZSA9ICdvYmplY3QnIGlmIG1pc3NpbmdcclxuICAgICAgICBpZiAoaXNPYmplY3QodGhpcy5qc2Yuc2NoZW1hLnByb3BlcnRpZXMpIHx8XHJcbiAgICAgICAgICBpc09iamVjdCh0aGlzLmpzZi5zY2hlbWEucGF0dGVyblByb3BlcnRpZXMpIHx8XHJcbiAgICAgICAgICBpc09iamVjdCh0aGlzLmpzZi5zY2hlbWEuYWRkaXRpb25hbFByb3BlcnRpZXMpXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICB0aGlzLmpzZi5zY2hlbWEudHlwZSA9ICdvYmplY3QnO1xyXG5cclxuICAgICAgICAgIC8vIEZpeCBKU09OIHNjaGVtYSBzaG9ydGhhbmQgKEpTT04gRm9ybSBzdHlsZSlcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdGhpcy5qc2YuSnNvbkZvcm1Db21wYXRpYmlsaXR5ID0gdHJ1ZTtcclxuICAgICAgICAgIHRoaXMuanNmLnNjaGVtYSA9IHtcclxuICAgICAgICAgICAgJ3R5cGUnOiAnb2JqZWN0JyxcclxuICAgICAgICAgICAgJ3Byb3BlcnRpZXMnOiB0aGlzLmpzZi5zY2hlbWFcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBJZiBuZWVkZWQsIHVwZGF0ZSBKU09OIFNjaGVtYSB0byBkcmFmdCA2IGZvcm1hdCwgaW5jbHVkaW5nXHJcbiAgICAgIC8vIGRyYWZ0IDMgKEpTT04gRm9ybSBzdHlsZSkgYW5kIGRyYWZ0IDQgKEFuZ3VsYXIgU2NoZW1hIEZvcm0gc3R5bGUpXHJcbiAgICAgIHRoaXMuanNmLnNjaGVtYSA9IGNvbnZlcnRTY2hlbWFUb0RyYWZ0Nih0aGlzLmpzZi5zY2hlbWEpO1xyXG5cclxuICAgICAgLy8gSW5pdGlhbGl6ZSBhanYgYW5kIGNvbXBpbGUgc2NoZW1hXHJcbiAgICAgIHRoaXMuanNmLmNvbXBpbGVBanZTY2hlbWEoKTtcclxuXHJcbiAgICAgIC8vIENyZWF0ZSBzY2hlbWFSZWZMaWJyYXJ5LCBzY2hlbWFSZWN1cnNpdmVSZWZNYXAsIGRhdGFSZWN1cnNpdmVSZWZNYXAsICYgYXJyYXlNYXBcclxuICAgICAgdGhpcy5qc2Yuc2NoZW1hID0gcmVzb2x2ZVNjaGVtYVJlZmVyZW5jZXMoXHJcbiAgICAgICAgdGhpcy5qc2Yuc2NoZW1hLCB0aGlzLmpzZi5zY2hlbWFSZWZMaWJyYXJ5LCB0aGlzLmpzZi5zY2hlbWFSZWN1cnNpdmVSZWZNYXAsXHJcbiAgICAgICAgdGhpcy5qc2YuZGF0YVJlY3Vyc2l2ZVJlZk1hcCwgdGhpcy5qc2YuYXJyYXlNYXBcclxuICAgICAgKTtcclxuICAgICAgaWYgKGhhc093bih0aGlzLmpzZi5zY2hlbWFSZWZMaWJyYXJ5LCAnJykpIHtcclxuICAgICAgICB0aGlzLmpzZi5oYXNSb290UmVmZXJlbmNlID0gdHJ1ZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gVE9ETzogKD8pIFJlc29sdmUgZXh0ZXJuYWwgJHJlZiBsaW5rc1xyXG4gICAgICAvLyAvLyBDcmVhdGUgc2NoZW1hUmVmTGlicmFyeSAmIHNjaGVtYVJlY3Vyc2l2ZVJlZk1hcFxyXG4gICAgICAvLyB0aGlzLnBhcnNlci5idW5kbGUodGhpcy5zY2hlbWEpXHJcbiAgICAgIC8vICAgLnRoZW4oc2NoZW1hID0+IHRoaXMuc2NoZW1hID0gcmVzb2x2ZVNjaGVtYVJlZmVyZW5jZXMoXHJcbiAgICAgIC8vICAgICBzY2hlbWEsIHRoaXMuanNmLnNjaGVtYVJlZkxpYnJhcnksXHJcbiAgICAgIC8vICAgICB0aGlzLmpzZi5zY2hlbWFSZWN1cnNpdmVSZWZNYXAsIHRoaXMuanNmLmRhdGFSZWN1cnNpdmVSZWZNYXBcclxuICAgICAgLy8gICApKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqICdpbml0aWFsaXplRGF0YScgZnVuY3Rpb25cclxuICAgKlxyXG4gICAqIEluaXRpYWxpemUgJ2Zvcm1WYWx1ZXMnXHJcbiAgICogZGVmdWxhdCBvciBwcmV2aW91c2x5IHN1Ym1pdHRlZCB2YWx1ZXMgdXNlZCB0byBwb3B1bGF0ZSBmb3JtXHJcbiAgICogVXNlIGZpcnN0IGF2YWlsYWJsZSBpbnB1dDpcclxuICAgKiAxLiBkYXRhIC0gcmVjb21tZW5kZWRcclxuICAgKiAyLiBtb2RlbCAtIEFuZ3VsYXIgU2NoZW1hIEZvcm0gc3R5bGVcclxuICAgKiAzLiBmb3JtLnZhbHVlIC0gSlNPTiBGb3JtIHN0eWxlXHJcbiAgICogNC4gZm9ybS5kYXRhIC0gU2luZ2xlIGlucHV0IHN0eWxlXHJcbiAgICogNS4gZm9ybURhdGEgLSBSZWFjdCBKU09OIFNjaGVtYSBGb3JtIHN0eWxlXHJcbiAgICogNi4gZm9ybS5mb3JtRGF0YSAtIEZvciBlYXNpZXIgdGVzdGluZyBvZiBSZWFjdCBKU09OIFNjaGVtYSBGb3Jtc1xyXG4gICAqIDcuIChub25lKSBubyBkYXRhIC0gaW5pdGlhbGl6ZSBkYXRhIGZyb20gc2NoZW1hIGFuZCBsYXlvdXQgZGVmYXVsdHMgb25seVxyXG4gICAqL1xyXG4gIHByaXZhdGUgaW5pdGlhbGl6ZURhdGEoKSB7XHJcbiAgICBpZiAoaGFzVmFsdWUodGhpcy5kYXRhKSkge1xyXG4gICAgICB0aGlzLmpzZi5mb3JtVmFsdWVzID0gY2xvbmVEZWVwKHRoaXMuZGF0YSk7XHJcbiAgICAgIHRoaXMuZm9ybVZhbHVlc0lucHV0ID0gJ2RhdGEnO1xyXG4gICAgfSBlbHNlIGlmIChoYXNWYWx1ZSh0aGlzLm1vZGVsKSkge1xyXG4gICAgICB0aGlzLmpzZi5Bbmd1bGFyU2NoZW1hRm9ybUNvbXBhdGliaWxpdHkgPSB0cnVlO1xyXG4gICAgICB0aGlzLmpzZi5mb3JtVmFsdWVzID0gY2xvbmVEZWVwKHRoaXMubW9kZWwpO1xyXG4gICAgICB0aGlzLmZvcm1WYWx1ZXNJbnB1dCA9ICdtb2RlbCc7XHJcbiAgICB9IGVsc2UgaWYgKGhhc1ZhbHVlKHRoaXMubmdNb2RlbCkpIHtcclxuICAgICAgdGhpcy5qc2YuQW5ndWxhclNjaGVtYUZvcm1Db21wYXRpYmlsaXR5ID0gdHJ1ZTtcclxuICAgICAgdGhpcy5qc2YuZm9ybVZhbHVlcyA9IGNsb25lRGVlcCh0aGlzLm5nTW9kZWwpO1xyXG4gICAgICB0aGlzLmZvcm1WYWx1ZXNJbnB1dCA9ICduZ01vZGVsJztcclxuICAgIH0gZWxzZSBpZiAoaXNPYmplY3QodGhpcy5mb3JtKSAmJiBoYXNWYWx1ZSh0aGlzLmZvcm0udmFsdWUpKSB7XHJcbiAgICAgIHRoaXMuanNmLkpzb25Gb3JtQ29tcGF0aWJpbGl0eSA9IHRydWU7XHJcbiAgICAgIHRoaXMuanNmLmZvcm1WYWx1ZXMgPSBjbG9uZURlZXAodGhpcy5mb3JtLnZhbHVlKTtcclxuICAgICAgdGhpcy5mb3JtVmFsdWVzSW5wdXQgPSAnZm9ybS52YWx1ZSc7XHJcbiAgICB9IGVsc2UgaWYgKGlzT2JqZWN0KHRoaXMuZm9ybSkgJiYgaGFzVmFsdWUodGhpcy5mb3JtLmRhdGEpKSB7XHJcbiAgICAgIHRoaXMuanNmLmZvcm1WYWx1ZXMgPSBjbG9uZURlZXAodGhpcy5mb3JtLmRhdGEpO1xyXG4gICAgICB0aGlzLmZvcm1WYWx1ZXNJbnB1dCA9ICdmb3JtLmRhdGEnO1xyXG4gICAgfSBlbHNlIGlmIChoYXNWYWx1ZSh0aGlzLmZvcm1EYXRhKSkge1xyXG4gICAgICB0aGlzLmpzZi5SZWFjdEpzb25TY2hlbWFGb3JtQ29tcGF0aWJpbGl0eSA9IHRydWU7XHJcbiAgICAgIHRoaXMuZm9ybVZhbHVlc0lucHV0ID0gJ2Zvcm1EYXRhJztcclxuICAgIH0gZWxzZSBpZiAoaGFzT3duKHRoaXMuZm9ybSwgJ2Zvcm1EYXRhJykgJiYgaGFzVmFsdWUodGhpcy5mb3JtLmZvcm1EYXRhKSkge1xyXG4gICAgICB0aGlzLmpzZi5SZWFjdEpzb25TY2hlbWFGb3JtQ29tcGF0aWJpbGl0eSA9IHRydWU7XHJcbiAgICAgIHRoaXMuanNmLmZvcm1WYWx1ZXMgPSBjbG9uZURlZXAodGhpcy5mb3JtLmZvcm1EYXRhKTtcclxuICAgICAgdGhpcy5mb3JtVmFsdWVzSW5wdXQgPSAnZm9ybS5mb3JtRGF0YSc7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmZvcm1WYWx1ZXNJbnB1dCA9IG51bGw7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiAnaW5pdGlhbGl6ZUxheW91dCcgZnVuY3Rpb25cclxuICAgKlxyXG4gICAqIEluaXRpYWxpemUgJ2xheW91dCdcclxuICAgKiBVc2UgZmlyc3QgYXZhaWxhYmxlIGFycmF5IGlucHV0OlxyXG4gICAqIDEuIGxheW91dCAtIHJlY29tbWVuZGVkXHJcbiAgICogMi4gZm9ybSAtIEFuZ3VsYXIgU2NoZW1hIEZvcm0gc3R5bGVcclxuICAgKiAzLiBmb3JtLmZvcm0gLSBKU09OIEZvcm0gc3R5bGVcclxuICAgKiA0LiBmb3JtLmxheW91dCAtIFNpbmdsZSBpbnB1dCBzdHlsZVxyXG4gICAqIDUuIChub25lKSBubyBsYXlvdXQgLSBzZXQgZGVmYXVsdCBsYXlvdXQgaW5zdGVhZFxyXG4gICAqICAgIChmdWxsIGxheW91dCB3aWxsIGJlIGJ1aWx0IGxhdGVyIGZyb20gdGhlIHNjaGVtYSlcclxuICAgKlxyXG4gICAqIEFsc28sIGlmIGFsdGVybmF0ZSBsYXlvdXQgZm9ybWF0cyBhcmUgYXZhaWxhYmxlLFxyXG4gICAqIGltcG9ydCBmcm9tICdVSVNjaGVtYScgb3IgJ2N1c3RvbUZvcm1JdGVtcydcclxuICAgKiB1c2VkIGZvciBSZWFjdCBKU09OIFNjaGVtYSBGb3JtIGFuZCBKU09OIEZvcm0gQVBJIGNvbXBhdGliaWxpdHlcclxuICAgKiBVc2UgZmlyc3QgYXZhaWxhYmxlIGlucHV0OlxyXG4gICAqIDEuIFVJU2NoZW1hIC0gUmVhY3QgSlNPTiBTY2hlbWEgRm9ybSBzdHlsZVxyXG4gICAqIDIuIGZvcm0uVUlTY2hlbWEgLSBGb3IgdGVzdGluZyBzaW5nbGUgaW5wdXQgUmVhY3QgSlNPTiBTY2hlbWEgRm9ybXNcclxuICAgKiAyLiBmb3JtLmN1c3RvbUZvcm1JdGVtcyAtIEpTT04gRm9ybSBzdHlsZVxyXG4gICAqIDMuIChub25lKSBubyBpbnB1dCAtIGRvbid0IGltcG9ydFxyXG4gICAqL1xyXG4gIHByaXZhdGUgaW5pdGlhbGl6ZUxheW91dCgpIHtcclxuXHJcbiAgICAvLyBSZW5hbWUgSlNPTiBGb3JtLXN0eWxlICdvcHRpb25zJyBsaXN0cyB0b1xyXG4gICAgLy8gQW5ndWxhciBTY2hlbWEgRm9ybS1zdHlsZSAndGl0bGVNYXAnIGxpc3RzLlxyXG4gICAgY29uc3QgZml4SnNvbkZvcm1PcHRpb25zID0gKGxheW91dDogYW55KTogYW55ID0+IHtcclxuICAgICAgaWYgKGlzT2JqZWN0KGxheW91dCkgfHwgaXNBcnJheShsYXlvdXQpKSB7XHJcbiAgICAgICAgZm9yRWFjaChsYXlvdXQsICh2YWx1ZSwga2V5KSA9PiB7XHJcbiAgICAgICAgICBpZiAoaGFzT3duKHZhbHVlLCAnb3B0aW9ucycpICYmIGlzT2JqZWN0KHZhbHVlLm9wdGlvbnMpKSB7XHJcbiAgICAgICAgICAgIHZhbHVlLnRpdGxlTWFwID0gdmFsdWUub3B0aW9ucztcclxuICAgICAgICAgICAgZGVsZXRlIHZhbHVlLm9wdGlvbnM7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSwgJ3RvcC1kb3duJyk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGxheW91dDtcclxuICAgIH07XHJcblxyXG4gICAgLy8gQ2hlY2sgZm9yIGxheW91dCBpbnB1dHMgYW5kLCBpZiBmb3VuZCwgaW5pdGlhbGl6ZSBmb3JtIGxheW91dFxyXG4gICAgaWYgKGlzQXJyYXkodGhpcy5sYXlvdXQpKSB7XHJcbiAgICAgIHRoaXMuanNmLmxheW91dCA9IGNsb25lRGVlcCh0aGlzLmxheW91dCk7XHJcbiAgICB9IGVsc2UgaWYgKGlzQXJyYXkodGhpcy5mb3JtKSkge1xyXG4gICAgICB0aGlzLmpzZi5Bbmd1bGFyU2NoZW1hRm9ybUNvbXBhdGliaWxpdHkgPSB0cnVlO1xyXG4gICAgICB0aGlzLmpzZi5sYXlvdXQgPSBjbG9uZURlZXAodGhpcy5mb3JtKTtcclxuICAgIH0gZWxzZSBpZiAodGhpcy5mb3JtICYmIGlzQXJyYXkodGhpcy5mb3JtLmZvcm0pKSB7XHJcbiAgICAgIHRoaXMuanNmLkpzb25Gb3JtQ29tcGF0aWJpbGl0eSA9IHRydWU7XHJcbiAgICAgIHRoaXMuanNmLmxheW91dCA9IGZpeEpzb25Gb3JtT3B0aW9ucyhjbG9uZURlZXAodGhpcy5mb3JtLmZvcm0pKTtcclxuICAgIH0gZWxzZSBpZiAodGhpcy5mb3JtICYmIGlzQXJyYXkodGhpcy5mb3JtLmxheW91dCkpIHtcclxuICAgICAgdGhpcy5qc2YubGF5b3V0ID0gY2xvbmVEZWVwKHRoaXMuZm9ybS5sYXlvdXQpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5qc2YubGF5b3V0ID0gWycqJ107XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ2hlY2sgZm9yIGFsdGVybmF0ZSBsYXlvdXQgaW5wdXRzXHJcbiAgICBsZXQgYWx0ZXJuYXRlTGF5b3V0OiBhbnkgPSBudWxsO1xyXG4gICAgaWYgKGlzT2JqZWN0KHRoaXMuVUlTY2hlbWEpKSB7XHJcbiAgICAgIHRoaXMuanNmLlJlYWN0SnNvblNjaGVtYUZvcm1Db21wYXRpYmlsaXR5ID0gdHJ1ZTtcclxuICAgICAgYWx0ZXJuYXRlTGF5b3V0ID0gY2xvbmVEZWVwKHRoaXMuVUlTY2hlbWEpO1xyXG4gICAgfSBlbHNlIGlmIChoYXNPd24odGhpcy5mb3JtLCAnVUlTY2hlbWEnKSkge1xyXG4gICAgICB0aGlzLmpzZi5SZWFjdEpzb25TY2hlbWFGb3JtQ29tcGF0aWJpbGl0eSA9IHRydWU7XHJcbiAgICAgIGFsdGVybmF0ZUxheW91dCA9IGNsb25lRGVlcCh0aGlzLmZvcm0uVUlTY2hlbWEpO1xyXG4gICAgfSBlbHNlIGlmIChoYXNPd24odGhpcy5mb3JtLCAndWlTY2hlbWEnKSkge1xyXG4gICAgICB0aGlzLmpzZi5SZWFjdEpzb25TY2hlbWFGb3JtQ29tcGF0aWJpbGl0eSA9IHRydWU7XHJcbiAgICAgIGFsdGVybmF0ZUxheW91dCA9IGNsb25lRGVlcCh0aGlzLmZvcm0udWlTY2hlbWEpO1xyXG4gICAgfSBlbHNlIGlmIChoYXNPd24odGhpcy5mb3JtLCAnY3VzdG9tRm9ybUl0ZW1zJykpIHtcclxuICAgICAgdGhpcy5qc2YuSnNvbkZvcm1Db21wYXRpYmlsaXR5ID0gdHJ1ZTtcclxuICAgICAgYWx0ZXJuYXRlTGF5b3V0ID0gZml4SnNvbkZvcm1PcHRpb25zKGNsb25lRGVlcCh0aGlzLmZvcm0uY3VzdG9tRm9ybUl0ZW1zKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gaWYgYWx0ZXJuYXRlIGxheW91dCBmb3VuZCwgY29weSBhbHRlcm5hdGUgbGF5b3V0IG9wdGlvbnMgaW50byBzY2hlbWFcclxuICAgIGlmIChhbHRlcm5hdGVMYXlvdXQpIHtcclxuICAgICAgSnNvblBvaW50ZXIuZm9yRWFjaERlZXAoYWx0ZXJuYXRlTGF5b3V0LCAodmFsdWUsIHBvaW50ZXIpID0+IHtcclxuICAgICAgICBjb25zdCBzY2hlbWFQb2ludGVyID0gcG9pbnRlclxyXG4gICAgICAgICAgLnJlcGxhY2UoL1xcLy9nLCAnL3Byb3BlcnRpZXMvJylcclxuICAgICAgICAgIC5yZXBsYWNlKC9cXC9wcm9wZXJ0aWVzXFwvaXRlbXNcXC9wcm9wZXJ0aWVzXFwvL2csICcvaXRlbXMvcHJvcGVydGllcy8nKVxyXG4gICAgICAgICAgLnJlcGxhY2UoL1xcL3Byb3BlcnRpZXNcXC90aXRsZU1hcFxcL3Byb3BlcnRpZXNcXC8vZywgJy90aXRsZU1hcC9wcm9wZXJ0aWVzLycpO1xyXG4gICAgICAgIGlmIChoYXNWYWx1ZSh2YWx1ZSkgJiYgaGFzVmFsdWUocG9pbnRlcikpIHtcclxuICAgICAgICAgIGxldCBrZXkgPSBKc29uUG9pbnRlci50b0tleShwb2ludGVyKTtcclxuICAgICAgICAgIGNvbnN0IGdyb3VwUG9pbnRlciA9IChKc29uUG9pbnRlci5wYXJzZShzY2hlbWFQb2ludGVyKSB8fCBbXSkuc2xpY2UoMCwgLTIpO1xyXG4gICAgICAgICAgbGV0IGl0ZW1Qb2ludGVyOiBzdHJpbmcgfCBzdHJpbmdbXTtcclxuXHJcbiAgICAgICAgICAvLyBJZiAndWk6b3JkZXInIG9iamVjdCBmb3VuZCwgY29weSBpbnRvIG9iamVjdCBzY2hlbWEgcm9vdFxyXG4gICAgICAgICAgaWYgKGtleS50b0xvd2VyQ2FzZSgpID09PSAndWk6b3JkZXInKSB7XHJcbiAgICAgICAgICAgIGl0ZW1Qb2ludGVyID0gWy4uLmdyb3VwUG9pbnRlciwgJ3VpOm9yZGVyJ107XHJcblxyXG4gICAgICAgICAgICAvLyBDb3B5IG90aGVyIGFsdGVybmF0ZSBsYXlvdXQgb3B0aW9ucyB0byBzY2hlbWEgJ3gtc2NoZW1hLWZvcm0nLFxyXG4gICAgICAgICAgICAvLyAobGlrZSBBbmd1bGFyIFNjaGVtYSBGb3JtIG9wdGlvbnMpIGFuZCByZW1vdmUgYW55ICd1aTonIHByZWZpeGVzXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAoa2V5LnNsaWNlKDAsIDMpLnRvTG93ZXJDYXNlKCkgPT09ICd1aTonKSB7IGtleSA9IGtleS5zbGljZSgzKTsgfVxyXG4gICAgICAgICAgICBpdGVtUG9pbnRlciA9IFsuLi5ncm91cFBvaW50ZXIsICd4LXNjaGVtYS1mb3JtJywga2V5XTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChKc29uUG9pbnRlci5oYXModGhpcy5qc2Yuc2NoZW1hLCBncm91cFBvaW50ZXIpICYmXHJcbiAgICAgICAgICAgICFKc29uUG9pbnRlci5oYXModGhpcy5qc2Yuc2NoZW1hLCBpdGVtUG9pbnRlcilcclxuICAgICAgICAgICkge1xyXG4gICAgICAgICAgICBKc29uUG9pbnRlci5zZXQodGhpcy5qc2Yuc2NoZW1hLCBpdGVtUG9pbnRlciwgdmFsdWUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiAnYWN0aXZhdGVGb3JtJyBmdW5jdGlvblxyXG4gICAqXHJcbiAgICogLi4uY29udGludWVkIGZyb20gJ2luaXRpYWxpemVTY2hlbWEnIGZ1bmN0aW9uLCBhYm92ZVxyXG4gICAqIElmICdzY2hlbWEnIGhhcyBub3QgYmVlbiBpbml0aWFsaXplZCAoaS5lLiBubyBzY2hlbWEgaW5wdXQgZm91bmQpXHJcbiAgICogNi4gSWYgbGF5b3V0IGlucHV0IC0gYnVpbGQgc2NoZW1hIGZyb20gbGF5b3V0IGlucHV0XHJcbiAgICogNy4gSWYgZGF0YSBpbnB1dCAtIGJ1aWxkIHNjaGVtYSBmcm9tIGRhdGEgaW5wdXRcclxuICAgKlxyXG4gICAqIENyZWF0ZSBmaW5hbCBsYXlvdXQsXHJcbiAgICogYnVpbGQgdGhlIEZvcm1Hcm91cCB0ZW1wbGF0ZSBhbmQgdGhlIEFuZ3VsYXIgRm9ybUdyb3VwLFxyXG4gICAqIHN1YnNjcmliZSB0byBjaGFuZ2VzLFxyXG4gICAqIGFuZCBhY3RpdmF0ZSB0aGUgZm9ybS5cclxuICAgKi9cclxuICBwcml2YXRlIGFjdGl2YXRlRm9ybSgpIHtcclxuICAgIHRoaXMudW5zdWJzY3JpYmVPbkFjdGl2YXRlRm9ybSQubmV4dCgpO1xyXG4gICAgLy8gSWYgJ3NjaGVtYScgbm90IGluaXRpYWxpemVkXHJcbiAgICBpZiAoaXNFbXB0eSh0aGlzLmpzZi5zY2hlbWEpKSB7XHJcblxyXG4gICAgICAvLyBUT0RPOiBJZiBmdWxsIGxheW91dCBpbnB1dCAod2l0aCBubyAnKicpLCBidWlsZCBzY2hlbWEgZnJvbSBsYXlvdXRcclxuICAgICAgLy8gaWYgKCF0aGlzLmpzZi5sYXlvdXQuaW5jbHVkZXMoJyonKSkge1xyXG4gICAgICAvLyAgIHRoaXMuanNmLmJ1aWxkU2NoZW1hRnJvbUxheW91dCgpO1xyXG4gICAgICAvLyB9IGVsc2VcclxuXHJcbiAgICAgIC8vIElmIGRhdGEgaW5wdXQsIGJ1aWxkIHNjaGVtYSBmcm9tIGRhdGFcclxuICAgICAgaWYgKCFpc0VtcHR5KHRoaXMuanNmLmZvcm1WYWx1ZXMpKSB7XHJcbiAgICAgICAgdGhpcy5qc2YuYnVpbGRTY2hlbWFGcm9tRGF0YSgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFpc0VtcHR5KHRoaXMuanNmLnNjaGVtYSkpIHtcclxuXHJcbiAgICAgIC8vIElmIG5vdCBhbHJlYWR5IGluaXRpYWxpemVkLCBpbml0aWFsaXplIGFqdiBhbmQgY29tcGlsZSBzY2hlbWFcclxuICAgICAgdGhpcy5qc2YuY29tcGlsZUFqdlNjaGVtYSgpO1xyXG5cclxuICAgICAgLy8gVXBkYXRlIGFsbCBsYXlvdXQgZWxlbWVudHMsIGFkZCB2YWx1ZXMsIHdpZGdldHMsIGFuZCB2YWxpZGF0b3JzLFxyXG4gICAgICAvLyByZXBsYWNlIGFueSAnKicgd2l0aCBhIGxheW91dCBidWlsdCBmcm9tIGFsbCBzY2hlbWEgZWxlbWVudHMsXHJcbiAgICAgIC8vIGFuZCB1cGRhdGUgdGhlIEZvcm1Hcm91cCB0ZW1wbGF0ZSB3aXRoIGFueSBuZXcgdmFsaWRhdG9yc1xyXG4gICAgICB0aGlzLmpzZi5idWlsZExheW91dCh0aGlzLndpZGdldExpYnJhcnkpO1xyXG5cclxuICAgICAgLy8gQnVpbGQgdGhlIEFuZ3VsYXIgRm9ybUdyb3VwIHRlbXBsYXRlIGZyb20gdGhlIHNjaGVtYVxyXG4gICAgICB0aGlzLmpzZi5idWlsZEZvcm1Hcm91cFRlbXBsYXRlKHRoaXMuanNmLmZvcm1WYWx1ZXMpO1xyXG5cclxuICAgICAgLy8gQnVpbGQgdGhlIHJlYWwgQW5ndWxhciBGb3JtR3JvdXAgZnJvbSB0aGUgRm9ybUdyb3VwIHRlbXBsYXRlXHJcbiAgICAgIHRoaXMuanNmLmJ1aWxkRm9ybUdyb3VwKCk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuanNmLmZvcm1Hcm91cCkge1xyXG5cclxuICAgICAgLy8gUmVzZXQgaW5pdGlhbCBmb3JtIHZhbHVlc1xyXG4gICAgICBpZiAoIWlzRW1wdHkodGhpcy5qc2YuZm9ybVZhbHVlcykgJiZcclxuICAgICAgICB0aGlzLmpzZi5mb3JtT3B0aW9ucy5zZXRTY2hlbWFEZWZhdWx0cyAhPT0gdHJ1ZSAmJlxyXG4gICAgICAgIHRoaXMuanNmLmZvcm1PcHRpb25zLnNldExheW91dERlZmF1bHRzICE9PSB0cnVlXHJcbiAgICAgICkge1xyXG4gICAgICAgIHRoaXMuc2V0Rm9ybVZhbHVlcyh0aGlzLmpzZi5mb3JtVmFsdWVzKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gVE9ETzogRmlndXJlIG91dCBob3cgdG8gZGlzcGxheSBjYWxjdWxhdGVkIHZhbHVlcyB3aXRob3V0IGNoYW5naW5nIG9iamVjdCBkYXRhXHJcbiAgICAgIC8vIFNlZSBodHRwOi8vdWxpb24uZ2l0aHViLmlvL2pzb25mb3JtL3BsYXlncm91bmQvP2V4YW1wbGU9dGVtcGxhdGluZy12YWx1ZXNcclxuICAgICAgLy8gQ2FsY3VsYXRlIHJlZmVyZW5jZXMgdG8gb3RoZXIgZmllbGRzXHJcbiAgICAgIC8vIGlmICghaXNFbXB0eSh0aGlzLmpzZi5mb3JtR3JvdXAudmFsdWUpKSB7XHJcbiAgICAgIC8vICAgZm9yRWFjaCh0aGlzLmpzZi5mb3JtR3JvdXAudmFsdWUsICh2YWx1ZSwga2V5LCBvYmplY3QsIHJvb3RPYmplY3QpID0+IHtcclxuICAgICAgLy8gICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIC8vICAgICAgIG9iamVjdFtrZXldID0gdGhpcy5qc2YucGFyc2VUZXh0KHZhbHVlLCB2YWx1ZSwgcm9vdE9iamVjdCwga2V5KTtcclxuICAgICAgLy8gICAgIH1cclxuICAgICAgLy8gICB9LCAndG9wLWRvd24nKTtcclxuICAgICAgLy8gfVxyXG5cclxuICAgICAgLy8gU3Vic2NyaWJlIHRvIGZvcm0gY2hhbmdlcyB0byBvdXRwdXQgbGl2ZSBkYXRhLCB2YWxpZGF0aW9uLCBhbmQgZXJyb3JzXHJcbiAgICAgIHRoaXMuanNmLmRhdGFDaGFuZ2VzLnBpcGUodGFrZVVudGlsKHRoaXMudW5zdWJzY3JpYmVPbkFjdGl2YXRlRm9ybSQpKS5zdWJzY3JpYmUoZGF0YSA9PiB7XHJcbiAgICAgICAgdGhpcy5vbkNoYW5nZXMuZW1pdCh0aGlzLm9iamVjdFdyYXAgPyBkYXRhWycxJ10gOiBkYXRhKTtcclxuICAgICAgICBpZiAodGhpcy5mb3JtVmFsdWVzSW5wdXQgJiYgdGhpcy5mb3JtVmFsdWVzSW5wdXQuaW5kZXhPZignLicpID09PSAtMSkge1xyXG4gICAgICAgICAgdGhpc1tgJHt0aGlzLmZvcm1WYWx1ZXNJbnB1dH1DaGFuZ2VgXS5lbWl0KHRoaXMub2JqZWN0V3JhcCA/IGRhdGFbJzEnXSA6IGRhdGEpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICAvLyBUcmlnZ2VyIGNoYW5nZSBkZXRlY3Rpb24gb24gc3RhdHVzQ2hhbmdlcyB0byBzaG93IHVwZGF0ZWQgZXJyb3JzXHJcbiAgICAgIHRoaXMuanNmLmZvcm1Hcm91cC5zdGF0dXNDaGFuZ2VzLnBpcGUodGFrZVVudGlsKHRoaXMudW5zdWJzY3JpYmVPbkFjdGl2YXRlRm9ybSQpKS5zdWJzY3JpYmUoKCkgPT4gdGhpcy5jaGFuZ2VEZXRlY3Rvci5tYXJrRm9yQ2hlY2soKSk7XHJcbiAgICAgIHRoaXMuanNmLmlzVmFsaWRDaGFuZ2VzLnBpcGUodGFrZVVudGlsKHRoaXMudW5zdWJzY3JpYmVPbkFjdGl2YXRlRm9ybSQpKS5zdWJzY3JpYmUoaXNWYWxpZCA9PiB0aGlzLmlzVmFsaWQuZW1pdChpc1ZhbGlkKSk7XHJcbiAgICAgIHRoaXMuanNmLnZhbGlkYXRpb25FcnJvckNoYW5nZXMucGlwZSh0YWtlVW50aWwodGhpcy51bnN1YnNjcmliZU9uQWN0aXZhdGVGb3JtJCkpLnN1YnNjcmliZShlcnIgPT4gdGhpcy52YWxpZGF0aW9uRXJyb3JzLmVtaXQoZXJyKSk7XHJcblxyXG4gICAgICAvLyBPdXRwdXQgZmluYWwgc2NoZW1hLCBmaW5hbCBsYXlvdXQsIGFuZCBpbml0aWFsIGRhdGFcclxuICAgICAgdGhpcy5mb3JtU2NoZW1hLmVtaXQodGhpcy5qc2Yuc2NoZW1hKTtcclxuICAgICAgdGhpcy5mb3JtTGF5b3V0LmVtaXQodGhpcy5qc2YubGF5b3V0KTtcclxuICAgICAgdGhpcy5vbkNoYW5nZXMuZW1pdCh0aGlzLm9iamVjdFdyYXAgPyB0aGlzLmpzZi5kYXRhWycxJ10gOiB0aGlzLmpzZi5kYXRhKTtcclxuXHJcbiAgICAgIC8vIElmIHZhbGlkYXRlT25SZW5kZXIsIG91dHB1dCBpbml0aWFsIHZhbGlkYXRpb24gYW5kIGFueSBlcnJvcnNcclxuICAgICAgY29uc3QgdmFsaWRhdGVPblJlbmRlciA9XHJcbiAgICAgICAgSnNvblBvaW50ZXIuZ2V0KHRoaXMuanNmLCAnL2Zvcm1PcHRpb25zL3ZhbGlkYXRlT25SZW5kZXInKTtcclxuICAgICAgaWYgKHZhbGlkYXRlT25SZW5kZXIpIHsgLy8gdmFsaWRhdGVPblJlbmRlciA9PT0gJ2F1dG8nIHx8IHRydWVcclxuICAgICAgICBjb25zdCB0b3VjaEFsbCA9IChjb250cm9sKSA9PiB7XHJcbiAgICAgICAgICBpZiAodmFsaWRhdGVPblJlbmRlciA9PT0gdHJ1ZSB8fCBoYXNWYWx1ZShjb250cm9sLnZhbHVlKSkge1xyXG4gICAgICAgICAgICBjb250cm9sLm1hcmtBc1RvdWNoZWQoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIE9iamVjdC5rZXlzKGNvbnRyb2wuY29udHJvbHMgfHwge30pXHJcbiAgICAgICAgICAgIC5mb3JFYWNoKGtleSA9PiB0b3VjaEFsbChjb250cm9sLmNvbnRyb2xzW2tleV0pKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRvdWNoQWxsKHRoaXMuanNmLmZvcm1Hcm91cCk7XHJcbiAgICAgICAgdGhpcy5pc1ZhbGlkLmVtaXQodGhpcy5qc2YuaXNWYWxpZCk7XHJcbiAgICAgICAgdGhpcy52YWxpZGF0aW9uRXJyb3JzLmVtaXQodGhpcy5qc2YuYWp2RXJyb3JzKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iLCI8Zm9ybSBbYXV0b2NvbXBsZXRlXT1cImpzZj8uZm9ybU9wdGlvbnM/LmF1dG9jb21wbGV0ZSA/ICdvbicgOiAnb2ZmJ1wiIGNsYXNzPVwianNvbi1zY2hlbWEtZm9ybVwiIChuZ1N1Ym1pdCk9XCJzdWJtaXRGb3JtKClcIj5cclxuICA8cm9vdC13aWRnZXQgW2xheW91dF09XCJqc2Y/LmxheW91dFwiPjwvcm9vdC13aWRnZXQ+XHJcbjwvZm9ybT5cclxuPGRpdiAqbmdJZj1cImRlYnVnIHx8IGpzZj8uZm9ybU9wdGlvbnM/LmRlYnVnXCI+XHJcbiAgRGVidWcgb3V0cHV0OlxyXG4gIDxwcmU+e3tkZWJ1Z091dHB1dH19PC9wcmU+XHJcbjwvZGl2PiJdfQ==