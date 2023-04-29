import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { JsonSchemaFormComponent } from './json-schema-form.component';
import { NoFrameworkModule } from './framework-library/no-framework.module';
import { WidgetLibraryModule } from './widget-library/widget-library.module';
import * as i0 from "@angular/core";
export class JsonSchemaFormModule {
}
JsonSchemaFormModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.2.0", ngImport: i0, type: JsonSchemaFormModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
JsonSchemaFormModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "14.2.0", ngImport: i0, type: JsonSchemaFormModule, declarations: [JsonSchemaFormComponent], imports: [CommonModule, FormsModule, ReactiveFormsModule,
        WidgetLibraryModule, NoFrameworkModule], exports: [JsonSchemaFormComponent, WidgetLibraryModule] });
JsonSchemaFormModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "14.2.0", ngImport: i0, type: JsonSchemaFormModule, imports: [CommonModule, FormsModule, ReactiveFormsModule,
        WidgetLibraryModule, NoFrameworkModule, WidgetLibraryModule] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.2.0", ngImport: i0, type: JsonSchemaFormModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [
                        CommonModule, FormsModule, ReactiveFormsModule,
                        WidgetLibraryModule, NoFrameworkModule
                    ],
                    declarations: [JsonSchemaFormComponent],
                    exports: [JsonSchemaFormComponent, WidgetLibraryModule]
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbi1zY2hlbWEtZm9ybS5tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9hanNmLWNvcmUvc3JjL2xpYi9qc29uLXNjaGVtYS1mb3JtLm1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDL0MsT0FBTyxFQUFFLFdBQVcsRUFBRSxtQkFBbUIsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQ2xFLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDekMsT0FBTyxFQUFFLHVCQUF1QixFQUFFLE1BQU0sOEJBQThCLENBQUM7QUFDdkUsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0seUNBQXlDLENBQUM7QUFDNUUsT0FBTyxFQUFFLG1CQUFtQixFQUFFLE1BQU0sd0NBQXdDLENBQUM7O0FBVTdFLE1BQU0sT0FBTyxvQkFBb0I7O2lIQUFwQixvQkFBb0I7a0hBQXBCLG9CQUFvQixpQkFIaEIsdUJBQXVCLGFBSHBDLFlBQVksRUFBRSxXQUFXLEVBQUUsbUJBQW1CO1FBQzlDLG1CQUFtQixFQUFFLGlCQUFpQixhQUc5Qix1QkFBdUIsRUFBRSxtQkFBbUI7a0hBRTNDLG9CQUFvQixZQU43QixZQUFZLEVBQUUsV0FBVyxFQUFFLG1CQUFtQjtRQUM5QyxtQkFBbUIsRUFBRSxpQkFBaUIsRUFHTCxtQkFBbUI7MkZBRTNDLG9CQUFvQjtrQkFSaEMsUUFBUTttQkFBQztvQkFDUixPQUFPLEVBQUU7d0JBQ1AsWUFBWSxFQUFFLFdBQVcsRUFBRSxtQkFBbUI7d0JBQzlDLG1CQUFtQixFQUFFLGlCQUFpQjtxQkFDdkM7b0JBQ0QsWUFBWSxFQUFFLENBQUMsdUJBQXVCLENBQUM7b0JBQ3ZDLE9BQU8sRUFBRSxDQUFDLHVCQUF1QixFQUFFLG1CQUFtQixDQUFDO2lCQUN4RCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbW1vbk1vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XHJcbmltcG9ydCB7IEZvcm1zTW9kdWxlLCBSZWFjdGl2ZUZvcm1zTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvZm9ybXMnO1xyXG5pbXBvcnQgeyBOZ01vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQgeyBKc29uU2NoZW1hRm9ybUNvbXBvbmVudCB9IGZyb20gJy4vanNvbi1zY2hlbWEtZm9ybS5jb21wb25lbnQnO1xyXG5pbXBvcnQgeyBOb0ZyYW1ld29ya01vZHVsZSB9IGZyb20gJy4vZnJhbWV3b3JrLWxpYnJhcnkvbm8tZnJhbWV3b3JrLm1vZHVsZSc7XHJcbmltcG9ydCB7IFdpZGdldExpYnJhcnlNb2R1bGUgfSBmcm9tICcuL3dpZGdldC1saWJyYXJ5L3dpZGdldC1saWJyYXJ5Lm1vZHVsZSc7XHJcblxyXG5ATmdNb2R1bGUoe1xyXG4gIGltcG9ydHM6IFtcclxuICAgIENvbW1vbk1vZHVsZSwgRm9ybXNNb2R1bGUsIFJlYWN0aXZlRm9ybXNNb2R1bGUsXHJcbiAgICBXaWRnZXRMaWJyYXJ5TW9kdWxlLCBOb0ZyYW1ld29ya01vZHVsZVxyXG4gIF0sXHJcbiAgZGVjbGFyYXRpb25zOiBbSnNvblNjaGVtYUZvcm1Db21wb25lbnRdLFxyXG4gIGV4cG9ydHM6IFtKc29uU2NoZW1hRm9ybUNvbXBvbmVudCwgV2lkZ2V0TGlicmFyeU1vZHVsZV1cclxufSlcclxuZXhwb3J0IGNsYXNzIEpzb25TY2hlbWFGb3JtTW9kdWxlIHtcclxufVxyXG4iXX0=