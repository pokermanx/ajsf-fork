export const enValidationMessages = {
    required: 'This field is required.',
    minLength: 'Must be {{minimumLength}} characters or longer (current length: {{currentLength}})',
    maxLength: 'Must be {{maximumLength}} characters or shorter (current length: {{currentLength}})',
    pattern: 'Must match pattern: {{requiredPattern}}',
    format: function (error) {
        switch (error.requiredFormat) {
            case 'date':
                return 'Must be a date, like "2000-12-31"';
            case 'time':
                return 'Must be a time, like "16:20" or "03:14:15.9265"';
            case 'date-time':
                return 'Must be a date-time, like "2000-03-14T01:59" or "2000-03-14T01:59:26.535Z"';
            case 'email':
                return 'Must be an email address, like "name@example.com"';
            case 'hostname':
                return 'Must be a hostname, like "example.com"';
            case 'ipv4':
                return 'Must be an IPv4 address, like "127.0.0.1"';
            case 'ipv6':
                return 'Must be an IPv6 address, like "1234:5678:9ABC:DEF0:1234:5678:9ABC:DEF0"';
            // TODO: add examples for 'uri', 'uri-reference', and 'uri-template'
            // case 'uri': case 'uri-reference': case 'uri-template':
            case 'url':
                return 'Must be a url, like "http://www.example.com/page.html"';
            case 'uuid':
                return 'Must be a uuid, like "12345678-9ABC-DEF0-1234-56789ABCDEF0"';
            case 'color':
                return 'Must be a color, like "#FFFFFF" or "rgb(255, 255, 255)"';
            case 'json-pointer':
                return 'Must be a JSON Pointer, like "/pointer/to/something"';
            case 'relative-json-pointer':
                return 'Must be a relative JSON Pointer, like "2/pointer/to/something"';
            case 'regex':
                return 'Must be a regular expression, like "(1-)?\\d{3}-\\d{3}-\\d{4}"';
            default:
                return 'Must be a correctly formatted ' + error.requiredFormat;
        }
    },
    minimum: 'Must be {{minimumValue}} or more',
    exclusiveMinimum: 'Must be more than {{exclusiveMinimumValue}}',
    maximum: 'Must be {{maximumValue}} or less',
    exclusiveMaximum: 'Must be less than {{exclusiveMaximumValue}}',
    multipleOf: function (error) {
        if ((1 / error.multipleOfValue) % 10 === 0) {
            const decimals = Math.log10(1 / error.multipleOfValue);
            return `Must have ${decimals} or fewer decimal places.`;
        }
        else {
            return `Must be a multiple of ${error.multipleOfValue}.`;
        }
    },
    minProperties: 'Must have {{minimumProperties}} or more items (current items: {{currentProperties}})',
    maxProperties: 'Must have {{maximumProperties}} or fewer items (current items: {{currentProperties}})',
    minItems: 'Must have {{minimumItems}} or more items (current items: {{currentItems}})',
    maxItems: 'Must have {{maximumItems}} or fewer items (current items: {{currentItems}})',
    uniqueItems: 'All items must be unique',
    // Note: No default error messages for 'type', 'const', 'enum', or 'dependencies'
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW4tdmFsaWRhdGlvbi1tZXNzYWdlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2Fqc2YtY29yZS9zcmMvbGliL2xvY2FsZS9lbi12YWxpZGF0aW9uLW1lc3NhZ2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sQ0FBQyxNQUFNLG9CQUFvQixHQUFRO0lBQ3ZDLFFBQVEsRUFBRSx5QkFBeUI7SUFDbkMsU0FBUyxFQUFFLG9GQUFvRjtJQUMvRixTQUFTLEVBQUUscUZBQXFGO0lBQ2hHLE9BQU8sRUFBRSx5Q0FBeUM7SUFDbEQsTUFBTSxFQUFFLFVBQVUsS0FBSztRQUNyQixRQUFRLEtBQUssQ0FBQyxjQUFjLEVBQUU7WUFDNUIsS0FBSyxNQUFNO2dCQUNULE9BQU8sbUNBQW1DLENBQUM7WUFDN0MsS0FBSyxNQUFNO2dCQUNULE9BQU8saURBQWlELENBQUM7WUFDM0QsS0FBSyxXQUFXO2dCQUNkLE9BQU8sNEVBQTRFLENBQUM7WUFDdEYsS0FBSyxPQUFPO2dCQUNWLE9BQU8sbURBQW1ELENBQUM7WUFDN0QsS0FBSyxVQUFVO2dCQUNiLE9BQU8sd0NBQXdDLENBQUM7WUFDbEQsS0FBSyxNQUFNO2dCQUNULE9BQU8sMkNBQTJDLENBQUM7WUFDckQsS0FBSyxNQUFNO2dCQUNULE9BQU8seUVBQXlFLENBQUM7WUFDbkYsb0VBQW9FO1lBQ3BFLHlEQUF5RDtZQUN6RCxLQUFLLEtBQUs7Z0JBQ1IsT0FBTyx3REFBd0QsQ0FBQztZQUNsRSxLQUFLLE1BQU07Z0JBQ1QsT0FBTyw2REFBNkQsQ0FBQztZQUN2RSxLQUFLLE9BQU87Z0JBQ1YsT0FBTyx5REFBeUQsQ0FBQztZQUNuRSxLQUFLLGNBQWM7Z0JBQ2pCLE9BQU8sc0RBQXNELENBQUM7WUFDaEUsS0FBSyx1QkFBdUI7Z0JBQzFCLE9BQU8sZ0VBQWdFLENBQUM7WUFDMUUsS0FBSyxPQUFPO2dCQUNWLE9BQU8sZ0VBQWdFLENBQUM7WUFDMUU7Z0JBQ0UsT0FBTyxnQ0FBZ0MsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDO1NBQ2xFO0lBQ0gsQ0FBQztJQUNELE9BQU8sRUFBRSxrQ0FBa0M7SUFDM0MsZ0JBQWdCLEVBQUUsNkNBQTZDO0lBQy9ELE9BQU8sRUFBRSxrQ0FBa0M7SUFDM0MsZ0JBQWdCLEVBQUUsNkNBQTZDO0lBQy9ELFVBQVUsRUFBRSxVQUFVLEtBQUs7UUFDekIsSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsRUFBRTtZQUMxQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDdkQsT0FBTyxhQUFhLFFBQVEsMkJBQTJCLENBQUM7U0FDekQ7YUFBTTtZQUNMLE9BQU8seUJBQXlCLEtBQUssQ0FBQyxlQUFlLEdBQUcsQ0FBQztTQUMxRDtJQUNILENBQUM7SUFDRCxhQUFhLEVBQUUsc0ZBQXNGO0lBQ3JHLGFBQWEsRUFBRSx1RkFBdUY7SUFDdEcsUUFBUSxFQUFFLDRFQUE0RTtJQUN0RixRQUFRLEVBQUUsNkVBQTZFO0lBQ3ZGLFdBQVcsRUFBRSwwQkFBMEI7SUFDdkMsaUZBQWlGO0NBQ2xGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgZW5WYWxpZGF0aW9uTWVzc2FnZXM6IGFueSA9IHsgLy8gRGVmYXVsdCBFbmdsaXNoIGVycm9yIG1lc3NhZ2VzXHJcbiAgcmVxdWlyZWQ6ICdUaGlzIGZpZWxkIGlzIHJlcXVpcmVkLicsXHJcbiAgbWluTGVuZ3RoOiAnTXVzdCBiZSB7e21pbmltdW1MZW5ndGh9fSBjaGFyYWN0ZXJzIG9yIGxvbmdlciAoY3VycmVudCBsZW5ndGg6IHt7Y3VycmVudExlbmd0aH19KScsXHJcbiAgbWF4TGVuZ3RoOiAnTXVzdCBiZSB7e21heGltdW1MZW5ndGh9fSBjaGFyYWN0ZXJzIG9yIHNob3J0ZXIgKGN1cnJlbnQgbGVuZ3RoOiB7e2N1cnJlbnRMZW5ndGh9fSknLFxyXG4gIHBhdHRlcm46ICdNdXN0IG1hdGNoIHBhdHRlcm46IHt7cmVxdWlyZWRQYXR0ZXJufX0nLFxyXG4gIGZvcm1hdDogZnVuY3Rpb24gKGVycm9yKSB7XHJcbiAgICBzd2l0Y2ggKGVycm9yLnJlcXVpcmVkRm9ybWF0KSB7XHJcbiAgICAgIGNhc2UgJ2RhdGUnOlxyXG4gICAgICAgIHJldHVybiAnTXVzdCBiZSBhIGRhdGUsIGxpa2UgXCIyMDAwLTEyLTMxXCInO1xyXG4gICAgICBjYXNlICd0aW1lJzpcclxuICAgICAgICByZXR1cm4gJ011c3QgYmUgYSB0aW1lLCBsaWtlIFwiMTY6MjBcIiBvciBcIjAzOjE0OjE1LjkyNjVcIic7XHJcbiAgICAgIGNhc2UgJ2RhdGUtdGltZSc6XHJcbiAgICAgICAgcmV0dXJuICdNdXN0IGJlIGEgZGF0ZS10aW1lLCBsaWtlIFwiMjAwMC0wMy0xNFQwMTo1OVwiIG9yIFwiMjAwMC0wMy0xNFQwMTo1OToyNi41MzVaXCInO1xyXG4gICAgICBjYXNlICdlbWFpbCc6XHJcbiAgICAgICAgcmV0dXJuICdNdXN0IGJlIGFuIGVtYWlsIGFkZHJlc3MsIGxpa2UgXCJuYW1lQGV4YW1wbGUuY29tXCInO1xyXG4gICAgICBjYXNlICdob3N0bmFtZSc6XHJcbiAgICAgICAgcmV0dXJuICdNdXN0IGJlIGEgaG9zdG5hbWUsIGxpa2UgXCJleGFtcGxlLmNvbVwiJztcclxuICAgICAgY2FzZSAnaXB2NCc6XHJcbiAgICAgICAgcmV0dXJuICdNdXN0IGJlIGFuIElQdjQgYWRkcmVzcywgbGlrZSBcIjEyNy4wLjAuMVwiJztcclxuICAgICAgY2FzZSAnaXB2Nic6XHJcbiAgICAgICAgcmV0dXJuICdNdXN0IGJlIGFuIElQdjYgYWRkcmVzcywgbGlrZSBcIjEyMzQ6NTY3ODo5QUJDOkRFRjA6MTIzNDo1Njc4OjlBQkM6REVGMFwiJztcclxuICAgICAgLy8gVE9ETzogYWRkIGV4YW1wbGVzIGZvciAndXJpJywgJ3VyaS1yZWZlcmVuY2UnLCBhbmQgJ3VyaS10ZW1wbGF0ZSdcclxuICAgICAgLy8gY2FzZSAndXJpJzogY2FzZSAndXJpLXJlZmVyZW5jZSc6IGNhc2UgJ3VyaS10ZW1wbGF0ZSc6XHJcbiAgICAgIGNhc2UgJ3VybCc6XHJcbiAgICAgICAgcmV0dXJuICdNdXN0IGJlIGEgdXJsLCBsaWtlIFwiaHR0cDovL3d3dy5leGFtcGxlLmNvbS9wYWdlLmh0bWxcIic7XHJcbiAgICAgIGNhc2UgJ3V1aWQnOlxyXG4gICAgICAgIHJldHVybiAnTXVzdCBiZSBhIHV1aWQsIGxpa2UgXCIxMjM0NTY3OC05QUJDLURFRjAtMTIzNC01Njc4OUFCQ0RFRjBcIic7XHJcbiAgICAgIGNhc2UgJ2NvbG9yJzpcclxuICAgICAgICByZXR1cm4gJ011c3QgYmUgYSBjb2xvciwgbGlrZSBcIiNGRkZGRkZcIiBvciBcInJnYigyNTUsIDI1NSwgMjU1KVwiJztcclxuICAgICAgY2FzZSAnanNvbi1wb2ludGVyJzpcclxuICAgICAgICByZXR1cm4gJ011c3QgYmUgYSBKU09OIFBvaW50ZXIsIGxpa2UgXCIvcG9pbnRlci90by9zb21ldGhpbmdcIic7XHJcbiAgICAgIGNhc2UgJ3JlbGF0aXZlLWpzb24tcG9pbnRlcic6XHJcbiAgICAgICAgcmV0dXJuICdNdXN0IGJlIGEgcmVsYXRpdmUgSlNPTiBQb2ludGVyLCBsaWtlIFwiMi9wb2ludGVyL3RvL3NvbWV0aGluZ1wiJztcclxuICAgICAgY2FzZSAncmVnZXgnOlxyXG4gICAgICAgIHJldHVybiAnTXVzdCBiZSBhIHJlZ3VsYXIgZXhwcmVzc2lvbiwgbGlrZSBcIigxLSk/XFxcXGR7M30tXFxcXGR7M30tXFxcXGR7NH1cIic7XHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgcmV0dXJuICdNdXN0IGJlIGEgY29ycmVjdGx5IGZvcm1hdHRlZCAnICsgZXJyb3IucmVxdWlyZWRGb3JtYXQ7XHJcbiAgICB9XHJcbiAgfSxcclxuICBtaW5pbXVtOiAnTXVzdCBiZSB7e21pbmltdW1WYWx1ZX19IG9yIG1vcmUnLFxyXG4gIGV4Y2x1c2l2ZU1pbmltdW06ICdNdXN0IGJlIG1vcmUgdGhhbiB7e2V4Y2x1c2l2ZU1pbmltdW1WYWx1ZX19JyxcclxuICBtYXhpbXVtOiAnTXVzdCBiZSB7e21heGltdW1WYWx1ZX19IG9yIGxlc3MnLFxyXG4gIGV4Y2x1c2l2ZU1heGltdW06ICdNdXN0IGJlIGxlc3MgdGhhbiB7e2V4Y2x1c2l2ZU1heGltdW1WYWx1ZX19JyxcclxuICBtdWx0aXBsZU9mOiBmdW5jdGlvbiAoZXJyb3IpIHtcclxuICAgIGlmICgoMSAvIGVycm9yLm11bHRpcGxlT2ZWYWx1ZSkgJSAxMCA9PT0gMCkge1xyXG4gICAgICBjb25zdCBkZWNpbWFscyA9IE1hdGgubG9nMTAoMSAvIGVycm9yLm11bHRpcGxlT2ZWYWx1ZSk7XHJcbiAgICAgIHJldHVybiBgTXVzdCBoYXZlICR7ZGVjaW1hbHN9IG9yIGZld2VyIGRlY2ltYWwgcGxhY2VzLmA7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gYE11c3QgYmUgYSBtdWx0aXBsZSBvZiAke2Vycm9yLm11bHRpcGxlT2ZWYWx1ZX0uYDtcclxuICAgIH1cclxuICB9LFxyXG4gIG1pblByb3BlcnRpZXM6ICdNdXN0IGhhdmUge3ttaW5pbXVtUHJvcGVydGllc319IG9yIG1vcmUgaXRlbXMgKGN1cnJlbnQgaXRlbXM6IHt7Y3VycmVudFByb3BlcnRpZXN9fSknLFxyXG4gIG1heFByb3BlcnRpZXM6ICdNdXN0IGhhdmUge3ttYXhpbXVtUHJvcGVydGllc319IG9yIGZld2VyIGl0ZW1zIChjdXJyZW50IGl0ZW1zOiB7e2N1cnJlbnRQcm9wZXJ0aWVzfX0pJyxcclxuICBtaW5JdGVtczogJ011c3QgaGF2ZSB7e21pbmltdW1JdGVtc319IG9yIG1vcmUgaXRlbXMgKGN1cnJlbnQgaXRlbXM6IHt7Y3VycmVudEl0ZW1zfX0pJyxcclxuICBtYXhJdGVtczogJ011c3QgaGF2ZSB7e21heGltdW1JdGVtc319IG9yIGZld2VyIGl0ZW1zIChjdXJyZW50IGl0ZW1zOiB7e2N1cnJlbnRJdGVtc319KScsXHJcbiAgdW5pcXVlSXRlbXM6ICdBbGwgaXRlbXMgbXVzdCBiZSB1bmlxdWUnLFxyXG4gIC8vIE5vdGU6IE5vIGRlZmF1bHQgZXJyb3IgbWVzc2FnZXMgZm9yICd0eXBlJywgJ2NvbnN0JywgJ2VudW0nLCBvciAnZGVwZW5kZW5jaWVzJ1xyXG59O1xyXG4iXX0=