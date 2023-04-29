export const itValidationMessages = {
    required: 'Il campo è obbligatorio',
    minLength: 'Deve inserire almeno {{minimumLength}} caratteri (lunghezza corrente: {{currentLength}})',
    maxLength: 'Il numero massimo di caratteri consentito è {{maximumLength}} (lunghezza corrente: {{currentLength}})',
    pattern: 'Devi rispettare il pattern : {{requiredPattern}}',
    format: function (error) {
        switch (error.requiredFormat) {
            case 'date':
                return 'Deve essere una data, come "31-12-2000"';
            case 'time':
                return 'Deve essere un orario, come "16:20" o "03:14:15.9265"';
            case 'date-time':
                return 'Deve essere data-orario, come "14-03-2000T01:59" or "14-03-2000T01:59:26.535Z"';
            case 'email':
                return 'Deve essere un indirzzo email, come "name@example.com"';
            case 'hostname':
                return 'Deve essere un hostname, come "example.com"';
            case 'ipv4':
                return 'Deve essere un indirizzo IPv4, come "127.0.0.1"';
            case 'ipv6':
                return 'Deve essere un indirizzo IPv6, come "1234:5678:9ABC:DEF0:1234:5678:9ABC:DEF0"';
            // TODO: add examples for 'uri', 'uri-reference', and 'uri-template'
            // case 'uri': case 'uri-reference': case 'uri-template':
            case 'url':
                return 'Deve essere un url, come "http://www.example.com/page.html"';
            case 'uuid':
                return 'Deve essere un uuid, come "12345678-9ABC-DEF0-1234-56789ABCDEF0"';
            case 'color':
                return 'Deve essere un colore, come "#FFFFFF" o "rgb(255, 255, 255)"';
            case 'json-pointer':
                return 'Deve essere un JSON Pointer, come "/pointer/to/something"';
            case 'relative-json-pointer':
                return 'Deve essere un JSON Pointer relativo, come "2/pointer/to/something"';
            case 'regex':
                return 'Deve essere una regular expression, come "(1-)?\\d{3}-\\d{3}-\\d{4}"';
            default:
                return 'Deve essere formattato correttamente ' + error.requiredFormat;
        }
    },
    minimum: 'Deve essere {{minimumValue}} o più',
    exclusiveMinimum: 'Deve essere più di {{exclusiveMinimumValue}}',
    maximum: 'Deve essere {{maximumValue}} o meno',
    exclusiveMaximum: 'Deve essere minore di {{exclusiveMaximumValue}}',
    multipleOf: function (error) {
        if ((1 / error.multipleOfValue) % 10 === 0) {
            const decimals = Math.log10(1 / error.multipleOfValue);
            return `Deve avere ${decimals} o meno decimali.`;
        }
        else {
            return `Deve essere multiplo di ${error.multipleOfValue}.`;
        }
    },
    minProperties: 'Deve avere {{minimumProperties}} o più elementi (elementi correnti: {{currentProperties}})',
    maxProperties: 'Deve avere {{maximumProperties}} o meno elementi (elementi correnti: {{currentProperties}})',
    minItems: 'Deve avere {{minimumItems}} o più elementi (elementi correnti: {{currentItems}})',
    maxItems: 'Deve avere {{maximumItems}} o meno elementi (elementi correnti: {{currentItems}})',
    uniqueItems: 'Tutti gli elementi devono essere unici',
    // Note: No default error messages for 'type', 'const', 'enum', or 'dependencies'
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXQtdmFsaWRhdGlvbi1tZXNzYWdlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2Fqc2YtY29yZS9zcmMvbGliL2xvY2FsZS9pdC12YWxpZGF0aW9uLW1lc3NhZ2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sQ0FBQyxNQUFNLG9CQUFvQixHQUFRO0lBQ3ZDLFFBQVEsRUFBRSx5QkFBeUI7SUFDbkMsU0FBUyxFQUFFLDBGQUEwRjtJQUNyRyxTQUFTLEVBQUUsdUdBQXVHO0lBQ2xILE9BQU8sRUFBRSxrREFBa0Q7SUFDM0QsTUFBTSxFQUFFLFVBQVUsS0FBSztRQUNyQixRQUFRLEtBQUssQ0FBQyxjQUFjLEVBQUU7WUFDNUIsS0FBSyxNQUFNO2dCQUNULE9BQU8seUNBQXlDLENBQUM7WUFDbkQsS0FBSyxNQUFNO2dCQUNULE9BQU8sdURBQXVELENBQUM7WUFDakUsS0FBSyxXQUFXO2dCQUNkLE9BQU8sZ0ZBQWdGLENBQUM7WUFDMUYsS0FBSyxPQUFPO2dCQUNWLE9BQU8sd0RBQXdELENBQUM7WUFDbEUsS0FBSyxVQUFVO2dCQUNiLE9BQU8sNkNBQTZDLENBQUM7WUFDdkQsS0FBSyxNQUFNO2dCQUNULE9BQU8saURBQWlELENBQUM7WUFDM0QsS0FBSyxNQUFNO2dCQUNULE9BQU8sK0VBQStFLENBQUM7WUFDekYsb0VBQW9FO1lBQ3BFLHlEQUF5RDtZQUN6RCxLQUFLLEtBQUs7Z0JBQ1IsT0FBTyw2REFBNkQsQ0FBQztZQUN2RSxLQUFLLE1BQU07Z0JBQ1QsT0FBTyxrRUFBa0UsQ0FBQztZQUM1RSxLQUFLLE9BQU87Z0JBQ1YsT0FBTyw4REFBOEQsQ0FBQztZQUN4RSxLQUFLLGNBQWM7Z0JBQ2pCLE9BQU8sMkRBQTJELENBQUM7WUFDckUsS0FBSyx1QkFBdUI7Z0JBQzFCLE9BQU8scUVBQXFFLENBQUM7WUFDL0UsS0FBSyxPQUFPO2dCQUNWLE9BQU8sc0VBQXNFLENBQUM7WUFDaEY7Z0JBQ0UsT0FBTyx1Q0FBdUMsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDO1NBQ3pFO0lBQ0gsQ0FBQztJQUNELE9BQU8sRUFBRSxvQ0FBb0M7SUFDN0MsZ0JBQWdCLEVBQUUsOENBQThDO0lBQ2hFLE9BQU8sRUFBRSxxQ0FBcUM7SUFDOUMsZ0JBQWdCLEVBQUUsaURBQWlEO0lBQ25FLFVBQVUsRUFBRSxVQUFVLEtBQUs7UUFDekIsSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsRUFBRTtZQUMxQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDdkQsT0FBTyxjQUFjLFFBQVEsbUJBQW1CLENBQUM7U0FDbEQ7YUFBTTtZQUNMLE9BQU8sMkJBQTJCLEtBQUssQ0FBQyxlQUFlLEdBQUcsQ0FBQztTQUM1RDtJQUNILENBQUM7SUFDRCxhQUFhLEVBQUUsNEZBQTRGO0lBQzNHLGFBQWEsRUFBRSw2RkFBNkY7SUFDNUcsUUFBUSxFQUFFLGtGQUFrRjtJQUM1RixRQUFRLEVBQUUsbUZBQW1GO0lBQzdGLFdBQVcsRUFBRSx3Q0FBd0M7SUFDckQsaUZBQWlGO0NBQ2xGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgaXRWYWxpZGF0aW9uTWVzc2FnZXM6IGFueSA9IHsgLy8gRGVmYXVsdCBJdGFsaWFuIGVycm9yIG1lc3NhZ2VzXHJcbiAgcmVxdWlyZWQ6ICdJbCBjYW1wbyDDqCBvYmJsaWdhdG9yaW8nLFxyXG4gIG1pbkxlbmd0aDogJ0RldmUgaW5zZXJpcmUgYWxtZW5vIHt7bWluaW11bUxlbmd0aH19IGNhcmF0dGVyaSAobHVuZ2hlenphIGNvcnJlbnRlOiB7e2N1cnJlbnRMZW5ndGh9fSknLFxyXG4gIG1heExlbmd0aDogJ0lsIG51bWVybyBtYXNzaW1vIGRpIGNhcmF0dGVyaSBjb25zZW50aXRvIMOoIHt7bWF4aW11bUxlbmd0aH19IChsdW5naGV6emEgY29ycmVudGU6IHt7Y3VycmVudExlbmd0aH19KScsXHJcbiAgcGF0dGVybjogJ0RldmkgcmlzcGV0dGFyZSBpbCBwYXR0ZXJuIDoge3tyZXF1aXJlZFBhdHRlcm59fScsXHJcbiAgZm9ybWF0OiBmdW5jdGlvbiAoZXJyb3IpIHtcclxuICAgIHN3aXRjaCAoZXJyb3IucmVxdWlyZWRGb3JtYXQpIHtcclxuICAgICAgY2FzZSAnZGF0ZSc6XHJcbiAgICAgICAgcmV0dXJuICdEZXZlIGVzc2VyZSB1bmEgZGF0YSwgY29tZSBcIjMxLTEyLTIwMDBcIic7XHJcbiAgICAgIGNhc2UgJ3RpbWUnOlxyXG4gICAgICAgIHJldHVybiAnRGV2ZSBlc3NlcmUgdW4gb3JhcmlvLCBjb21lIFwiMTY6MjBcIiBvIFwiMDM6MTQ6MTUuOTI2NVwiJztcclxuICAgICAgY2FzZSAnZGF0ZS10aW1lJzpcclxuICAgICAgICByZXR1cm4gJ0RldmUgZXNzZXJlIGRhdGEtb3JhcmlvLCBjb21lIFwiMTQtMDMtMjAwMFQwMTo1OVwiIG9yIFwiMTQtMDMtMjAwMFQwMTo1OToyNi41MzVaXCInO1xyXG4gICAgICBjYXNlICdlbWFpbCc6XHJcbiAgICAgICAgcmV0dXJuICdEZXZlIGVzc2VyZSB1biBpbmRpcnp6byBlbWFpbCwgY29tZSBcIm5hbWVAZXhhbXBsZS5jb21cIic7XHJcbiAgICAgIGNhc2UgJ2hvc3RuYW1lJzpcclxuICAgICAgICByZXR1cm4gJ0RldmUgZXNzZXJlIHVuIGhvc3RuYW1lLCBjb21lIFwiZXhhbXBsZS5jb21cIic7XHJcbiAgICAgIGNhc2UgJ2lwdjQnOlxyXG4gICAgICAgIHJldHVybiAnRGV2ZSBlc3NlcmUgdW4gaW5kaXJpenpvIElQdjQsIGNvbWUgXCIxMjcuMC4wLjFcIic7XHJcbiAgICAgIGNhc2UgJ2lwdjYnOlxyXG4gICAgICAgIHJldHVybiAnRGV2ZSBlc3NlcmUgdW4gaW5kaXJpenpvIElQdjYsIGNvbWUgXCIxMjM0OjU2Nzg6OUFCQzpERUYwOjEyMzQ6NTY3ODo5QUJDOkRFRjBcIic7XHJcbiAgICAgIC8vIFRPRE86IGFkZCBleGFtcGxlcyBmb3IgJ3VyaScsICd1cmktcmVmZXJlbmNlJywgYW5kICd1cmktdGVtcGxhdGUnXHJcbiAgICAgIC8vIGNhc2UgJ3VyaSc6IGNhc2UgJ3VyaS1yZWZlcmVuY2UnOiBjYXNlICd1cmktdGVtcGxhdGUnOlxyXG4gICAgICBjYXNlICd1cmwnOlxyXG4gICAgICAgIHJldHVybiAnRGV2ZSBlc3NlcmUgdW4gdXJsLCBjb21lIFwiaHR0cDovL3d3dy5leGFtcGxlLmNvbS9wYWdlLmh0bWxcIic7XHJcbiAgICAgIGNhc2UgJ3V1aWQnOlxyXG4gICAgICAgIHJldHVybiAnRGV2ZSBlc3NlcmUgdW4gdXVpZCwgY29tZSBcIjEyMzQ1Njc4LTlBQkMtREVGMC0xMjM0LTU2Nzg5QUJDREVGMFwiJztcclxuICAgICAgY2FzZSAnY29sb3InOlxyXG4gICAgICAgIHJldHVybiAnRGV2ZSBlc3NlcmUgdW4gY29sb3JlLCBjb21lIFwiI0ZGRkZGRlwiIG8gXCJyZ2IoMjU1LCAyNTUsIDI1NSlcIic7XHJcbiAgICAgIGNhc2UgJ2pzb24tcG9pbnRlcic6XHJcbiAgICAgICAgcmV0dXJuICdEZXZlIGVzc2VyZSB1biBKU09OIFBvaW50ZXIsIGNvbWUgXCIvcG9pbnRlci90by9zb21ldGhpbmdcIic7XHJcbiAgICAgIGNhc2UgJ3JlbGF0aXZlLWpzb24tcG9pbnRlcic6XHJcbiAgICAgICAgcmV0dXJuICdEZXZlIGVzc2VyZSB1biBKU09OIFBvaW50ZXIgcmVsYXRpdm8sIGNvbWUgXCIyL3BvaW50ZXIvdG8vc29tZXRoaW5nXCInO1xyXG4gICAgICBjYXNlICdyZWdleCc6XHJcbiAgICAgICAgcmV0dXJuICdEZXZlIGVzc2VyZSB1bmEgcmVndWxhciBleHByZXNzaW9uLCBjb21lIFwiKDEtKT9cXFxcZHszfS1cXFxcZHszfS1cXFxcZHs0fVwiJztcclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICByZXR1cm4gJ0RldmUgZXNzZXJlIGZvcm1hdHRhdG8gY29ycmV0dGFtZW50ZSAnICsgZXJyb3IucmVxdWlyZWRGb3JtYXQ7XHJcbiAgICB9XHJcbiAgfSxcclxuICBtaW5pbXVtOiAnRGV2ZSBlc3NlcmUge3ttaW5pbXVtVmFsdWV9fSBvIHBpw7knLFxyXG4gIGV4Y2x1c2l2ZU1pbmltdW06ICdEZXZlIGVzc2VyZSBwacO5IGRpIHt7ZXhjbHVzaXZlTWluaW11bVZhbHVlfX0nLFxyXG4gIG1heGltdW06ICdEZXZlIGVzc2VyZSB7e21heGltdW1WYWx1ZX19IG8gbWVubycsXHJcbiAgZXhjbHVzaXZlTWF4aW11bTogJ0RldmUgZXNzZXJlIG1pbm9yZSBkaSB7e2V4Y2x1c2l2ZU1heGltdW1WYWx1ZX19JyxcclxuICBtdWx0aXBsZU9mOiBmdW5jdGlvbiAoZXJyb3IpIHtcclxuICAgIGlmICgoMSAvIGVycm9yLm11bHRpcGxlT2ZWYWx1ZSkgJSAxMCA9PT0gMCkge1xyXG4gICAgICBjb25zdCBkZWNpbWFscyA9IE1hdGgubG9nMTAoMSAvIGVycm9yLm11bHRpcGxlT2ZWYWx1ZSk7XHJcbiAgICAgIHJldHVybiBgRGV2ZSBhdmVyZSAke2RlY2ltYWxzfSBvIG1lbm8gZGVjaW1hbGkuYDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBgRGV2ZSBlc3NlcmUgbXVsdGlwbG8gZGkgJHtlcnJvci5tdWx0aXBsZU9mVmFsdWV9LmA7XHJcbiAgICB9XHJcbiAgfSxcclxuICBtaW5Qcm9wZXJ0aWVzOiAnRGV2ZSBhdmVyZSB7e21pbmltdW1Qcm9wZXJ0aWVzfX0gbyBwacO5IGVsZW1lbnRpIChlbGVtZW50aSBjb3JyZW50aToge3tjdXJyZW50UHJvcGVydGllc319KScsXHJcbiAgbWF4UHJvcGVydGllczogJ0RldmUgYXZlcmUge3ttYXhpbXVtUHJvcGVydGllc319IG8gbWVubyBlbGVtZW50aSAoZWxlbWVudGkgY29ycmVudGk6IHt7Y3VycmVudFByb3BlcnRpZXN9fSknLFxyXG4gIG1pbkl0ZW1zOiAnRGV2ZSBhdmVyZSB7e21pbmltdW1JdGVtc319IG8gcGnDuSBlbGVtZW50aSAoZWxlbWVudGkgY29ycmVudGk6IHt7Y3VycmVudEl0ZW1zfX0pJyxcclxuICBtYXhJdGVtczogJ0RldmUgYXZlcmUge3ttYXhpbXVtSXRlbXN9fSBvIG1lbm8gZWxlbWVudGkgKGVsZW1lbnRpIGNvcnJlbnRpOiB7e2N1cnJlbnRJdGVtc319KScsXHJcbiAgdW5pcXVlSXRlbXM6ICdUdXR0aSBnbGkgZWxlbWVudGkgZGV2b25vIGVzc2VyZSB1bmljaScsXHJcbiAgLy8gTm90ZTogTm8gZGVmYXVsdCBlcnJvciBtZXNzYWdlcyBmb3IgJ3R5cGUnLCAnY29uc3QnLCAnZW51bScsIG9yICdkZXBlbmRlbmNpZXMnXHJcbn07XHJcbiJdfQ==