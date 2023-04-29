export const frValidationMessages = {
    required: 'Est obligatoire.',
    minLength: 'Doit avoir minimum {{minimumLength}} caractères (actuellement: {{currentLength}})',
    maxLength: 'Doit avoir maximum {{maximumLength}} caractères (actuellement: {{currentLength}})',
    pattern: 'Doit respecter: {{requiredPattern}}',
    format: function (error) {
        switch (error.requiredFormat) {
            case 'date':
                return 'Doit être une date, tel que "2000-12-31"';
            case 'time':
                return 'Doit être une heure, tel que "16:20" ou "03:14:15.9265"';
            case 'date-time':
                return 'Doit être une date et une heure, tel que "2000-03-14T01:59" ou "2000-03-14T01:59:26.535Z"';
            case 'email':
                return 'Doit être une adresse e-mail, tel que "name@example.com"';
            case 'hostname':
                return 'Doit être un nom de domaine, tel que "example.com"';
            case 'ipv4':
                return 'Doit être une adresse IPv4, tel que "127.0.0.1"';
            case 'ipv6':
                return 'Doit être une adresse IPv6, tel que "1234:5678:9ABC:DEF0:1234:5678:9ABC:DEF0"';
            // TODO: add examples for 'uri', 'uri-reference', and 'uri-template'
            // case 'uri': case 'uri-reference': case 'uri-template':
            case 'url':
                return 'Doit être une URL, tel que "http://www.example.com/page.html"';
            case 'uuid':
                return 'Doit être un UUID, tel que "12345678-9ABC-DEF0-1234-56789ABCDEF0"';
            case 'color':
                return 'Doit être une couleur, tel que "#FFFFFF" or "rgb(255, 255, 255)"';
            case 'json-pointer':
                return 'Doit être un JSON Pointer, tel que "/pointer/to/something"';
            case 'relative-json-pointer':
                return 'Doit être un relative JSON Pointer, tel que "2/pointer/to/something"';
            case 'regex':
                return 'Doit être une expression régulière, tel que "(1-)?\\d{3}-\\d{3}-\\d{4}"';
            default:
                return 'Doit être avoir le format correct: ' + error.requiredFormat;
        }
    },
    minimum: 'Doit être supérieur à {{minimumValue}}',
    exclusiveMinimum: 'Doit avoir minimum {{exclusiveMinimumValue}} charactères',
    maximum: 'Doit être inférieur à {{maximumValue}}',
    exclusiveMaximum: 'Doit avoir maximum {{exclusiveMaximumValue}} charactères',
    multipleOf: function (error) {
        if ((1 / error.multipleOfValue) % 10 === 0) {
            const decimals = Math.log10(1 / error.multipleOfValue);
            return `Doit comporter ${decimals} ou moins de decimales.`;
        }
        else {
            return `Doit être un multiple de ${error.multipleOfValue}.`;
        }
    },
    minProperties: 'Doit comporter au minimum {{minimumProperties}} éléments',
    maxProperties: 'Doit comporter au maximum {{maximumProperties}} éléments',
    minItems: 'Doit comporter au minimum {{minimumItems}} éléments',
    maxItems: 'Doit comporter au maximum {{minimumItems}} éléments',
    uniqueItems: 'Tous les éléments doivent être uniques',
    // Note: No default error messages for 'type', 'const', 'enum', or 'dependencies'
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnItdmFsaWRhdGlvbi1tZXNzYWdlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2Fqc2YtY29yZS9zcmMvbGliL2xvY2FsZS9mci12YWxpZGF0aW9uLW1lc3NhZ2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sQ0FBQyxNQUFNLG9CQUFvQixHQUFRO0lBQ3ZDLFFBQVEsRUFBRSxrQkFBa0I7SUFDNUIsU0FBUyxFQUFFLG1GQUFtRjtJQUM5RixTQUFTLEVBQUUsbUZBQW1GO0lBQzlGLE9BQU8sRUFBRSxxQ0FBcUM7SUFDOUMsTUFBTSxFQUFFLFVBQVUsS0FBSztRQUNyQixRQUFRLEtBQUssQ0FBQyxjQUFjLEVBQUU7WUFDNUIsS0FBSyxNQUFNO2dCQUNULE9BQU8sMENBQTBDLENBQUM7WUFDcEQsS0FBSyxNQUFNO2dCQUNULE9BQU8seURBQXlELENBQUM7WUFDbkUsS0FBSyxXQUFXO2dCQUNkLE9BQU8sMkZBQTJGLENBQUM7WUFDckcsS0FBSyxPQUFPO2dCQUNWLE9BQU8sMERBQTBELENBQUM7WUFDcEUsS0FBSyxVQUFVO2dCQUNiLE9BQU8sb0RBQW9ELENBQUM7WUFDOUQsS0FBSyxNQUFNO2dCQUNULE9BQU8saURBQWlELENBQUM7WUFDM0QsS0FBSyxNQUFNO2dCQUNULE9BQU8sK0VBQStFLENBQUM7WUFDekYsb0VBQW9FO1lBQ3BFLHlEQUF5RDtZQUN6RCxLQUFLLEtBQUs7Z0JBQ1IsT0FBTywrREFBK0QsQ0FBQztZQUN6RSxLQUFLLE1BQU07Z0JBQ1QsT0FBTyxtRUFBbUUsQ0FBQztZQUM3RSxLQUFLLE9BQU87Z0JBQ1YsT0FBTyxrRUFBa0UsQ0FBQztZQUM1RSxLQUFLLGNBQWM7Z0JBQ2pCLE9BQU8sNERBQTRELENBQUM7WUFDdEUsS0FBSyx1QkFBdUI7Z0JBQzFCLE9BQU8sc0VBQXNFLENBQUM7WUFDaEYsS0FBSyxPQUFPO2dCQUNWLE9BQU8seUVBQXlFLENBQUM7WUFDbkY7Z0JBQ0UsT0FBTyxxQ0FBcUMsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDO1NBQ3ZFO0lBQ0gsQ0FBQztJQUNELE9BQU8sRUFBRSx3Q0FBd0M7SUFDakQsZ0JBQWdCLEVBQUUsMERBQTBEO0lBQzVFLE9BQU8sRUFBRSx3Q0FBd0M7SUFDakQsZ0JBQWdCLEVBQUUsMERBQTBEO0lBQzVFLFVBQVUsRUFBRSxVQUFVLEtBQUs7UUFDekIsSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsRUFBRTtZQUMxQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDdkQsT0FBTyxrQkFBa0IsUUFBUSx5QkFBeUIsQ0FBQztTQUM1RDthQUFNO1lBQ0wsT0FBTyw0QkFBNEIsS0FBSyxDQUFDLGVBQWUsR0FBRyxDQUFDO1NBQzdEO0lBQ0gsQ0FBQztJQUNELGFBQWEsRUFBRSwwREFBMEQ7SUFDekUsYUFBYSxFQUFFLDBEQUEwRDtJQUN6RSxRQUFRLEVBQUUscURBQXFEO0lBQy9ELFFBQVEsRUFBRSxxREFBcUQ7SUFDL0QsV0FBVyxFQUFFLHdDQUF3QztJQUNyRCxpRkFBaUY7Q0FDbEYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjb25zdCBmclZhbGlkYXRpb25NZXNzYWdlczogYW55ID0geyAvLyBGcmVuY2ggZXJyb3IgbWVzc2FnZXNcclxuICByZXF1aXJlZDogJ0VzdCBvYmxpZ2F0b2lyZS4nLFxyXG4gIG1pbkxlbmd0aDogJ0RvaXQgYXZvaXIgbWluaW11bSB7e21pbmltdW1MZW5ndGh9fSBjYXJhY3TDqHJlcyAoYWN0dWVsbGVtZW50OiB7e2N1cnJlbnRMZW5ndGh9fSknLFxyXG4gIG1heExlbmd0aDogJ0RvaXQgYXZvaXIgbWF4aW11bSB7e21heGltdW1MZW5ndGh9fSBjYXJhY3TDqHJlcyAoYWN0dWVsbGVtZW50OiB7e2N1cnJlbnRMZW5ndGh9fSknLFxyXG4gIHBhdHRlcm46ICdEb2l0IHJlc3BlY3Rlcjoge3tyZXF1aXJlZFBhdHRlcm59fScsXHJcbiAgZm9ybWF0OiBmdW5jdGlvbiAoZXJyb3IpIHtcclxuICAgIHN3aXRjaCAoZXJyb3IucmVxdWlyZWRGb3JtYXQpIHtcclxuICAgICAgY2FzZSAnZGF0ZSc6XHJcbiAgICAgICAgcmV0dXJuICdEb2l0IMOqdHJlIHVuZSBkYXRlLCB0ZWwgcXVlIFwiMjAwMC0xMi0zMVwiJztcclxuICAgICAgY2FzZSAndGltZSc6XHJcbiAgICAgICAgcmV0dXJuICdEb2l0IMOqdHJlIHVuZSBoZXVyZSwgdGVsIHF1ZSBcIjE2OjIwXCIgb3UgXCIwMzoxNDoxNS45MjY1XCInO1xyXG4gICAgICBjYXNlICdkYXRlLXRpbWUnOlxyXG4gICAgICAgIHJldHVybiAnRG9pdCDDqnRyZSB1bmUgZGF0ZSBldCB1bmUgaGV1cmUsIHRlbCBxdWUgXCIyMDAwLTAzLTE0VDAxOjU5XCIgb3UgXCIyMDAwLTAzLTE0VDAxOjU5OjI2LjUzNVpcIic7XHJcbiAgICAgIGNhc2UgJ2VtYWlsJzpcclxuICAgICAgICByZXR1cm4gJ0RvaXQgw6p0cmUgdW5lIGFkcmVzc2UgZS1tYWlsLCB0ZWwgcXVlIFwibmFtZUBleGFtcGxlLmNvbVwiJztcclxuICAgICAgY2FzZSAnaG9zdG5hbWUnOlxyXG4gICAgICAgIHJldHVybiAnRG9pdCDDqnRyZSB1biBub20gZGUgZG9tYWluZSwgdGVsIHF1ZSBcImV4YW1wbGUuY29tXCInO1xyXG4gICAgICBjYXNlICdpcHY0JzpcclxuICAgICAgICByZXR1cm4gJ0RvaXQgw6p0cmUgdW5lIGFkcmVzc2UgSVB2NCwgdGVsIHF1ZSBcIjEyNy4wLjAuMVwiJztcclxuICAgICAgY2FzZSAnaXB2Nic6XHJcbiAgICAgICAgcmV0dXJuICdEb2l0IMOqdHJlIHVuZSBhZHJlc3NlIElQdjYsIHRlbCBxdWUgXCIxMjM0OjU2Nzg6OUFCQzpERUYwOjEyMzQ6NTY3ODo5QUJDOkRFRjBcIic7XHJcbiAgICAgIC8vIFRPRE86IGFkZCBleGFtcGxlcyBmb3IgJ3VyaScsICd1cmktcmVmZXJlbmNlJywgYW5kICd1cmktdGVtcGxhdGUnXHJcbiAgICAgIC8vIGNhc2UgJ3VyaSc6IGNhc2UgJ3VyaS1yZWZlcmVuY2UnOiBjYXNlICd1cmktdGVtcGxhdGUnOlxyXG4gICAgICBjYXNlICd1cmwnOlxyXG4gICAgICAgIHJldHVybiAnRG9pdCDDqnRyZSB1bmUgVVJMLCB0ZWwgcXVlIFwiaHR0cDovL3d3dy5leGFtcGxlLmNvbS9wYWdlLmh0bWxcIic7XHJcbiAgICAgIGNhc2UgJ3V1aWQnOlxyXG4gICAgICAgIHJldHVybiAnRG9pdCDDqnRyZSB1biBVVUlELCB0ZWwgcXVlIFwiMTIzNDU2NzgtOUFCQy1ERUYwLTEyMzQtNTY3ODlBQkNERUYwXCInO1xyXG4gICAgICBjYXNlICdjb2xvcic6XHJcbiAgICAgICAgcmV0dXJuICdEb2l0IMOqdHJlIHVuZSBjb3VsZXVyLCB0ZWwgcXVlIFwiI0ZGRkZGRlwiIG9yIFwicmdiKDI1NSwgMjU1LCAyNTUpXCInO1xyXG4gICAgICBjYXNlICdqc29uLXBvaW50ZXInOlxyXG4gICAgICAgIHJldHVybiAnRG9pdCDDqnRyZSB1biBKU09OIFBvaW50ZXIsIHRlbCBxdWUgXCIvcG9pbnRlci90by9zb21ldGhpbmdcIic7XHJcbiAgICAgIGNhc2UgJ3JlbGF0aXZlLWpzb24tcG9pbnRlcic6XHJcbiAgICAgICAgcmV0dXJuICdEb2l0IMOqdHJlIHVuIHJlbGF0aXZlIEpTT04gUG9pbnRlciwgdGVsIHF1ZSBcIjIvcG9pbnRlci90by9zb21ldGhpbmdcIic7XHJcbiAgICAgIGNhc2UgJ3JlZ2V4JzpcclxuICAgICAgICByZXR1cm4gJ0RvaXQgw6p0cmUgdW5lIGV4cHJlc3Npb24gcsOpZ3VsacOocmUsIHRlbCBxdWUgXCIoMS0pP1xcXFxkezN9LVxcXFxkezN9LVxcXFxkezR9XCInO1xyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIHJldHVybiAnRG9pdCDDqnRyZSBhdm9pciBsZSBmb3JtYXQgY29ycmVjdDogJyArIGVycm9yLnJlcXVpcmVkRm9ybWF0O1xyXG4gICAgfVxyXG4gIH0sXHJcbiAgbWluaW11bTogJ0RvaXQgw6p0cmUgc3Vww6lyaWV1ciDDoCB7e21pbmltdW1WYWx1ZX19JyxcclxuICBleGNsdXNpdmVNaW5pbXVtOiAnRG9pdCBhdm9pciBtaW5pbXVtIHt7ZXhjbHVzaXZlTWluaW11bVZhbHVlfX0gY2hhcmFjdMOocmVzJyxcclxuICBtYXhpbXVtOiAnRG9pdCDDqnRyZSBpbmbDqXJpZXVyIMOgIHt7bWF4aW11bVZhbHVlfX0nLFxyXG4gIGV4Y2x1c2l2ZU1heGltdW06ICdEb2l0IGF2b2lyIG1heGltdW0ge3tleGNsdXNpdmVNYXhpbXVtVmFsdWV9fSBjaGFyYWN0w6hyZXMnLFxyXG4gIG11bHRpcGxlT2Y6IGZ1bmN0aW9uIChlcnJvcikge1xyXG4gICAgaWYgKCgxIC8gZXJyb3IubXVsdGlwbGVPZlZhbHVlKSAlIDEwID09PSAwKSB7XHJcbiAgICAgIGNvbnN0IGRlY2ltYWxzID0gTWF0aC5sb2cxMCgxIC8gZXJyb3IubXVsdGlwbGVPZlZhbHVlKTtcclxuICAgICAgcmV0dXJuIGBEb2l0IGNvbXBvcnRlciAke2RlY2ltYWxzfSBvdSBtb2lucyBkZSBkZWNpbWFsZXMuYDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBgRG9pdCDDqnRyZSB1biBtdWx0aXBsZSBkZSAke2Vycm9yLm11bHRpcGxlT2ZWYWx1ZX0uYDtcclxuICAgIH1cclxuICB9LFxyXG4gIG1pblByb3BlcnRpZXM6ICdEb2l0IGNvbXBvcnRlciBhdSBtaW5pbXVtIHt7bWluaW11bVByb3BlcnRpZXN9fSDDqWzDqW1lbnRzJyxcclxuICBtYXhQcm9wZXJ0aWVzOiAnRG9pdCBjb21wb3J0ZXIgYXUgbWF4aW11bSB7e21heGltdW1Qcm9wZXJ0aWVzfX0gw6lsw6ltZW50cycsXHJcbiAgbWluSXRlbXM6ICdEb2l0IGNvbXBvcnRlciBhdSBtaW5pbXVtIHt7bWluaW11bUl0ZW1zfX0gw6lsw6ltZW50cycsXHJcbiAgbWF4SXRlbXM6ICdEb2l0IGNvbXBvcnRlciBhdSBtYXhpbXVtIHt7bWluaW11bUl0ZW1zfX0gw6lsw6ltZW50cycsXHJcbiAgdW5pcXVlSXRlbXM6ICdUb3VzIGxlcyDDqWzDqW1lbnRzIGRvaXZlbnQgw6p0cmUgdW5pcXVlcycsXHJcbiAgLy8gTm90ZTogTm8gZGVmYXVsdCBlcnJvciBtZXNzYWdlcyBmb3IgJ3R5cGUnLCAnY29uc3QnLCAnZW51bScsIG9yICdkZXBlbmRlbmNpZXMnXHJcbn07XHJcbiJdfQ==