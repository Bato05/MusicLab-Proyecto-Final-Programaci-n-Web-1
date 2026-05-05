import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private http = inject(HttpClient);
  private url = 'http://localhost/phpMusicLab/api/index.php?accion=posts';

  // recibe un objeto JSON simple
  postPosts(datos: any): Observable<any> {
    return this.http.post(this.url, datos);
  }
}