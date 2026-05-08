import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AdminService } from '@services/admin.service';
import { Dealership, DealerShipResponse } from '@interfaces/admin.interfaces';
import { dealershipServiceTypeLabel } from 'src/app/shared/utils/public-dealerships';

@Component({
  selector: 'app-dealerships-map',
  templateUrl: './dealerships-map.component.html',
  styleUrls: ['./dealerships-map.component.css'],
  standalone: false
})
export class DealershipsMapComponent implements OnInit {
  dealerships: Dealership[] = [];
  loading = true;

  constructor(
    private adminService: AdminService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadDealerships();
  }

  loadDealerships(): void {
    this.loading = true;
    this.adminService.getDealershipsList().subscribe({
      next: (res: DealerShipResponse) => {
        this.dealerships = res.data || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  openInMaps(d: Dealership): void {
    if (d.latitude != null && d.longitude != null) {
      window.open(`https://www.google.com/maps?q=${d.latitude},${d.longitude}`, '_blank');
    } else if (d.address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.address)}`, '_blank');
    } else {
      const q = encodeURIComponent(`${d.name} ${d.location}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
    }
  }

  getMapEmbedUrl(d: Dealership): SafeResourceUrl | null {
    if (d.latitude != null && d.longitude != null) {
      const url = `https://www.openstreetmap.org/export/embed.html?bbox=${d.longitude - 0.01},${d.latitude - 0.01},${d.longitude + 0.01},${d.latitude + 0.01}&layer=mapnik&marker=${d.latitude},${d.longitude}`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
    return null;
  }

  capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  serviceTypeLabel(t: Dealership['service_type']): string {
    return dealershipServiceTypeLabel(t);
  }

  get hasCoordinates(): boolean {
    return this.dealerships.some(d => d.latitude != null && d.longitude != null);
  }
}
