import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { HomeNavComponent } from '../../shared/components/home-nav/home-nav.component';
import { ModernFooterComponent } from '../../shared/components/modern-footer/modern-footer.component';
import { ReferralService } from '../../shared/services/referral.service';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, RouterModule, HomeNavComponent, ModernFooterComponent],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css']
})
export class ServicesComponent implements OnInit {
  constructor(
    private referralService: ReferralService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.referralService.captureFromUrl(this.route);
  }

  get referralLinkParams(): Record<string, string> {
    return this.referralService.getReferralLinkQueryParams();
  }
}














