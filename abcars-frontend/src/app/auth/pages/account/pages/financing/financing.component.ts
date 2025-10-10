import { Component, ViewChild } from '@angular/core';
import { MatTableDataSource as MatTableDataSource } from '@angular/material/table';
import { MatPaginator as MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

// Services
import { FinancingsService } from '../../services/financings.service';

// Interfaces
import { Financing, FinancingItem } from '../../interfaces/financing.interface';

@Component({
    selector: 'app-financing',
    templateUrl: './financing.component.html',
    styles: [`
    table {
      width: 100%;
    }
  `],
    standalone: false
})

export class FinancingComponent {

  // References of help
  public flag: Boolean = true;

  // References of MatTable
  public displayedColumns: string[] = ['id', 'price', 'hitch', 'status', 'brand', 'carmodel', 'date'];
  public dataSource!: MatTableDataSource<FinancingItem>;
  public pageSizeOptions: number[] = [10, 30, 45, 60, 100];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private _financingService: FinancingsService) {        
    // Get financing by user_id
    this.getFinancingsByUser();    
  }

  /**
   * Get financings by user
   */
  public getFinancingsByUser() {
    if (localStorage.getItem('user')!) {
      let user = JSON.parse(localStorage.getItem('user')!);

      this._financingService.getFinancingsByUser(user.id)
      .subscribe({
        next: ({ code, status, message, financings }: Financing) => {
          if (code === 200 && status === 'success') {
            if (financings.length > 0) {
              this.flag = true;
              
              // Assign the data to the data source for the table to render
              this.dataSource = new MatTableDataSource(financings);
              
              // Set paginator and sort
              this.dataSource.paginator = this.paginator;
              this.dataSource.sort = this.sort;
            } else {
              this.flag = false;
            }
          } else {
            this.flag = false;
            console.log(message);
          }
        }
      });

    }
  }

}