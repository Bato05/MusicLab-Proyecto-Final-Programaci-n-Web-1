import { Component, OnInit, inject, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms'; 
import { GetUsers } from '../../../services/getUsers';
import { PatchUsers } from '../../../services/patchUsers';
import { SiteConfigService } from '../../../services/siteConfigService';

@Component({
  selector: 'app-profile',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: '../../../app.css'
})
export class Profile implements OnInit {

  userRole:number = 0;

  siteName: string = 'MusicLab';
  
  public profileForm: FormGroup;
  public loading: boolean = false;
  
  public currentImgUrl: string = 'default_profile.png';
  public previewUrl: string | null = null;
  private originalData: any = {};
  
  private newImgBase64: string = '';
  private newImgName: string = '';

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private getUsersService = inject(GetUsers);
  private patchUsersService = inject(PatchUsers);
  private cdr = inject(ChangeDetectorRef);
  private siteConfigService = inject(SiteConfigService);

  constructor() {
    this.profileForm = this.fb.group({
      first_name: [''],
      last_name: [''],
      artist_type: [''],
      bio: ['']
    });
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

  cargarDatosUsuario() {
    const sesion = JSON.parse(localStorage.getItem('user_session') || '{}');
    const userId = sesion.user?.id;

    if (userId) {
      this.getUsersService.getUserById(userId).subscribe({
        next: (res: any) => {
          this.originalData = {
            first_name: res.first_name,
            last_name: res.last_name,
            artist_type: res.artist_type,
            bio: res.bio || ''
          };

          this.profileForm.patchValue(this.originalData);
          this.currentImgUrl = res.profile_img_url;
          this.cdr.detectChanges(); 
        },
        error: (err) => console.error("Error cargando perfil", err)
      });
    }
  }

  get profileImageSrc(): string {
    if (this.previewUrl) return this.previewUrl;
    
    if (this.currentImgUrl === 'default_profile.png') {
        return 'http://localhost/phpMusicLab/assets/default_profile.png';
    }
    return `http://localhost/phpMusicLab/uploads/${this.currentImgUrl}`;
  }

  hasChanges(): boolean {
    if (this.newImgBase64) return true;
    
    const current = this.profileForm.value;
    if (current.first_name !== this.originalData.first_name) return true;
    if (current.last_name !== this.originalData.last_name) return true;
    if (current.artist_type !== this.originalData.artist_type) return true;
    if (current.bio !== this.originalData.bio) return true;

    return false;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Solo se permiten archivos de imagen');
        return;
      }

      this.newImgName = file.name;
      
      const reader = new FileReader();
      
      reader.onload = () => {
        this.newImgBase64 = reader.result as string;
        this.previewUrl = this.newImgBase64;
        this.cdr.detectChanges(); 
      };
      
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  }

  updateProfile() {
    if (this.profileForm.valid && this.hasChanges()) {
      this.loading = true;
      const sesion = JSON.parse(localStorage.getItem('user_session') || '{}');
      const userId = sesion.user?.id;

      const payload: any = { ...this.profileForm.value };

      if (this.newImgBase64) {
        payload.profile_img_data = this.newImgBase64;
        payload.profile_img_name = this.newImgName;
      }

      this.patchUsersService.patchUsers(userId, payload).subscribe({
        next: (res: any) => {
          alert('Profile updated successfully!');
          
          sesion.user = { ...sesion.user, ...payload };
          if (res.new_img) sesion.user.profile_img_url = res.new_img;
          localStorage.setItem('user_session', JSON.stringify(sesion));

          this.loading = false;
          window.location.reload(); 
        },
        error: (err) => {
          console.error(err);
          alert('Error updating profile.');
          this.loading = false;
        }
      });
    }
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}