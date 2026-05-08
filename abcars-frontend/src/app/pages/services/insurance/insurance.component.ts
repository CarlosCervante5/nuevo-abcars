import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HomeNavComponent } from '../../../shared/components/home-nav/home-nav.component';
import { ModernFooterComponent } from '../../../shared/components/modern-footer/modern-footer.component';
import { VehicleService } from '../../../shared/services/vehicle.service';
import { Brand, BrandsResponse } from '../../../shared/interfaces/vehicle_data.interface';
import { StregaService } from '../../../shared/services/strega.service';
import { Dealership, DealerShipResponse } from '../../../shared/interfaces/admin.interfaces';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-insurance',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, HomeNavComponent, ModernFooterComponent],
  templateUrl: './insurance.component.html',
  styleUrls: ['./insurance.component.css']
})
export class InsuranceComponent implements OnInit {
  brands: Brand[] = [];
  
  quoteData = {
    brand: '',
    model: '',
    year: '',
    value: 0,
    usage: '',
    zipCode: ''
  };

  quoteResult: any = null;

  insuranceForm: FormGroup;
  isSubmitting: boolean = false;
  dealerships: Dealership[] = [];

  constructor(
    private vehicleService: VehicleService,
    private fb: FormBuilder,
    private stregaService: StregaService
  ) {
    this.insuranceForm = this.fb.group({
      name: ['', Validators.required],
      last_name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      email: ['', [Validators.required, Validators.email]],
      city: ['', Validators.required],
      coverageType: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.getBrands();
    this.loadDealerships();
  }

  private loadDealerships(): void {
    this.vehicleService.searchDealershipsForServiceTypes('venta').subscribe({
      next: (res: DealerShipResponse) => {
        if (res.status === 200 && Array.isArray(res.data)) {
          this.dealerships = res.data;
        }
      },
      error: () => {
        this.dealerships = [];
      }
    });
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

  getYears(): number[] {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 20; i--) {
      years.push(i);
    }
    return years;
  }

  updateQuote() {
    if (this.quoteData.brand && this.quoteData.model && this.quoteData.year && this.quoteData.value) {
      // Simulación de cálculo de cotización
      const baseRate = this.quoteData.value * 0.05; // 5% del valor del vehículo
      
      this.quoteResult = {
        basic: Math.round(baseRate * 0.6),
        standard: Math.round(baseRate * 0.8),
        premium: Math.round(baseRate * 1.2)
      };
    } else {
      this.quoteResult = null;
    }
  }

  getCoverageAmount(): number {
    if (!this.quoteResult) return 0;
    
    const coverageType = this.insuranceForm.value.coverageType;
    if (coverageType === 'basica') return this.quoteResult.basic;
    if (coverageType === 'estandar') return this.quoteResult.standard;
    if (coverageType === 'premium') return this.quoteResult.premium;
    return 0;
  }

  buildQComments(coverageAmount: number, city: string): string {
    const coverageTypeText = this.insuranceForm.value.coverageType === 'basica' ? 'Básica' :
                             this.insuranceForm.value.coverageType === 'estandar' ? 'Estándar' :
                             this.insuranceForm.value.coverageType === 'premium' ? 'Premium' : '';

    const cityText = city || 'No especificada';

    return `Marca: ${this.quoteData.brand}, Modelo: ${this.quoteData.model}, Año: ${this.quoteData.year}, Valor comercial: $${this.quoteData.value.toLocaleString()} MXN, Tipo de cobertura: ${coverageTypeText}, Monto de la cobertura elegida: $${coverageAmount.toLocaleString()} MXN, Sucursal: ${cityText}`;
  }

  onSubmitInsurance() {
    if (this.insuranceForm.invalid || this.isSubmitting) {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.insuranceForm.controls).forEach(key => {
        this.insuranceForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;

    // Obtener monto de cobertura según tipo seleccionado
    const coverageAmount = this.getCoverageAmount();
    const city = this.insuranceForm.value.city;
    
    // Construir q_comments
    const qComments = this.buildQComments(coverageAmount, city);
    
    // Preparar datos con campos adicionales para enviar
    const formData = {
      ...this.insuranceForm.value,
      q_model_interest: '',
      q_brand_interest: '',
      q_initial_investment: String(coverageAmount),
      q_time_to_buy: '',
      q_comments: qComments,
      opportunity_type: 'lead',
      dealership_name: city || 'Chevrolet Serdán',
      campaign_name: 'Página ABCars',
      campaign_channel: 'WEB ABCars',
      campaign_source: 'Solicitud de cotización de seguros'
    };

    // Crear FormGroup temporal solo para cumplir con la firma del servicio
    const formToSend = this.fb.group(formData);

    this.stregaService.createLead(formToSend).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        
        // Limpiar formulario de solicitud
        this.insuranceForm.reset();
        
        // Limpiar cotizador de seguros
        this.quoteData = {
          brand: '',
          model: '',
          year: '',
          value: 0,
          usage: '',
          zipCode: ''
        };
        
        // Limpiar resultados de cotización
        this.quoteResult = null;
        
        Swal.fire({
          icon: 'success',
          title: '¡Solicitud enviada!',
          text: 'Tu solicitud de cotización de seguros ha sido enviada exitosamente. Nos pondremos en contacto contigo pronto.',
          showConfirmButton: true,
          confirmButtonColor: '#10b981',
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
}
