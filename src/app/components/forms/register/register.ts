import { Component, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router'; 
import { Router } from '@angular/router'; 
import { Validators, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms'; 
import { CommonModule } from '@angular/common';

import { RegisterService } from '../../../services/registerService';
import { SiteConfigService } from '../../../services/siteConfigService'; 

@Component({
  selector: 'app-register',
  standalone: true,
  encapsulation: ViewEncapsulation.None, 
  imports: [
    RouterLink, 
    RouterLinkActive,
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './register.html',
  styleUrl: '../../../app.css',
})
export class Register implements OnInit {
  public formulario: FormGroup;
  
  // Variables dinámicas
  siteName: string = 'MusicLab';
  welcomeText: string = 'Collaborate with musicians from all over the world';

  private router = inject(Router);
  private registerService = inject(RegisterService);
  private siteConfigService = inject(SiteConfigService);

  constructor(private fb: FormBuilder) {
    this.formulario = this.fb.group({
      first_name: ['', [Validators.required, Validators.minLength(2)]],
      last_name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: [''], 
      artist_type: ['', Validators.required],
      bio: ['']
    });
  }

  ngOnInit(): void {
    // Cargar configuración global (Nombre y Texto de Bienvenida)
    this.siteConfigService.getSiteconfig().subscribe();
    
    this.siteConfigService.config$.subscribe(config => {
      if (config) {
        this.siteName = config.site_name || 'MusicLab';
        this.welcomeText = config.welcome_text || 'Collaborate with musicians from all over the world';
      }
    });
  }

  registrarse() {
    if (this.formulario.valid) {
      // Validar que las contraseñas coincidan aquí antes de enviar
      if (this.formulario.value.password !== this.formulario.value.confirm_password) {
          alert("Las contraseñas no coinciden.");
          return;
      }

      this.registerService.postUser(this.formulario.value).subscribe({
        next: (res: any) => {
          alert("¡Registro exitoso! Ahora puedes iniciar sesión.");
          this.router.navigate(['/login']);
        },
        error: (err: any) => {
          console.error(err);
          alert('Error al registrarse. Posiblemente el email ya existe.');
        }
      });
    } else {
        alert("Por favor completa todos los campos requeridos.");
    }
  }
}