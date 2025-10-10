import { Component, OnInit } from '@angular/core';

// Angular Material
import { MatBottomSheet } from '@angular/material/bottom-sheet';

// Components
import { FormQuoteIncidentsComponent } from '../../components/form-quote-incidents/form-quote-incidents.component';

// Services
import { IncidentsService } from '../../services/incidents.service';

// Interfaces
import { IncidentData, Incident } from '../../interfaces/incidents.interface';
import { ClientData } from '../../interfaces/client.interface';

@Component({
    selector: 'app-incidents',
    templateUrl: './incidents.component.html',
    standalone: false
})

export class IncidentsComponent implements OnInit {

  // References
  public user_id!: number;
  public client_id!: number;
  public flag: Boolean = false;
  public incidents: Incident[] = [];
  
  constructor(private _incidentsService: IncidentsService, private _bottomSheet: MatBottomSheet) { 
    // Get id user in session storage
    const user = JSON.parse(localStorage.getItem('user')!);
    
    // Launch get vehicles
    this.user_id = user.id;
  }

  ngOnInit(): void {
    this.scrollTop();

    this._incidentsService.getClient( this.user_id )
    .subscribe({
      next: ( clientData: ClientData ) => {
        this.client_id = clientData.client.id;
        this.getServiceIncidents( this.client_id );
        this.getVehicleIncidents( this.client_id );  
      }
    });
  }

  scrollTop() {
    window.scrollTo(0, 0);
  }

  /**
   * Open Form Generate Service
   */
  public openBottomSheet(): void {
    this._bottomSheet.open(FormQuoteIncidentsComponent);
  }

  public getServiceIncidents( client_id: number): void {
    this._incidentsService.getServiceIncidents( client_id )
    .subscribe({
      next: ( incidentData:IncidentData ) => {
        incidentData.incidents.map( incident => {
          this.incidents.push( incident );
          this.flag = true;
        });
      },
      error: (error) => {
        this.flag = false;
      }
    });
  }

  public getVehicleIncidents( client_id: number ): void {
    this._incidentsService.getVehicleIncidents( client_id )
    .subscribe({
      next: ( incidentData:IncidentData ) => {
        incidentData.incidents.map( incident => {
          this.incidents.push( incident );
          this.flag = true;
        });
      },
      error: (error) => {
        this.flag = false;
      }
    });
  }

}
