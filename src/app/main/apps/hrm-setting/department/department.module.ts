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
import { DepartmentEditComponent } from "./department-edit/department-edit.component";
import { DepartmentListComponent } from "./department-list/department-list.component";
import { DepartmentEditService } from "./department-edit/department-edit.service";
import { DepartmentListService } from "./department-list/department-list.service";
import { DepartmentViewService } from "./department-view/department-view.service";
import { DepartmentViewComponent } from "./department-view/department-view.component";
import { BranchService } from "../branch/branch.service";
import { TreeTableModule } from "primeng/treetable";

// routing
const routes: Routes = [
  {
    path: "department/department-list",
    component: DepartmentListComponent,
    resolve: {
      bls: DepartmentListService,
    },
    data: { animation: "DepartmentListComponent" },
  },
  {
    path: "department/department-view/:id",
    component: DepartmentViewComponent,
    resolve: {
      data: DepartmentViewService,
    },
    data: { path: "view/:id", animation: "DepartmentViewComponent" },
  },
  {
    path: "department/department-edit/:id",
    component: DepartmentEditComponent,
    resolve: {
      ues: DepartmentEditService,
    },
    data: { animation: "DepartmentEditComponent" },
  },
  {
    path: "department/department-view",
    redirectTo: "/apps/hrm-setting/department/department-view/1", // Redirection to default department view
  },
  {
    path: "department/department-edit",
    redirectTo: "/apps/hrm-setting/department/department-edit/1", // Redirection to default department edit
  },
];

@NgModule({
  declarations: [
    DepartmentListComponent,
    DepartmentEditComponent,
    DepartmentViewComponent,
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
    TreeTableModule,
  ],
  providers: [
    DepartmentEditService,
    DepartmentListService,
    DepartmentViewService,
    BranchService,
  ],
})
export class DepartmentModule {}
