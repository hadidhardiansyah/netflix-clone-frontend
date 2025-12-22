import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../shared/services/auth-service/auth-service';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '../shared/services/notification-service/notification-service';
import { ErrorHandlerService } from '../shared/services/error-handler-service/error-handler-service';

@Component({
  selector: 'app-signup',
  standalone: false,
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup implements OnInit {

  hidePassword: boolean = true;
  hideConfirmPassword: boolean = true;
  loading: boolean = false;

  signupForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private notification: NotificationService,
    private errorHandler: ErrorHandlerService
  ) {
    this.signupForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, authService.passwordMatchValidator('password')]]
    })
  }

  ngOnInit(): void {
    const email = this.route.snapshot.queryParams['email'];

    if (email) {
      this.signupForm.patchValue({email: email});
      console.log(email);

    }
  }

  submit() {
    this.loading = true;

    const formData = this.signupForm.value;
    const data = {
      email: formData.email?.trim().toLowerCase(),
      password: formData.password,
      fullName: formData.fullName
    };

    this.authService.signup(data).subscribe({
      next: (res: any) => {
        this.loading = false;

        this.notification.success(res?.message);
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        this.loading = false;

        this.errorHandler.handle(err, 'Registration failed. Please try again.')
      }
    })
  }

}
