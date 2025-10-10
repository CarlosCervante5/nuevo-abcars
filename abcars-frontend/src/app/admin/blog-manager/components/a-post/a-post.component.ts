import { Component, Input, Output, type OnInit, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { GralResponse } from '@interfaces/auth.interface';
import { PostService } from '@services/post.service';

import Swal from "sweetalert2";

@Component({
    selector: 'app-a-post',
    templateUrl: './a-post.component.html',
    styleUrls: ['./a-post.component.css'],
    standalone: false
})

export class APostComponent implements OnInit {
    @Input() post!: any;
    @Output() reload = new EventEmitter<Boolean>();

    constructor(
        private _postService: PostService,
        private _router: Router
    ) {
    }

    ngOnInit(): void { }


    public image( primera_imagen:any ){      
  
      return primera_imagen || 'assets/images/demo_image.png';      
        
    }

    public onDelete(){

        Swal.fire({
            title: 'Estas segur@ que quieres eliminar este post?',      
            showCancelButton: true,
            confirmButtonText: 'Eliminar', 
            confirmButtonColor: '#008bcc',  
        }).then((result) => {
            if (result.isConfirmed) {
            
                this._postService.delete( this.post.uuid )
                .subscribe({
                    next: ( response: GralResponse) => {

                        Swal.fire({
                            icon: 'success',
                            title: `El post ha sido eliminado correctamente.`,
                            timer: 3500
                        });
                        
                        this.reload.emit(true);
                    },
                    error: ( error ) => {

                        Swal.fire({
                            icon: 'error',
                            title: 'Lo sentimos, hubo un error',
                            text: 'Hubo un problema al procesar la solicitud. Inténtalo más tarde.'+ error,
                        });
                    } 
                });
            }
        });

    }


}
