import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// Enviroments
import { environment } from 'src/environments/environment';

// Interfaces
import { Rewards, Reward, CheckingReward, PostReward, UpdateReward, ResetReward } from '../interfaces/rewards.interface';

@Injectable({
  providedIn: 'root'
})
export class RewardsService {

  // References
  private url: string = environment.baseUrl;  

  constructor(private _http: HttpClient) { }

  /**
   * Get Reward
   */
  public getRewards(page: number = 1): Observable<Rewards> {
    return this._http.get<Rewards>(`${ this.url }/api/rewards?page=${ page }`, {
      headers: new HttpHeaders().set('Authorization', JSON.stringify(localStorage.getItem('user_token')))
    });
  }

  /**
   * Get Reward
   */
  public getReward(user_id: number): Observable<Reward> {
    return this._http.get<Reward>(`${ this.url }/api/rewards/${ user_id }`, {
      headers: new HttpHeaders().set('Authorization', JSON.stringify(localStorage.getItem('user_token')))
    });
  }

  /**
   * Post Reward   
   */
  public setReward(client_id: number): Observable<PostReward> {
    return this._http.post<PostReward>(`${ this.url }/api/rewards`, { client_id }, {
      headers: new HttpHeaders().set('Authorization', JSON.stringify(localStorage.getItem('user_token')))
    });
  }
  
  /**
   * Update Reward
   */
  public updateReward(reward_id: number, status: string): Observable<UpdateReward> {
    return this._http.put<UpdateReward>(`${ this.url }/api/rewards/${ reward_id }`, { status }, {
      headers: new HttpHeaders().set('Authorization', JSON.stringify(localStorage.getItem('user_token')))
    });
  }

  /**
   * Reset Reward
   */
  public resetReward(client_id: number): Observable<ResetReward> {
    return this._http.delete<ResetReward>(`${ this.url }/api/rewards/${ client_id }`, {
      headers: new HttpHeaders().set('Authorization', JSON.stringify(localStorage.getItem('user_token')))
    });
  }

  /**
   * Checking Reward
   */
  public checkingReward(reward: string, email: string): Observable<CheckingReward> {
    return this._http.get<CheckingReward>(`${ this.url }/api/rewards/checking/${ reward }/${ email }`, {
      headers: new HttpHeaders().set('Authorization', JSON.stringify(localStorage.getItem('user_token')))
    });
  }

}