import { Component, Inject, OnInit } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { FormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import Swal from "sweetalert2";


import { EditorChangeContent, EditorChangeSelection, QuillEditorComponent } from 'ngx-quill'
import Quill from 'quill'
import Block from 'quill/blots/block';

import {reload} from '@helpers/session.helper';
import { ActivatedRoute, Router } from '@angular/router';
import { PostService } from '@services/post.service';
import { GralResponse } from '@interfaces/auth.interface';

@Component({
    selector: 'app-store-post-content',
    templateUrl: './store-post-content.component.html',
    styleUrls: ['./store-post-content.component.css'],
    standalone: false
})

export class StorePostContentComponent  implements OnInit{

    public button:      boolean = false;
    public disabled:    boolean = true;
    public file_1:        File[] = [];
    public file_2:        File[] = [];
    public form!:       FormGroup;
    public loading:     boolean = false;
    public selected_value: string = 'full_width_image';
    public blurred = false
    public focused = false
    public content = ''
    public post_uuid!:string;

    public editorConfig = {
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{ header: 1 }, { header: 2 }],

            [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

            [{ list: 'ordered' }, { list: 'bullet' }],
            // ['link', 'image', 'video']
        ],
    };

    constructor(
        @Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
        private _formBuilder: UntypedFormBuilder,
        private _postService: PostService,
        private _bottomSheetRef: MatBottomSheetRef<any>,
        private _router: Router
    ) {
        this.post_uuid =  data.uuid;
        this.formInit();
    }

    ngOnInit(): void {

    }

    private formInit() {
        this.form = this._formBuilder.group({
            post_uuid:            [ this.post_uuid, [Validators.required]],
            content_type:         ['full_width_image', [Validators.required]],
            content_text:         [''],
            content_multimedia_1: [''],
            content_multimedia_2: ['']
        });
    }

    onSubmit() {

        this.button = true;

        Swal.fire({
            title: 'Procesando...',
            allowOutsideClick: false,
        });

        const formData = new FormData();
        formData.append('post_uuid', this.form.value.post_uuid);
        formData.append('content_type', this.form.value.content_type);
        formData.append('content_text', this.form.value.content_text);

        if( this.selected_value ===  'left_text_right_image' || this.selected_value ===  'left_image_right_text' || this.selected_value ===  'full_width_image' || this.selected_value ===  'two_columns_images' || this.selected_value ===  'centered_image'){
            formData.append('content_multimedia_1', this.file_1[0]);
        }

        if( this.selected_value ===  'two_columns_images'){
            formData.append('content_multimedia_2', this.file_2[0]);
        }

        this._postService.content_store( formData )
        .subscribe({
            next: ( storePostResponse : GralResponse) => {
                
                Swal.fire({                    
                    icon: 'success',
                    title: 'Contenido creado con éxito',
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

    get pictureInvalid_1() {
        const imageControl = this.form.get('content_multimedia_1');
        return imageControl?.invalid && (imageControl?.dirty || imageControl?.touched);
    }

    get pictureInvalid_2() {
        const imageControl = this.form.get('content_multimedia_2');
        return imageControl?.invalid && (imageControl?.dirty || imageControl?.touched);
    }

    public close():void {
        this._bottomSheetRef.dismiss();
    }

    public assignImage_1( event: Event ){
        
        const element = event.currentTarget as HTMLInputElement;
        let fileList: FileList | null = element.files;
        
        if (fileList && fileList.length > 0) {
            this.file_1 = Array.from(fileList);
            this.disabled = false;

        } else {
            this.file_1 = [];
            this.disabled = true;
        }
    }

    public assignImage_2( event: Event ){
        
        const element = event.currentTarget as HTMLInputElement;
        let fileList: FileList | null = element.files;
        
        if (fileList && fileList.length > 0) {
            this.file_2 = Array.from(fileList);
            this.disabled = false;

        } else {
            this.file_2 = [];
            this.disabled = true;
        }
    }

    onTypeContentChange(event: any): void {
        const selectedValue = event.value;
        this.selected_value = selectedValue;

        this.form.get('content_text')?.clearValidators();
        this.form.get('content_multimedia_1')?.clearValidators();
        this.form.get('content_multimedia_2')?.clearValidators();

        switch (this.selected_value) {
            case 'full_width_text':
                this.form.get('content_text')?.setValidators([Validators.required]);
                break;

            case 'left_text_right_image':
            case 'left_image_right_text':
                this.form.get('content_text')?.setValidators([Validators.required]);
                this.form.get('content_multimedia_1')?.setValidators([Validators.required]);
                break;

            case 'two_columns_images':
                this.form.get('content_multimedia_1')?.setValidators([Validators.required]);
                this.form.get('content_multimedia_2')?.setValidators([Validators.required]);
                break;

            case 'full_width_image':
            case 'centered_image':
                this.form.get('content_multimedia_1')?.setValidators([Validators.required]);
                break;
        }

        // Aplicamos los cambios de validación
        this.form.get('content_text')?.updateValueAndValidity();
        this.form.get('content_multimedia_1')?.updateValueAndValidity();
        this.form.get('content_multimedia_2')?.updateValueAndValidity();

    }

}
