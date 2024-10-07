import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import {
  AbstractControl,
  UntypedFormBuilder,
  UntypedFormGroup,
  ValidationErrors,
  Validators,
} from "@angular/forms";

import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";

import { CoreConfigService } from "@core/services/config.service";
import { ToastrService } from "ngx-toastr";
@Component({
  selector: "app-auth-reset-password-v2",
  templateUrl: "./auth-reset-password-v2.component.html",
  styleUrls: ["./auth-reset-password-v2.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class AuthResetPasswordV2Component implements OnInit {
  // Public
  public coreConfig: any;
  public passwordTextType: boolean;
  public confPasswordTextType: boolean;
  public resetPasswordForm: UntypedFormGroup;
  public submitted = false;

  // Private
  private _unsubscribeAll: Subject<any>;

  /**
   * Constructor
   *
   * @param {CoreConfigService} _coreConfigService
   * @param {FormBuilder} _formBuilder
   */
  constructor(
    private _coreConfigService: CoreConfigService,
    private _formBuilder: UntypedFormBuilder,
    private toastr: ToastrService
  ) {
    this._unsubscribeAll = new Subject();

    // Configure the layout
    this._coreConfigService.config = {
      layout: {
        navbar: {
          hidden: true,
        },
        menu: {
          hidden: true,
        },
        footer: {
          hidden: true,
        },
        customizer: false,
        enableLocalStorage: false,
      },
    };
  }

  // convenience getter for easy access to form fields
  get f() {
    return this.resetPasswordForm.controls;
  }

  /**
   * Toggle password
   */
  togglePasswordTextType() {
    this.passwordTextType = !this.passwordTextType;
  }

  /**
   * Toggle confirm password
   */
  toggleConfPasswordTextType() {
    this.confPasswordTextType = !this.confPasswordTextType;
  }

  /**
   * On Submit
   */
  onSubmit() {
    this.submitted = true;

    // stop here if form is invalid
    if (this.resetPasswordForm.invalid) {
      this.toastr.error(
        "Thông tin không hợp lệ. Vui lòng kiểm tra lại!",
        "Lỗi"
      );
      return;
    }

    this.toastr.success("Đặt lại mật khẩu thành công!", "Thành công");
  }

  mustMatch(newPassword: string, confirmPassword: string) {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const passControl = formGroup.get(newPassword);
      const confirmPassControl = formGroup.get(confirmPassword);

      if (!passControl || !confirmPassControl) {
        return null;
      }

      if (
        confirmPassControl.errors &&
        !confirmPassControl.errors["mustMatch"]
      ) {
        return null;
      }

      // So sánh giá trị của mật khẩu và xác nhận mật khẩu
      if (passControl.value !== confirmPassControl.value) {
        confirmPassControl.setErrors({ mustMatch: true });
      } else {
        confirmPassControl.setErrors(null);
      }

      return null;
    };
  }

  // Lifecycle Hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    this.resetPasswordForm = this._formBuilder.group(
      {
        newPassword: [
          "",
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(
              "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"
            ),
          ],
        ],
        confirmPassword: ["", Validators.required],
      },
      {
        validator: this.mustMatch("newPassword", "confirmPassword"), // Hàm so khớp mật khẩu
      }
    );

    // Subscribe to config changes
    this._coreConfigService.config
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((config) => {
        this.coreConfig = config;
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
