import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../services/auth-service/auth-service';
import { NotificationService } from '../../services/notification-service/notification-service';
import { ErrorHandlerService } from '../../services/error-handler-service/error-handler-service';

@Component({
  selector: 'app-change-password-dialog',
  standalone: false,
  templateUrl: './change-password-dialog.html',
  styleUrl: './change-password-dialog.css',
})
export class ChangePasswordDialog {
  changePasswordForm!: FormGroup;

  loading: boolean = false;
  hideCurrent: boolean = true;
  hideNew: boolean = true;
  hideConfirm: boolean = true;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ChangePasswordDialog>,
    private authService: AuthService,
    private notification: NotificationService,
    private errorHandler: ErrorHandlerService
  ) {
    this.changePasswordForm = fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: [
        '',
        [
          Validators.required,
          authService.passwordMatchValidator('newPassword'),
        ],
      ],
    });
  }

  submit() {
    this.loading = true;

    const formData = this.changePasswordForm.value;
    const data = {
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    };

    this.authService.changePassword(data).subscribe({
      next: (res: any) => {
        this.loading = false;

        this.notification.success(
          res.message || 'Password changed successfully!'
        );
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.loading = false;

        this.errorHandler.handle(
          err,
          'Failed to change password. Please try again.'
        );
      },
    });
  }

  cancel() {
    this.dialogRef.close(false);
  }
}
