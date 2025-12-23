import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../shared/services/auth-service/auth-service';
import { NotificationService } from '../shared/services/notification-service/notification-service';

@Component({
  selector: 'app-reset-password',
  standalone: false,
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword implements OnInit {
  loading: boolean = false;
  tokenValid: boolean = false;
  hidePassword: boolean = true;
  hideConfirmPassword: boolean = true;

  token: string = '';

  resetPasswordForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private notification: NotificationService
  ) {
    this.resetPasswordForm = fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, authService.passwordMatchValidator('password')]]
    })
  }

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (token) {
      this.token = token;
      this.tokenValid = true;
    } else {
      this.tokenValid = false;
    }
  }

  submit() {
    this.loading = true;

    const newPassword = this.resetPasswordForm.value.password;

    this.authService.resetPassword(this.token, newPassword).subscribe({
      next: (res: any) => {
        this.loading = false;

        this.notification.success(res.message || 'Password reset successfully!');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading = false;

        const errorMsg = err.error?.error || 'Failed to reset password. Please try again.'

        if (errorMsg.toLowerCase().includes('expired') || errorMsg.toLowerCase().includes('invalid')) {
          this.tokenValid = false;
        } else {
          this.notification.error(errorMsg);
        }
      }
    })
  }
}
