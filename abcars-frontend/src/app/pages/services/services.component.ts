import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { HomeNavComponent } from '../../shared/components/home-nav/home-nav.component';
import { ModernFooterComponent } from '../../shared/components/modern-footer/modern-footer.component';
import { ReferralService } from '../../shared/services/referral.service';
import { CarWashService } from '@services/carwash.service';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, RouterModule, HomeNavComponent, ModernFooterComponent],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css']
})
export class ServicesComponent implements OnInit {
  carwashWhatsappUrl =
    'https://wa.me/5215646531805?text=' +
    encodeURIComponent('Hola AB CarWash, quiero agendar un lavado.');
  carwashPhoneDisplay = '+52 564 653 1805';
  carwashPhoneTel = 'tel:+525646531805';

  constructor(
    private referralService: ReferralService,
    private route: ActivatedRoute,
    private carwash: CarWashService
  ) {}

  ngOnInit(): void {
    this.referralService.captureFromUrl(this.route);
    this.carwash.getPublicContact().subscribe({
      next: (res) => {
        const d = res.data;
        if (d?.whatsapp_url) this.carwashWhatsappUrl = d.whatsapp_url;
        if (d?.phone_display) this.carwashPhoneDisplay = d.phone_display;
        if (d?.phone_tel) {
          this.carwashPhoneTel = d.phone_tel;
        } else if (d?.phone_digits) {
          this.carwashPhoneTel = `tel:+${d.phone_digits.replace(/^521(\d{10})$/, '52$1')}`;
        }
      }
    });
  }

  get referralLinkParams(): Record<string, string> {
    return this.referralService.getReferralLinkQueryParams();
  }
}
