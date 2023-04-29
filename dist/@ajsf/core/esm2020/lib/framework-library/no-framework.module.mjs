import { CommonModule } from '@angular/common';
import { Framework } from './framework';
import { NgModule } from '@angular/core';
import { NoFramework } from './no.framework';
import { NoFrameworkComponent } from './no-framework.component';
import { WidgetLibraryModule } from '../widget-library/widget-library.module';
import * as i0 from "@angular/core";
// No framework - plain HTML controls (styles from form layout only)
export class NoFrameworkModule {
}
NoFrameworkModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.2.0", ngImport: i0, type: NoFrameworkModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
NoFrameworkModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "14.2.0", ngImport: i0, type: NoFrameworkModule, declarations: [NoFrameworkComponent], imports: [CommonModule, WidgetLibraryModule], exports: [NoFrameworkComponent] });
NoFrameworkModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "14.2.0", ngImport: i0, type: NoFrameworkModule, providers: [
        { provide: Framework, useClass: NoFramework, multi: true }
    ], imports: [CommonModule, WidgetLibraryModule] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.2.0", ngImport: i0, type: NoFrameworkModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [CommonModule, WidgetLibraryModule],
                    declarations: [NoFrameworkComponent],
                    exports: [NoFrameworkComponent],
                    providers: [
                        { provide: Framework, useClass: NoFramework, multi: true }
                    ]
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm8tZnJhbWV3b3JrLm1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2Fqc2YtY29yZS9zcmMvbGliL2ZyYW1ld29yay1saWJyYXJ5L25vLWZyYW1ld29yay5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQy9DLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDeEMsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUN6QyxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDN0MsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDaEUsT0FBTyxFQUFFLG1CQUFtQixFQUFFLE1BQU0seUNBQXlDLENBQUM7O0FBRTlFLG9FQUFvRTtBQVVwRSxNQUFNLE9BQU8saUJBQWlCOzs4R0FBakIsaUJBQWlCOytHQUFqQixpQkFBaUIsaUJBTlgsb0JBQW9CLGFBRHpCLFlBQVksRUFBRSxtQkFBbUIsYUFFakMsb0JBQW9COytHQUtyQixpQkFBaUIsYUFKZjtRQUNQLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUU7S0FDN0QsWUFMUyxZQUFZLEVBQUUsbUJBQW1COzJGQU9sQyxpQkFBaUI7a0JBUjdCLFFBQVE7bUJBQUM7b0JBQ04sT0FBTyxFQUFFLENBQUMsWUFBWSxFQUFFLG1CQUFtQixDQUFDO29CQUM1QyxZQUFZLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQztvQkFDcEMsT0FBTyxFQUFFLENBQUMsb0JBQW9CLENBQUM7b0JBQy9CLFNBQVMsRUFBRTt3QkFDUCxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFO3FCQUM3RDtpQkFDSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbW1vbk1vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XHJcbmltcG9ydCB7IEZyYW1ld29yayB9IGZyb20gJy4vZnJhbWV3b3JrJztcclxuaW1wb3J0IHsgTmdNb2R1bGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcclxuaW1wb3J0IHsgTm9GcmFtZXdvcmsgfSBmcm9tICcuL25vLmZyYW1ld29yayc7XHJcbmltcG9ydCB7IE5vRnJhbWV3b3JrQ29tcG9uZW50IH0gZnJvbSAnLi9uby1mcmFtZXdvcmsuY29tcG9uZW50JztcclxuaW1wb3J0IHsgV2lkZ2V0TGlicmFyeU1vZHVsZSB9IGZyb20gJy4uL3dpZGdldC1saWJyYXJ5L3dpZGdldC1saWJyYXJ5Lm1vZHVsZSc7XHJcblxyXG4vLyBObyBmcmFtZXdvcmsgLSBwbGFpbiBIVE1MIGNvbnRyb2xzIChzdHlsZXMgZnJvbSBmb3JtIGxheW91dCBvbmx5KVxyXG5cclxuQE5nTW9kdWxlKHtcclxuICAgIGltcG9ydHM6IFtDb21tb25Nb2R1bGUsIFdpZGdldExpYnJhcnlNb2R1bGVdLFxyXG4gICAgZGVjbGFyYXRpb25zOiBbTm9GcmFtZXdvcmtDb21wb25lbnRdLFxyXG4gICAgZXhwb3J0czogW05vRnJhbWV3b3JrQ29tcG9uZW50XSxcclxuICAgIHByb3ZpZGVyczogW1xyXG4gICAgICAgIHsgcHJvdmlkZTogRnJhbWV3b3JrLCB1c2VDbGFzczogTm9GcmFtZXdvcmssIG11bHRpOiB0cnVlIH1cclxuICAgIF1cclxufSlcclxuZXhwb3J0IGNsYXNzIE5vRnJhbWV3b3JrTW9kdWxlIHsgfVxyXG4iXX0=