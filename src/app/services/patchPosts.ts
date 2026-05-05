import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PatchPost {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost/phpMusicLab/api/index.php';

  patchPosts(id: number, datos: any): Observable<any> {
    // 1. Recuperamos la sesión para sacar el token
    const sesionRaw = localStorage.getItem('user_session');
    const sesion = sesionRaw ? JSON.parse(sesionRaw) : null;
    const token = sesion?.token;

    // 2. Creamos los headers con la autorización
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    // 3. Enviamos la petición CON los headers
    return this.http.patch(`${this.baseUrl}?accion=posts/${id}`, datos, { headers });
  }
}