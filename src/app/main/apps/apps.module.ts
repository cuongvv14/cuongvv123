import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { FullCalendarModule } from "@fullcalendar/angular";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import timeGridPlugin from "@fullcalendar/timegrid";
import { DepartmentListComponent } from "./hrm-setting/department/department-list/department-list.component";
import { DepartmentViewComponent } from "./hrm-setting/department/department-view/department-view.component";
import { DepartmentEditComponent } from "./hrm-setting/department/department-edit/department-edit.component";
import { PositionListComponent } from "./hrm-setting/position/position-list/position-list.component";
import { PositionViewComponent } from "./hrm-setting/position/position-view/position-view.component";
import { PositionEditComponent } from "./hrm-setting/position/position-edit/position-edit.component";
import { ToastrModule } from "ngx-toastr";

// routing
const routes: Routes = [
  {
    path: "user",
    loadChildren: () => import("./user/user.module").then((m) => m.UserModule),
  },

  {
    path: "hrm-setting",
    loadChildren: () =>
      import("./hrm-setting/branch/branch.module").then((m) => m.BranchModule),
  },
  {
    path: "hrm-setting",
    loadChildren: () =>
      import("./hrm-setting/department/department.module").then(
        (m) => m.DepartmentModule
      ),
  },
  {
    path: "hrm-setting",
    loadChildren: () =>
      import("./hrm-setting/position/position.module").then(
        (m) => m.PositionModule
      ),
  },
];

FullCalendarModule.registerPlugins([
  dayGridPlugin,
  timeGridPlugin,
  listPlugin,
  interactionPlugin,
]);

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(routes)],
})
export class AppsModule { }
