export const esValidationMessages = {
    required: 'Este campo está requerido.',
    minLength: 'Debe tener {{minimumLength}} caracteres o más longitud (longitud actual: {{currentLength}})',
    maxLength: 'Debe tener {{maximumLength}} caracteres o menos longitud (longitud actual: {{currentLength}})',
    pattern: 'Must match pattern: {{requiredPattern}}',
    format: function (error) {
        switch (error.requiredFormat) {
            case 'date':
                return 'Debe tener una fecha, ej "2000-12-31"';
            case 'time':
                return 'Debe tener una hora, ej "16:20" o "03:14:15.9265"';
            case 'date-time':
                return 'Debe tener fecha y hora, ej "2000-03-14T01:59" o "2000-03-14T01:59:26.535Z"';
            case 'email':
                return 'No hay dirección de correo electrónico válida, ej "name@example.com"';
            case 'hostname':
                return 'Debe ser un nombre de host válido, ej "example.com"';
            case 'ipv4':
                return 'Debe ser una dirección de IPv4, ej "127.0.0.1"';
            case 'ipv6':
                return 'Debe ser una dirección de IPv6, ej "1234:5678:9ABC:DEF0:1234:5678:9ABC:DEF0"';
            case 'url':
                return 'Debe ser una URL, ej "http://www.example.com/page.html"';
            case 'uuid':
                return 'Debe ser un UUID, ej "12345678-9ABC-DEF0-1234-56789ABCDEF0"';
            case 'color':
                return 'Debe ser un color, ej "#FFFFFF" or "rgb(255, 255, 255)"';
            case 'json-pointer':
                return 'Debe ser un JSON Pointer, ej "/pointer/to/something"';
            case 'relative-json-pointer':
                return 'Debe ser un JSON Pointer relativo, ej "2/pointer/to/something"';
            case 'regex':
                return 'Debe ser una expresión regular, ej "(1-)?\\d{3}-\\d{3}-\\d{4}"';
            default:
                return 'Debe tener el formato correcto ' + error.requiredFormat;
        }
    },
    minimum: 'Debe ser {{minimumValue}} o más',
    exclusiveMinimum: 'Debe ser superior a {{exclusiveMinimumValue}}',
    maximum: 'Debe ser {{maximumValue}} o menos',
    exclusiveMaximum: 'Debe ser menor que {{exclusiveMaximumValue}}',
    multipleOf: function (error) {
        if ((1 / error.multipleOfValue) % 10 === 0) {
            const decimals = Math.log10(1 / error.multipleOfValue);
            return `Se permite un máximo de ${decimals} decimales`;
        }
        else {
            return `Debe ser múltiplo de ${error.multipleOfValue}.`;
        }
    },
    minProperties: 'Debe tener {{minimumProperties}} o más elementos (elementos actuales: {{currentProperties}})',
    maxProperties: 'Debe tener {{maximumProperties}} o menos elementos (elementos actuales: {{currentProperties}})',
    minItems: 'Debe tener {{minimumItems}} o más elementos (elementos actuales: {{currentItems}})',
    maxItems: 'Debe tener {{maximumItems}} o menos elementos (elementos actuales: {{currentItems}})',
    uniqueItems: 'Todos los elementos deben ser únicos',
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXMtdmFsaWRhdGlvbi1tZXNzYWdlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2Fqc2YtY29yZS9zcmMvbGliL2xvY2FsZS9lcy12YWxpZGF0aW9uLW1lc3NhZ2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sQ0FBQyxNQUFNLG9CQUFvQixHQUFRO0lBQ3ZDLFFBQVEsRUFBRSw0QkFBNEI7SUFDdEMsU0FBUyxFQUFFLDZGQUE2RjtJQUN4RyxTQUFTLEVBQUUsK0ZBQStGO0lBQzFHLE9BQU8sRUFBRSx5Q0FBeUM7SUFDbEQsTUFBTSxFQUFFLFVBQVUsS0FBSztRQUNyQixRQUFRLEtBQUssQ0FBQyxjQUFjLEVBQUU7WUFDNUIsS0FBSyxNQUFNO2dCQUNULE9BQU8sdUNBQXVDLENBQUM7WUFDakQsS0FBSyxNQUFNO2dCQUNULE9BQU8sbURBQW1ELENBQUM7WUFDN0QsS0FBSyxXQUFXO2dCQUNkLE9BQU8sNkVBQTZFLENBQUM7WUFDdkYsS0FBSyxPQUFPO2dCQUNWLE9BQU8sc0VBQXNFLENBQUM7WUFDaEYsS0FBSyxVQUFVO2dCQUNiLE9BQU8scURBQXFELENBQUM7WUFDL0QsS0FBSyxNQUFNO2dCQUNULE9BQU8sZ0RBQWdELENBQUM7WUFDMUQsS0FBSyxNQUFNO2dCQUNULE9BQU8sOEVBQThFLENBQUM7WUFDeEYsS0FBSyxLQUFLO2dCQUNSLE9BQU8seURBQXlELENBQUM7WUFDbkUsS0FBSyxNQUFNO2dCQUNULE9BQU8sNkRBQTZELENBQUM7WUFDdkUsS0FBSyxPQUFPO2dCQUNWLE9BQU8seURBQXlELENBQUM7WUFDbkUsS0FBSyxjQUFjO2dCQUNqQixPQUFPLHNEQUFzRCxDQUFDO1lBQ2hFLEtBQUssdUJBQXVCO2dCQUMxQixPQUFPLGdFQUFnRSxDQUFDO1lBQzFFLEtBQUssT0FBTztnQkFDVixPQUFPLGdFQUFnRSxDQUFDO1lBQzFFO2dCQUNFLE9BQU8saUNBQWlDLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQztTQUNuRTtJQUNILENBQUM7SUFDRCxPQUFPLEVBQUUsaUNBQWlDO0lBQzFDLGdCQUFnQixFQUFFLCtDQUErQztJQUNqRSxPQUFPLEVBQUUsbUNBQW1DO0lBQzVDLGdCQUFnQixFQUFFLDhDQUE4QztJQUNoRSxVQUFVLEVBQUUsVUFBVSxLQUFLO1FBQ3pCLElBQUksQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLEVBQUU7WUFDMUMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQ3ZELE9BQU8sMkJBQTJCLFFBQVEsWUFBWSxDQUFDO1NBQ3hEO2FBQU07WUFDTCxPQUFPLHdCQUF3QixLQUFLLENBQUMsZUFBZSxHQUFHLENBQUM7U0FDekQ7SUFDSCxDQUFDO0lBQ0QsYUFBYSxFQUFFLDhGQUE4RjtJQUM3RyxhQUFhLEVBQUUsZ0dBQWdHO0lBQy9HLFFBQVEsRUFBRSxvRkFBb0Y7SUFDOUYsUUFBUSxFQUFFLHNGQUFzRjtJQUNoRyxXQUFXLEVBQUUsc0NBQXNDO0NBQ3BELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgZXNWYWxpZGF0aW9uTWVzc2FnZXM6IGFueSA9IHsgLy8gRGVmYXVsdCBTcGFuaXNoIGVycm9yIG1lc3NhZ2VzXHJcbiAgcmVxdWlyZWQ6ICdFc3RlIGNhbXBvIGVzdMOhIHJlcXVlcmlkby4nLFxyXG4gIG1pbkxlbmd0aDogJ0RlYmUgdGVuZXIge3ttaW5pbXVtTGVuZ3RofX0gY2FyYWN0ZXJlcyBvIG3DoXMgbG9uZ2l0dWQgKGxvbmdpdHVkIGFjdHVhbDoge3tjdXJyZW50TGVuZ3RofX0pJyxcclxuICBtYXhMZW5ndGg6ICdEZWJlIHRlbmVyIHt7bWF4aW11bUxlbmd0aH19IGNhcmFjdGVyZXMgbyBtZW5vcyBsb25naXR1ZCAobG9uZ2l0dWQgYWN0dWFsOiB7e2N1cnJlbnRMZW5ndGh9fSknLFxyXG4gIHBhdHRlcm46ICdNdXN0IG1hdGNoIHBhdHRlcm46IHt7cmVxdWlyZWRQYXR0ZXJufX0nLFxyXG4gIGZvcm1hdDogZnVuY3Rpb24gKGVycm9yKSB7XHJcbiAgICBzd2l0Y2ggKGVycm9yLnJlcXVpcmVkRm9ybWF0KSB7XHJcbiAgICAgIGNhc2UgJ2RhdGUnOlxyXG4gICAgICAgIHJldHVybiAnRGViZSB0ZW5lciB1bmEgZmVjaGEsIGVqIFwiMjAwMC0xMi0zMVwiJztcclxuICAgICAgY2FzZSAndGltZSc6XHJcbiAgICAgICAgcmV0dXJuICdEZWJlIHRlbmVyIHVuYSBob3JhLCBlaiBcIjE2OjIwXCIgbyBcIjAzOjE0OjE1LjkyNjVcIic7XHJcbiAgICAgIGNhc2UgJ2RhdGUtdGltZSc6XHJcbiAgICAgICAgcmV0dXJuICdEZWJlIHRlbmVyIGZlY2hhIHkgaG9yYSwgZWogXCIyMDAwLTAzLTE0VDAxOjU5XCIgbyBcIjIwMDAtMDMtMTRUMDE6NTk6MjYuNTM1WlwiJztcclxuICAgICAgY2FzZSAnZW1haWwnOlxyXG4gICAgICAgIHJldHVybiAnTm8gaGF5IGRpcmVjY2nDs24gZGUgY29ycmVvIGVsZWN0csOzbmljbyB2w6FsaWRhLCBlaiBcIm5hbWVAZXhhbXBsZS5jb21cIic7XHJcbiAgICAgIGNhc2UgJ2hvc3RuYW1lJzpcclxuICAgICAgICByZXR1cm4gJ0RlYmUgc2VyIHVuIG5vbWJyZSBkZSBob3N0IHbDoWxpZG8sIGVqIFwiZXhhbXBsZS5jb21cIic7XHJcbiAgICAgIGNhc2UgJ2lwdjQnOlxyXG4gICAgICAgIHJldHVybiAnRGViZSBzZXIgdW5hIGRpcmVjY2nDs24gZGUgSVB2NCwgZWogXCIxMjcuMC4wLjFcIic7XHJcbiAgICAgIGNhc2UgJ2lwdjYnOlxyXG4gICAgICAgIHJldHVybiAnRGViZSBzZXIgdW5hIGRpcmVjY2nDs24gZGUgSVB2NiwgZWogXCIxMjM0OjU2Nzg6OUFCQzpERUYwOjEyMzQ6NTY3ODo5QUJDOkRFRjBcIic7XHJcbiAgICAgIGNhc2UgJ3VybCc6XHJcbiAgICAgICAgcmV0dXJuICdEZWJlIHNlciB1bmEgVVJMLCBlaiBcImh0dHA6Ly93d3cuZXhhbXBsZS5jb20vcGFnZS5odG1sXCInO1xyXG4gICAgICBjYXNlICd1dWlkJzpcclxuICAgICAgICByZXR1cm4gJ0RlYmUgc2VyIHVuIFVVSUQsIGVqIFwiMTIzNDU2NzgtOUFCQy1ERUYwLTEyMzQtNTY3ODlBQkNERUYwXCInO1xyXG4gICAgICBjYXNlICdjb2xvcic6XHJcbiAgICAgICAgcmV0dXJuICdEZWJlIHNlciB1biBjb2xvciwgZWogXCIjRkZGRkZGXCIgb3IgXCJyZ2IoMjU1LCAyNTUsIDI1NSlcIic7XHJcbiAgICAgIGNhc2UgJ2pzb24tcG9pbnRlcic6XHJcbiAgICAgICAgcmV0dXJuICdEZWJlIHNlciB1biBKU09OIFBvaW50ZXIsIGVqIFwiL3BvaW50ZXIvdG8vc29tZXRoaW5nXCInO1xyXG4gICAgICBjYXNlICdyZWxhdGl2ZS1qc29uLXBvaW50ZXInOlxyXG4gICAgICAgIHJldHVybiAnRGViZSBzZXIgdW4gSlNPTiBQb2ludGVyIHJlbGF0aXZvLCBlaiBcIjIvcG9pbnRlci90by9zb21ldGhpbmdcIic7XHJcbiAgICAgIGNhc2UgJ3JlZ2V4JzpcclxuICAgICAgICByZXR1cm4gJ0RlYmUgc2VyIHVuYSBleHByZXNpw7NuIHJlZ3VsYXIsIGVqIFwiKDEtKT9cXFxcZHszfS1cXFxcZHszfS1cXFxcZHs0fVwiJztcclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICByZXR1cm4gJ0RlYmUgdGVuZXIgZWwgZm9ybWF0byBjb3JyZWN0byAnICsgZXJyb3IucmVxdWlyZWRGb3JtYXQ7XHJcbiAgICB9XHJcbiAgfSxcclxuICBtaW5pbXVtOiAnRGViZSBzZXIge3ttaW5pbXVtVmFsdWV9fSBvIG3DoXMnLFxyXG4gIGV4Y2x1c2l2ZU1pbmltdW06ICdEZWJlIHNlciBzdXBlcmlvciBhIHt7ZXhjbHVzaXZlTWluaW11bVZhbHVlfX0nLFxyXG4gIG1heGltdW06ICdEZWJlIHNlciB7e21heGltdW1WYWx1ZX19IG8gbWVub3MnLFxyXG4gIGV4Y2x1c2l2ZU1heGltdW06ICdEZWJlIHNlciBtZW5vciBxdWUge3tleGNsdXNpdmVNYXhpbXVtVmFsdWV9fScsXHJcbiAgbXVsdGlwbGVPZjogZnVuY3Rpb24gKGVycm9yKSB7XHJcbiAgICBpZiAoKDEgLyBlcnJvci5tdWx0aXBsZU9mVmFsdWUpICUgMTAgPT09IDApIHtcclxuICAgICAgY29uc3QgZGVjaW1hbHMgPSBNYXRoLmxvZzEwKDEgLyBlcnJvci5tdWx0aXBsZU9mVmFsdWUpO1xyXG4gICAgICByZXR1cm4gYFNlIHBlcm1pdGUgdW4gbcOheGltbyBkZSAke2RlY2ltYWxzfSBkZWNpbWFsZXNgO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIGBEZWJlIHNlciBtw7psdGlwbG8gZGUgJHtlcnJvci5tdWx0aXBsZU9mVmFsdWV9LmA7XHJcbiAgICB9XHJcbiAgfSxcclxuICBtaW5Qcm9wZXJ0aWVzOiAnRGViZSB0ZW5lciB7e21pbmltdW1Qcm9wZXJ0aWVzfX0gbyBtw6FzIGVsZW1lbnRvcyAoZWxlbWVudG9zIGFjdHVhbGVzOiB7e2N1cnJlbnRQcm9wZXJ0aWVzfX0pJyxcclxuICBtYXhQcm9wZXJ0aWVzOiAnRGViZSB0ZW5lciB7e21heGltdW1Qcm9wZXJ0aWVzfX0gbyBtZW5vcyBlbGVtZW50b3MgKGVsZW1lbnRvcyBhY3R1YWxlczoge3tjdXJyZW50UHJvcGVydGllc319KScsXHJcbiAgbWluSXRlbXM6ICdEZWJlIHRlbmVyIHt7bWluaW11bUl0ZW1zfX0gbyBtw6FzIGVsZW1lbnRvcyAoZWxlbWVudG9zIGFjdHVhbGVzOiB7e2N1cnJlbnRJdGVtc319KScsXHJcbiAgbWF4SXRlbXM6ICdEZWJlIHRlbmVyIHt7bWF4aW11bUl0ZW1zfX0gbyBtZW5vcyBlbGVtZW50b3MgKGVsZW1lbnRvcyBhY3R1YWxlczoge3tjdXJyZW50SXRlbXN9fSknLFxyXG4gIHVuaXF1ZUl0ZW1zOiAnVG9kb3MgbG9zIGVsZW1lbnRvcyBkZWJlbiBzZXIgw7puaWNvcycsXHJcbn07XHJcbiJdfQ==