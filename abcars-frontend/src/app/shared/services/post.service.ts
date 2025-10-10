import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { GralResponse } from '@interfaces/auth.interface';
import { GetPost, GetPosts, GetRandomPosts, Post, PostOrder } from '@interfaces/getPosts.interfaces';
import { GetPostDetail } from '@interfaces/getPostDetail.interfaces';
import { Observable } from 'rxjs';
import { GetStatusUpdate } from '@interfaces/getStatusUpdate.interfaces';

@Injectable({
  providedIn: 'root'
})
export class PostService {

    baseUrl = environment.baseUrl;

    constructor(
        private _http: HttpClient
    ) {}

    public getPosts( page: number, word: string, paginate: number):Observable<GetPosts>{

        let params = new HttpParams();

        if (word) {
            params = params.set('keyword', word);
        }

        if (page) {
            params = params.set('page', page.toString());
        }

        if (paginate) {
            params = params.set('paginate', paginate.toString());
        }

        let user_token = localStorage.getItem('user_token');
        let headers = new HttpHeaders().set('Authorization', `Bearer ${ user_token }`);

        return this._http.get<GetPosts>(`${ this.baseUrl }/api/blogs/search_manager`, {params, headers});
    }

    public getRandomPosts() :Observable<Post[]>{

        let user_token = localStorage.getItem('user_token');
        let headers = new HttpHeaders().set('Authorization', `Bearer ${ user_token }`);

        return this._http.get<Post[]>(`${ this.baseUrl }/api/blogs/random_search`, {headers});

    }


    public managerDetail( post_uuid: String):Observable<GetPost>{

        const body = {
            post_uuid: post_uuid
        }

        let user_token = localStorage.getItem('user_token');
        let headers = new HttpHeaders().set('Authorization', `Bearer ${ user_token }`);

        return this._http.post<GetPost>(`${ this.baseUrl }/api/blogs/detail`, body , {headers});
    }

    public changeOrder(contentData: PostOrder[]){

        const body = {
            "content_order": contentData.map( (content, index) => ({
              "uuid": content.id, 
              "sort_id": index + 1
            }))
        };
     
        let user_token = localStorage.getItem('user_token');
        let headers = new HttpHeaders().set('Authorization', `Bearer ${user_token}`);
    
        return this._http.post<GralResponse>(`${this.baseUrl}/api/blogs/sort_update`, body, { headers });
    
    }

    public deleteContent( content_uuid:string ): Observable<GralResponse>{

        let data = { content_uuid: content_uuid };
    
        let user_token = localStorage.getItem('user_token');
        let headers = new HttpHeaders().set('Authorization', `Bearer ${user_token}`);
    
        return this._http.post<GralResponse>(`${this.baseUrl}/api/blogs/delete_content`, data, { headers });
    
    }
    
    public getPublicPosts( page: number, word: string, paginate: number):Observable<GetPosts>{

        let params = new HttpParams();

        if (word) {
            params = params.set('keyword', word);
        }

        if (page) {
            params = params.set('page', page.toString());
        }

        if (paginate) {
            params = params.set('paginate', paginate.toString());
        }

        let user_token = localStorage.getItem('user_token');
        let headers = new HttpHeaders().set('Authorization', `Bearer ${ user_token }`);

        return this._http.get<GetPosts>(`${ this.baseUrl }/api/blogs/search`, {params, headers});
    }


    public store( form: FormData ) :Observable<GralResponse>{

        let user_token = localStorage.getItem('user_token');
        let headers = new HttpHeaders().set('Authorization', `Bearer ${ user_token }`);

        return this._http.post<GralResponse>(`${ this.baseUrl }/api/blogs`, form ,{headers});
    }

    public content_store( form: FormData ):Observable<GralResponse>{

        let user_token = localStorage.getItem('user_token');
        let headers = new HttpHeaders().set('Authorization', `Bearer ${ user_token }`);

        return this._http.post<GralResponse>(`${ this.baseUrl }/api/blogs/create_content`, form ,{headers});
    }

    public delete( post_uuid: string ) :Observable<GralResponse>{

        const body = { post_uuid: post_uuid };

        let user_token = localStorage.getItem('user_token');
        let headers = new HttpHeaders().set('Authorization', `Bearer ${ user_token }`);

        return this._http.post<GralResponse>(`${ this.baseUrl }/api/blogs/delete`, body ,{headers});
    }

    public getPostDetail(url_name: string): Observable<GetPostDetail>{
        const form: FormData = new FormData();

        form.append('url_name', url_name);

        return this._http.post<GetPostDetail>(`${this.baseUrl}/api/blogs/detail_url`, form);
    }
    
    public getPostDetailPreview(url_name: string): Observable<GetPostDetail>{
        const form: FormData = new FormData();

        let user_token = localStorage.getItem('user_token');
        let headers = new HttpHeaders().set('Authorization', `Bearer ${ user_token }`);

        form.append('url_name', url_name);

        return this._http.post<GetPostDetail>(`${this.baseUrl}/api/blogs/detail_url_manager`, form, {headers});
    }

    public publishUnpublish(post_uuid: string): Observable<GetStatusUpdate>{
        const body = { post_uuid: post_uuid };

        let user_token = localStorage.getItem('user_token');
        let headers = new HttpHeaders().set('Authorization', `Bearer ${ user_token }`);

        return this._http.post<GetStatusUpdate>(`${ this.baseUrl }/api/blogs/status_update`, body, { headers });
    }

}
