import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HomeNavComponent } from '../../shared/components/home-nav/home-nav.component';
import { ModernFooterComponent } from '../../shared/components/modern-footer/modern-footer.component';
import { CarWashService } from '@services/carwash.service';

interface WashServiceRow {
  name: string;
  priceWithVat: number;
}

@Component({
  selector: 'app-public-carwash',
  standalone: true,
  imports: [CommonModule, RouterModule, HomeNavComponent, ModernFooterComponent],
  templateUrl: './public-carwash.component.html',
  styleUrls: ['./public-carwash.component.css']
})
export class PublicCarwashComponent implements OnInit {
  /** Fallback si el API aún no responde (Settings → Teléfono público). */
  private phoneDigits = '525646531805';

  whatsappUrl = this.buildWhatsAppUrl('Hola AB CarWash, quiero agendar un lavado.');
  phoneDisplay = '+52 564 653 1805';
  phoneTel = 'tel:+525646531805';

  readonly features = [
    { label: 'Rapidez', icon: 'speed' },
    { label: 'Confiabilidad', icon: 'shield' },
    { label: 'Eco-Friendly', icon: 'eco' },
    { label: 'Calidad', icon: 'trophy' }
  ];

  /** Lista oficial de servicios (precios MXN con IVA). */
  readonly services: WashServiceRow[] = [
    { name: 'Lavado, Aspirado y Secado', priceWithVat: 250 },
    { name: 'Lavado, Aspirado, Secado y Pulido', priceWithVat: 400 },
    { name: 'Lavado, aspirado, secado, pulido y encerado', priceWithVat: 2000 },
    { name: 'Lavado de vestiduras', priceWithVat: 850 },
    { name: 'Lavado de vestiduras y alfombra intenso', priceWithVat: 1800 },
    { name: 'Descontaminación de lluvia ácida parabrisas', priceWithVat: 600 },
    { name: 'Descontaminación de lluvia ácida carrocería', priceWithVat: 3000 },
    { name: 'Nanocerámico', priceWithVat: 4000 },
    { name: 'Películas de protección solar', priceWithVat: 3700 },
    { name: 'Filos de PPF', priceWithVat: 350 },
    { name: 'Películas y filos de PPF', priceWithVat: 3900 },
    { name: 'PPF Pieza', priceWithVat: 3500 },
    { name: 'PPF Completo', priceWithVat: 65000 },
    { name: 'Detallado de Rines (retoques)', priceWithVat: 600 },
    { name: 'Detallado completo de ruedas (incluye rotores)', priceWithVat: 750 },
    { name: 'Venta de nitrógeno (inflado llantas)', priceWithVat: 600 },
    { name: 'Rehidratación de plásticos', priceWithVat: 700 },
    { name: 'Pintura de fascia sin reparación (express)', priceWithVat: 1800 }
  ];

  constructor(private carwash: CarWashService) {}

  ngOnInit(): void {
    this.carwash.getPublicContact().subscribe({
      next: (res) => {
        const d = res.data;
        if (d?.phone_digits) {
          this.phoneDigits = d.phone_digits;
          this.phoneTel = `tel:+${d.phone_digits}`;
          this.whatsappUrl =
            d.whatsapp_url ||
            this.buildWhatsAppUrl(d.prefill || 'Hola AB CarWash, quiero agendar un lavado.');
        }
        if (d?.phone_display) {
          this.phoneDisplay = d.phone_display;
        }
      },
      error: () => {
        /* se mantiene fallback */
      }
    });
  }

  scrollToPackages(): void {
    document.getElementById('paquetes')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  whatsappFor(service: WashServiceRow): string {
    return this.buildWhatsAppUrl(`Hola AB CarWash, me interesa: ${service.name}`);
  }

  private buildWhatsAppUrl(text: string): string {
    return `https://wa.me/${this.phoneDigits}?text=${encodeURIComponent(text)}`;
  }
}
