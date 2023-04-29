export const deValidationMessages = {
    required: 'Darf nicht leer sein',
    minLength: 'Mindestens {{minimumLength}} Zeichen benötigt (aktuell: {{currentLength}})',
    maxLength: 'Maximal {{maximumLength}} Zeichen erlaubt (aktuell: {{currentLength}})',
    pattern: 'Entspricht nicht diesem regulären Ausdruck: {{requiredPattern}}',
    format: function (error) {
        switch (error.requiredFormat) {
            case 'date':
                return 'Muss ein Datum sein, z. B. "2000-12-31"';
            case 'time':
                return 'Muss eine Zeitangabe sein, z. B. "16:20" oder "03:14:15.9265"';
            case 'date-time':
                return 'Muss Datum mit Zeit beinhalten, z. B. "2000-03-14T01:59" oder "2000-03-14T01:59:26.535Z"';
            case 'email':
                return 'Keine gültige E-Mail-Adresse (z. B. "name@example.com")';
            case 'hostname':
                return 'Kein gültiger Hostname (z. B. "example.com")';
            case 'ipv4':
                return 'Keine gültige IPv4-Adresse (z. B. "127.0.0.1")';
            case 'ipv6':
                return 'Keine gültige IPv6-Adresse (z. B. "1234:5678:9ABC:DEF0:1234:5678:9ABC:DEF0")';
            // TODO: add examples for 'uri', 'uri-reference', and 'uri-template'
            // case 'uri': case 'uri-reference': case 'uri-template':
            case 'url':
                return 'Keine gültige URL (z. B. "http://www.example.com/page.html")';
            case 'uuid':
                return 'Keine gültige UUID (z. B. "12345678-9ABC-DEF0-1234-56789ABCDEF0")';
            case 'color':
                return 'Kein gültiger Farbwert (z. B. "#FFFFFF" oder "rgb(255, 255, 255)")';
            case 'json-pointer':
                return 'Kein gültiger JSON-Pointer (z. B. "/pointer/to/something")';
            case 'relative-json-pointer':
                return 'Kein gültiger relativer JSON-Pointer (z. B. "2/pointer/to/something")';
            case 'regex':
                return 'Kein gültiger regulärer Ausdruck (z. B. "(1-)?\\d{3}-\\d{3}-\\d{4}")';
            default:
                return 'Muss diesem Format entsprechen: ' + error.requiredFormat;
        }
    },
    minimum: 'Muss mindestens {{minimumValue}} sein',
    exclusiveMinimum: 'Muss größer als {{exclusiveMinimumValue}} sein',
    maximum: 'Darf maximal {{maximumValue}} sein',
    exclusiveMaximum: 'Muss kleiner als {{exclusiveMaximumValue}} sein',
    multipleOf: function (error) {
        if ((1 / error.multipleOfValue) % 10 === 0) {
            const decimals = Math.log10(1 / error.multipleOfValue);
            return `Maximal ${decimals} Dezimalstellen erlaubt`;
        }
        else {
            return `Muss ein Vielfaches von ${error.multipleOfValue} sein`;
        }
    },
    minProperties: 'Mindestens {{minimumProperties}} Attribute erforderlich (aktuell: {{currentProperties}})',
    maxProperties: 'Maximal {{maximumProperties}} Attribute erlaubt (aktuell: {{currentProperties}})',
    minItems: 'Mindestens {{minimumItems}} Werte erforderlich (aktuell: {{currentItems}})',
    maxItems: 'Maximal {{maximumItems}} Werte erlaubt (aktuell: {{currentItems}})',
    uniqueItems: 'Alle Werte müssen eindeutig sein',
    // Note: No default error messages for 'type', 'const', 'enum', or 'dependencies'
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGUtdmFsaWRhdGlvbi1tZXNzYWdlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2Fqc2YtY29yZS9zcmMvbGliL2xvY2FsZS9kZS12YWxpZGF0aW9uLW1lc3NhZ2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sQ0FBQyxNQUFNLG9CQUFvQixHQUFRO0lBQ3ZDLFFBQVEsRUFBRSxzQkFBc0I7SUFDaEMsU0FBUyxFQUFFLDRFQUE0RTtJQUN2RixTQUFTLEVBQUUsd0VBQXdFO0lBQ25GLE9BQU8sRUFBRSxpRUFBaUU7SUFDMUUsTUFBTSxFQUFFLFVBQVUsS0FBSztRQUNyQixRQUFRLEtBQUssQ0FBQyxjQUFjLEVBQUU7WUFDNUIsS0FBSyxNQUFNO2dCQUNULE9BQU8seUNBQXlDLENBQUM7WUFDbkQsS0FBSyxNQUFNO2dCQUNULE9BQU8sK0RBQStELENBQUM7WUFDekUsS0FBSyxXQUFXO2dCQUNkLE9BQU8sMEZBQTBGLENBQUM7WUFDcEcsS0FBSyxPQUFPO2dCQUNWLE9BQU8seURBQXlELENBQUM7WUFDbkUsS0FBSyxVQUFVO2dCQUNiLE9BQU8sOENBQThDLENBQUM7WUFDeEQsS0FBSyxNQUFNO2dCQUNULE9BQU8sZ0RBQWdELENBQUM7WUFDMUQsS0FBSyxNQUFNO2dCQUNULE9BQU8sOEVBQThFLENBQUM7WUFDeEYsb0VBQW9FO1lBQ3BFLHlEQUF5RDtZQUN6RCxLQUFLLEtBQUs7Z0JBQ1IsT0FBTyw4REFBOEQsQ0FBQztZQUN4RSxLQUFLLE1BQU07Z0JBQ1QsT0FBTyxtRUFBbUUsQ0FBQztZQUM3RSxLQUFLLE9BQU87Z0JBQ1YsT0FBTyxvRUFBb0UsQ0FBQztZQUM5RSxLQUFLLGNBQWM7Z0JBQ2pCLE9BQU8sNERBQTRELENBQUM7WUFDdEUsS0FBSyx1QkFBdUI7Z0JBQzFCLE9BQU8sdUVBQXVFLENBQUM7WUFDakYsS0FBSyxPQUFPO2dCQUNWLE9BQU8sc0VBQXNFLENBQUM7WUFDaEY7Z0JBQ0UsT0FBTyxrQ0FBa0MsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDO1NBQ3BFO0lBQ0gsQ0FBQztJQUNELE9BQU8sRUFBRSx1Q0FBdUM7SUFDaEQsZ0JBQWdCLEVBQUUsZ0RBQWdEO0lBQ2xFLE9BQU8sRUFBRSxvQ0FBb0M7SUFDN0MsZ0JBQWdCLEVBQUUsaURBQWlEO0lBQ25FLFVBQVUsRUFBRSxVQUFVLEtBQUs7UUFDekIsSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsRUFBRTtZQUMxQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDdkQsT0FBTyxXQUFXLFFBQVEseUJBQXlCLENBQUM7U0FDckQ7YUFBTTtZQUNMLE9BQU8sMkJBQTJCLEtBQUssQ0FBQyxlQUFlLE9BQU8sQ0FBQztTQUNoRTtJQUNILENBQUM7SUFDRCxhQUFhLEVBQUUsMEZBQTBGO0lBQ3pHLGFBQWEsRUFBRSxrRkFBa0Y7SUFDakcsUUFBUSxFQUFFLDRFQUE0RTtJQUN0RixRQUFRLEVBQUUsb0VBQW9FO0lBQzlFLFdBQVcsRUFBRSxrQ0FBa0M7SUFDL0MsaUZBQWlGO0NBQ2xGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgZGVWYWxpZGF0aW9uTWVzc2FnZXM6IGFueSA9IHsgLy8gRGVmYXVsdCBHZXJtYW4gZXJyb3IgbWVzc2FnZXNcclxuICByZXF1aXJlZDogJ0RhcmYgbmljaHQgbGVlciBzZWluJyxcclxuICBtaW5MZW5ndGg6ICdNaW5kZXN0ZW5zIHt7bWluaW11bUxlbmd0aH19IFplaWNoZW4gYmVuw7Z0aWd0IChha3R1ZWxsOiB7e2N1cnJlbnRMZW5ndGh9fSknLFxyXG4gIG1heExlbmd0aDogJ01heGltYWwge3ttYXhpbXVtTGVuZ3RofX0gWmVpY2hlbiBlcmxhdWJ0IChha3R1ZWxsOiB7e2N1cnJlbnRMZW5ndGh9fSknLFxyXG4gIHBhdHRlcm46ICdFbnRzcHJpY2h0IG5pY2h0IGRpZXNlbSByZWd1bMOkcmVuIEF1c2RydWNrOiB7e3JlcXVpcmVkUGF0dGVybn19JyxcclxuICBmb3JtYXQ6IGZ1bmN0aW9uIChlcnJvcikge1xyXG4gICAgc3dpdGNoIChlcnJvci5yZXF1aXJlZEZvcm1hdCkge1xyXG4gICAgICBjYXNlICdkYXRlJzpcclxuICAgICAgICByZXR1cm4gJ011c3MgZWluIERhdHVtIHNlaW4sIHouIEIuIFwiMjAwMC0xMi0zMVwiJztcclxuICAgICAgY2FzZSAndGltZSc6XHJcbiAgICAgICAgcmV0dXJuICdNdXNzIGVpbmUgWmVpdGFuZ2FiZSBzZWluLCB6LiBCLiBcIjE2OjIwXCIgb2RlciBcIjAzOjE0OjE1LjkyNjVcIic7XHJcbiAgICAgIGNhc2UgJ2RhdGUtdGltZSc6XHJcbiAgICAgICAgcmV0dXJuICdNdXNzIERhdHVtIG1pdCBaZWl0IGJlaW5oYWx0ZW4sIHouIEIuIFwiMjAwMC0wMy0xNFQwMTo1OVwiIG9kZXIgXCIyMDAwLTAzLTE0VDAxOjU5OjI2LjUzNVpcIic7XHJcbiAgICAgIGNhc2UgJ2VtYWlsJzpcclxuICAgICAgICByZXR1cm4gJ0tlaW5lIGfDvGx0aWdlIEUtTWFpbC1BZHJlc3NlICh6LiBCLiBcIm5hbWVAZXhhbXBsZS5jb21cIiknO1xyXG4gICAgICBjYXNlICdob3N0bmFtZSc6XHJcbiAgICAgICAgcmV0dXJuICdLZWluIGfDvGx0aWdlciBIb3N0bmFtZSAoei4gQi4gXCJleGFtcGxlLmNvbVwiKSc7XHJcbiAgICAgIGNhc2UgJ2lwdjQnOlxyXG4gICAgICAgIHJldHVybiAnS2VpbmUgZ8O8bHRpZ2UgSVB2NC1BZHJlc3NlICh6LiBCLiBcIjEyNy4wLjAuMVwiKSc7XHJcbiAgICAgIGNhc2UgJ2lwdjYnOlxyXG4gICAgICAgIHJldHVybiAnS2VpbmUgZ8O8bHRpZ2UgSVB2Ni1BZHJlc3NlICh6LiBCLiBcIjEyMzQ6NTY3ODo5QUJDOkRFRjA6MTIzNDo1Njc4OjlBQkM6REVGMFwiKSc7XHJcbiAgICAgIC8vIFRPRE86IGFkZCBleGFtcGxlcyBmb3IgJ3VyaScsICd1cmktcmVmZXJlbmNlJywgYW5kICd1cmktdGVtcGxhdGUnXHJcbiAgICAgIC8vIGNhc2UgJ3VyaSc6IGNhc2UgJ3VyaS1yZWZlcmVuY2UnOiBjYXNlICd1cmktdGVtcGxhdGUnOlxyXG4gICAgICBjYXNlICd1cmwnOlxyXG4gICAgICAgIHJldHVybiAnS2VpbmUgZ8O8bHRpZ2UgVVJMICh6LiBCLiBcImh0dHA6Ly93d3cuZXhhbXBsZS5jb20vcGFnZS5odG1sXCIpJztcclxuICAgICAgY2FzZSAndXVpZCc6XHJcbiAgICAgICAgcmV0dXJuICdLZWluZSBnw7xsdGlnZSBVVUlEICh6LiBCLiBcIjEyMzQ1Njc4LTlBQkMtREVGMC0xMjM0LTU2Nzg5QUJDREVGMFwiKSc7XHJcbiAgICAgIGNhc2UgJ2NvbG9yJzpcclxuICAgICAgICByZXR1cm4gJ0tlaW4gZ8O8bHRpZ2VyIEZhcmJ3ZXJ0ICh6LiBCLiBcIiNGRkZGRkZcIiBvZGVyIFwicmdiKDI1NSwgMjU1LCAyNTUpXCIpJztcclxuICAgICAgY2FzZSAnanNvbi1wb2ludGVyJzpcclxuICAgICAgICByZXR1cm4gJ0tlaW4gZ8O8bHRpZ2VyIEpTT04tUG9pbnRlciAoei4gQi4gXCIvcG9pbnRlci90by9zb21ldGhpbmdcIiknO1xyXG4gICAgICBjYXNlICdyZWxhdGl2ZS1qc29uLXBvaW50ZXInOlxyXG4gICAgICAgIHJldHVybiAnS2VpbiBnw7xsdGlnZXIgcmVsYXRpdmVyIEpTT04tUG9pbnRlciAoei4gQi4gXCIyL3BvaW50ZXIvdG8vc29tZXRoaW5nXCIpJztcclxuICAgICAgY2FzZSAncmVnZXgnOlxyXG4gICAgICAgIHJldHVybiAnS2VpbiBnw7xsdGlnZXIgcmVndWzDpHJlciBBdXNkcnVjayAoei4gQi4gXCIoMS0pP1xcXFxkezN9LVxcXFxkezN9LVxcXFxkezR9XCIpJztcclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICByZXR1cm4gJ011c3MgZGllc2VtIEZvcm1hdCBlbnRzcHJlY2hlbjogJyArIGVycm9yLnJlcXVpcmVkRm9ybWF0O1xyXG4gICAgfVxyXG4gIH0sXHJcbiAgbWluaW11bTogJ011c3MgbWluZGVzdGVucyB7e21pbmltdW1WYWx1ZX19IHNlaW4nLFxyXG4gIGV4Y2x1c2l2ZU1pbmltdW06ICdNdXNzIGdyw7bDn2VyIGFscyB7e2V4Y2x1c2l2ZU1pbmltdW1WYWx1ZX19IHNlaW4nLFxyXG4gIG1heGltdW06ICdEYXJmIG1heGltYWwge3ttYXhpbXVtVmFsdWV9fSBzZWluJyxcclxuICBleGNsdXNpdmVNYXhpbXVtOiAnTXVzcyBrbGVpbmVyIGFscyB7e2V4Y2x1c2l2ZU1heGltdW1WYWx1ZX19IHNlaW4nLFxyXG4gIG11bHRpcGxlT2Y6IGZ1bmN0aW9uIChlcnJvcikge1xyXG4gICAgaWYgKCgxIC8gZXJyb3IubXVsdGlwbGVPZlZhbHVlKSAlIDEwID09PSAwKSB7XHJcbiAgICAgIGNvbnN0IGRlY2ltYWxzID0gTWF0aC5sb2cxMCgxIC8gZXJyb3IubXVsdGlwbGVPZlZhbHVlKTtcclxuICAgICAgcmV0dXJuIGBNYXhpbWFsICR7ZGVjaW1hbHN9IERlemltYWxzdGVsbGVuIGVybGF1YnRgO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIGBNdXNzIGVpbiBWaWVsZmFjaGVzIHZvbiAke2Vycm9yLm11bHRpcGxlT2ZWYWx1ZX0gc2VpbmA7XHJcbiAgICB9XHJcbiAgfSxcclxuICBtaW5Qcm9wZXJ0aWVzOiAnTWluZGVzdGVucyB7e21pbmltdW1Qcm9wZXJ0aWVzfX0gQXR0cmlidXRlIGVyZm9yZGVybGljaCAoYWt0dWVsbDoge3tjdXJyZW50UHJvcGVydGllc319KScsXHJcbiAgbWF4UHJvcGVydGllczogJ01heGltYWwge3ttYXhpbXVtUHJvcGVydGllc319IEF0dHJpYnV0ZSBlcmxhdWJ0IChha3R1ZWxsOiB7e2N1cnJlbnRQcm9wZXJ0aWVzfX0pJyxcclxuICBtaW5JdGVtczogJ01pbmRlc3RlbnMge3ttaW5pbXVtSXRlbXN9fSBXZXJ0ZSBlcmZvcmRlcmxpY2ggKGFrdHVlbGw6IHt7Y3VycmVudEl0ZW1zfX0pJyxcclxuICBtYXhJdGVtczogJ01heGltYWwge3ttYXhpbXVtSXRlbXN9fSBXZXJ0ZSBlcmxhdWJ0IChha3R1ZWxsOiB7e2N1cnJlbnRJdGVtc319KScsXHJcbiAgdW5pcXVlSXRlbXM6ICdBbGxlIFdlcnRlIG3DvHNzZW4gZWluZGV1dGlnIHNlaW4nLFxyXG4gIC8vIE5vdGU6IE5vIGRlZmF1bHQgZXJyb3IgbWVzc2FnZXMgZm9yICd0eXBlJywgJ2NvbnN0JywgJ2VudW0nLCBvciAnZGVwZW5kZW5jaWVzJ1xyXG59O1xyXG4iXX0=