import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild, ElementRef, OnInit } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { Vehicle } from 'src/app/dashboard/interfaces/random_vehicles.interface';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-modal',
    templateUrl: './modal.component.html',
    styleUrls: ['./modal.component.css'],
    animations: [
        trigger('modalAnimation', [
            state('void', style({ opacity: 0, transform: 'scale(0.8)' })),
            state('*', style({ opacity: 1, transform: 'scale(1)' })),
            transition('void => *', [
                animate('300ms cubic-bezier(0.68, -0.55, 0.27, 1.55)', style({ opacity: 1, transform: 'scale(1)' }))
            ]),
            transition('* => void', [
                animate('300ms cubic-bezier(0.68, -0.55, 0.27, 1.55)', style({ opacity: 0, transform: 'scale(0.8)' }))
            ]),
        ])
    ],
    standalone: false
})
export class ModalComponent implements OnChanges, OnInit{  
  public baseUrl: string = environment.baseUrl;
  @Input() showModal: boolean = false;
  @Input() vehicle: any;
  @Output() modalClosed = new EventEmitter<void>();

  @ViewChild('slider') slider!: ElementRef;
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  context!: CanvasRenderingContext2D;
  images:any = [];

  dragging:boolean = false;
  show:boolean = true;

  startDragging(event: MouseEvent): void {
    this.dragging = true;
    this.show = false;
    document.body.style.userSelect = 'none'; // Evitar la selección de texto durante el arrastre
  }

  onMouseMove(event: MouseEvent): void {
    if (this.dragging) {
      document.getElementById('blur-container')?.classList.remove('blurry');
    }
  }

  stopDragging(): void {
    this.dragging = false;
    document.body.style.userSelect = ''; // Restaurar la selección de texto después del arrastre
  }

  ngOnInit() {    
    this.pageLoaded();     
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.showModal) {
      document.body.style.overflow = this.showModal ? 'hidden' : '';
    }
  }

  closeModal(event: Event): void {
    // Verifica si se hizo clic en el área interna del modal y detén la propagación en ese caso
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.showModal = false;
      this.modalClosed.emit();
      // Otras acciones para cerrar el modal...
    }
  }

  public handleInputSlider() {      
    this.loadImage( this.slider.nativeElement.value - 1 );
  }

  public pageLoaded (){    
    this.vehicle.vehicle_360_images.map( ( img:any, i:number ) => {      
      const url = this.baseUrl + '/api/image_360_vehicle/' + img.path;
      const image = new Image()
      image.src = url      
      image.addEventListener('load', () => {          
          
          // si el indice es igual a 1 cargamos la image
          if (i === 0) {
            this.images[i] = image
            this.loadImage(i)
          }else{
            this.images[i - 1] = image
          } 
          console.log(i);                
      }) 
    });                    
  }

  public loadImage(index:number){
    const uno = this.canvas.nativeElement.getContext('2d');
    if( uno ){
      this.context = uno;
        /** 
        /* Recibe 5 parametros:
        /* indice de la imagen, x, y, tamaños ancho y alto 
        **/         
      this.context.drawImage(this.images[index], 0, 0, this.canvas.nativeElement.clientWidth, this.canvas.nativeElement.clientHeight)    
      console.log( this.context );
    }    
  }

  public move(){
    this.images.map( (image:any, index:number) => {        
        //setTimeout( () => { loadImage(index) }, index * 65 );        
        setTimeout( () => { this.loadImage(index) }, index * 65);        
    });
  }
}
