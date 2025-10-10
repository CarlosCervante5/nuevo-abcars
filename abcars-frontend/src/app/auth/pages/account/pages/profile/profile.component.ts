import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['profile.component.css'],
    standalone: false
})

export class ProfileComponent implements OnInit {

  // Information User
  public name: string = '';

  constructor(
    private titleService: Title,
    private authService: AuthService,
    private router: Router
  ) { 
    // Set Title View
    this.titleService.setTitle('ABCars | Mi Cuenta');
  }

  ngOnInit(): void {
    // Get user in session storage
    this.userSessionStorage();
    this.scrollTop();
  }

  scrollTop() {
    window.scrollTo(0, 0);
  }

  /**
   * Get information user in session storage 
   */
  private userSessionStorage() {
    const user = JSON.parse(localStorage.getItem('user')!);
    if (user) {
      this.name = user.name || user.nickname || 'Usuario';
    }
  }

  /**
   * Logout user
   */
  logout() {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: '¿Estás seguro de que deseas cerrar sesión?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.logout().subscribe({
          next: () => {
            this.authService.clearAuthState();
            this.router.navigate(['/']);
            Swal.fire({
              icon: 'success',
              title: 'Sesión cerrada',
              text: 'Has cerrado sesión exitosamente',
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            // Even if the API call fails, clear local state
            this.authService.clearAuthState();
            this.router.navigate(['/']);
          }
        });
      }
    });
  }

}
