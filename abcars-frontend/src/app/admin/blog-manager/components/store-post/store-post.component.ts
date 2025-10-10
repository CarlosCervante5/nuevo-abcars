import { Component, OnInit } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { FormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { VehicleService } from '@services/vehicle.service';
import Swal from "sweetalert2";

import {reload} from '@helpers/session.helper';
import { Router } from '@angular/router';
import { VehicleStoreResponse } from '@interfaces/vehicle_data.interface';
import { PostService } from '@services/post.service';
import { Gral } from '@interfaces/dashboard.interface';
import { GralResponse } from '@interfaces/auth.interface';

@Component({
    selector: 'app-store-post',
    templateUrl: './store-post.component.html',
    styleUrls: ['./store-post.component.css'],
    standalone: false
})

export class StorePostComponent  implements OnInit{

    public button:      boolean = false;
    public disabled:    boolean = true;
    public file:        File[] = [];
    public form!:       FormGroup;
    public loading:     boolean = false;

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _postService: PostService,
        private _bottomSheetRef: MatBottomSheetRef<any>,
        private _router: Router
    ) {
        this.formInit();
    }

    ngOnInit(): void {

    }

    private formInit() {
        this.form = this._formBuilder.group({
            title:          ['', [Validators.required]],
            category:       ['', [Validators.required]],
            sub_category:   [''],
            key_words:      [''],
            image:          [null, Validators.required]
        });
    }

    onSubmit() {

        this.button = true;

        Swal.fire({
            title: 'Procesando...',
            allowOutsideClick: false,
        });

        const formData = new FormData();
        formData.append('title', this.form.value.title);
        formData.append('category', this.form.value.category);
        formData.append('sub_category', this.form.value.sub_category);
        formData.append('key_words', this.form.value.key_words);
        formData.append('image', this.file[0]);

        this._postService.store( formData )
        .subscribe({
            next: ( storePostResponse :GralResponse) => {
                
                Swal.fire({                    
                    icon: 'success',
                    title: 'Post creado con éxito',
                    text: storePostResponse.message,
                    showConfirmButton: false,
                    timer: 2000
                });

                this._bottomSheetRef.dismiss(
                    {reload: true}
                );
            },
            error: (error) => {
                reload(error, this._router);
            }
        });

        this.button = false;
    }


    get postTitleInvalid() {
        return this.form.get('title')!.invalid && (this.form.get('title')!.dirty);
    }

    get postCategoryInvalid() {
        return this.form.get('category')!.invalid && (this.form.get('category')!.dirty);
    }

    get pictureInvalid() {
        const imageControl = this.form.get('image');
        return imageControl?.invalid && (imageControl?.dirty || imageControl?.touched);
    }

    public close():void {
        this._bottomSheetRef.dismiss();
    }

    assignImage( event: Event ){
        
        const element = event.currentTarget as HTMLInputElement;
        let fileList: FileList | null = element.files;
        
        if (fileList && fileList.length > 0) {
            this.file = Array.from(fileList);
            this.disabled = false;

        } else {
            this.file = [];
            this.disabled = true;
        }
    }

    


}
