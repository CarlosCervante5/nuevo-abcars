import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Vehicle } from '../../interfaces/vehicle.interface';
import { FALLBACK_HERO_IMAGE } from '../../shared/constants/fallback-media';
import { optimizeCloudinaryVehicleDeliveryUrl } from '../../shared/utils/cloudinary-vehicle-delivery-url';
import { formatFuelTypeLabel } from '../../shared/utils/fuel-type-label';
import { formatVehicleCategoryBadgeLabel } from '../../shared/utils/vehicle-category-label';

@Component({
  selector: 'app-vehicle-card',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  template: `
    <div 
      class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 h-full flex flex-col"
      (click)="onCardClick()"
    >
      <!-- Imagen del vehículo -->
      <div class="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex-shrink-0">
        <img 
          [src]="getVehicleImage()" 
          [alt]="vehicle.brand + ' ' + vehicle.model"
          class="w-full h-full object-cover"
        >
        <!-- Etiqueta categoría -->
        <div class="absolute top-3 left-3">
          <span class="px-2 py-1 bg-black text-white text-xs font-bold rounded tracking-wide">
            {{ categoryBadgeLabel }}
          </span>
        </div>
        <!-- Etiqueta PREMIUM -->
        <div class="absolute top-3 right-3" *ngIf="vehicle.status === 'premium'">
          <span class="px-2 py-1 bg-primary-500 text-black text-xs font-bold rounded">
            PREMIUM
          </span>
        </div>
      </div>
      
      <!-- Contenido de la tarjeta -->
      <div class="p-4 flex-grow flex flex-col">
        <!-- Información del vehículo -->
        <div class="mb-4 flex-grow">
          <h3 class="text-lg font-bold text-gray-900 mb-1 uppercase">{{ vehicle.brand }}</h3>
          <p class="text-base text-gray-700 mb-3">{{ vehicle.model }}</p>
          
          <!-- Detalles en tabla limpia -->
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">Año</span>
              <span class="font-medium text-gray-900">{{ vehicle.year }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Combustible</span>
              <span class="font-medium text-gray-900">{{ fuelLabel }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Kilómetros</span>
              <span class="font-medium text-gray-900">{{ vehicle.mileage | number }}</span>
            </div>
          </div>
        </div>
        
        <!-- Precios de Venta -->
        <div class="mb-4 pt-3 border-t border-gray-100 flex-shrink-0">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm text-gray-500">Precio contado</span>
            <span class="text-base font-bold text-primary-500">MXN {{ getContadoPrice() | number }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500">Pago mensual desde</span>
            <span class="text-base font-bold text-gray-900">MXN {{ getMonthlyPayment() | number }}</span>
          </div>
        </div>
        

      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class VehicleCardComponent {
  @Input() vehicle!: Vehicle;
  @Output() viewDetails = new EventEmitter<Vehicle>();
  @Output() contact = new EventEmitter<Vehicle>();
  @Output() cardClick = new EventEmitter<Vehicle>();

  get fuelLabel(): string {
    return formatFuelTypeLabel(this.vehicle?.fuel);
  }

  get categoryBadgeLabel(): string {
    return (
      formatVehicleCategoryBadgeLabel(this.vehicle?.category) ||
      formatVehicleCategoryBadgeLabel(this.vehicle?.apiData?.category) ||
      'N/A'
    );
  }

  getVehicleImage(): string {
    if (this.vehicle.image_url && this.vehicle.image_url.trim() !== '') {
      return optimizeCloudinaryVehicleDeliveryUrl(this.vehicle.image_url.trim());
    }

    return FALLBACK_HERO_IMAGE;
  }

  getContadoPrice(): number {
    return this.vehicle.price;
  }

  getMonthlyPayment(): number {
    // Parámetros de financiamiento
    const downPaymentPercentage = 10; // 10% de enganche
    const annualInterestRate = 15; // 15% anual
    const termMonths = 60; // 60 meses
    
    // Calcular monto a financiar
    const downPayment = (this.vehicle.price * downPaymentPercentage) / 100;
    const principal = this.vehicle.price - downPayment;
    
    // Tasa de interés mensual
    const monthlyRate = annualInterestRate / 100 / 12;
    
    // Fórmula de amortización
    if (monthlyRate === 0) {
      return Math.round(principal / termMonths);
    }
    
    const monthlyPayment = principal * 
      (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
      (Math.pow(1 + monthlyRate, termMonths) - 1);
    
    return Math.round(monthlyPayment);
  }

  onViewDetails(event: Event): void {
    event.stopPropagation();
    this.viewDetails.emit(this.vehicle);
  }

  onContact(event: Event): void {
    event.stopPropagation();
    this.contact.emit(this.vehicle);
  }

  onCardClick(): void {
    this.cardClick.emit(this.vehicle);
  }
} 