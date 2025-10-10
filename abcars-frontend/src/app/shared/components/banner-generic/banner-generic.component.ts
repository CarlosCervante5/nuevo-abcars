import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-banner-generic',
  standalone: true,
  template: `
    <div class="relative bg-yellow-100 rounded-xl shadow-lg border border-yellow-400 overflow-hidden cursor-pointer hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 h-full flex flex-col justify-center items-center p-4">
      <img [src]="imageUrl" alt="Promoción" class="absolute inset-0 w-full h-full object-cover opacity-60" />
      <div class="absolute inset-0 bg-yellow-900 opacity-30"></div>
      <div class="relative z-10 flex flex-col items-center justify-center w-full h-full">
        <svg class="w-10 h-10 text-yellow-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <h3 class="text-lg font-bold text-white mb-1">{{ title }}</h3>
        <p class="text-sm text-yellow-100 mb-3 text-center">{{ description }}</p>
        <button class="px-4 py-2 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition-all duration-300 text-sm">{{ buttonText }}</button>
      </div>
    </div>
  `
})
export class BannerGenericComponent {
  @Input() title: string = '¡Promoción Especial!';
  @Input() description: string = 'Solicita tu crédito automotriz con tasa preferencial y estrena auto este mes.';
  @Input() buttonText: string = 'Ver promoción';
  @Input() imageUrl: string = 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=600&q=80';
} 