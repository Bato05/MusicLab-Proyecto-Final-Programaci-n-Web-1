import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PatchUsers {
  private http = inject(HttpClient);
  private url = 'http://localhost/phpMusicLab/api/index.php?accion=users';

  constructor() { }

  patchUsers(id: number | string, userData: any): Observable<any> {
    // Obtenemos el token para la autorización
    const sesion = JSON.parse(localStorage.getItem('user_session') || '{}');
    const token = sesion.token;

    // Angular envía JSON por defecto, así que solo pasamos el objeto 'userData' y solo usamos el token.
    const headers = {
      'Authorization': `Bearer ${token}`
    };

    return this.http.patch(`${this.url}/${id}`, userData, { headers });
  }
}