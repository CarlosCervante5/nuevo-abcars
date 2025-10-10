import { Component } from '@angular/core';
import { Router } from '@angular/router';

// Interfaces
import { RandomVehiclesData, Vehicle } from 'src/app/dashboard/interfaces/random_vehicles.interface';

// Services
import { HomeService } from 'src/app/dashboard/services/home.service';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.css'],
    standalone: false
})

export class FooterComponent {
  
  // References
  public date: number = 0;  
  public vehicles: Vehicle[] = [];

  constructor(private _homeService: HomeService, private _router: Router) { 
    const d = new Date();
    this.date = d.getFullYear();

    // Most vehicles
    // this.mostVehicles();
  }

  public scrollTop() {    
    var scrollElem = document.querySelector('#moveTop');
    scrollElem!.scrollIntoView();  
  }

  /**
   * Search vehicle in Stock Redirect
   * @param brand String
   * @param carmodel String
   */
  public redirectStockVehicle(brand: string, carmodel: string) {
    window.location.href = `/compra-tu-auto/${ brand.toLocaleLowerCase() }/${ carmodel.toLocaleLowerCase() }/sin-anios/100000/5000000/sin-carrocerias/sin-estados/sin-busqueda/sin-transmisiones/1`;
    this.scrollTop();
  }

  /**
   * Most wanted Vehicles 
   */
  // public mostVehicles() {
  //   this._homeService.getVehicles()
  //   .subscribe({
  //     next: ({ code, status, vehicles }: RandomVehiclesData) => {
  //       if (code === 200 && status === 'success') {
  //         this.vehicles = vehicles;
  //       }
  //     }
  //   });
  // }

}