// import { CommonModule } from '@angular/common';
import { Component, type OnInit } from '@angular/core';

@Component({
    selector: 'app-sticky-whatsapp-detail',
    // standalone: true,
    // imports: [
    //     CommonModule,
    // ],
    templateUrl: './sticky-whatsapp-detail.component.html',
    styleUrls: ['./sticky-whatsapp-detail.component.css'],
    standalone: false
})
export class StickyWhatsappDetailComponent implements OnInit {

    public pageVehicle: string = '';

    ngOnInit(): void { 
        // Assign active route for shared button    
        this.pageVehicle = window.location.href;
    }

}
