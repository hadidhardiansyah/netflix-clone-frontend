import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../shared/services/auth-service/auth-service';
import { NotificationService } from '../shared/services/notification-service/notification-service';

@Component({
  selector: 'app-forgot-password',
  standalone: false,
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  loading: boolean = false;

  forgotPasswordForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notification: NotificationService,
    private router: Router,
  ) {
    this.forgotPasswordForm = fb.group({
      email: ['', [Validators.required, Validators.email]]
    })
  }

  submit() {
    this.loading = true;

    const email = this.forgotPasswordForm.value.email?.trim().toLowerCase();

    this.authService.forgotPassword(email).subscribe({
      next: (res: any) => {
        this.loading = false;

        this.notification.success(res.message);
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading = false;

        this.notification.error(err.error?.error || 'Failed to send reset email. Please try again.');
      }
    })
  }
}
