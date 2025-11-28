import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HomeNavComponent } from '../../../shared/components/home-nav/home-nav.component';
import { ModernFooterComponent } from '../../../shared/components/modern-footer/modern-footer.component';
import { StregaService } from '../../../shared/services/strega.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-technical-service',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, HomeNavComponent, ModernFooterComponent],
  templateUrl: './technical-service.component.html',
  styleUrls: ['./technical-service.component.css']
})
export class TechnicalServiceComponent {
  serviceForm: FormGroup;
  isSubmitting: boolean = false;

  constructor(
    private fb: FormBuilder,
    private stregaService: StregaService
  ) {
    this.serviceForm = this.fb.group({
      name: ['', Validators.required],
      last_name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      email: ['', [Validators.required, Validators.email]],
      serviceType: ['', Validators.required],
      preferredDate: [''],
      preferredTime: ['']
    });
  }

  buildQComments(serviceType: string, preferredDate: string, preferredTime: string): string {
    const serviceTypeText = serviceType === 'mantenimiento' ? 'Mantenimiento preventivo' :
                            serviceType === 'diagnostico' ? 'Diagnóstico computarizado' :
                            serviceType === 'reparacion' ? 'Reparación' :
                            serviceType === 'otro' ? 'Otro' : 'No especificado';

    // Parsear fecha manualmente para evitar problemas de zona horaria
    let dateFormatted = 'No especificada';
    if (preferredDate) {
      const [year, month, day] = preferredDate.split('-');
      dateFormatted = `${day}/${month}/${year}`;
    }

    const timeFormatted = preferredTime || 'No especificada';

    return `Tipo de servicio: ${serviceTypeText}, Fecha preferida: ${dateFormatted}, Hora preferida: ${timeFormatted}`;
  }

  onSubmitService() {
    if (this.serviceForm.invalid || this.isSubmitting) {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.serviceForm.controls).forEach(key => {
        this.serviceForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;

    // Obtener valores para q_comments (NO se envían en formData)
    const serviceType = this.serviceForm.value.serviceType;
    const preferredDate = this.serviceForm.value.preferredDate;
    const preferredTime = this.serviceForm.value.preferredTime;

    // Construir q_comments
    const qComments = this.buildQComments(serviceType, preferredDate, preferredTime);

    // Preparar datos con campos adicionales para enviar (EXCLUYENDO serviceType, preferredDate, preferredTime)
    const formData = {
      name: this.serviceForm.value.name,
      last_name: this.serviceForm.value.last_name,
      phone: this.serviceForm.value.phone,
      email: this.serviceForm.value.email,
      q_model_interest: '',
      q_brand_interest: '',
      q_initial_investment: '',
      q_time_to_buy: '',
      q_comments: qComments,
      opportunity_type: 'lead',
      dealership_name: 'Chevrolet Serdán',
      campaign_name: 'Página ABCars',
      campaign_channel: 'WEB ABCars',
      campaign_source: 'Solicitud de agendamiento de servicio técnico'
    };

    // Crear FormGroup temporal solo para cumplir con la firma del servicio
    const formToSend = this.fb.group(formData);

    this.stregaService.createLead(formToSend).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        
        // Limpiar formulario inmediatamente después del éxito
        this.serviceForm.reset();
        
        Swal.fire({
          icon: 'success',
          title: '¡Solicitud enviada!',
          text: 'Tu solicitud de agendamiento de servicio técnico ha sido enviada exitosamente. Nos pondremos en contacto contigo pronto.',
          showConfirmButton: true,
          confirmButtonColor: '#dc2626',
          timer: 5000
        });
      },
      error: (error) => {
        this.isSubmitting = false;
        
        console.error('Error al enviar solicitud:', error);
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un problema al enviar tu solicitud. Por favor, intenta de nuevo más tarde.',
          showConfirmButton: true,
          confirmButtonColor: '#ef4444'
        });
      }
    });
  }

  services = [
    {
      name: 'Cambio de aceite',
      description: 'Cambio de aceite y filtro con productos de calidad premium.',
      price: 800,
      duration: '30 min',
      colorClass: 'bg-blue-500',
      icon: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>'
    },
    {
      name: 'Revisión de frenos',
      description: 'Revisión completa del sistema de frenos y cambio de pastillas.',
      price: 1200,
      duration: '1 hora',
      colorClass: 'bg-red-500',
      icon: '<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>'
    },
    {
      name: 'Alineación y balanceo',
      description: 'Alineación de dirección y balanceo de llantas para mejor manejo.',
      price: 600,
      duration: '45 min',
      colorClass: 'bg-green-500',
      icon: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>'
    },
    {
      name: 'Revisión de aire acondicionado',
      description: 'Revisión y recarga del sistema de aire acondicionado.',
      price: 900,
      duration: '1 hora',
      colorClass: 'bg-blue-500',
      icon: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>'
    },
    {
      name: 'Cambio de batería',
      description: 'Instalación de batería nueva con garantía del fabricante.',
      price: 1500,
      duration: '20 min',
      colorClass: 'bg-yellow-500',
      icon: '<path d="M15.67 4H14V2c0-.55-.45-1-1-1s-1 .45-1 1v2H5.33C4.6 4 4 4.6 4 5.33v15.33C4 21.4 4.6 22 5.33 22h10.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4zM13 18H7v-2h6v2zm0-4H7v-2h6v2zm0-4H7V8h6v2z"/>'
    },
    {
      name: 'Revisión de transmisión',
      description: 'Revisión completa del sistema de transmisión automática o manual.',
      price: 2000,
      duration: '2 horas',
      colorClass: 'bg-purple-500',
      icon: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>'
    }
  ];
}
