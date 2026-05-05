import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router); 
  
  // ¿Sigue encendida la vela de la sesión?
  const sesion = localStorage.getItem('user_session');

  if (sesion) {
    // Si hay sesión, el paso es lícito
    return true;
  } else {
    // Si no hay sesión, se le deniega el paso y se le envía al inicio
    router.navigate(['/login']);
    return false;
  }
};