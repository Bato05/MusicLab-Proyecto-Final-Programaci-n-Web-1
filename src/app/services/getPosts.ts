import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GetPosts {
  private http = inject(HttpClient);
  
  private baseUrl = 'http://localhost/phpMusicLab/api/index.php';

  // Traer todos (Home)
  getPosts(): Observable<any> {
    return this.http.get(`${this.baseUrl}?accion=posts`);
  }

  // Traer propios (My Content)
  getUserPosts(userId: number | string): Observable<any> {
    return this.http.get(`${this.baseUrl}?accion=posts/${userId}`);
  }
}