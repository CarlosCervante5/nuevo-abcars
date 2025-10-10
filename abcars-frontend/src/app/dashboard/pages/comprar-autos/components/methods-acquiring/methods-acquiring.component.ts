import { Component, Inject, OnInit } from '@angular/core';
import {MatBottomSheet, MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA} from '@angular/material/bottom-sheet';

@Component({
    selector: 'app-methods-acquiring',
    templateUrl: './methods-acquiring.component.html',
    styles: [`
    .card {
      cursor: pointer;
      background-color: var(--abcars-color);
      border: 0px;
    }
  `],
    standalone: false
})

export class MethodsAcquiringComponent implements OnInit {

  // Referencies of Help
  public vin: string = '';

  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
    private _bottomSheetRef: MatBottomSheetRef<MethodsAcquiringComponent>
  ) {}

  ngOnInit(): void {
    // Get data in Mat Bottom References
    this.vin = this.data.id;    
  }

  /**
   * Help function, close and open when clicked
   */
  openLink(event: MouseEvent): void {
    this._bottomSheetRef.dismiss();
    event.preventDefault();
  }

}
