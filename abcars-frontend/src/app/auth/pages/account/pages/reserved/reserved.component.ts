import { Component, LOCALE_ID, OnInit, ViewChild } from '@angular/core';

// Services
import { ReservedService } from '../../services/reserved.service';

// Interfaces
import { Reserved, Reserveds } from '../../interfaces/reserved.interface';
import { MatTableDataSource as MatTableDataSource } from '@angular/material/table';

// Change location app
import localeESMX from "@angular/common/locales/es-MX";
import { registerLocaleData } from '@angular/common';
registerLocaleData(localeESMX);

@Component({
    selector: 'app-reserved',
    templateUrl: './reserved.component.html',
    providers: [
        { provide: LOCALE_ID, useValue: 'es-MX' }
    ],
    standalone: false
})

export class ReservedComponent implements OnInit {

  // References
  public flag: Boolean = false;

  // References of MatTable
  public displayedColumns: string[] = ['id', 'status', 'price', 'platform', 'vin', 'date', 'remaining_time'];
  public dataSource!: MatTableDataSource<Reserved>;

  constructor(private _reservedService: ReservedService) { 
    // Get choices
    this.getChoices();
  }

  ngOnInit(): void {
    this.scrollTop();
  }

  scrollTop() {
    var scrollElem = document.querySelector('#moveTop');
    scrollElem!.scrollIntoView();  
  }

  /**
   * Get choices by client
   */
  public getChoices() {
    const user = JSON.parse(localStorage.getItem('user')!);

    if (user) {
      this._reservedService.getChoicesByClient(user.id)
      .subscribe({
        next: ({ code, status, choices }: Reserveds) => {
          if (code === 200 && status === 'success') {
            if (choices.length > 0) {
              this.flag = true;
              
              // Set Requets
              this.dataSource = new MatTableDataSource(choices);
            } else {
              this.flag = false;
            }
          } else {
            this.flag = false;
          }
        }
      });
    }
  }

  /**
   * name
   */
  public countDownDate(date: Date, vin: string) {
    let message;

    // Increment 1 hour & 15 days to amountDate
    date = new Date(date);
    date.setHours(date.getHours() + 2);
    date.setDate(date.getDate() + 15);

    // Get time of date in type Date()
    let countDownDate = new Date(date).getTime();

    // Get today's date and time
    let now = new Date().getTime();

    // Find the distance between now and the count down date
    let distance = countDownDate - now;

    // Time calculations for days, hours, minutes and seconds
    let days = Math.floor(distance / (1000 * 60 * 60 * 24));
    let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // If the count down is over, write some text 
    if (distance < 0) {
      message = "Desapartado";

      // Launch unpark
      this._reservedService.unChoiceVehicle(vin)
      .subscribe({
        next: (response) => {
          console.log(response);
        }
      });
    } else {
      // Output the result in an element
      message = days + "d " + hours + "h " + minutes + "m " + seconds + "s";

      setInterval(() => {
        message = days + "d " + hours + "h " + minutes + "m " + seconds + "s";
      }, 1000);
    }

    return message;
  }

}

