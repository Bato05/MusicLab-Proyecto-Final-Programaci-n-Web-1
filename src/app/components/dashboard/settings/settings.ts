import { Component, OnInit, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { GetUsers } from '../../../services/getUsers';
import { PatchUsers } from '../../../services/patchUsers';
import { DeleteUsers } from '../../../services/deleteUsers';
import { SiteConfigService } from '../../../services/siteConfigService';

@Component({
  selector: 'app-settings',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './settings.html',
  styleUrl: '../../../app.css'
})
export class Settings implements OnInit {

  userRole: number = 0;
  
  siteName: string = 'MusicLab';

  public settingsForm: FormGroup;
  public loading: boolean = false;
  public deleting: boolean = false;
  
  private originalEmail: string = '';
  
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private getUsersService = inject(GetUsers);
  private patchUsersService = inject(PatchUsers);
  private deleteUsersService = inject(DeleteUsers);
  private siteConfigService = inject(SiteConfigService);

  constructor() {
    this.settingsForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(6)]], 
      confirm_password: ['']
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.cargarDatosUsuario();
    const sesion = JSON.parse(localStorage.getItem('user_session') || '{}');
    
    // 2. Extracción del rol
    // Intenta leer 'sesion.user.role'. Si no existe, usa '0' para evitar NaN.
    const rawRole = sesion.user?.role || sesion.role || 0;

    // 3. Asignación y conversión
    this.userRole = Number(rawRole);

    // Lógica para el nombre del sitio dinámico
    this.siteConfigService.config$.subscribe(config => {
        if (config && config.site_name) {
            this.siteName = config.site_name;
        }
    });
  }

  // Validador: Compara contraseñas solo si el campo password tiene contenido
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirm = control.get('confirm_password')?.value;
    
    if (!password || password.trim() === '') {
      return null;
    }

    return password === confirm ? null : { mismatch: true };
  }

  cargarDatosUsuario() {
    const sesion = JSON.parse(localStorage.getItem('user_session') || '{}');
    const userId = sesion.user?.id;

    if (userId) {
      this.getUsersService.getUserById(userId).subscribe({
        next: (res: any) => {
          // Guardamos el email original para comparaciones
          this.originalEmail = (res.email || '').trim();
          
          this.settingsForm.patchValue({
            email: this.originalEmail,
            password: '',
            confirm_password: ''
          });
        },
        error: (err) => console.error("Error cargando usuario", err)
      });
    }
  }

  /**
   * Determina si el botón debe habilitarse.
   * Se habilita si el email cambió O si se ingresó una contraseña nueva.
   */
  hasChanges(): boolean {
    const formEmail = (this.settingsForm.get('email')?.value || '').trim();
    const formPass = (this.settingsForm.get('password')?.value || '').trim();
    
    const emailChanged = formEmail !== this.originalEmail && formEmail !== '';
    const passwordEntered = formPass.length > 0;

    return emailChanged || passwordEntered;
  }

  updateSettings() {
    if (this.settingsForm.valid && this.hasChanges()) {
      this.loading = true;
      const sesion = JSON.parse(localStorage.getItem('user_session') || '{}');
      const userId = sesion.user?.id;

      const payload: any = {};
      const currentEmail = this.settingsForm.get('email')?.value.trim();
      const currentPass = this.settingsForm.get('password')?.value;

      if (currentEmail !== this.originalEmail) {
        payload.email = currentEmail;
      }
      
      if (currentPass && currentPass.length > 0) {
        payload.password = currentPass;
      }

      this.patchUsersService.patchUsers(userId, payload).subscribe({
        next: (res: any) => {
          alert('Account settings updated successfully!');
          
          if (payload.email) sesion.user.email = payload.email;
          localStorage.setItem('user_session', JSON.stringify(sesion));
          
          window.location.reload();
        },
        error: (err) => {
          console.error(err);
          alert('Error updating settings.');
          this.loading = false;
        }
      });
    }
  }

  deleteAccount() {
    if (confirm('⚠️ WARNING: Are you sure you want to delete your account? This action cannot be undone.')) {
      this.deleting = true;
      const sesion = JSON.parse(localStorage.getItem('user_session') || '{}');
      const userId = sesion.user?.id;

      this.deleteUsersService.deleteUser(userId).subscribe({
        next: (res: any) => {
          if (res && res.status === 'error') {
            this.deleting = false;
            alert('⛔ ERROR: ' + (res.message || 'Cannot delete account.'));
            return;
          }
          alert('Account deleted. Goodbye!');
          this.logout();
        },
        error: (err) => {
          this.deleting = false;
          if (err.status === 403) {
            alert('⛔ ERROR: Critical System Protection.\nThe Owner account cannot be deleted.');
          } else {
            alert('An unexpected error occurred.');
          }
        }
      });
    }
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}