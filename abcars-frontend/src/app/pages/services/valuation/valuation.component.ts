import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HomeNavComponent } from '../../../shared/components/home-nav/home-nav.component';
import { ModernFooterComponent } from '../../../shared/components/modern-footer/modern-footer.component';
import { VehicleService } from '../../../shared/services/vehicle.service';
import { Brand, BrandsResponse, Model, ModelsResponse } from '../../../shared/interfaces/vehicle_data.interface';
import { AdminService } from '../../../shared/services/admin.service';
import { Dealership, DealerShipResponse } from '../../../shared/interfaces/admin.interfaces';
import { AppointmentService } from '../../../shared/services/appointment.service';
import { LeadService } from '../../../shared/services/lead.service';
import { ReferralService } from '../../../shared/services/referral.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-valuation',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, HomeNavComponent, ModernFooterComponent],
  templateUrl: './valuation.component.html',
  styleUrls: ['./valuation.component.css']
})
export class ValuationComponent implements OnInit {
  brands: Brand[] = [];
  dealerships: Dealership[] = [
    { name: 'Chevrolet Balderrama Serdán (puebla)', location: '', description: null, created_at: new Date() },
    { name: 'VECSA pachuca', location: '', description: null, created_at: new Date() }
  ];
  models: Model[] = [];
  valuationForm: FormGroup;
  isSubmitting: boolean = false;

