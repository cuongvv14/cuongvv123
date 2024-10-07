import { AbstractControl, UntypedFormGroup, ValidationErrors, ValidatorFn } from "@angular/forms";

export function noFutureDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const currentDate = new Date();
        const selectedDate = new Date(control.value);

        // Nếu giá trị của control lớn hơn ngày hiện tại, trả về lỗi
        if (selectedDate > currentDate) {
            return { futureDate: true }; // Tên lỗi là "futureDate"
        }

        return null; // Không có lỗi
    };
}

