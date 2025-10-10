import { Component, Inject, LOCALE_ID, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { MatSnackBar as MatSnackBar } from '@angular/material/snack-bar';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

// Animations
import Swal from "sweetalert2";

// Services
import { RewardsService } from '../../services/rewards.service';

// Components
import { BuyCustomerComponent } from '../../components/buy-customer/buy-customer.component';

// Interfaces
import { UserSettings } from '../../interfaces/settings.interface';
import { AccountService } from '../../services/account.service';
import { Reward, PostReward } from '../../interfaces/rewards.interface';

// Change location app
import localeESMX from "@angular/common/locales/es-MX";
import { DOCUMENT, registerLocaleData } from '@angular/common';
registerLocaleData(localeESMX);

// Pipe
import { DatePipe } from '@angular/common';

@Component({
    selector: 'app-rewards',
    templateUrl: './rewards.component.html',
    styleUrls: ['./rewards.component.css'],
    providers: [
        { provide: LOCALE_ID, useValue: 'es-MX' },
        DatePipe
    ],
    standalone: false
})

export class RewardsComponent implements OnInit {

  // References
  private url: string = environment.baseUrl;
  private _client_id: number = 0;
  public pathname: string = '';

  // References Level
  public level: number = 0;
  public nextLevel: number = 0;

  // References Points
  public reward: string = '';
  public points: number = 0; 
  public redemption: boolean = true; 
  public pointsTotalLevel: number = 3000;
  public pointsRemaining: number = 0;
  private levelPoints = [
    {
      level: 1,
      points: 50,
      nextLevel: 2
    },
    {
      level: 2,
      points: 100,
      nextLevel: 3
    },
    {
      level: 3,
      points: 400,
      nextLevel: 4
    },
    {
      level: 4,
      points: 1500,
      nextLevel: 5
    },
    {
      level: 5,
      points: 4000,
      nextLevel: 5
    },
  ];

  // References Rewards
  public sharedReward: string = '';

  constructor(
    private _accountService: AccountService, 
    private _rewardService: RewardsService, 
    private _bottomSheet: MatBottomSheet,
    private _snackBar: MatSnackBar,
    @Inject(DOCUMENT) private datePipe: DatePipe,
    
  ) { }

  ngOnInit(): void {
    // Checking Level User
    //this.checkLevel();

    // Get picture    
    this.getPicture();
    this.scrollTop();
  }

  scrollTop() {
    window.scrollTo(0, 0);
  }

  /**
   * Get rewards for user
   */
  private rewardsUser(user_id: number) {
    this._rewardService.getReward(user_id)
    .subscribe({
      next: ({ code, status, reward, redemption }: Reward) => {        
        if (code === 200 && status === 'success') {
          this._client_id = reward.clients[0].id;
          this.points = reward.clients[0].points;
          this.reward = reward.clients[0].rewards;
          this.pointsRemaining = this.pointsTotalLevel - reward.clients[0].points
          this.sharedReward = `${ this.toTitleCase(reward.name) } te invitó a utilizar su código de Rewards en ABcars. ¡Disfruta de $100 de bono al utilizarlo en alguna compra dentro de nuestro sitio! Genera y acumula la mayor cantidad posible la cual podrás canjear en dinero. Al comprar en ABcars y recomendar a un amigo, siente el amor. Ingresa el código siguiente: ${ reward.clients[0].rewards }`;

          // Flag to redemption button active when is true
          this.redemption = !redemption;
        }
      }
    });
  }

  /**
   * Checking Level User
   */
  private checkLevel() {
    if (this.points >= 50) {      
      let { level, nextLevel } = this.levelPoints.filter(p => p.points <= this.points).reverse()[0];    
      
      this.level = (this.points === this.pointsTotalLevel) ? nextLevel : level;
      this.nextLevel = (level === 5) ? 5 : nextLevel;
    } else {      
      this.nextLevel = 1;
    }
  }

  /**
   * Angular Material 
   * bottom-sheet
   */
  public shoppingCustomer(): void {
    this._bottomSheet.open(BuyCustomerComponent);
  }

  /**
   * Get picture user
   */
  private getPicture() {
    // Get information user in session storage
    const user = JSON.parse(localStorage.getItem('user')!);

    // Get reward
    this.rewardsUser(user.id);
    
    // Launch request
    // this._accountService.getUser(user.id)
    // .subscribe({
    //   next: ({ code, user }: UserSettings) => {
    //     if (code === 200) {
    //       this.pathname = (user.picture == null) ? `/assets/icons/profile.svg` : `${ this.url }/api/user/image/${ user.picture }`;
    //     } else {
    //       this.pathname = '/assets/icons/profile.svg';
    //     }
    //   },
    //   error: (error) => {
    //     this.pathname = '/assets/icons/profile.svg';
    //   }
    // });
  }

  /**
   * Request cash redemption   
   */
  public requestRedemption() {      
    Swal.fire({
      title: '¿Esta seguro que desea enviar su solicitud para obtener su dinero?',
      icon: 'warning',
      showCancelButton: true,      
      confirmButtonText: 'Enviar Solicitud',
      denyButtonText: 'Cancelar',
      confirmButtonColor: '#EEB838',
      cancelButtonColor: '#7C8183',
    }).then((result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        this._rewardService.setReward(this._client_id)
        .subscribe({
          next: ({ code, status, message, rewards }: PostReward) => {
            const date = this.datePipe.transform(rewards.updated_at, "dd MMMM, yyyy, h:mm:ss a");
            if (code === 200 && status === 'success') {
              Swal.fire({
                position: 'top',
                icon: 'success',
                title: `Solicitud enviada el ${ date }, nos pondremos en contacto con usted lo antes posible.`,
                showConfirmButton: false,
                timer: 3500
              });

              // Get information user in session storage
              const user = JSON.parse(localStorage.getItem('user')!);

              // Get reward
              this.rewardsUser(user.id);
            } else {
              Swal.fire({
                icon: 'error',
                text: message,
                showConfirmButton: true,
                confirmButtonColor: '#EEB838',
                timer: 3500
              });
            }
          }
        });
      }
    });
  }

  /**
   * Button for Copy url active to shared button
   */
  public openSnackBarCopy() {  
    // Lauch Snackbar
    this._snackBar.open('Copiado', '', {
      horizontalPosition: 'center',
      verticalPosition: 'top',
      duration: 2000,
      panelClass: ['snackbar']
    });    
  }

  /**
   * To titlecase string
   * @param str String
   * @returns String
   */
  private toTitleCase(str: string) {
    return str.replace(
      /\w\S*/g,
      function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      }
    );
  }

}