import { Component, inject, ViewEncapsulation, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { Router, RouterLink } from '@angular/router'; 
import { Validators, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { UploadService } from '../../../services/uploadService';
import { FollowService } from '../../../services/followService';
import { SiteConfigService } from '../../../services/siteConfigService';

@Component({
  selector: 'app-upload-content', 
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, 
            RouterLink, 
            ReactiveFormsModule], 
  templateUrl: './uploadContent.html', 
  styleUrl: '../../../app.css',
})
export class UploadContent implements OnInit {

  userRole: number = 0;

  siteName: string = 'MusicLab';
  
  public uploadForm: FormGroup;
  public usersList: any[] = []; // Lista de usuarios seguidos
  public loading: boolean = false;
  
  // Variables para manejar el archivo
  private fileBase64: string = '';
  public fileName: string = ''; 

  private router = inject(Router);
  private fb = inject(FormBuilder);
  private uploadService = inject(UploadService);
  private followService = inject(FollowService);
  private siteConfigService = inject(SiteConfigService);

  constructor() {
    this.uploadForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]], 
      file_type: ['audio', [Validators.required]],                
      description: ['', [Validators.maxLength(200)]],
      visibility: ['public', Validators.required], 
      // VOLVEMOS A NULL: Selección única
      destination_id: [null] 
    });
  }

  ngOnInit() {
    this.cargarSeguidos();
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

  cargarSeguidos() {
    const sesion = JSON.parse(localStorage.getItem('user_session') || '{}');
    const miId = sesion.user?.id;

    if (miId) {
      this.followService.getFollowing(miId).subscribe({
        next: (res: any) => {
          this.usersList = res.following || [];
        },
        error: (err) => console.error("Error al obtener seguidos", err)
      });
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.fileName = file.name;
      const reader = new FileReader();
      
      reader.onload = () => {
        this.fileBase64 = reader.result as string;
      };
      
      reader.readAsDataURL(file);
    }
  }

  publicar(): void {
    if (this.uploadForm.valid && this.fileBase64) {
      const val = this.uploadForm.value;

      // Validación simple para selección única
      if (val.visibility === 'followers' && !val.destination_id) {
        alert("Debes seleccionar un destinatario para esta visibilidad.");
        return;
      }

      this.loading = true;
      const sesion = JSON.parse(localStorage.getItem('user_session') || '{}');
      
      const payload = {
        user_id: sesion.user?.id, 
        title: val.title,
        description: val.description,
        file_type: val.file_type,
        file_name: this.fileName,
        file_data: this.fileBase64,
        visibility: val.visibility,
        // Enviamos el ID directo (INT o NULL), nada de arrays ni strings
        destination_id: val.destination_id 
      };

      this.uploadService.postPosts(payload).subscribe({
        next: (res: any) => {
          alert("¡Publicación realizada con éxito!");
          this.loading = false;
          this.router.navigate(['/home']);
        },
        error: (err: any) => {
          console.error(err);
          alert("Error en la publicación. Revisa el tamaño del archivo.");
          this.loading = false;
        }
      });
    } else {
      alert("Por favor completa todos los campos y selecciona un archivo.");
    }
  }

  acceptedFileTypes(): string {
  const type = this.uploadForm.get('file_type')?.value;
  switch (type) {
    case 'audio': return '.mp3, audio/mpeg'; // Muestra solo MP3
    case 'score': return '.pdf, application/pdf'; // Muestra solo PDF
    case 'text': return '.txt, text/plain';  // Muestra solo TXT
    default: return '*'; // Por defecto
  }
}

acceptedExtensions(): string {   
  const type = this.uploadForm.get('file_type')?.value;
  
  switch (type) {
    case 'audio':
      return '.mp3';
    case 'score':
      return '.pdf';
    case 'lyrics':
      return '.txt';
    default:
      return '*';
  }
}

  logout(): void {
    localStorage.clear(); 
    this.router.navigate(['/login']);
  }
}