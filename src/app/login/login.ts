import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../shared/services/auth-service/auth-service';
import { Router } from '@angular/router';
import { NotificationService } from '../shared/services/notification-service/notification-service';
import { ErrorHandlerService } from '../shared/services/error-handler-service/error-handler-service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  hide: boolean = true;
  loading: boolean = false;
  showResendLink: boolean = false;

  userEmail: string = '';

  loginForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notification: NotificationService,
    private errorHandler: ErrorHandlerService
  ) {
    this.loginForm = fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    })
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.authService.redirectBasedOnRole();
    }
  }

  submit() {
    this.loading = true;

    const formData = this.loginForm.value;
    const authData = {
      email: formData.email?.trim().toLowerCase(),
      password: formData.password
    };

    this.authService.login(authData).subscribe({
      next: (res) => {
        this.loading = false;

        this.authService.redirectBasedOnRole();
      },
      error: (err) => {
        this.loading = false;

        const errorMsg = err.error?.error || 'Login failed. Please check your credentials.'

        if (err.status === 403 && errorMsg.toLowerCase().includes('verified')) {
          this.showResendLink = true;
          this.userEmail = this.loginForm.value.email;
        } else {
          this.showResendLink = false;
        }

        this.notification.error(errorMsg);

        console.log('Login error: ', err);

      }
    })
  }

  resendVerification() {
    if (!this.userEmail) {
      this.notification.error('Please enter your email address');

      return;
    }

    this.showResendLink = false;
    this.loading = true;

    this.authService.resendVerificationEmail(this.userEmail).subscribe({
      next: (res: any) => {
        this.loading = false;

        this.notification.success(res.message || 'Verification email sent! Please check your inbox.');
      },
      error: (err) => {
        this.loading = false;

        this.errorHandler.handle(err, 'Failed to send verification email. Please try again.')
      }
    })
  }

  forgot() {
    this.router.navigate(['/forgot-password']);
  }
}
