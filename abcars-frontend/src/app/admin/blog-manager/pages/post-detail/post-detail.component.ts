import { Component } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import {reload} from '@helpers/session.helper';

// Interfaces
import { MatSnackBar } from '@angular/material/snack-bar';
import { PostService } from '@services/post.service';

import { StorePostContentComponent } from '../../components/store-post-content/store-post-content.component';

import { Content, GetPost, Post, PostOrder } from '@interfaces/getPosts.interfaces';

import Swal from 'sweetalert2';
import { PostPreviewComponent } from '../../components/post-preview/post-preview.component';
import { GetStatusUpdate } from '@interfaces/getStatusUpdate.interfaces';


@Component({
    selector: 'app-post-detail',
    templateUrl: './post-detail.component.html',
    styleUrls: ['./post-detail.component.css'],
    standalone: false
})
export class PostDetailComponent {

    public post_uuid!: string;
    public post!: Post;
    public post_contents: Content[] = [];
    public post_for_slider: PostOrder[] = [];
    public url_name: string = '';

    retryAttempts: { [key: string]: number } = {};

    constructor(
        private _postsService: PostService,
        private _bottomSheet: MatBottomSheet,
        private _snackBar: MatSnackBar,
        private _router: Router,
        private _activatedRoute: ActivatedRoute,

    ) {

        this._activatedRoute.params
        .subscribe({
            next: (params) => {
                this.post_uuid = params['uuid'];
                this.detail();
            }
        });

    }

    public detail() {    

        this._postsService.managerDetail(this.post_uuid)
        .subscribe({
            next: (response: GetPost) => {

                this.post = response.data;
                this.post_contents = response.data.contents;
                this.url_name = this.post.url_name;

                this.post_for_slider = [];

                for (let i = 0; i < this.post_contents.length; i++) {
                    
                    this.post_for_slider.push({
                        id: this.post_contents[i].uuid,
                        content_text: this.post_contents[i].content_text,
                        content_type: this.post_contents[i].content_type,
                        content_multimedia_1: this.post_contents[i].content_multimedia_1,
                        content_multimedia_2: this.post_contents[i].content_multimedia_2,
                        sort_id: this.post_contents[i].sort_id,
                        selected: false
                    });
                }

            },
            error: (error:any) => {
                reload(error, this._router);
            }
        });
    }


    drop(event: CdkDragDrop<PostOrder[]>) {

        const selectedImages = this.post_for_slider.filter(post => post.selected);
      
        if (selectedImages.length > 0) {
          // Remover las imágenes seleccionadas manteniendo el orden original
          const remainingPosts = this.post_for_slider.filter(post => !post.selected);
          
          // Insertar las imágenes seleccionadas en el nuevo índice del drop
          const insertIndex = event.currentIndex;
      
          // Mantener el orden original de las seleccionadas e insertarlas en la posición del drop
          this.post_for_slider = [
            ...remainingPosts.slice(0, insertIndex),
            ...selectedImages,
            ...remainingPosts.slice(insertIndex)
          ];
        } else {
          // Si no hay imágenes seleccionadas, mover solo la arrastrada
          moveItemInArray(this.post_for_slider, event.previousIndex, event.currentIndex);

          this.changeOrder()

        }
      }

    openSnackBar(message: string, verticalPosition:any, className:string) {
        this._snackBar.open(message, "cerrar", {
            duration: 3000,
            horizontalPosition: "end",
            verticalPosition: verticalPosition,
            panelClass: [className],
        });
    }
    
    openStorePostContentSheet(): void {

        const bottomSheetRef = this._bottomSheet.open(StorePostContentComponent,  { data: {uuid: this.post_uuid} });
  
        bottomSheetRef.afterDismissed().subscribe((dataFromChild) => {      
            if(dataFromChild != undefined && dataFromChild.reload === true ){        
                this.detail();
            }
        });
    }

    openPreview(url_name: string) {
        console.log(url_name);
        this._bottomSheet.open(PostPreviewComponent, {
            data: {
                url_name
            }
        });
    }

    publishUnpublish() {
        console.log(this.post_uuid);
        this._postsService.publishUnpublish(this.post_uuid)
        .subscribe({
            next: (resp: GetStatusUpdate) => {
                console.log(resp.data.status);
                    const Toast = Swal.mixin({
                        toast: true,
                        position: "top-end",
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true,
                        didOpen: (toast) => {
                            toast.onmouseenter = Swal.stopTimer;
                            toast.onmouseleave = Swal.resumeTimer;
                        }
                    });
                    Toast.fire({
                        icon: "success",
                        title: "Estatus modificado"
                    });
                    this.detail();
            },
            error: (err) => {
                reload(err, this._router);
            }
        });
    }
    
    retryImageLoad_1(event: any, content: any) {
        const maxRetries = 3;
        const retryDelay = 5000;
    
        const imgUrl = content.content_multimedia_1;
        
        event.target.src = 'assets/placeholder-image.jpg';

        if (!this.retryAttempts[imgUrl]) {
            this.retryAttempts[imgUrl] = 0;
        }
    
        if (this.retryAttempts[imgUrl] < maxRetries) {
            this.retryAttempts[imgUrl]++;
            console.warn(`Reintentando carga de imagen (${this.retryAttempts[imgUrl]}/${maxRetries})...`);
        
            setTimeout(() => {
                this.detail();
            }, retryDelay);

        } else {
            console.error("No se pudo cargar la imagen después de varios intentos.");
        }
    }

    retryImageLoad_2(event: any, content: any) {
        const maxRetries = 3;
        const retryDelay = 5000;
    
        const imgUrl = content.content_multimedia_2;
        
        event.target.src = 'assets/placeholder-image.jpg';

        if (!this.retryAttempts[imgUrl]) {
            this.retryAttempts[imgUrl] = 0;
        }
    
        if (this.retryAttempts[imgUrl] < maxRetries) {
            this.retryAttempts[imgUrl]++;
            console.warn(`Reintentando carga de imagen (${this.retryAttempts[imgUrl]}/${maxRetries})...`);
        
            setTimeout(() => {
                this.detail();
            }, retryDelay);

        } else {
            console.error("No se pudo cargar la imagen después de varios intentos.");
        }
    }

    changeOrder(): void {

        this._postsService.changeOrder(this.post_for_slider)
        .subscribe({
            next: (resp) => {
                
                const Toast = Swal.mixin({
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                      toast.onmouseenter = Swal.stopTimer;
                      toast.onmouseleave = Swal.resumeTimer;
                    }
                });
                Toast.fire({
                    icon: "success",
                    title: "Guardado..."
                });
            },
            error: (err) => {
                reload(err, this._router);
            }
        });
    }

    deleteContent( content_uuid: string, index: number): void {
        Swal.fire({
            title: '¿Estás segur@ que quieres eliminar este contenido?',
            showCancelButton: true,
            confirmButtonText: 'Eliminar',
            confirmButtonColor: '#008bcc',
        }).then((result) => {
            if (result.isConfirmed) {

                this._postsService.deleteContent(content_uuid)
                .subscribe({
                    next: (resp) => {

                        this.post_for_slider.splice(index, 1);
            
                        Swal.fire(resp.message, '', 'success');
                    },
                    error: (err: any) => {
                        reload(err, this._router);
                    }
                })
            }
        })
    }
}


