import { Component, OnInit } from '@angular/core';

// Angular Material
import { MatBottomSheet } from '@angular/material/bottom-sheet';

// Components
import { FormQuoteServiceComponent } from '../../components/form-quote-service/form-quote-service.component';

// Services
import { ServicesService } from '../../services/services.service';

// Interfaces
import { ServicesClient, VehicleElement } from '../../interfaces/services.interface';

@Component({
    selector: 'app-my-services',
    templateUrl: './my-services.component.html',
    standalone: false
})

export class MyServicesComponent implements OnInit {

  // References of Help
  public flag: Boolean = true;

  // References User and Vehicles
  public user_id: number = 0;
  public vehicles: VehicleElement[] = [];

  constructor(
    private _bottomSheet: MatBottomSheet,
    private _myServicesService: ServicesService
  ) { 
    // Get id user in session storage
    const user = JSON.parse(localStorage.getItem('user')!);
    
    // Launch get vehicles
    this.getVehicles(user.id);
  }

  ngOnInit(): void {
    this.scrollTop();
  }

  scrollTop() {
    var scrollElem= document.querySelector('#moveTop');
        scrollElem!.scrollIntoView();  
  }

  /**
   * Open Form Generate Service
   */
  public openBottomSheet(): void {
    this._bottomSheet.open(FormQuoteServiceComponent);
  }

  /**
   * Get vehicles by user
   */
  public getVehicles(user_id: number) {
    this._myServicesService.getServicesByUser('servicio', user_id)
    .subscribe({
      next: ({ code, status, vehicles }: ServicesClient) => {
        if (code === 200 && status === 'success') {
          // Load vehicles
          this.vehicles = vehicles;
          
          this.flag = false;
        } else {
          // Error in response
          this.flag = true;
        }
      },
      error: (error) => {
        console.error(error);
      }
    });
  }

}
