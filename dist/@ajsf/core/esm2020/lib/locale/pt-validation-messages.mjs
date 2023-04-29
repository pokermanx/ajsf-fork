export const ptValidationMessages = {
    required: 'Este campo é obrigatório.',
    minLength: 'É preciso no mínimo {{minimumLength}} caracteres ou mais (tamanho atual: {{currentLength}})',
    maxLength: 'É preciso no máximo  {{maximumLength}} caracteres ou menos (tamanho atual: {{currentLength}})',
    pattern: 'Tem que ajustar ao formato: {{requiredPattern}}',
    format: function (error) {
        switch (error.requiredFormat) {
            case 'date':
                return 'Tem que ser uma data, por exemplo "2000-12-31"';
            case 'time':
                return 'Tem que ser horário, por exemplo "16:20" ou "03:14:15.9265"';
            case 'date-time':
                return 'Tem que ser data e hora, por exemplo "2000-03-14T01:59" ou "2000-03-14T01:59:26.535Z"';
            case 'email':
                return 'Tem que ser um email, por exemplo "fulano@exemplo.com.br"';
            case 'hostname':
                return 'Tem que ser uma nome de domínio, por exemplo "exemplo.com.br"';
            case 'ipv4':
                return 'Tem que ser um endereço IPv4, por exemplo "127.0.0.1"';
            case 'ipv6':
                return 'Tem que ser um endereço IPv6, por exemplo "1234:5678:9ABC:DEF0:1234:5678:9ABC:DEF0"';
            // TODO: add examples for 'uri', 'uri-reference', and 'uri-template'
            // case 'uri': case 'uri-reference': case 'uri-template':
            case 'url':
                return 'Tem que ser uma URL, por exemplo "http://www.exemplo.com.br/pagina.html"';
            case 'uuid':
                return 'Tem que ser um uuid, por exemplo "12345678-9ABC-DEF0-1234-56789ABCDEF0"';
            case 'color':
                return 'Tem que ser uma cor, por exemplo "#FFFFFF" ou "rgb(255, 255, 255)"';
            case 'json-pointer':
                return 'Tem que ser um JSON Pointer, por exemplo "/referencia/para/algo"';
            case 'relative-json-pointer':
                return 'Tem que ser um JSON Pointer relativo, por exemplo "2/referencia/para/algo"';
            case 'regex':
                return 'Tem que ser uma expressão regular, por exemplo "(1-)?\\d{3}-\\d{3}-\\d{4}"';
            default:
                return 'Tem que ser no formato: ' + error.requiredFormat;
        }
    },
    minimum: 'Tem que ser {{minimumValue}} ou mais',
    exclusiveMinimum: 'Tem que ser mais que {{exclusiveMinimumValue}}',
    maximum: 'Tem que ser {{maximumValue}} ou menos',
    exclusiveMaximum: 'Tem que ser menor que {{exclusiveMaximumValue}}',
    multipleOf: function (error) {
        if ((1 / error.multipleOfValue) % 10 === 0) {
            const decimals = Math.log10(1 / error.multipleOfValue);
            return `Tem que ter ${decimals} ou menos casas decimais.`;
        }
        else {
            return `Tem que ser um múltiplo de ${error.multipleOfValue}.`;
        }
    },
    minProperties: 'Deve ter {{minimumProperties}} ou mais itens (itens até o momento: {{currentProperties}})',
    maxProperties: 'Deve ter {{maximumProperties}} ou menos intens (itens até o momento: {{currentProperties}})',
    minItems: 'Deve ter {{minimumItems}} ou mais itens (itens até o momento: {{currentItems}})',
    maxItems: 'Deve ter {{maximumItems}} ou menos itens (itens até o momento: {{currentItems}})',
    uniqueItems: 'Todos os itens devem ser únicos',
    // Note: No default error messages for 'type', 'const', 'enum', or 'dependencies'
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHQtdmFsaWRhdGlvbi1tZXNzYWdlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2Fqc2YtY29yZS9zcmMvbGliL2xvY2FsZS9wdC12YWxpZGF0aW9uLW1lc3NhZ2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sQ0FBQyxNQUFNLG9CQUFvQixHQUFRO0lBQ3ZDLFFBQVEsRUFBRSwyQkFBMkI7SUFDckMsU0FBUyxFQUFFLDZGQUE2RjtJQUN4RyxTQUFTLEVBQUUsK0ZBQStGO0lBQzFHLE9BQU8sRUFBRSxpREFBaUQ7SUFDMUQsTUFBTSxFQUFFLFVBQVUsS0FBSztRQUNyQixRQUFRLEtBQUssQ0FBQyxjQUFjLEVBQUU7WUFDNUIsS0FBSyxNQUFNO2dCQUNULE9BQU8sZ0RBQWdELENBQUM7WUFDMUQsS0FBSyxNQUFNO2dCQUNULE9BQU8sNkRBQTZELENBQUM7WUFDdkUsS0FBSyxXQUFXO2dCQUNkLE9BQU8sdUZBQXVGLENBQUM7WUFDakcsS0FBSyxPQUFPO2dCQUNWLE9BQU8sMkRBQTJELENBQUM7WUFDckUsS0FBSyxVQUFVO2dCQUNiLE9BQU8sK0RBQStELENBQUM7WUFDekUsS0FBSyxNQUFNO2dCQUNULE9BQU8sdURBQXVELENBQUM7WUFDakUsS0FBSyxNQUFNO2dCQUNULE9BQU8scUZBQXFGLENBQUM7WUFDL0Ysb0VBQW9FO1lBQ3BFLHlEQUF5RDtZQUN6RCxLQUFLLEtBQUs7Z0JBQ1IsT0FBTywwRUFBMEUsQ0FBQztZQUNwRixLQUFLLE1BQU07Z0JBQ1QsT0FBTyx5RUFBeUUsQ0FBQztZQUNuRixLQUFLLE9BQU87Z0JBQ1YsT0FBTyxvRUFBb0UsQ0FBQztZQUM5RSxLQUFLLGNBQWM7Z0JBQ2pCLE9BQU8sa0VBQWtFLENBQUM7WUFDNUUsS0FBSyx1QkFBdUI7Z0JBQzFCLE9BQU8sNEVBQTRFLENBQUM7WUFDdEYsS0FBSyxPQUFPO2dCQUNWLE9BQU8sNEVBQTRFLENBQUM7WUFDdEY7Z0JBQ0UsT0FBTywwQkFBMEIsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDO1NBQzVEO0lBQ0gsQ0FBQztJQUNELE9BQU8sRUFBRSxzQ0FBc0M7SUFDL0MsZ0JBQWdCLEVBQUUsZ0RBQWdEO0lBQ2xFLE9BQU8sRUFBRSx1Q0FBdUM7SUFDaEQsZ0JBQWdCLEVBQUUsaURBQWlEO0lBQ25FLFVBQVUsRUFBRSxVQUFVLEtBQUs7UUFDekIsSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsRUFBRTtZQUMxQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDdkQsT0FBTyxlQUFlLFFBQVEsMkJBQTJCLENBQUM7U0FDM0Q7YUFBTTtZQUNMLE9BQU8sOEJBQThCLEtBQUssQ0FBQyxlQUFlLEdBQUcsQ0FBQztTQUMvRDtJQUNILENBQUM7SUFDRCxhQUFhLEVBQUUsMkZBQTJGO0lBQzFHLGFBQWEsRUFBRSw2RkFBNkY7SUFDNUcsUUFBUSxFQUFFLGlGQUFpRjtJQUMzRixRQUFRLEVBQUUsa0ZBQWtGO0lBQzVGLFdBQVcsRUFBRSxpQ0FBaUM7SUFDOUMsaUZBQWlGO0NBQ2xGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgcHRWYWxpZGF0aW9uTWVzc2FnZXM6IGFueSA9IHsgLy8gQnJhemlsaWFuIFBvcnR1Z3Vlc2UgZXJyb3IgbWVzc2FnZXNcclxuICByZXF1aXJlZDogJ0VzdGUgY2FtcG8gw6kgb2JyaWdhdMOzcmlvLicsXHJcbiAgbWluTGVuZ3RoOiAnw4kgcHJlY2lzbyBubyBtw61uaW1vIHt7bWluaW11bUxlbmd0aH19IGNhcmFjdGVyZXMgb3UgbWFpcyAodGFtYW5obyBhdHVhbDoge3tjdXJyZW50TGVuZ3RofX0pJyxcclxuICBtYXhMZW5ndGg6ICfDiSBwcmVjaXNvIG5vIG3DoXhpbW8gIHt7bWF4aW11bUxlbmd0aH19IGNhcmFjdGVyZXMgb3UgbWVub3MgKHRhbWFuaG8gYXR1YWw6IHt7Y3VycmVudExlbmd0aH19KScsXHJcbiAgcGF0dGVybjogJ1RlbSBxdWUgYWp1c3RhciBhbyBmb3JtYXRvOiB7e3JlcXVpcmVkUGF0dGVybn19JyxcclxuICBmb3JtYXQ6IGZ1bmN0aW9uIChlcnJvcikge1xyXG4gICAgc3dpdGNoIChlcnJvci5yZXF1aXJlZEZvcm1hdCkge1xyXG4gICAgICBjYXNlICdkYXRlJzpcclxuICAgICAgICByZXR1cm4gJ1RlbSBxdWUgc2VyIHVtYSBkYXRhLCBwb3IgZXhlbXBsbyBcIjIwMDAtMTItMzFcIic7XHJcbiAgICAgIGNhc2UgJ3RpbWUnOlxyXG4gICAgICAgIHJldHVybiAnVGVtIHF1ZSBzZXIgaG9yw6FyaW8sIHBvciBleGVtcGxvIFwiMTY6MjBcIiBvdSBcIjAzOjE0OjE1LjkyNjVcIic7XHJcbiAgICAgIGNhc2UgJ2RhdGUtdGltZSc6XHJcbiAgICAgICAgcmV0dXJuICdUZW0gcXVlIHNlciBkYXRhIGUgaG9yYSwgcG9yIGV4ZW1wbG8gXCIyMDAwLTAzLTE0VDAxOjU5XCIgb3UgXCIyMDAwLTAzLTE0VDAxOjU5OjI2LjUzNVpcIic7XHJcbiAgICAgIGNhc2UgJ2VtYWlsJzpcclxuICAgICAgICByZXR1cm4gJ1RlbSBxdWUgc2VyIHVtIGVtYWlsLCBwb3IgZXhlbXBsbyBcImZ1bGFub0BleGVtcGxvLmNvbS5iclwiJztcclxuICAgICAgY2FzZSAnaG9zdG5hbWUnOlxyXG4gICAgICAgIHJldHVybiAnVGVtIHF1ZSBzZXIgdW1hIG5vbWUgZGUgZG9tw61uaW8sIHBvciBleGVtcGxvIFwiZXhlbXBsby5jb20uYnJcIic7XHJcbiAgICAgIGNhc2UgJ2lwdjQnOlxyXG4gICAgICAgIHJldHVybiAnVGVtIHF1ZSBzZXIgdW0gZW5kZXJlw6dvIElQdjQsIHBvciBleGVtcGxvIFwiMTI3LjAuMC4xXCInO1xyXG4gICAgICBjYXNlICdpcHY2JzpcclxuICAgICAgICByZXR1cm4gJ1RlbSBxdWUgc2VyIHVtIGVuZGVyZcOnbyBJUHY2LCBwb3IgZXhlbXBsbyBcIjEyMzQ6NTY3ODo5QUJDOkRFRjA6MTIzNDo1Njc4OjlBQkM6REVGMFwiJztcclxuICAgICAgLy8gVE9ETzogYWRkIGV4YW1wbGVzIGZvciAndXJpJywgJ3VyaS1yZWZlcmVuY2UnLCBhbmQgJ3VyaS10ZW1wbGF0ZSdcclxuICAgICAgLy8gY2FzZSAndXJpJzogY2FzZSAndXJpLXJlZmVyZW5jZSc6IGNhc2UgJ3VyaS10ZW1wbGF0ZSc6XHJcbiAgICAgIGNhc2UgJ3VybCc6XHJcbiAgICAgICAgcmV0dXJuICdUZW0gcXVlIHNlciB1bWEgVVJMLCBwb3IgZXhlbXBsbyBcImh0dHA6Ly93d3cuZXhlbXBsby5jb20uYnIvcGFnaW5hLmh0bWxcIic7XHJcbiAgICAgIGNhc2UgJ3V1aWQnOlxyXG4gICAgICAgIHJldHVybiAnVGVtIHF1ZSBzZXIgdW0gdXVpZCwgcG9yIGV4ZW1wbG8gXCIxMjM0NTY3OC05QUJDLURFRjAtMTIzNC01Njc4OUFCQ0RFRjBcIic7XHJcbiAgICAgIGNhc2UgJ2NvbG9yJzpcclxuICAgICAgICByZXR1cm4gJ1RlbSBxdWUgc2VyIHVtYSBjb3IsIHBvciBleGVtcGxvIFwiI0ZGRkZGRlwiIG91IFwicmdiKDI1NSwgMjU1LCAyNTUpXCInO1xyXG4gICAgICBjYXNlICdqc29uLXBvaW50ZXInOlxyXG4gICAgICAgIHJldHVybiAnVGVtIHF1ZSBzZXIgdW0gSlNPTiBQb2ludGVyLCBwb3IgZXhlbXBsbyBcIi9yZWZlcmVuY2lhL3BhcmEvYWxnb1wiJztcclxuICAgICAgY2FzZSAncmVsYXRpdmUtanNvbi1wb2ludGVyJzpcclxuICAgICAgICByZXR1cm4gJ1RlbSBxdWUgc2VyIHVtIEpTT04gUG9pbnRlciByZWxhdGl2bywgcG9yIGV4ZW1wbG8gXCIyL3JlZmVyZW5jaWEvcGFyYS9hbGdvXCInO1xyXG4gICAgICBjYXNlICdyZWdleCc6XHJcbiAgICAgICAgcmV0dXJuICdUZW0gcXVlIHNlciB1bWEgZXhwcmVzc8OjbyByZWd1bGFyLCBwb3IgZXhlbXBsbyBcIigxLSk/XFxcXGR7M30tXFxcXGR7M30tXFxcXGR7NH1cIic7XHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgcmV0dXJuICdUZW0gcXVlIHNlciBubyBmb3JtYXRvOiAnICsgZXJyb3IucmVxdWlyZWRGb3JtYXQ7XHJcbiAgICB9XHJcbiAgfSxcclxuICBtaW5pbXVtOiAnVGVtIHF1ZSBzZXIge3ttaW5pbXVtVmFsdWV9fSBvdSBtYWlzJyxcclxuICBleGNsdXNpdmVNaW5pbXVtOiAnVGVtIHF1ZSBzZXIgbWFpcyBxdWUge3tleGNsdXNpdmVNaW5pbXVtVmFsdWV9fScsXHJcbiAgbWF4aW11bTogJ1RlbSBxdWUgc2VyIHt7bWF4aW11bVZhbHVlfX0gb3UgbWVub3MnLFxyXG4gIGV4Y2x1c2l2ZU1heGltdW06ICdUZW0gcXVlIHNlciBtZW5vciBxdWUge3tleGNsdXNpdmVNYXhpbXVtVmFsdWV9fScsXHJcbiAgbXVsdGlwbGVPZjogZnVuY3Rpb24gKGVycm9yKSB7XHJcbiAgICBpZiAoKDEgLyBlcnJvci5tdWx0aXBsZU9mVmFsdWUpICUgMTAgPT09IDApIHtcclxuICAgICAgY29uc3QgZGVjaW1hbHMgPSBNYXRoLmxvZzEwKDEgLyBlcnJvci5tdWx0aXBsZU9mVmFsdWUpO1xyXG4gICAgICByZXR1cm4gYFRlbSBxdWUgdGVyICR7ZGVjaW1hbHN9IG91IG1lbm9zIGNhc2FzIGRlY2ltYWlzLmA7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gYFRlbSBxdWUgc2VyIHVtIG3Dumx0aXBsbyBkZSAke2Vycm9yLm11bHRpcGxlT2ZWYWx1ZX0uYDtcclxuICAgIH1cclxuICB9LFxyXG4gIG1pblByb3BlcnRpZXM6ICdEZXZlIHRlciB7e21pbmltdW1Qcm9wZXJ0aWVzfX0gb3UgbWFpcyBpdGVucyAoaXRlbnMgYXTDqSBvIG1vbWVudG86IHt7Y3VycmVudFByb3BlcnRpZXN9fSknLFxyXG4gIG1heFByb3BlcnRpZXM6ICdEZXZlIHRlciB7e21heGltdW1Qcm9wZXJ0aWVzfX0gb3UgbWVub3MgaW50ZW5zIChpdGVucyBhdMOpIG8gbW9tZW50bzoge3tjdXJyZW50UHJvcGVydGllc319KScsXHJcbiAgbWluSXRlbXM6ICdEZXZlIHRlciB7e21pbmltdW1JdGVtc319IG91IG1haXMgaXRlbnMgKGl0ZW5zIGF0w6kgbyBtb21lbnRvOiB7e2N1cnJlbnRJdGVtc319KScsXHJcbiAgbWF4SXRlbXM6ICdEZXZlIHRlciB7e21heGltdW1JdGVtc319IG91IG1lbm9zIGl0ZW5zIChpdGVucyBhdMOpIG8gbW9tZW50bzoge3tjdXJyZW50SXRlbXN9fSknLFxyXG4gIHVuaXF1ZUl0ZW1zOiAnVG9kb3Mgb3MgaXRlbnMgZGV2ZW0gc2VyIMO6bmljb3MnLFxyXG4gIC8vIE5vdGU6IE5vIGRlZmF1bHQgZXJyb3IgbWVzc2FnZXMgZm9yICd0eXBlJywgJ2NvbnN0JywgJ2VudW0nLCBvciAnZGVwZW5kZW5jaWVzJ1xyXG59O1xyXG4iXX0=