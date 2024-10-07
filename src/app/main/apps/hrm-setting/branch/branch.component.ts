import { Component, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { ColumnMode, DatatableComponent, SelectionType } from "@swimlane/ngx-datatable";

import { Subject } from "rxjs";
import { debounceTime, distinctUntilChanged, takeUntil } from "rxjs/operators";

import { CoreConfigService } from "@core/services/config.service";

import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { FlatpickrOptions } from "ng2-flatpickr";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { ValidationPatterns } from "common/validation-patterns";
import { Branch } from "shared/models/branch.model";
import { BranchService } from "./branch.service";


@Component({
  selector: "app-branch",
  templateUrl: "./branch.component.html",
  styleUrls: ["./branch.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class BranchComponent implements OnInit {
  // Public
  public temp = [];
  public rows: any[] = [];
  public selectedOption = 10;
  public ColumnMode = ColumnMode;
  public provinces: any = [];
  public districts: any = [];
  public wards: any = [];
  public modalMode: "add" | "edit" | "view" = "add";
  public selectedBranch: any = null;
  public selectedIds = [];
  public deletedIds = [];
  public SelectionType = SelectionType;
  public selectedRows: any[] = [];

  public basicDateOptions: FlatpickrOptions = {
    altInput: true,
  };
  formErrors: { [key: string]: string[] } = {};

  public searchValue1: string = "";

  // Decorator
  @ViewChild(DatatableComponent) table: DatatableComponent;

  // Private
  private tempData = [];
  private _unsubscribeAll: Subject<any>;
  private form: FormGroup;
  public loading: boolean = false;
  public formLoading: boolean = false;
  public modalLoading: boolean = false;
  public deleteLoading: boolean = false;
  public isLoadingDistricts = false;
  public isLoadingWards = false;

  constructor(
    private _branchService: BranchService,
    private modalService: NgbModal,
    private _coreConfigService: CoreConfigService,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this._unsubscribeAll = new Subject();
    this.initializeForm();
    this.fetchBranchList();
  }

  initializeForm(): void {
    this.form = this.fb.group({
      branchName: [
        "",
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(255),
        ],
      ],
      province: [null, Validators.required],
      district: [{ value: null, disabled: true }, Validators.required],
      ward: [{ value: null, disabled: true }, Validators.required],
      specificAddress: [
        "",
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(255),
        ],
      ],
      email: ["", [Validators.required, Validators.pattern(ValidationPatterns.EMAIL)]],
      phoneNumber: [
        "",
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(10),
          Validators.pattern(ValidationPatterns.PHONE),
        ],
      ],
      taxCode: ["", [Validators.required, Validators.pattern(ValidationPatterns.TAX_CODE)]],
      provinceName: [""],
      districtName: [""],
      wardName: [""]
    });
  }

  // onCheckboxChange(event: any, rowId: number): void {
  //   console.log(event.target.checked, rowId);

  //   if (event.target.checked) {
  //     this.selectedIds.push(rowId);
  //   } else {
  //     this.selectedIds = this.selectedIds.filter(id => id !== rowId);
  //   }
  // }

  onActivate(event) {

  }

  onSelect({ selected }) {
    this.selectedIds.splice(0, this.selectedIds.length);
    this.selectedIds.push(...selected);
    this.deletedIds = this.selectedIds.map(row => row.id);
  }


  fetchBranchList(): void {
    this.loading = true;
    this._branchService.getDataTableRows().then((data) => {
      this.rows = data.map(branch => {
        const fullAddress = [
          branch.specificAddress,
          branch.ward,
          branch.district,
          branch.province
        ]
          .filter(part => part && part.trim())
          .join(', ');
        return {
          ...branch,
          address: fullAddress || "N/A"
        };

      });
      this.loading = false;
    }).catch((error) => {
      this.toastr.error('Lỗi khi tải dữ liệu chi nhánh', 'Lỗi');
      console.error("Có lỗi khi tải danh sách chi nhánh", error);
      this.loading = false;
    });
  }

  onSubmitReactiveForm(modal): void {
    this.formLoading = true;
    if (this.form.valid) {
      const formData = this.form.value;
      const dataToSend: Branch = {
        branchName: formData.branchName,
        province: formData.provinceName,
        district: formData.districtName,
        ward: formData.wardName,
        specificAddress: formData.specificAddress,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        taxCode: formData.taxCode
      };

      if (this.modalMode === "add") {
        // Gọi API tạo mới
        this._branchService.createBranch(dataToSend).subscribe(
          (response) => {
            this.formLoading = false;
            if (response.code === 201) {
              this.toastr.success("Thêm chi nhánh thành công", "Thành công");
              modal.close();
              this.fetchBranchList();
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
      } else if (this.modalMode === "edit" && this.selectedBranch) {
        // Gọi API chỉnh sửa
        this._branchService
          .updateBranch(this.selectedBranch.id, dataToSend)
          .subscribe(
            (response) => {
              this.formLoading = false;
              if (response.code === 200) {
                this.toastr.success("Chỉnh sửa chi nhánh thành công", "Thành công");
                modal.close();
                this.fetchBranchList();
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

  displayApiErrors(apiErrors: any[]): void {
    apiErrors.forEach((err) => {
      if (this.form.controls[err.field]) {
        this.form.controls[err.field].setErrors({ apiError: err.errors });
      }
    });
  }

  filterUpdate(event) {

    const val = event.target.value.toLowerCase();

    // Filter Our Data
    const temp = this.tempData.filter(function (d) {
      return d.branchName.toLowerCase().indexOf(val) !== -1 || !val;
    });

    this.rows = temp.map(branch => {
      const fullAddress = [
        branch.specificAddress,
        branch.ward,
        branch.district,
        branch.province
      ]
        .filter(part => part && part.trim())
        .join(', ');

      return {
        ...branch,
        address: fullAddress || "N/A"
      };
    });

    this.table.offset = 0;
  }

  openAddModal(modalRef): void {
    this.modalMode = "add";
    this.selectedBranch = null;
    this.form.reset();
    this.form.enable();
    this.form.get("ward").disable();
    this.form.get("district").disable();
    this.modalService.open(modalRef, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
    });
  }
  onCloseModal(modal: any): void {
    this.form.reset(); // Reset toàn bộ form
    this.form.get("ward")?.disable();    // Vô hiệu hóa trường `ward`
    this.form.get("district")?.disable(); // Vô hiệu hóa trường `district`
    modal.dismiss('Cross click'); // Đóng modal
  }

  openDetailsOrUpdateModal(modalRef, branch: Branch, mode: 'view' | 'edit'): void {
    this.modalLoading = true;
    this.modalMode = mode;
    this.selectedBranch = branch;

    // Mở modal ngay lập tức và hiển thị trạng thái loading bên trong modal
    this.modalService.open(modalRef, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
    });

    const selectedProvince = this.provinces.find(province => province.name === branch.province);

    if (selectedProvince) {
      this._branchService.getDistricts(selectedProvince.code).subscribe((districtData) => {
        this.districts = districtData.districts;

        const selectedDistrict = this.districts.find(district => district.name === branch.district);

        if (selectedDistrict) {
          this._branchService.getWards(selectedDistrict.code).subscribe((wardData) => {
            this.wards = wardData.wards;

            const selectedWard = this.wards.find(ward => ward.name === branch.ward);

            const detailBranch = {
              ...branch,
              province: selectedProvince.code,
              district: selectedDistrict ? selectedDistrict.code : '',
              ward: selectedWard ? selectedWard.code : '',
              provinceName: selectedProvince.name || '',
              districtName: selectedDistrict.name || '',
              wardName: selectedWard.name || '',
            };

            this.form.patchValue(detailBranch);
            this.modalLoading = false; // Khi dữ liệu đã tải xong, tắt trạng thái loading

            // Xử lý chế độ view hoặc edit
            if (mode === 'view') {
              this.form.disable();
            } else if (mode === 'edit') {
              this.form.enable();
            }
          });
        }
      });
    } else {
      this.modalLoading = false; // Nếu không tìm thấy tỉnh, tắt trạng thái loading
    }
  }

  openDetailsModal(modalRef, branch: Branch): void {
    this.openDetailsOrUpdateModal(modalRef, branch, 'view');
  }

  openEditModal(modalRef, branch: Branch): void {
    this.openDetailsOrUpdateModal(modalRef, branch, 'edit');
  }

  openDeleteModal(modalRef, branch?: Branch): void {
    if (branch) {
      this.deletedIds = [branch.id];
      this.selectedBranch = branch;
    }
    else {
      this.selectedBranch = null;
    }
    this.modalService.open(modalRef, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
    });
  }


  deleteSelectedBranches(modal): void {
    this.deleteLoading = true;
    this._branchService.deleteBranch(this.deletedIds).subscribe(
      (response) => {
        if (response.code === 200) {
          this.deleteLoading = false;
          this.toastr.success("Xóa chi nhánh thành công");
          this.fetchBranchList();
          this.selectedIds = [];
          this.deletedIds = [];
          this.table.selected = [];
          modal.close();
        }
        else {
          this.deleteLoading = false;
          this.toastr.error("Xóa chi nhánh thất bại");
          modal.close();
        }
      },
      (error) => {
        this.deleteLoading = false;
        console.error("Có lỗi xảy ra khi xóa chi nhánh", error);
      }
    );
  }

  onProvinceChange(event: any) {
    const provinceId = event?.code;
    if (provinceId) {
      const selectedProvince = this.provinces.find(province => province.code == provinceId);
      if (selectedProvince) {
        this.form.patchValue({
          province: provinceId,
          provinceName: selectedProvince.name
        });
      }
      // Gọi API để lấy danh sách quận/huyện
      this._branchService.getDistricts(provinceId).subscribe((data) => {
        this.districts = data.districts;

        this.form.get('district')?.enable();
        this.form.get('district')?.setValue(null);

        this.form.get('ward')?.setValue(null);
        this.form.get('ward')?.disable();
      });
    } else {
      this.form.get('district')?.setValue(null);
      this.form.get('district')?.disable();
      this.form.get('ward')?.setValue(null);
      this.form.get('ward')?.disable();
    }
  }

  onDistrictChange(event: any) {
    const districtId = event?.code;
    if (districtId) {
      const selectedDistrict = this.districts.find(district => district.code == districtId);
      if (selectedDistrict) {
        this.form.patchValue({
          district: districtId,
          districtName: selectedDistrict.name
        });
      }
      this._branchService.getWards(districtId).subscribe((data) => {
        this.wards = data.wards;


        this.form.get('ward')?.enable();
        this.form.get('ward')?.setValue(null);
      });
    } else {
      this.form.get('ward')?.setValue(null);
      this.form.get('ward')?.disable();
    }
  }

  // Function to handle ward change
  onWardChange(event: any) {
    const wardId = event?.code;
    if (wardId) {
      const selectedWard = this.wards.find(ward => ward.code == wardId);
      if (selectedWard) {
        this.form.patchValue({
          ward: wardId,
          wardName: selectedWard.name
        });
      }
    }
  }

  ngOnInit(): void {

    this.fetchBranchList();
    this._branchService.getProvinces().subscribe((response) => {
      this.provinces = response;
    });

    this._coreConfigService.config
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((config) => {
        if (config.layout.animation === "zoomIn") {
          setTimeout(() => {
            this._branchService.onBranchListChanged
              .pipe(takeUntil(this._unsubscribeAll))
              .subscribe((response) => {
                this.rows = response;
                this.tempData = this.rows;
              });
          }, 450);
        } else {
          this._branchService.onBranchListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((response) => {
              this.rows = response;
              this.tempData = this.rows;
            });
        }
      });
  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }
}
