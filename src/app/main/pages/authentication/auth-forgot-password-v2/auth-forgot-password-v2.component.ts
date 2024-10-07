import {
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { first, takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import { Router } from "@angular/router"; // Import Router

import { CoreConfigService } from "@core/services/config.service";
import { AuthenticationService } from "app/auth/service";
import { ToastrService } from "ngx-toastr";
@Component({
  selector: "app-auth-forgot-password-v2",
  templateUrl: "./auth-forgot-password-v2.component.html",
  styleUrls: ["./auth-forgot-password-v2.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class AuthForgotPasswordV2Component implements OnInit {
  // Public variables
  public emailVar;
  public coreConfig: any;
  public loading = false;
  public forgotPasswordForm: UntypedFormGroup;
  public otpForm: UntypedFormGroup; // Form for OTP
  public resetPasswordForm: UntypedFormGroup;
  public showEmailForm = true;
  public submitted = false;
  public submittedResetPassword = false;
  public submittedOtp = false; // Track OTP submission
  public showOtpForm = false; // Track whether to show OTP form or not
  public showResetPasswordForm = false;
  public resendingOtp = false; // Quản lý trạng thái gửi lại OTP
  public resendOtpMessage: string = ""; // Thông báo sau khi gửi OTP
  // Reference for OTP modal template
  @ViewChild("otpModalTemplate") otpModalTemplate: TemplateRef<any>;

  // Private subject for cleanup
  private _unsubscribeAll: Subject<any>;

  /**
   * Constructor
   *
   * @param {CoreConfigService} _coreConfigService
   * @param {FormBuilder} _formBuilder
   * @param {NgbModal} modalService
   * @param {Router} router // Inject the Router here
   *
   */
  constructor(
    private _coreConfigService: CoreConfigService,
    private _formBuilder: UntypedFormBuilder,
    private modalService: NgbModal,
    private _authenticationService: AuthenticationService,
    private router: Router,
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
    return this.forgotPasswordForm.controls;
  }

  get fOtp() {
    return this.otpForm.controls;
  }
  get fReset() {
    return this.resetPasswordForm.controls;
  }
  resendOtp(): void {
    this.resendingOtp = true;
    this.resendOtpMessage = "";

    // Gọi API gửi lại OTP
    this._authenticationService
      .resendOtp(this.f.email.value)
      .pipe(first())
      .subscribe(
        (response) => {
          if (response.code === 201) {
            this.toastr.success(
              "OTP đã được gửi lại thành công!",
              "Thành công"
            ); // Success toastr
            this.resendOtpMessage = response.message;
            this.resendingOtp = false;
          }
        },
        (error) => {
          this.toastr.error(
            "Có lỗi xảy ra khi gửi lại OTP. Vui lòng thử lại!",
            "Lỗi"
          ); // Error toastr
          this.resendingOtp = false;
        }
      );
  }

  /**
   * Handle the form submission for email (forgot password)
   */
  onSubmit() {
    this.submitted = true;

    // stop here if form is invalid
    if (this.forgotPasswordForm.invalid) {
      return;
    }

    // Simulate sending the reset password email
    this.loading = true;

    this._authenticationService
      .resendOtp(this.forgotPasswordForm.value.email)
      .pipe(first())
      .subscribe((response) => {
        if (response.code === 201) {
          this.toastr.success(
            "OTP đã được gửi đến email của bạn!",
            "Thành công"
          );
          this.showEmailForm = false;
          this.showOtpForm = true;
          this.loading = false;
        } else {
          if (response.message) {
            // Gán lỗi cho các trường cụ thể trong form
            if (response.message) {
              this.forgotPasswordForm.controls["email"].setErrors({
                serverError: response.message,
              });
            }
          }
          this.toastr.error("Có lỗi xảy ra. Vui lòng thử lại!", "Lỗi");
          // Ngừng loading và không chuyển trang
          this.loading = false;
        }
      });
  }

  /**
   * Handle the form submission for OTP verification
   */
  onSubmitOtp() {
    this.submittedOtp = true;

    if (this.otpForm.invalid) {
      this.toastr.error("OTP không hợp lệ. Vui lòng kiểm tra lại!", "Lỗi");
      return;
    }

    this.loading = true;

    this._authenticationService
      .verifyOtp(this.otpForm.value.otp)

      .pipe(first())
      .subscribe((response) => {
        if (response.code === 201) {
          this.toastr.success("OTP xác nhận thành công!", "Thành công");
          this.loading = false;
          this.showOtpForm = false;
          this.showResetPasswordForm = true; // Mở form đặt lại mật khẩu
        } else {
          this.toastr.error("OTP không hợp lệ. Vui lòng thử lại!", "Lỗi");
          // Xử lý lỗi OTP không hợp lệ
          this.loading = false;
        }
      });
  }

  // Lifecycle Hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    // Initialize the forgot password form
    this.forgotPasswordForm = this._formBuilder.group({
      email: ["", [Validators.required, Validators.email]],
    });

    // Initialize the OTP form
    this.otpForm = this._formBuilder.group({
      otp: ["", [Validators.required, Validators.minLength(6)]],
    });

    this.resetPasswordForm = this._formBuilder.group(
      {
        newPassword: [
          "",
          [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(255),
            Validators.pattern(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)/), // Pattern for strong password
          ],
        ],
        confirmPassword: ["", Validators.required],
      },
      {
        validator: this.mustMatch("newPassword", "confirmPassword"), // Custom validator
      }
    );
    // Subscribe to config changes
    this._coreConfigService.config
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((config) => {
        this.coreConfig = config;
      });
  }

  mustMatch(newPassword: string, confirmPassword: string) {
    return (formGroup: UntypedFormGroup) => {
      const control = formGroup.controls[newPassword];
      const matchingControl = formGroup.controls[confirmPassword];

      if (matchingControl.errors && !matchingControl.errors.mustMatch) {
        return;
      }

      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ mustMatch: true });
      } else {
        matchingControl.setErrors(null);
      }
    };
  }

  // Mở modal đặt lại mật khẩu
  openResetPasswordModal() {
    const modalRef = this.modalService.open("resetPasswordModal");
    modalRef.result.then((result) => {
      console.log("Modal closed");
    });
  }

  // Submit form đặt lại mật khẩu
  onSubmitResetPassword() {
    this.submittedResetPassword = true;

    if (this.resetPasswordForm.invalid) {
      this.toastr.error(
        "Thông tin không hợp lệ. Vui lòng kiểm tra lại!",
        "Lỗi"
      );
      return;
    }

    this.loading = true;

    this._authenticationService
      .resetPassword(
        this.forgotPasswordForm.value.email,
        this.resetPasswordForm.value.newPassword
      )
      .pipe(first())
      .subscribe(
        (response) => {
          this.toastr.success("Đặt lại mật khẩu thành công!", "Thành công");
          this.loading = false;
          this.router.navigate(["/pages/authentication/login-v2"]);
        },
        (error) => {
          this.toastr.error(
            "Có lỗi xảy ra khi đặt lại mật khẩu. Vui lòng thử lại!",
            "Lỗi"
          );
          this.loading = false;
          console.error("Reset password failed", error);
        }
      );
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
