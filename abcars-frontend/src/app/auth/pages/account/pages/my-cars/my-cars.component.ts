import { Component, OnInit } from '@angular/core';

// Services
import { MyCarsService } from '../../services/my-cars.service';

// Interfaces
import { Vehicles, VehicleUser } from '../../interfaces/my-cars.interface';
import { IncidentsService } from '../../services/incidents.service';
import { ClientData } from '../../interfaces/client.interface';

@Component({
    selector: 'app-my-cars',
    templateUrl: './my-cars.component.html',
    standalone: false
})

export class MyCarsComponent implements OnInit {

  // References of Help
  public flag: Boolean = true;

  // References User and Vehicles
  public user_id: number = 0;
  public vehicles: Vehicles[] = [];

  constructor(private _myCarsService: MyCarsService, private _incidentsService: IncidentsService) { 
    // Get id user in session storage
    const user = JSON.parse(localStorage.getItem('user')!);
    
    // Launch get vehicles
    this.user_id = user.id;
  }

  ngOnInit(): void { 
    this._incidentsService.getClient(this.user_id)
    .subscribe({
      next: (clientData: ClientData) => {      
        this.getVehicles(clientData.client.id);            
      }
    });
    this.scrollTop();
  }

  scrollTop() {
    var scrollElem= document.querySelector('#moveTop');
        scrollElem!.scrollIntoView();  
  }

  /**
   * Get vehicles by user
   */
  public getVehicles(client_id: number) {
    this._myCarsService.getVehiclesByUser(client_id)
    .subscribe({
      next: ({ code, status, vehicles }: VehicleUser) => {
        if (code === 200 && status === 'success') {
          // Load vehicles
          this.vehicles = vehicles;  
          this.flag = false;     
        } else {
          // Error in response
          this.flag = true;
        }
      }}
    );
  }

}
