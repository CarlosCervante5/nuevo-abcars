import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


// Modules
import { AngularMaterialModule } from 'src/app/angular-material/angular-material.module';
import { ComprarAutosRoutingModule } from './comprar-autos-routing.module';

// Components
import { AcquisitionFormComponent } from './pages/acquisition-form/acquisition-form.component';
import { CompraTuAutoComponent } from './pages/compra-tu-auto/compra-tu-auto.component';
import { DetailComponent } from './pages/detail/detail.component';
import { MethodsAcquiringComponent } from './components/methods-acquiring/methods-acquiring.component';
import { NotificationReservedComponent } from './components/notification-reserved/notification-reserved.component';
import { VehicleComponent } from './components/vehicle/vehicle.component';
import { AskInformationComponent } from './components/ask-information/ask-information.component';
import { VehiclePanoramaViewerComponent } from './components/vehicle-panorama-viewer/vehicle-panorama-viewer.component';
import { ModalComponent } from './components/modal/modal.component';
import { StickyWhatsappComponent } from 'src/app/shared/sticky-whatsapp/sticky-whatsapp.component'; 
import { StickyWhatsappDetailComponent } from 'src/app/shared/sticky-whatsapp-detail/sticky-whatsapp-detail/sticky-whatsapp-detail.component'; 
import { SkCubeComponent } from '@components/sk-cube/sk-cube.component'; 
import { VideoModalComponent } from './components/video-modal/video-modal.component';
import { CommonModule } from '@angular/common';
import { SafeUrlPipe } from './pipe/safe-url.pipe';

@NgModule({
  declarations: [    
    CompraTuAutoComponent, 
    VehicleComponent, 
    VehiclePanoramaViewerComponent,
    DetailComponent, 
    MethodsAcquiringComponent, 
    AcquisitionFormComponent, 
    NotificationReservedComponent, AskInformationComponent, ModalComponent,
    StickyWhatsappComponent,
    StickyWhatsappDetailComponent,
    VideoModalComponent,
    SafeUrlPipe
  ],
  imports: [
    CommonModule,
    ComprarAutosRoutingModule,
    FormsModule, 
    ReactiveFormsModule,
    AngularMaterialModule,
    SkCubeComponent
  ],
  exports: [
    VehicleComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class ComprarAutosModule { }
