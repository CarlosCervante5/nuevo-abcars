import { Component, Input, Output, type OnInit, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { GralResponse } from '@interfaces/auth.interface';
import { PostService } from '@services/post.service';

import Swal from "sweetalert2";

@Component({
    selector: 'app-public-post',
    templateUrl: './public-post.component.html',
    styleUrls: ['./public-post.component.css'],
    standalone: false
})

export class PublicPostComponent implements OnInit {
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

}
