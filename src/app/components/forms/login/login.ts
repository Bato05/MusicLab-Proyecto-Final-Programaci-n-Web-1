import { Component, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router'; 
import { Router } from '@angular/router'; 
import { Validators, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms'; 
import { CommonModule } from '@angular/common';

import { LoginService } from '../../../services/loginService';
import { SiteConfigService } from '../../../services/siteConfigService'; 

@Component({
  selector: 'app-login',
  standalone: true,
  encapsulation: ViewEncapsulation.None, 
  imports: [
    RouterLink, 
    RouterLinkActive,
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './login.html',
  styleUrl: '../../../app.css',
})
export class Login implements OnInit {
  public formulario: FormGroup;

  // Variables dinámicas
  siteName: string = 'MusicLab';
  welcomeText: string = 'Collaborate with musicians from all over the world';

  private router = inject(Router);
  private loginService = inject(LoginService);
  private siteConfigService = inject(SiteConfigService);

  constructor(private fb: FormBuilder) {
    this.formulario = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // 1. Forzamos la carga de la configuración actualizada al entrar
    this.siteConfigService.getSiteconfig().subscribe(); 
    
    // 2. Nos suscribimos a cambios futuros
    this.siteConfigService.config$.subscribe(config => {
      if (config) {
        this.siteName = config.site_name || 'MusicLab';
        this.welcomeText = config.welcome_text || 'Collaborate with musicians from all over the world';
      }
    });
  }

  logearse() {
    if (this.formulario.valid) {
      this.loginService.postLogin(this.formulario.value).subscribe({
        next: (res: any) => {
          // Éxito: Guardamos sesión y redirigimos
          this.formulario.reset();
          localStorage.setItem('user_session', JSON.stringify(res));
          // Importante: Guardar el token suelto también para que el SiteConfigService lo encuentre fácil
          if (res.token) {
              localStorage.setItem('token', res.token);
          }
          this.router.navigate(['/home']);
        },
        error: (err: any) => {
          console.error(err);

          // --- MANEJO DE ERRORES (Mantenimiento, Bloqueo, Credenciales) ---
          
          if (err.status === 503) {
             // 503: MODO MANTENIMIENTO ACTIVO
             alert('⚠️ SITIO EN MANTENIMIENTO\n\nEl acceso está restringido temporalmente por mejoras.\nSolo administradores pueden acceder.');
          
          } else if (err.status === 403) {
             // 403: USUARIO BLOQUEADO
             alert('⛔ CUENTA SUSPENDIDA\n\nTu usuario ha sido bloqueado por infringir las normas.');
          
          } else if (err.status === 401) {
             // 401: CONTRASEÑA INCORRECTA
             alert('❌ Error: Credenciales incorrectas.');
          
          } else {
             // OTROS
             alert('Ocurrió un error inesperado. Verifica tu conexión.');
          }
        }
      });
    }
  }
}