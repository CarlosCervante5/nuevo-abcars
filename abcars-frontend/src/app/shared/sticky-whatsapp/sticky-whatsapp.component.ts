import { Component, HostListener, OnInit } from '@angular/core';

@Component({
    selector: 'app-sticky-whatsapp',
    templateUrl: './sticky-whatsapp.component.html',
    styleUrls: ['./sticky-whatsapp.component.css'],
    standalone: false
})
export class StickyWhatsappComponent implements OnInit {
    
    // isSticky: boolean = false;

    // @HostListener('window:scroll', ['event'])
    // checkScroll(){
    //     // Obtén la posición actual de desplazamiento
    //     const scrollPosition = window.scrollY;
    //     // Define una posición umbral para activar el "sticky"
    //     const threshold = 100;
    //     // Actualiza el estado "isSticky" según la posición de desplazamiento
    //     this.isSticky = scrollPosition > threshold;
    // }

    ngOnInit(): void { }

}
