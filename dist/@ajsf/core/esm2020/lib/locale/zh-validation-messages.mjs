export const zhValidationMessages = {
    required: '必填字段.',
    minLength: '字符长度必须大于或者等于 {{minimumLength}} (当前长度: {{currentLength}})',
    maxLength: '字符长度必须小于或者等于 {{maximumLength}} (当前长度: {{currentLength}})',
    pattern: '必须匹配正则表达式: {{requiredPattern}}',
    format: function (error) {
        switch (error.requiredFormat) {
            case 'date':
                return '必须为日期格式, 比如 "2000-12-31"';
            case 'time':
                return '必须为时间格式, 比如 "16:20" 或者 "03:14:15.9265"';
            case 'date-time':
                return '必须为日期时间格式, 比如 "2000-03-14T01:59" 或者 "2000-03-14T01:59:26.535Z"';
            case 'email':
                return '必须为邮箱地址, 比如 "name@example.com"';
            case 'hostname':
                return '必须为主机名, 比如 "example.com"';
            case 'ipv4':
                return '必须为 IPv4 地址, 比如 "127.0.0.1"';
            case 'ipv6':
                return '必须为 IPv6 地址, 比如 "1234:5678:9ABC:DEF0:1234:5678:9ABC:DEF0"';
            // TODO: add examples for 'uri', 'uri-reference', and 'uri-template'
            // case 'uri': case 'uri-reference': case 'uri-template':
            case 'url':
                return '必须为 url, 比如 "http://www.example.com/page.html"';
            case 'uuid':
                return '必须为 uuid, 比如 "12345678-9ABC-DEF0-1234-56789ABCDEF0"';
            case 'color':
                return '必须为颜色值, 比如 "#FFFFFF" 或者 "rgb(255, 255, 255)"';
            case 'json-pointer':
                return '必须为 JSON Pointer, 比如 "/pointer/to/something"';
            case 'relative-json-pointer':
                return '必须为相对的 JSON Pointer, 比如 "2/pointer/to/something"';
            case 'regex':
                return '必须为正则表达式, 比如 "(1-)?\\d{3}-\\d{3}-\\d{4}"';
            default:
                return '必须为格式正确的 ' + error.requiredFormat;
        }
    },
    minimum: '必须大于或者等于最小值: {{minimumValue}}',
    exclusiveMinimum: '必须大于最小值: {{exclusiveMinimumValue}}',
    maximum: '必须小于或者等于最大值: {{maximumValue}}',
    exclusiveMaximum: '必须小于最大值: {{exclusiveMaximumValue}}',
    multipleOf: function (error) {
        if ((1 / error.multipleOfValue) % 10 === 0) {
            const decimals = Math.log10(1 / error.multipleOfValue);
            return `必须有 ${decimals} 位或更少的小数位`;
        }
        else {
            return `必须为 ${error.multipleOfValue} 的倍数`;
        }
    },
    minProperties: '项目数必须大于或者等于 {{minimumProperties}} (当前项目数: {{currentProperties}})',
    maxProperties: '项目数必须小于或者等于 {{maximumProperties}} (当前项目数: {{currentProperties}})',
    minItems: '项目数必须大于或者等于 {{minimumItems}} (当前项目数: {{currentItems}})',
    maxItems: '项目数必须小于或者等于 {{maximumItems}} (当前项目数: {{currentItems}})',
    uniqueItems: '所有项目必须是唯一的',
    // Note: No default error messages for 'type', 'const', 'enum', or 'dependencies'
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiemgtdmFsaWRhdGlvbi1tZXNzYWdlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2Fqc2YtY29yZS9zcmMvbGliL2xvY2FsZS96aC12YWxpZGF0aW9uLW1lc3NhZ2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sQ0FBQyxNQUFNLG9CQUFvQixHQUFRO0lBQ3ZDLFFBQVEsRUFBRSxPQUFPO0lBQ2pCLFNBQVMsRUFBRSwwREFBMEQ7SUFDckUsU0FBUyxFQUFFLDBEQUEwRDtJQUNyRSxPQUFPLEVBQUUsZ0NBQWdDO0lBQ3pDLE1BQU0sRUFBRSxVQUFVLEtBQUs7UUFDckIsUUFBUSxLQUFLLENBQUMsY0FBYyxFQUFFO1lBQzVCLEtBQUssTUFBTTtnQkFDVCxPQUFPLDBCQUEwQixDQUFDO1lBQ3BDLEtBQUssTUFBTTtnQkFDVCxPQUFPLHdDQUF3QyxDQUFDO1lBQ2xELEtBQUssV0FBVztnQkFDZCxPQUFPLGdFQUFnRSxDQUFDO1lBQzFFLEtBQUssT0FBTztnQkFDVixPQUFPLGdDQUFnQyxDQUFDO1lBQzFDLEtBQUssVUFBVTtnQkFDYixPQUFPLDBCQUEwQixDQUFDO1lBQ3BDLEtBQUssTUFBTTtnQkFDVCxPQUFPLDZCQUE2QixDQUFDO1lBQ3ZDLEtBQUssTUFBTTtnQkFDVCxPQUFPLDJEQUEyRCxDQUFDO1lBQ3JFLG9FQUFvRTtZQUNwRSx5REFBeUQ7WUFDekQsS0FBSyxLQUFLO2dCQUNSLE9BQU8sZ0RBQWdELENBQUM7WUFDMUQsS0FBSyxNQUFNO2dCQUNULE9BQU8scURBQXFELENBQUM7WUFDL0QsS0FBSyxPQUFPO2dCQUNWLE9BQU8sOENBQThDLENBQUM7WUFDeEQsS0FBSyxjQUFjO2dCQUNqQixPQUFPLDhDQUE4QyxDQUFDO1lBQ3hELEtBQUssdUJBQXVCO2dCQUMxQixPQUFPLGtEQUFrRCxDQUFDO1lBQzVELEtBQUssT0FBTztnQkFDVixPQUFPLDBDQUEwQyxDQUFDO1lBQ3BEO2dCQUNFLE9BQU8sV0FBVyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUM7U0FDN0M7SUFDSCxDQUFDO0lBQ0QsT0FBTyxFQUFFLCtCQUErQjtJQUN4QyxnQkFBZ0IsRUFBRSxvQ0FBb0M7SUFDdEQsT0FBTyxFQUFFLCtCQUErQjtJQUN4QyxnQkFBZ0IsRUFBRSxvQ0FBb0M7SUFDdEQsVUFBVSxFQUFFLFVBQVUsS0FBSztRQUN6QixJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxFQUFFO1lBQzFDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUN2RCxPQUFPLE9BQU8sUUFBUSxXQUFXLENBQUM7U0FDbkM7YUFBTTtZQUNMLE9BQU8sT0FBTyxLQUFLLENBQUMsZUFBZSxNQUFNLENBQUM7U0FDM0M7SUFDSCxDQUFDO0lBQ0QsYUFBYSxFQUFFLGtFQUFrRTtJQUNqRixhQUFhLEVBQUUsa0VBQWtFO0lBQ2pGLFFBQVEsRUFBRSx3REFBd0Q7SUFDbEUsUUFBUSxFQUFFLHdEQUF3RDtJQUNsRSxXQUFXLEVBQUUsWUFBWTtJQUN6QixpRkFBaUY7Q0FDbEYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjb25zdCB6aFZhbGlkYXRpb25NZXNzYWdlczogYW55ID0geyAvLyBDaGluZXNlIGVycm9yIG1lc3NhZ2VzXHJcbiAgcmVxdWlyZWQ6ICflv4XloavlrZfmrrUuJyxcclxuICBtaW5MZW5ndGg6ICflrZfnrKbplb/luqblv4XpobvlpKfkuo7miJbogIXnrYnkuo4ge3ttaW5pbXVtTGVuZ3RofX0gKOW9k+WJjemVv+W6pjoge3tjdXJyZW50TGVuZ3RofX0pJyxcclxuICBtYXhMZW5ndGg6ICflrZfnrKbplb/luqblv4XpobvlsI/kuo7miJbogIXnrYnkuo4ge3ttYXhpbXVtTGVuZ3RofX0gKOW9k+WJjemVv+W6pjoge3tjdXJyZW50TGVuZ3RofX0pJyxcclxuICBwYXR0ZXJuOiAn5b+F6aG75Yy56YWN5q2j5YiZ6KGo6L6+5byPOiB7e3JlcXVpcmVkUGF0dGVybn19JyxcclxuICBmb3JtYXQ6IGZ1bmN0aW9uIChlcnJvcikge1xyXG4gICAgc3dpdGNoIChlcnJvci5yZXF1aXJlZEZvcm1hdCkge1xyXG4gICAgICBjYXNlICdkYXRlJzpcclxuICAgICAgICByZXR1cm4gJ+W/hemhu+S4uuaXpeacn+agvOW8jywg5q+U5aaCIFwiMjAwMC0xMi0zMVwiJztcclxuICAgICAgY2FzZSAndGltZSc6XHJcbiAgICAgICAgcmV0dXJuICflv4XpobvkuLrml7bpl7TmoLzlvI8sIOavlOWmgiBcIjE2OjIwXCIg5oiW6ICFIFwiMDM6MTQ6MTUuOTI2NVwiJztcclxuICAgICAgY2FzZSAnZGF0ZS10aW1lJzpcclxuICAgICAgICByZXR1cm4gJ+W/hemhu+S4uuaXpeacn+aXtumXtOagvOW8jywg5q+U5aaCIFwiMjAwMC0wMy0xNFQwMTo1OVwiIOaIluiAhSBcIjIwMDAtMDMtMTRUMDE6NTk6MjYuNTM1WlwiJztcclxuICAgICAgY2FzZSAnZW1haWwnOlxyXG4gICAgICAgIHJldHVybiAn5b+F6aG75Li66YKu566x5Zyw5Z2ALCDmr5TlpoIgXCJuYW1lQGV4YW1wbGUuY29tXCInO1xyXG4gICAgICBjYXNlICdob3N0bmFtZSc6XHJcbiAgICAgICAgcmV0dXJuICflv4XpobvkuLrkuLvmnLrlkI0sIOavlOWmgiBcImV4YW1wbGUuY29tXCInO1xyXG4gICAgICBjYXNlICdpcHY0JzpcclxuICAgICAgICByZXR1cm4gJ+W/hemhu+S4uiBJUHY0IOWcsOWdgCwg5q+U5aaCIFwiMTI3LjAuMC4xXCInO1xyXG4gICAgICBjYXNlICdpcHY2JzpcclxuICAgICAgICByZXR1cm4gJ+W/hemhu+S4uiBJUHY2IOWcsOWdgCwg5q+U5aaCIFwiMTIzNDo1Njc4OjlBQkM6REVGMDoxMjM0OjU2Nzg6OUFCQzpERUYwXCInO1xyXG4gICAgICAvLyBUT0RPOiBhZGQgZXhhbXBsZXMgZm9yICd1cmknLCAndXJpLXJlZmVyZW5jZScsIGFuZCAndXJpLXRlbXBsYXRlJ1xyXG4gICAgICAvLyBjYXNlICd1cmknOiBjYXNlICd1cmktcmVmZXJlbmNlJzogY2FzZSAndXJpLXRlbXBsYXRlJzpcclxuICAgICAgY2FzZSAndXJsJzpcclxuICAgICAgICByZXR1cm4gJ+W/hemhu+S4uiB1cmwsIOavlOWmgiBcImh0dHA6Ly93d3cuZXhhbXBsZS5jb20vcGFnZS5odG1sXCInO1xyXG4gICAgICBjYXNlICd1dWlkJzpcclxuICAgICAgICByZXR1cm4gJ+W/hemhu+S4uiB1dWlkLCDmr5TlpoIgXCIxMjM0NTY3OC05QUJDLURFRjAtMTIzNC01Njc4OUFCQ0RFRjBcIic7XHJcbiAgICAgIGNhc2UgJ2NvbG9yJzpcclxuICAgICAgICByZXR1cm4gJ+W/hemhu+S4uuminOiJsuWAvCwg5q+U5aaCIFwiI0ZGRkZGRlwiIOaIluiAhSBcInJnYigyNTUsIDI1NSwgMjU1KVwiJztcclxuICAgICAgY2FzZSAnanNvbi1wb2ludGVyJzpcclxuICAgICAgICByZXR1cm4gJ+W/hemhu+S4uiBKU09OIFBvaW50ZXIsIOavlOWmgiBcIi9wb2ludGVyL3RvL3NvbWV0aGluZ1wiJztcclxuICAgICAgY2FzZSAncmVsYXRpdmUtanNvbi1wb2ludGVyJzpcclxuICAgICAgICByZXR1cm4gJ+W/hemhu+S4uuebuOWvueeahCBKU09OIFBvaW50ZXIsIOavlOWmgiBcIjIvcG9pbnRlci90by9zb21ldGhpbmdcIic7XHJcbiAgICAgIGNhc2UgJ3JlZ2V4JzpcclxuICAgICAgICByZXR1cm4gJ+W/hemhu+S4uuato+WImeihqOi+vuW8jywg5q+U5aaCIFwiKDEtKT9cXFxcZHszfS1cXFxcZHszfS1cXFxcZHs0fVwiJztcclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICByZXR1cm4gJ+W/hemhu+S4uuagvOW8j+ato+ehrueahCAnICsgZXJyb3IucmVxdWlyZWRGb3JtYXQ7XHJcbiAgICB9XHJcbiAgfSxcclxuICBtaW5pbXVtOiAn5b+F6aG75aSn5LqO5oiW6ICF562J5LqO5pyA5bCP5YC8OiB7e21pbmltdW1WYWx1ZX19JyxcclxuICBleGNsdXNpdmVNaW5pbXVtOiAn5b+F6aG75aSn5LqO5pyA5bCP5YC8OiB7e2V4Y2x1c2l2ZU1pbmltdW1WYWx1ZX19JyxcclxuICBtYXhpbXVtOiAn5b+F6aG75bCP5LqO5oiW6ICF562J5LqO5pyA5aSn5YC8OiB7e21heGltdW1WYWx1ZX19JyxcclxuICBleGNsdXNpdmVNYXhpbXVtOiAn5b+F6aG75bCP5LqO5pyA5aSn5YC8OiB7e2V4Y2x1c2l2ZU1heGltdW1WYWx1ZX19JyxcclxuICBtdWx0aXBsZU9mOiBmdW5jdGlvbiAoZXJyb3IpIHtcclxuICAgIGlmICgoMSAvIGVycm9yLm11bHRpcGxlT2ZWYWx1ZSkgJSAxMCA9PT0gMCkge1xyXG4gICAgICBjb25zdCBkZWNpbWFscyA9IE1hdGgubG9nMTAoMSAvIGVycm9yLm11bHRpcGxlT2ZWYWx1ZSk7XHJcbiAgICAgIHJldHVybiBg5b+F6aG75pyJICR7ZGVjaW1hbHN9IOS9jeaIluabtOWwkeeahOWwj+aVsOS9jWA7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gYOW/hemhu+S4uiAke2Vycm9yLm11bHRpcGxlT2ZWYWx1ZX0g55qE5YCN5pWwYDtcclxuICAgIH1cclxuICB9LFxyXG4gIG1pblByb3BlcnRpZXM6ICfpobnnm67mlbDlv4XpobvlpKfkuo7miJbogIXnrYnkuo4ge3ttaW5pbXVtUHJvcGVydGllc319ICjlvZPliY3pobnnm67mlbA6IHt7Y3VycmVudFByb3BlcnRpZXN9fSknLFxyXG4gIG1heFByb3BlcnRpZXM6ICfpobnnm67mlbDlv4XpobvlsI/kuo7miJbogIXnrYnkuo4ge3ttYXhpbXVtUHJvcGVydGllc319ICjlvZPliY3pobnnm67mlbA6IHt7Y3VycmVudFByb3BlcnRpZXN9fSknLFxyXG4gIG1pbkl0ZW1zOiAn6aG555uu5pWw5b+F6aG75aSn5LqO5oiW6ICF562J5LqOIHt7bWluaW11bUl0ZW1zfX0gKOW9k+WJjemhueebruaVsDoge3tjdXJyZW50SXRlbXN9fSknLFxyXG4gIG1heEl0ZW1zOiAn6aG555uu5pWw5b+F6aG75bCP5LqO5oiW6ICF562J5LqOIHt7bWF4aW11bUl0ZW1zfX0gKOW9k+WJjemhueebruaVsDoge3tjdXJyZW50SXRlbXN9fSknLFxyXG4gIHVuaXF1ZUl0ZW1zOiAn5omA5pyJ6aG555uu5b+F6aG75piv5ZSv5LiA55qEJyxcclxuICAvLyBOb3RlOiBObyBkZWZhdWx0IGVycm9yIG1lc3NhZ2VzIGZvciAndHlwZScsICdjb25zdCcsICdlbnVtJywgb3IgJ2RlcGVuZGVuY2llcydcclxufTtcclxuIl19