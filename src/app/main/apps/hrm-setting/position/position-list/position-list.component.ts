import { Component, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { ColumnMode, DatatableComponent, SelectionType } from "@swimlane/ngx-datatable";

import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { CoreConfigService } from "@core/services/config.service";
import { CoreSidebarService } from "@core/components/core-sidebar/core-sidebar.service";
import { PositionListService } from "./position-list.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { FlatpickrOptions } from "ng2-flatpickr";
import { FormBuilder, FormGroup, NgForm, Validators } from "@angular/forms";
import { DepartmentListService } from "../../department/department-list/department-list.service";
import { BranchService } from "../../branch/branch.service";
import { ToastrService } from "ngx-toastr";
import { Position } from "ngx-perfect-scrollbar";

@Component({
  selector: "app-position-list",
  templateUrl: "./position-list.component.html",
  styleUrls: ["./position-list.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class PositionListComponent implements OnInit {
  // Public
  public sidebarToggleRef = false;
  public selectedOption = 10;
  public ColumnMode = ColumnMode;
  public temp = [];
  public previousRoleFilter = "";
  public previousPlanFilter = "";
  public previousStatusFilter = "";
  public SelectionType = SelectionType;
  public departments: any = [];
  public branches: any = [];
  public positions: any = [];
  public modalRef: any;
  public selectedIds = [];
  public deletedIds = [];
  public searchValue1 = "";
  public modalMode: "add" | "edit" | "view" = "add";
  public selectedPosition: any = null;
  public modalLoading: boolean = false;
  public formLoading: boolean = false;
  public deleteLoading: boolean = false;
  public loading: boolean = false;


  @ViewChild(DatatableComponent) table: DatatableComponent;


  private tempData = [];
  private _unsubscribeAll: Subject<any>;
  private form: FormGroup;

  constructor(
    private _positionListService: PositionListService,
    private _departmentListService: DepartmentListService,
    private _branchService: BranchService,
    private _coreConfigService: CoreConfigService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this._unsubscribeAll = new Subject();
    this.form = this.fb.group({
      branchName: [null, Validators.required],
      departmentId: [{ value: null, disabled: true }, Validators.required],
      positionName: [
        "",
        [
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(255),
        ],
      ],
    });
  }

  onSubmitReactiveForm(modal): void {
    this.formLoading = true;
    if (this.form.valid) {
      const formData = this.form.value;
      const dataToSend = {
        departmentId: formData.departmentId,
        positionName: formData.positionName,
      };

      if (this.modalMode === "add") {
        // Gọi API tạo mới
        this._positionListService.createPosition(dataToSend).subscribe(
          (response) => {
            this.formLoading = false;
            if (response.code === 201) {
              this.toastr.success("Thêm vị trí thành công", "Thành công");
              modal.close();
              this.fetchPositionList();
              this.form.reset();
            } else {
              this.displayApiErrors(response.message);
            }
          },
          (error) => {
            this.formLoading = false;
            console.error("Có lỗi xảy ra khi thêm mới", error);
          }
        );
      } else if (this.modalMode === "edit" && this.selectedPosition) {
        // Gọi API chỉnh sửa
        this._positionListService
          .updatePosition(this.selectedPosition.id, dataToSend)
          .subscribe(
            (response) => {
              this.formLoading = false;
              if (response.code === 200) {
                this.toastr.success("Chỉnh sửa chi nhánh thành công", "Thành công");
                modal.close();
                this.fetchPositionList();
                this.form.reset();
              } else {
                this.displayApiErrors(response.message);
              }
            },
            (error) => {
              this.formLoading = false;
              console.error("Có lỗi xảy ra khi chỉnh sửa", error);
            }
          );
      }
    }
  }

  deleteSelectedBranches(modal): void {
    this.deleteLoading = true;
    this._positionListService.deletePosition(this.deletedIds).subscribe(
      (response) => {
        if (response.code === 200) {
          this.deleteLoading = false;
          this.toastr.success("Xóa chức vụ thành công");
          this.fetchPositionList();
          this.selectedIds = [];
          this.deletedIds = [];
          this.table.selected = [];
          modal.close();
        }
        else {
          this.deleteLoading = false;
          this.toastr.error("Xóa chức vụ thất bại");
          modal.close();
        }
      },
      (error) => {
        this.deleteLoading = false;
        console.error("Có lỗi xảy ra khi xóa chức vụ", error);
      }
    );
  }

  fetchPositionList(): void {
    this.loading = true;
    this._positionListService.getDataTableRows().then((data) => {
      this.positions = data;

      this.loading = false;
    }).catch((error) => {
      this.toastr.error('Lỗi khi tải dữ liệu chi nhánh', 'Lỗi');
      console.error("Có lỗi khi tải danh sách chi nhánh", error);
      this.loading = false;
    });
  }



  displayApiErrors(apiErrors: any[]): void {
    apiErrors.forEach((err) => {
      if (this.form.controls[err.field]) {
        this.form.controls[err.field].setErrors({ apiError: err.errors });
      }
    });
  }

  openAddModal(modalRef): void {
    this.modalMode = "add";
    this.selectedPosition = null;
    this.form.reset();
    this.form.enable();
    this.form.get("departmentId").disable();
    this.modalService.open(modalRef, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
    });
  }

  openDeleteModal(modalRef, position?: any): void {
    if (position) {
      this.deletedIds = [position.id];
      this.selectedPosition = position;
    }
    else {
      this.selectedPosition = null;
    }
    this.modalService.open(modalRef, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
    });
  }
  onCloseModal(modal: any): void {
    this.form.reset();
    this.form.get("departmentId")?.disable();
    modal.dismiss('Cross click');
  }
  openDetailsOrUpdateModal(modalRef, position: any, mode: 'view' | 'edit'): void {
    this.modalLoading = true;
    this.modalMode = mode;
    this.selectedPosition = position;

    this.modalService.open(modalRef, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
    });

    if (position) {
      this._departmentListService.getDepartmentByBranch(this.selectedPosition.branch.id).subscribe((data) => {
        this.departments = data.data;
      });
      const detailPosition = {
        branchName: this.selectedPosition.branch.id || '',
        departmentId: this.selectedPosition.department.id || '',
        positionName: this.selectedPosition.positionName || '',
      };

      this.form.patchValue(detailPosition);
      this.modalLoading = false;

      if (mode === 'view') {
        this.form.disable();
      } else if (mode === 'edit') {
        this.form.enable();
      }
    }
    else {
      this.modalLoading = false;
    }
  }

  openDetailsModal(modalRef, position: Position): void {
    this.openDetailsOrUpdateModal(modalRef, position, 'view');
  }

  openEditModal(modalRef, position: Position): void {
    this.openDetailsOrUpdateModal(modalRef, position, 'edit');
  }


  onBranchChange(event: any) {
    const provinceId = event?.id;
    if (provinceId) {
      // Gọi API để lấy danh sách quận/huyện
      this._departmentListService.getDepartmentByBranch(provinceId).subscribe((data) => {
        if (data.code === 200) {
          console.log(data);
          this.departments = data.data;
          this.form.get('departmentId')?.enable();
          this.form.get('departmentId')?.setValue(null);
        }
        else {
          console.log(data.message);
        }
      });
    } else {
      this.form.get('departmentId')?.setValue(null);
      this.form.get('departmentId')?.disable();
    }
  }


  filterUpdate(event) {

    const val = event.target.value.toLowerCase();

    // Filter Our Data
    const temp = this.tempData.filter(function (d) {
      return d.fullName.toLowerCase().indexOf(val) !== -1 || !val;
    });

    // Update The Rows
    this.positions = temp;
    // Whenever The Filter Changes, Always Go Back To The First Page
    this.table.offset = 0;
  }

  onActivate(event) {

  }

  onSelect({ selected }) {
    this.selectedIds.splice(0, this.selectedIds.length);
    this.selectedIds.push(...selected);
    this.deletedIds = this.selectedIds.map(row => row.id);
  }

  filterRows(roleFilter, planFilter, statusFilter): any[] {
    // Reset search on select change
    this.searchValue1 = "";

    roleFilter = roleFilter.toLowerCase();
    planFilter = planFilter.toLowerCase();
    statusFilter = statusFilter.toLowerCase();

    return this.tempData.filter((row) => {
      const isPartialNameMatch =
        row.role.toLowerCase().indexOf(roleFilter) !== -1 || !roleFilter;
      const isPartialGenderMatch =
        row.currentPlan.toLowerCase().indexOf(planFilter) !== -1 || !planFilter;
      const isPartialStatusMatch =
        row.status.toLowerCase().indexOf(statusFilter) !== -1 || !statusFilter;
      return isPartialNameMatch && isPartialGenderMatch && isPartialStatusMatch;
    });
  }


  ngOnInit(): void {
    this.getBranches();
    // Subscribe to config changes
    this._coreConfigService.config
      .pipe(takeUntil(this._unsubscribeAll)) // Unsubscribe when component is destroyed
      .subscribe((config) => {
        //! If there is zoomIn route transition, delay the datatable load
        if (config.layout.animation === "zoomIn") {
          setTimeout(() => {
            this._positionListService.onPositionListChanged
              .pipe(takeUntil(this._unsubscribeAll))
              .subscribe((response) => {
                this.positions = response;
                this.tempData = this.positions;
              });
          }, 450);
        } else {
          this._positionListService.onPositionListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((branchResponse) => {
              this.positions = branchResponse;
              console.log("Position Data:", branchResponse);
              this.positions = branchResponse;
            });
        }
      });
  }

  getBranches() {
    this._branchService.getDataTableRows().then((data) => {
      this.branches = data;
    }).catch((error) => {
      console.error("Có lỗi khi tải danh sách chi nhánh", error);
      // this.loading = false;
    });
  }


  /**
   * On destroy
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }
}
