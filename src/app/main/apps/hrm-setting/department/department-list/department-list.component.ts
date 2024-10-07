import {
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import { ColumnMode, DatatableComponent } from "@swimlane/ngx-datatable";

import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { CoreConfigService } from "@core/services/config.service";

import { DepartmentListService } from "./department-list.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { FormBuilder, Validators } from "@angular/forms";
import { BranchService } from "../../branch/branch.service";
import { ToastrService } from "ngx-toastr";

@Component({
  selector: "app-department-list",
  templateUrl: "./department-list.component.html",
  styleUrls: ["./department-list.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class DepartmentListComponent implements OnInit {
  // Public
  public sidebarToggleRef = false;
  public rows;
  public selectedOption = 10;
  public ColumnMode = ColumnMode;
  public temp = [];
  public previousRoleFilter = "";
  public previousPlanFilter = "";
  public previousStatusFilter = "";
  public cols: any[];
  deleteLoading: boolean = false;
  public branches: any;
  public departments: any;
  public modalRef: any;
  filteredDepartments = [];
  public deleteIds = [];

  public modalMode: "add" | "edit" | "view" = "add";
  public selectedDepartment: any = null;

  public selectPlan: any = [
    { name: "All", value: "" },
    { name: "Basic", value: "Basic" },
    { name: "Company", value: "Company" },
    { name: "Enterprise", value: "Enterprise" },
    { name: "Team", value: "Team" },
  ];

  public selectStatus: any = [
    { name: "All", value: "" },
    { name: "Pending", value: "Pending" },
    { name: "Active", value: "Active" },
    { name: "Inactive", value: "Inactive" },
  ];

  public selectBranch = [];
  public selectedPlan1 = [];
  public selectedStatus1 = [];
  public searchValue1 = "";

  // Decorator
  @ViewChild(DatatableComponent) table: DatatableComponent;

  // Private
  private tempData = [];
  private _unsubscribeAll: Subject<any>;

  private form: any;
  public loading: boolean = false;

  /**
   * Constructor
   *
   * @param {CoreConfigService} _coreConfigService
   * @param {DepartmentListService} _departmentListService
   * @param {CoreSidebarService} _coreSidebarService
   */
  constructor(
    private _departmentListService: DepartmentListService,
    private _branchService: BranchService,
    private modalService: NgbModal,
    private _coreConfigService: CoreConfigService,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private toastr: ToastrService
  ) {
    this._unsubscribeAll = new Subject();
    this.form = this.fb.group({
      departmentName: [
        "",
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(255),
          Validators.pattern("^[^0-9]+$"),
        ],
      ],
      level: [
        "",
        [
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(10),
          Validators.pattern("^[0-9]+$"),
        ],
      ],
      branchId: [
        [
          Validators.required,
          Validators.pattern("^[0-9]+$"),
          Validators.minLength(1),
          Validators.maxLength(10),
        ],
      ],
      parentDepartmentId: [
        [
          Validators.minLength(1),
          Validators.maxLength(10),
          Validators.pattern("^[0-9]+$"),
        ],
      ],
    });
  }

  fetchDepartmentList(): void {
    this.loading = true;
    this._departmentListService.getDataTableRows().then(
      (departmentResponse) => {
        this.rows = departmentResponse;
        this.tempData = this.rows;

        if (this.table) {
          this.table.offset = 0;
          this.table.recalculate();
          this.loading = false;
        }

        // Call detectChanges to ensure the UI updates
        if (this.cd) {
          this.cd.detectChanges();
          this.loading = false;
        }
      },
      (error) => {
        console.error("Có lỗi khi lấy danh sách phòng ban:", error);
      }
    );
  }

  onSubmitReactiveForm(modal): void {
    if (this.form.valid) {
      const departmentData = this.form.value;
      departmentData.level = parseInt(departmentData.level, 10);

      if (this.modalMode === "add") {
        this._departmentListService.createDepartment(departmentData).subscribe(
          (response) => {
            this.toastr.success("Thêm chi nhánh thành công", "Thành công");
            console.log("Thêm phòng ban thành công", response);
            modal.close();
            if (this.modalRef) {
              this.form.reset();
              this.modalRef.close();
            }
            this.fetchDepartmentList();
            this.loadData();
          },
          (error) => {
            console.error("Có lỗi xảy ra khi thêm phòng ban", error);
          }
        );
      } else if (this.modalMode === "edit") {
        // Đúng cú pháp
        this._departmentListService
          .updateDepartment(this.selectedDepartment.id, departmentData)
          .subscribe(
            (response) => {
              this.toastr.success(
                "Cập nhật phòng ban thành công",
                "Thành công"
              );
              console.log("Cập nhật phòng ban thành công", response);
              modal.close();
              if (this.modalRef) {
                this.form.reset();
                this.modalRef.close();
              }
              this.fetchDepartmentList();
              this.loadData();
            },
            (error) => {
              console.error("Có lỗi xảy ra khi cập nhật phòng ban", error);
            }
          );
      }
    } else {
      console.log("Form không hợp lệ");
    }
  }

  displayApiErrors(apiErrors: any[]): void {
    apiErrors.forEach((err) => {
      if (this.form.controls[err.field]) {
        this.form.controls[err.field].setErrors({ apiError: err.errors });
      }
    });
  }

  get DepartmentName() {
    return this.form.get("departmentName");
  }

  get Level() {
    return this.form.get("level");
  }

  get BranchId() {
    return this.form.get("branchId");
  }

  get ParentDepartmentId() {
    return this.form.get("parentDepartmentId");
  }

  // Public Methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * filterUpdate
   *
   * @param event
   */
  filterUpdate(event) {
    // Reset ng-select on search
    // this.selectBranch = this.selectRole[0];
    this.selectedPlan1 = this.selectPlan[0];
    this.selectedStatus1 = this.selectStatus[0];

    const val = event.target.value.toLowerCase();

    // Filter Our Data
    const temp = this.tempData.filter(function (d) {
      return d.departmentName.toLowerCase().indexOf(val) !== -1 || !val;
    });

    // Update The Rows
    this.rows = temp;
    // Whenever The Filter Changes, Always Go Back To The First Page
    this.table.offset = 0;
  }

  /**
   * Toggle the sidebar
   *
   * @param name
   */

  //Modal Basic
  modalOpen(modalBasic): void {
    this.form.reset();

    // Load branch and department data before opening the modal
    Promise.all([
      this._branchService.getDataTableRows(), // Lấy dữ liệu chi nhánh
      this._departmentListService.getDataTableRows(), // Lấy dữ liệu phòng ban gốc
    ])
      .then(([branchResponse, departmentResponse]) => {
        this.branches = branchResponse; // Cập nhật danh sách chi nhánh
        this.departments = departmentResponse; // Cập nhật danh sách phòng ban gốc
        console.log("Branch Data:", this.branches);
        console.log("Department Data:", this.departments);

        // Sau khi có dữ liệu, mở modal
        this.modalRef = this.modalService.open(modalBasic, {
          size: "lg",
          centered: true,
          backdrop: "static",
          keyboard: false,
        });
      })
      .catch((error) => {
        console.error("Error loading data for modal:", error);
      });
  }
  openAddModal(modalRef): void {
    this.modalMode = "add";
    this.selectedDepartment = null;
    this.form.reset(); // Reset form cho chức năng thêm mới
    this.form.enable();

    // Đảm bảo rằng modalRef được gán cho this.modalRef
    this.modalRef = this.modalService.open(modalRef, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
    });
  }

  // Mở modal cho chức năng chỉnh sửa
  openEditModal(modalRef, branch): void {
    this.modalMode = "edit";
    this.selectedDepartment = branch;
    this.form.patchValue(branch); // Load dữ liệu chi nhánh vào form
    this.form.enable(); // Vô hiệu hóa form để đang chính sửa();
    this.modalService.open(modalRef, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
    }); // Mở modal và truyền tham chiếu modalRef
  }

  // Mở modal cho chức năng xem chi tiết
  openDetailsModal(modalRef, department): void {
    this.modalMode = "view";
    this.selectedDepartment = department;
    console.log(department);
    const detailData = {
      departmentName: department.departmentName,
      level: department.level,
      branchId: department.branch ? department.branch.id : null, // Map branch id
      parentDepartmentId: department.parentDepartment
        ? department.parentDepartment.id
        : null, // Map parent department id if it exists
    };

    this.form.patchValue(detailData); // Load dữ liệu chi nhánh vào form
    this.form.disable(); // Vô hiệu hóa form để chỉ hiển thị (không chỉnh sửa)
    this.modalService.open(modalRef, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
    }); // Mở modal và truyền tham chiếu modalRef
  }

  openDeleteModal(modalRef, department): void {
    if (department) {
      this.deleteIds = [department.id];
      this.selectedDepartment = department;
    } else {
      this.selectBranch = null;
    }
    // Lưu phòng ban cần xóa
    this.modalService.open(modalRef, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
    });
  }

  deleteDepartment(modal) {
    this.deleteLoading = true; // Thêm dòng này
    this._departmentListService.deleteDepartment(this.deleteIds).subscribe(
      (response) => {
        if (response.code === 200) {
          this.toastr.success("Xóa phần ban thành công");
          this.selectedDepartment = null;
          this.deleteIds = [];
          this.fetchDepartmentList();
          this.loadData();
          this.deleteLoading = false; // Thêm dòng này
          modal.close();
        }
      },
      (error) => {
        console.error("Error deleting department:", error);
        this.deleteLoading = false; // Thêm dòng này
      }
    );
  }

  /**
   * Filter By Roles
   *
   * @param event
   */
  filterByRole(event) {
    const filter = event ? event.value : "";
    this.previousRoleFilter = filter;
    this.temp = this.filterRows(
      filter,
      this.previousPlanFilter,
      this.previousStatusFilter
    );
    this.rows = this.temp;
  }

  /**
   * Filter By Plan
   *
   * @param event
   */
  filterByPlan(event) {
    const filter = event ? event.value : "";
    this.previousPlanFilter = filter;
    this.temp = this.filterRows(
      this.previousRoleFilter,
      filter,
      this.previousStatusFilter
    );
    this.rows = this.temp;
  }

  /**
   * Filter By Status
   *
   * @param event
   */
  filterByStatus(event) {
    const filter = event ? event.value : "";
    this.previousStatusFilter = filter;
    this.temp = this.filterRows(
      this.previousRoleFilter,
      this.previousPlanFilter,
      filter
    );
    this.rows = this.temp;
  }

  /**
   * Filter Rows
   *
   * @param roleFilter
   * @param planFilter
   * @param statusFilter
   */
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

  // Lifecycle Hooks
  // -----------------------------------------------------------------------------------------------------
  /**
   * On init
   */
  ngOnInit(): void {
    this.fetchDepartmentList();
    this.cols = [
      { field: "departmentName", header: "Tên Phòng Ban" },
      { field: "level", header: "Cấp Độ" },
      { field: "branchName", header: "Tên Chi Nhánh" },
      { field: "parenDepartmentName", header: "Phòng Ban Gốc" },
    ];
    // this.cols = [
    //   { field: "name", header: "Name" },
    //   { field: "size", header: "Size" },
    //   { field: "type", header: "Type" },
    // ];
    this._coreConfigService.config
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((config) => {
        //! If we have zoomIn route Transition then load datatable after 450ms(Transition will finish in 400ms)
        if (config.layout.animation === "zoomIn") {
          this._departmentListService.onUserListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((response) => {
              this.rows = response;
              this.tempData = this.rows;
            });
          this._branchService.onBranchListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((branchResponse) => {
              console.log("Branch Data:", branchResponse);
              this.branches = branchResponse;
            });
          console.log("1");
          this.loadParentDepartments(); // Gọi hàm loadParentDepartments ở đây
        } else {
          this.loadData();
          this.loadParentDepartments();
          // Gọi hàm loadParentDepartments ở đây
        }
      });
    // Đảm bảo mảng không bị undefined
  }

  onBranchChange(selectedBranch: any) {
    // Filter the departments based on the selected branchId
    console.log("selectedBranchId", selectedBranch);
    console.log("rows", this.rows);
    this.filteredDepartments = getDepartmentsByBranch(
      this.rows,
      selectedBranch.branchName
    );

    console.log("filteredDepartments", this.filteredDepartments);

    // Reset the selected parent department when the branch changes
    this.form.get("parentDepartmentId").setValue(null);
  }

  /*************  ✨ Codeium Command ⭐  *************/
  /**
   * Load department and branch data
   *
   * @description
   * This function makes two API calls to load department and branch data. The department data is used to populate the department list table, while the branch data is used to populate the department list table and the department edit form.
   * @returns {Promise<any[]>}
   */
  /******  6c2e777a-7a0d-4650-843f-82aa3dc00d7c  *******/
  loadData(): void {
    Promise.all([
      this._departmentListService.getDataTableRows(), // API call for department data
      this._branchService.getDataTableRows(), // API call for branch data
    ])
      .then(([departmentResponse, branchResponse]) => {
        this.rows = departmentResponse; // Set department data
        this.tempData = this.rows;
        this.branches = branchResponse; // Set branch data
        console.log("Branch Data:", this.branches);
        console.log("this.rows", this.rows);
      })
      .catch((error) => {
        console.error("Error loading data:", error);
      });
  }

  loadParentDepartments(): void {
    this._departmentListService
      .getDataTableRows()
      .then((departmentResponse) => {
        // Dữ liệu phòng ban gốc
        this.departments = departmentResponse.map(
          convertDepartmentToTargetObject
        );
        // this.departments = [
        //   {
        //     data: {
        //       name: "Applications",
        //       size: "200mb",
        //       type: "Folder",
        //     },
        //     children: [
        //       {
        //         data: {
        //           name: "Angular",
        //           size: "25mb",
        //           type: "Folder",
        //         },
        //         children: [
        //           {
        //             data: {
        //               name: "angular.app",
        //               size: "10mb",
        //               type: "Application",
        //             },
        //           },
        //           {
        //             data: {
        //               name: "cli.app",
        //               size: "10mb",
        //               type: "Application",
        //             },
        //           },
        //           {
        //             data: {
        //               name: "mobile.app",
        //               size: "5mb",
        //               type: "Application",
        //             },
        //           },
        //         ],
        //       },
        //       {
        //         data: {
        //           name: "editor.app",
        //           size: "25mb",
        //           type: "Application",
        //         },
        //       },
        //       {
        //         data: {
        //           name: "settings.app",
        //           size: "50mb",
        //           type: "Application",
        //         },
        //       },
        //     ],
        //   },
        //   {
        //     data: {
        //       name: "Cloud",
        //       size: "20mb",
        //       type: "Folder",
        //     },
        //     children: [
        //       {
        //         data: {
        //           name: "backup-1.zip",
        //           size: "10mb",
        //           type: "Zip",
        //         },
        //       },
        //       {
        //         data: {
        //           name: "backup-2.zip",
        //           size: "10mb",
        //           type: "Zip",
        //         },
        //       },
        //     ],
        //   },
        //   {
        //     data: {
        //       name: "Desktop",
        //       size: "150kb",
        //       type: "Folder",
        //     },
        //     children: [
        //       {
        //         data: {
        //           name: "note-meeting.txt",
        //           size: "50kb",
        //           type: "Text",
        //         },
        //       },
        //       {
        //         data: {
        //           name: "note-todo.txt",
        //           size: "100kb",
        //           type: "Text",
        //         },
        //       },
        //     ],
        //   },
        //   {
        //     data: {
        //       name: "Documents",
        //       size: "75kb",
        //       type: "Folder",
        //     },
        //     children: [
        //       {
        //         data: {
        //           name: "Work",
        //           size: "55kb",
        //           type: "Folder",
        //         },
        //         children: [
        //           {
        //             data: {
        //               name: "Expenses.doc",
        //               size: "30kb",
        //               type: "Document",
        //             },
        //           },
        //           {
        //             data: {
        //               name: "Resume.doc",
        //               size: "25kb",
        //               type: "Resume",
        //             },
        //           },
        //         ],
        //       },
        //       {
        //         data: {
        //           name: "Home",
        //           size: "20kb",
        //           type: "Folder",
        //         },
        //         children: [
        //           {
        //             data: {
        //               name: "Invoices",
        //               size: "20kb",
        //               type: "Text",
        //             },
        //           },
        //         ],
        //       },
        //     ],
        //   },
        //   {
        //     data: {
        //       name: "Downloads",
        //       size: "25mb",
        //       type: "Folder",
        //     },
        //     children: [
        //       {
        //         data: {
        //           name: "Spanish",
        //           size: "10mb",
        //           type: "Folder",
        //         },
        //         children: [
        //           {
        //             data: {
        //               name: "tutorial-a1.txt",
        //               size: "5mb",
        //               type: "Text",
        //             },
        //           },
        //           {
        //             data: {
        //               name: "tutorial-a2.txt",
        //               size: "5mb",
        //               type: "Text",
        //             },
        //           },
        //         ],
        //       },
        //       {
        //         data: {
        //           name: "Travel",
        //           size: "15mb",
        //           type: "Text",
        //         },
        //         children: [
        //           {
        //             data: {
        //               name: "Hotel.pdf",
        //               size: "10mb",
        //               type: "PDF",
        //             },
        //           },
        //           {
        //             data: {
        //               name: "Flight.pdf",
        //               size: "5mb",
        //               type: "PDF",
        //             },
        //           },
        //         ],
        //       },
        //     ],
        //   },
        //   {
        //     data: {
        //       name: "Main",
        //       size: "50mb",
        //       type: "Folder",
        //     },
        //     children: [
        //       {
        //         data: {
        //           name: "bin",
        //           size: "50kb",
        //           type: "Link",
        //         },
        //       },
        //       {
        //         data: {
        //           name: "etc",
        //           size: "100kb",
        //           type: "Link",
        //         },
        //       },
        //       {
        //         data: {
        //           name: "var",
        //           size: "100kb",
        //           type: "Link",
        //         },
        //       },
        //     ],
        //   },
        //   {
        //     data: {
        //       name: "Other",
        //       size: "5mb",
        //       type: "Folder",
        //     },
        //     children: [
        //       {
        //         data: {
        //           name: "todo.txt",
        //           size: "3mb",
        //           type: "Text",
        //         },
        //       },
        //       {
        //         data: {
        //           name: "logo.png",
        //           size: "2mb",
        //           type: "Picture",
        //         },
        //       },
        //     ],
        //   },
        //   {
        //     data: {
        //       name: "Pictures",
        //       size: "150kb",
        //       type: "Folder",
        //     },
        //     children: [
        //       {
        //         data: {
        //           name: "barcelona.jpg",
        //           size: "90kb",
        //           type: "Picture",
        //         },
        //       },
        //       {
        //         data: {
        //           name: "primeng.png",
        //           size: "30kb",
        //           type: "Picture",
        //         },
        //       },
        //       {
        //         data: {
        //           name: "prime.jpg",
        //           size: "30kb",
        //           type: "Picture",
        //         },
        //       },
        //     ],
        //   },
        //   {
        //     data: {
        //       name: "Videos",
        //       size: "1500mb",
        //       type: "Folder",
        //     },
        //     children: [
        //       {
        //         data: {
        //           name: "primefaces.mkv",
        //           size: "1000mb",
        //           type: "Video",
        //         },
        //       },
        //       {
        //         data: {
        //           name: "intro.avi",
        //           size: "500mb",
        //           type: "Video",
        //         },
        //       },
        //     ],
        //   },
        // ];
        console.log("Department Data:", this.departments); // Logging để kiểm tra dữ liệu trả về
      })
      .catch((error) => {
        console.error("Error loading departments:", error);
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

function convertDepartmentToTargetObject(department) {
  // Copy the department properties to the new structure
  const targetObject = {
    data: {
      ...department,
      branchName: department.branch.branchName,
      parenDepartmentName: department.parentDepartment?.departmentName,
    }, // Spread the existing properties of the department
    children: department.childDepartments
      ? department.childDepartments.map((child) =>
          convertDepartmentToTargetObject(child)
        )
      : [],
  };

  // Remove the original childDepartments property as it's replaced by children
  delete targetObject.data.childDepartments;

  return targetObject;
}

function getDepartmentsByBranch(departments, branchName) {
  // Helper function to recursively flatten the child departments
  function flattenDepartments(departmentList) {
    let flatList = [];

    departmentList.forEach((department) => {
      // Push the department if its branchName matches
      if (department.branch.branchName === branchName) {
        // Create a shallow copy of the department without childDepartments
        let departmentWithoutChildren = { ...department };
        delete departmentWithoutChildren.childDepartments;
        flatList.push(departmentWithoutChildren);
      }

      // If the department has child departments, flatten them as well
      if (
        department.childDepartments &&
        department.childDepartments.length > 0
      ) {
        flatList = flatList.concat(
          flattenDepartments(department.childDepartments)
        );
      }
    });

    return flatList;
  }

  // Start flattening the departments from the root list
  return flattenDepartments(departments);
}
