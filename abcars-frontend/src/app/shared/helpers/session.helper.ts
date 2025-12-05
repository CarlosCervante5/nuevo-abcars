
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

// Bandera global para evitar múltiples redirecciones simultáneas
// Se comparte entre la función reload y el interceptor
(window as any).__isRedirecting401 = false;

export function reload(error:any, router: Router){
    if(error.status == 401){
        // Evitar múltiples redirecciones simultáneas
        // Usar la misma bandera que el interceptor
        if ((window as any).__isRedirecting401) {
            return;
        }
        (window as any).__isRedirecting401 = true;
        
        // Limpiar el estado de autenticación
        localStorage.removeItem('user_token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        localStorage.removeItem('profile');
        
        router.navigate(['/auth/iniciar-sesion']).then(() => {
            // Solo mostrar el mensaje si no se ha mostrado ya (el interceptor también lo muestra)
            if (!(window as any).__swalShown401) {
                (window as any).__swalShown401 = true;
                Swal.fire({
                    icon: 'warning',
                    title: 'Sesión expirada',
                    text: 'Su sesión ha expirado, por favor inicie sesión nuevamente.',
                    confirmButtonText: 'Aceptar',
                    allowOutsideClick: false,
                    allowEscapeKey: false
                }).finally(() => {
                    (window as any).__swalShown401 = false;
                    // Resetear la bandera después de un tiempo
                    setTimeout(() => {
                        (window as any).__isRedirecting401 = false;
                    }, 2000);
                });
            } else {
                // Si ya se mostró el mensaje, solo resetear la bandera
                setTimeout(() => {
                    (window as any).__isRedirecting401 = false;
                }, 2000);
            }
        }).catch(() => {
            // Si la navegación falla, resetear la bandera
            setTimeout(() => {
                (window as any).__isRedirecting401 = false;
            }, 1000);
        });
    }else{
        Swal.fire({
                icon: 'error',
                title: 'Oupps..',
                text: 'Al parecer ocurrio un error' + (error.error?.message || ''),
                showConfirmButton: true,
                confirmButtonColor: '#EEB838',
                timer: 3500
        });
    }
}