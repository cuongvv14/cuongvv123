import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule, Routes } from "@angular/router";

import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { NgSelectModule } from "@ng-select/ng-select";
import { NgxDatatableModule } from "@swimlane/ngx-datatable";

import { CoreCommonModule } from "@core/common.module";
import { CoreDirectivesModule } from "@core/directives/directives";
import { CorePipesModule } from "@core/pipes/pipes.module";
import { CoreSidebarModule } from "@core/components";

import { Ng2FlatpickrModule } from "ng2-flatpickr";
import { PositionEditComponent } from "./position-edit/position-edit.component";
import { PositionListComponent } from "./position-list/position-list.component";
import { PositionViewComponent } from "./position-view/position-view.component";
import { PositionListService } from "./position-list/position-list.service";
import { PositionEditService } from "./position-edit/position-edit.service";
import { PositionViewService } from "./position-view/position-view.service";
import { DepartmentListService } from "../department/department-list/department-list.service";
import { BranchService } from "../branch/branch.service";

// routing
const routes: Routes = [
  {
    path: "position/position-list",
    component: PositionListComponent,
    resolve: {
      bls: PositionListService,
    },
    data: { animation: "PositionListComponent" },
  },
  {
    path: "position/position-view/:id",
    component: PositionViewComponent,
    resolve: {
      data: PositionViewService,
    },
    data: { path: "view/:id", animation: "PositionViewComponent" },
  },
  {
    path: "position/position-edit/:id",
    component: PositionEditComponent,
    resolve: {
      ues: PositionEditService,
    },
    data: { animation: "PositionEditComponent" },
  },
  {
    path: "position/position-view",
    redirectTo: "/apps/hrm-setting/position/position-view/1", // Redirection to default position view
  },
  {
    path: "position/position-edit",
    redirectTo: "/apps/hrm-setting/position/position-edit/1", // Redirection to default position edit
  },
];

@NgModule({
  declarations: [
    PositionEditComponent,
    PositionListComponent,
    PositionViewComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    CoreCommonModule,
    FormsModule,
    RouterModule,
    NgbModule,
    NgSelectModule,
    CommonModule,
    Ng2FlatpickrModule,
    NgxDatatableModule,
    CorePipesModule,
    CoreDirectivesModule,
    CoreSidebarModule,
  ],
  providers: [
    PositionListService,
    PositionEditService,
    PositionViewService,
    DepartmentListService,
    BranchService
  ],
})
export class PositionModule { }
