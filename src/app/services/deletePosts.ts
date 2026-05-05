import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DeletePosts {
  private http = inject(HttpClient);
  
  private baseUrl = 'http://localhost/phpMusicLab/api/index.php';
  
  // Borrar publicación (Misma estructura, solo agregamos la "llave" del token)
  deletePost(postId: number | string): Observable<any> {
    const sesionRaw = localStorage.getItem('user_session');
    const sesion = sesionRaw ? JSON.parse(sesionRaw) : null;
    const token = sesion?.token; // Extrae el token del objeto de sesión

    // El prefijo DEBE SER "Bearer " (con 'e' y un espacio al final)
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.delete(`${this.baseUrl}?accion=posts/${postId}`, { headers });
  }
}
