import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Modules
import { AccountRoutingModule } from './account-routing.module';
import { AngularMaterialModule } from 'src/app/angular-material/angular-material.module';

// Components
import { ProfileComponent } from './pages/profile/profile.component';
import { MyCarsComponent } from './pages/my-cars/my-cars.component';
import { MyServicesComponent } from './pages/my-services/my-services.component';
import { IncidentsComponent } from './pages/incidents/incidents.component';
import { AssistsComponent } from './pages/assists/assists.component';
import { RewardsComponent } from './pages/rewards/rewards.component';
import { ProductsCustomerComponent } from './components/products-customer/products-customer.component';
import { CarsCustomerComponent } from './components/cars-customer/cars-customer.component';
import { ServicesCustomerComponent } from './components/services-customer/services-customer.component';
import { IncidentsCustomerComponent } from './components/incidents-customer/incidents-customer.component';
import { BuyCustomerComponent } from './components/buy-customer/buy-customer.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { FormQuoteServiceComponent } from './components/form-quote-service/form-quote-service.component';
import { FormQuoteIncidentsComponent } from './components/form-quote-incidents/form-quote-incidents.component';
import { ServicesSheetCustomerComponent } from './components/services-sheet-customer/services-sheet-customer.component';
import { FinancingComponent } from './pages/financing/financing.component';
import { ReservedComponent } from './pages/reserved/reserved.component';
import { SkCubeComponent } from "../../../shared/components/sk-cube/sk-cube.component";
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [
    ProfileComponent,
    MyCarsComponent,
    MyServicesComponent,
    IncidentsComponent,
    AssistsComponent,
    RewardsComponent,
    ProductsCustomerComponent,
    CarsCustomerComponent,
    ServicesCustomerComponent,
    IncidentsCustomerComponent,
    BuyCustomerComponent,
    SettingsComponent,
    FormQuoteServiceComponent,
    FormQuoteIncidentsComponent,
    ServicesSheetCustomerComponent,
    FinancingComponent,
    ReservedComponent,
  ],
  imports: [
    CommonModule,
    AccountRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    AngularMaterialModule,
    SkCubeComponent
  ],
  providers: [
    MyServicesComponent
  ]
})

export class AccountModule { }
