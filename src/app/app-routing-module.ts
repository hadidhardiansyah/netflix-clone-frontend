import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Landing } from './landing/landing';
import { Signup } from './signup/signup';
import { Login } from './login/login';
import { VerifyEmail } from './verify-email/verify-email';

const routes: Routes = [
  {
    path: '',
    component: Landing
  },
  {
    path: 'signup',
    component: Signup
  },
  {
    path: 'login',
    component: Login
  },
  {
    path: 'verify-email',
    component: VerifyEmail
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