  constructor(
    private vehicleService: VehicleService,
    private adminService: AdminService,
    private appointmentService: AppointmentService,
    private leadService: LeadService,
    private referralService: ReferralService,
    private fb: FormBuilder
  ) {
    this.valuationForm = this.fb.group({
      // Información del vehículo
      brand: ['', Validators.required],
      model: ['', Validators.required],
      year: ['', Validators.required],
      mileage: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      // Información de contacto
      fullName: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      email: ['', [Validators.required, Validators.email]],
      city: ['', Validators.required],
      preferredDate: ['', Validators.required],
      preferredTime: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.referralService.captureFromUrl();
    this.getBrands();
    // Sucursales ahora están hardcodeadas, no se cargan dinámicamente
    // this.getDealerships();
  }

  getBrands(): void {
    this.vehicleService.getBrands().subscribe({
      next: (response: BrandsResponse) => {
        this.brands = response.data.vehicle_brands;
      },
      error: (error) => {
        console.error('Error al cargar marcas:', error);
      }
    });
  }

  getDealerships(): void {
    this.adminService.getDealerships().subscribe({
      next: (response: DealerShipResponse) => {
        this.dealerships = response.data;
      },
      error: (error) => {
        console.error('Error al cargar sucursales:', error);
      }
    });
  }

  onBrandInput(brand: string): void {
    // Si el valor coincide con una marca de la API, cargar modelos
    const foundBrand = this.brands.find(b => b.name.toLowerCase() === brand.toLowerCase());
    
    if (foundBrand) {
      this.onBrandSelected(foundBrand.name);
    } else {
      // Si no coincide, limpiar modelos
      this.models = [];
      this.valuationForm.patchValue({ model: '' });
    }
  }

  onBrandSelected(brand: string): void {
    // Limpiar modelo anterior
    this.valuationForm.patchValue({ model: '' });
    this.models = [];

    if (!brand) {
      return;
    }

    this.vehicleService.getModelsByBrand(brand).subscribe({
      next: (response: ModelsResponse) => {
        this.models = response.data.line_models;
      },
      error: (error) => {
        console.error('Error al cargar modelos:', error);
        this.models = [];
      }
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) {
      return '';
    }
    // Asegurarse de que la fecha esté en formato YYYY-MM-DD
    const [year, month, day] = dateString.split('-');
    const paddedMonth = month.padStart(2, '0');
    const paddedDay = day.padStart(2, '0');
    return `${year}-${paddedMonth}-${paddedDay}`;
  }

  onPhoneKeyPress(event: KeyboardEvent): void {
    // Solo permitir números (0-9)
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
    }
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Remover cualquier carácter que no sea número
    const value = input.value.replace(/\D/g, '');
    // Limitar a 10 dígitos
    const limitedValue = value.slice(0, 10);
    // Actualizar el valor del formulario
    this.valuationForm.patchValue({ phone: limitedValue }, { emitEvent: false });
  }

  getYears(): number[] {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 30; i--) {
      years.push(i);
    }
    return years;
  }

  submitValuation(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    
    // Validar formulario
    if (this.valuationForm.invalid || this.isSubmitting) {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.valuationForm.controls).forEach(key => {
        this.valuationForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;

    const formValue = this.valuationForm.value;
    
    // Construir objeto para registro del cliente
    const clientData = {
      name: formValue.fullName || '',
      last_name: formValue.lastName || '',
      email: formValue.email || '',
      phone_1: formValue.phone || ''
    };

    // Crear FormGroup temporal para el cliente
    const clientForm = this.fb.group(clientData);

    // Paso 1: Registrar el cliente
    this.adminService.setRiders(clientForm).subscribe({
      next: (response) => {
        // Verificar que la respuesta tenga la estructura esperada
        if (response && response.data && response.data.profile && response.data.profile.uuid) {
          const customerUuid = response.data.profile.uuid;
          
          // Hacer patchValue al formulario con el customer_uuid
          this.valuationForm.patchValue({ customer_uuid: customerUuid });

          // Construir scheduled_date con formato YYYY-MM-DD HH:MM
          const formattedDate = formValue.preferredDate ? this.formatDate(formValue.preferredDate) : '';
          const scheduledDateTime = formattedDate && formValue.preferredTime
            ? `${formattedDate} ${formValue.preferredTime}`
            : '';
    
          // Construir objeto para la cita de valuación
          const referrerUuid = this.referralService.getReferrerUuid();
          const appointmentData: Record<string, unknown> = {
            type: 'valuation',
            customer_uuid: customerUuid,
            brand_name: formValue.brand || '',
            model_name: formValue.model || '',
            year: formValue.year || '',
            mileage: formValue.mileage ? String(formValue.mileage) : '0',
            scheduled_date: scheduledDateTime,
            dealership_name: formValue.city || ''
          };
          if (referrerUuid) {
            appointmentData.referrer_uuid = referrerUuid;
          }

          // Crear FormGroup temporal para la cita
          const appointmentForm = this.fb.group(appointmentData);

          // Paso 2: Crear la cita de valuación
          this.appointmentService.setExternalAppointmentValuation(appointmentForm).subscribe({
            next: (appointmentResponse) => {
              // Paso 3: Enviar datos a Google Sheet mediante la API de leads
              const valuationLeadData = {
                fullName: formValue.fullName || '',
                lastName: formValue.lastName || '',
                phone: formValue.phone || '',
                email: formValue.email || '',
                city: formValue.city || '',
                preferredDate: formValue.preferredDate || '',
                preferredTime: formValue.preferredTime || '',
                brand: formValue.brand || '',
                model: formValue.model || '',
                year: formValue.year ? Number(formValue.year) : 0,
                mileage: formValue.mileage ? Number(formValue.mileage) : 0,
                ...(referrerUuid && { referrer_uuid: referrerUuid })
              };

              this.leadService.sendValuationRequest(valuationLeadData).subscribe({
                next: (leadResponse) => {
                  console.log('Datos enviados a Google Sheet exitosamente:', leadResponse);
                },
                error: (leadError) => {
                  // No afectar el flujo principal si falla el envío a Google Sheet
                  console.error('Error al enviar datos a Google Sheet (no crítico):', leadError);
                }
              });

              this.isSubmitting = false;
              
              // Mostrar mensaje de éxito
              Swal.fire({
                icon: 'success',
                title: 'Cita creada exitosamente',
                timer: 2000,
                showConfirmButton: false
              }).then(() => {
                // Recargar la página
                window.location.reload();
              });
            },
            error: (error) => {
              this.isSubmitting = false;
              
              // Mostrar mensaje de error
              Swal.fire({
                icon: 'error',
                title: 'Lo sentimos, hubo un error',
                text: 'Hubo un problema al procesar la solicitud, inténtelo más tarde. ' + (error?.error?.message || error?.message || '')
              });
            }
          });
        } else {
          this.isSubmitting = false;
          Swal.fire({
            icon: 'error',
            title: 'Lo sentimos, hubo un error',
            text: 'No se pudo obtener el identificador del cliente. Por favor, inténtelo más tarde.'
          });
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        
        // Mostrar mensaje de error
        Swal.fire({
          icon: 'error',
          title: 'Lo sentimos, hubo un error',
          text: 'Hubo un problema al procesar la solicitud, inténtelo más tarde. ' + (error?.error?.message || error?.message || '')
        });
      }
    });
  }
}
