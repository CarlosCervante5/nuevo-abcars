import { NgModule } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { BlogManagerRoutingModule } from './blog-manager-routing.module';
import { PostsComponent } from './pages/posts/posts.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AdminModule } from '../admin.module';
import { AngularMaterialModule } from '../../angular-material/angular-material.module';
import { LoadImagesComponent } from './components/load-images/load-images.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UpdateImagesComponent } from './components/update-images/update-images.component';
import { UpdateVehicleComponent } from './components/update-vehicle/update-vehicle.component';
import { StorePostComponent } from './components/store-post/store-post.component'; 
import { AVehicleComponent } from './components/a-vehicle/a-vehicle.component';
import { SkCubeComponent } from '@components/sk-cube/sk-cube.component'
import { NewNavComponent } from 'src/app/shared/versiones-nav/new-nav/new-nav.component';
import { APostComponent } from "./components/a-post/a-post.component";
import { PostDetailComponent } from './pages/post-detail/post-detail.component';
import { APostPublicComponent } from 'src/app/dashboard/pages/abc/components/a-post-public/a-post-public.component';
import { CommonModule } from '@angular/common';
import { QuillModule } from 'ngx-quill'
import { StorePostContentComponent } from './components/store-post-content/store-post-content.component';
import { PostPreviewComponent } from './components/post-preview/post-preview.component';
@NgModule({
  declarations: [
    DashboardComponent,
    PostsComponent,
    LoadImagesComponent,
    UpdateImagesComponent,
    UpdateVehicleComponent,
    StorePostComponent,
    AVehicleComponent,
    APostComponent,
    PostDetailComponent,
    PostPreviewComponent,
    StorePostContentComponent,
    APostPublicComponent,
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    FormsModule,
    BlogManagerRoutingModule,
    AdminModule,
    DragDropModule,
    ReactiveFormsModule,
    SkCubeComponent,
    NewNavComponent,
    QuillModule
  ],
  exports: [
    APostComponent,
    APostPublicComponent
  ]
})
export class BlogManagerModule { }
