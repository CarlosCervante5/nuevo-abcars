import { NgModule } from '@angular/core';

// Components
import { RegisterComponent } from './pages/register/register.component';

// Modules
import { AuthRoutingModule } from './auth-routing.module';
import { AccountRoutingModule } from './pages/account/account-routing.module';
import { AccountModule } from './pages/account/account.module';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { RecoverAccountComponent } from './pages/recover-account/recover-account.component';
import { PasswordResetComponent } from './pages/password-reset/password-reset.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HomeNavComponent } from '../shared/components/home-nav/home-nav.component';
import { ModernFooterComponent } from '../shared/components/modern-footer/modern-footer.component';
@NgModule({ declarations: [
        RegisterComponent,
        RecoverAccountComponent,
        PasswordResetComponent,
    ], imports: [CommonModule,
        AuthRoutingModule,
        AngularMaterialModule,
        AccountRoutingModule,
        AccountModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule,
        HomeNavComponent,
        ModernFooterComponent], providers: [provideHttpClient(withInterceptorsFromDi())] })

export class AuthModule { }
