import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FollowService {
  private http = inject(HttpClient);
  private url = 'http://localhost/phpMusicLab/api/index.php?accion=followers';

  // Seguir a un usuario
  /**
   * Obtiene la lista de seguidores y seguidos de un usuario específico.
   * Esto es fundamental para que el componente de búsqueda sepa quién tiene el botón "Following".
   */
  getFollowing(userId: number | string): Observable<any> {
  const sesion = JSON.parse(localStorage.getItem('user_session') || '{}');
  const token = sesion.token;
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  
  // Usamos el ID en la URL: http://localhost/.../index.php?accion=followers/1
  return this.http.get(`${this.url}/${userId}`, { headers });
}

  // Seguir a un usuario
  follow(followedId: number | string): Observable<any> {
    const sesion = JSON.parse(localStorage.getItem('user_session') || '{}');
    const token = sesion.token;
    const followerId = sesion.user?.id;

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    return this.http.post(this.url, { 
      follower_id: followerId, 
      followed_id: followedId 
    }, { headers });
  }

  // Dejar de seguir
  unfollow(followedId: number | string): Observable<any> {
    const sesion = JSON.parse(localStorage.getItem('user_session') || '{}');
    const token = sesion.token;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.delete(`${this.url}/${followedId}`, { headers });
  }
}