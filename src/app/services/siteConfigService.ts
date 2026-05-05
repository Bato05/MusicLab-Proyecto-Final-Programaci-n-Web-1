import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // <--- Importacion del HttpHeaders
import { BehaviorSubject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SiteConfigService {
  private http = inject(HttpClient);

  // URL directa a la API
  private baseUrl = 'http://localhost/phpMusicLab/api/siteconfig';

  // ESTADO GLOBAL
  private configSubject = new BehaviorSubject<any>({
    site_name: 'MusicLab',
    welcome_text: 'Welcome to MusicLab',
    maintenance_mode: 0
  });

  public config$ = this.configSubject.asObservable();

  // --- FUNCIÓN PRIVADA PARA OBTENER CABECERAS CON TOKEN ---
  private getHeaders(): HttpHeaders {
    // Recuperamos el token del almacenamiento local
    // Asegúrate de que la clave sea 'token' 
    
    let token = localStorage.getItem('token'); 
    
    if (!token) {
        // Si no hay token suelto, buscamos en la sesión
        const session = localStorage.getItem('user_session');
        if (session) {
            const parsedSession = JSON.parse(session);
            token = parsedSession.token || ''; 
        }
    }

    return new HttpHeaders({
      'Authorization': `Bearer ${token}` 
    });
  }

  // 1. GET Site Config
  getSiteconfig() {
    // Enviamos las cabeceras con el token
    return this.http.get(this.baseUrl, { headers: this.getHeaders() }).pipe(
      tap((res: any) => {
        if (res && res.length > 0) {
            this.configSubject.next(res[0]); 
        }
      })
    );
  }

  // 2. PATCH Site Config
  patchSiteconfig(data: any) {
    // Enviamos las cabeceras con el token
    return this.http.patch(this.baseUrl, data, { headers: this.getHeaders() }).pipe(
      tap((res: any) => {
        if (res.data) {
            const currentConfig = this.configSubject.value;
            this.configSubject.next({ ...currentConfig, ...res.data });
        }
      })
    );
  }
}