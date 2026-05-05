<?php

// 1. CONFIGURACIÓN DE CORS Y HEADERS, puente entre el backend y el frontend de angular dependiendo de las versiones
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Authorization, Content-Type");
header("Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS");
header("Access-Control-Expose-Headers: Content-Disposition");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    die;
}

// 2. CONEXIÓN Y CONFIGURACIÓN
// incuye el $link
require_once "../config/config.php";

if (!isset($_GET['accion'])) {
    outputError(400);
}

// 3. ENRUTAMIENTO BÁSICO
$metodo = strtolower($_SERVER['REQUEST_METHOD']);
$accion = explode('/', strtolower($_GET['accion']));
$funcionNombre = $metodo . ucfirst($accion[0]);
$parametros = array_slice($accion, 1);

if (count($parametros) > 0 && $metodo == 'get') {
    $funcionNombre = $funcionNombre.'ConParametros';
}

if (function_exists($funcionNombre)) {
    call_user_func_array ($funcionNombre, $parametros);
} else {
    outputError(400);
}

// =================================================================================
//                               FUNCIONES AUXILIARES
// =================================================================================

function outputError($codigo = 500) {
    switch ($codigo) {
        case 401: header($_SERVER["SERVER_PROTOCOL"] . " 401 Unauthorized", true, 401); die;
        case 400: header($_SERVER["SERVER_PROTOCOL"] . " 400 Bad request", true, 400); die;
        case 404: header($_SERVER["SERVER_PROTOCOL"] . " 404 Not Found", true, 404); die;
        default:  header($_SERVER["SERVER_PROTOCOL"] . " 500 Internal Server Error", true, 500); die;
    }
}

function outputJson($data, $codigo = 200) {
    header('', true, $codigo);
    header('Content-type: application/json');
    print json_encode($data);
    die;
}

function generarJWT($id, $email, $role) {
    $key = "Tu_Clave_Secreta_MusicLab_2026";
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $headerBase64 = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $payload = json_encode([
        'iat' => time(),
        'exp' => time() + 3600,
        'data' => ['id' => $id, 'email' => $email, 'role' => $role]
    ]);
    $payloadBase64 = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    $signature = hash_hmac('sha256', "$headerBase64.$payloadBase64", $key, true);
    $signatureBase64 = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    return "$headerBase64.$payloadBase64.$signatureBase64";
}

function validarToken() {
    $headers = apache_request_headers(); 
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
    if (!$authHeader) { outputError(401); }
    $token = str_ireplace('Bearer ', '', $authHeader);
    $partes = explode('.', $token);
    if (count($partes) !== 3) { outputError(401); }
    $payloadBase64 = str_replace(['-', '_'], ['+', '/'], $partes[1]);
    $payload = json_decode(base64_decode($payloadBase64), true);
    if (isset($payload['data'])) { return $payload['data']; }
    outputError(401);
}

/**
 * Función auxiliar para decodificar y guardar archivos Base64
 * necesario para traducir binario a string
 * Recibe: string base64 y nombre del archivo destino
 * Retorna: true si guardó, false si falló
 */
// --- FUNCIÓN AUXILIAR IMPRESCINDIBLE ---

function guardarBase64($base64_string, $nombre_archivo) {
    // 1. Definir rutas
    $ruta_carpeta = __DIR__ . "/../uploads/"; 
    $ruta_destino = $ruta_carpeta . $nombre_archivo;

    // 2. Verificar si existe la carpeta, si no, crearla
    if (!file_exists($ruta_carpeta)) {
        // Si falla al crear la carpeta, retornamos false directamente
        if (!mkdir($ruta_carpeta, 0777, true)) {
            return false;
        }
    }

    // 3. Limpiar la cadena Base64 (quita el encabezado "data:image...")
    if (strpos($base64_string, ',') !== false) {
        $partes = explode(',', $base64_string);
        $base64_limpio = $partes[1];
    } else {
        $base64_limpio = $base64_string;
    }

    // 4. Decodificar en base64
    $data_decodificada = base64_decode($base64_limpio);

    if ($data_decodificada === false) {
        return false;
    }

    // 5. Escribir el archivo
    $bytes_escritos = file_put_contents($ruta_destino, $data_decodificada);

    // Retornar true si se escribieron bytes, false si hubo error
    if ($bytes_escritos !== false) {
        return true; 
    } else {
        return false;
    }
}


// =================================================================================
//                                      API
// =================================================================================

// GET Users
function getUsers() {
    global $link;
    $sql = "SELECT * FROM users";
    $result = mysqli_query($link, $sql);
    if ($result===false) { outputError(500); }
    $ret = [];
    while ($fila = mysqli_fetch_assoc($result)) {
        settype($fila['id'], 'integer');
        settype($fila['role'], 'integer');
        settype($fila['status'], 'integer');
        $ret[] = $fila;
    }
    outputJson($ret);
}

// GET User by ID
function getUsersConParametros($id) {
    global $link;
    $id = mysqli_real_escape_string($link, $id);
    $sql = "SELECT id, first_name, last_name, password, email, role, artist_type, bio, profile_img_url, status, created_at FROM users WHERE id = $id";
    $result = mysqli_query($link, $sql);
    if ($result === false) { outputError(500); }
    $usuario = mysqli_fetch_assoc($result);
    if ($usuario) {
        settype($usuario['id'], 'integer');
        settype($usuario['role'], 'integer');
        settype($usuario['status'], 'integer');
        outputJson($usuario);
    } else {
        outputError(404);
    }
}

// GET Posts
function getPosts() {
    global $link;
    $sql = "SELECT p.id, user_id, p.title, p.description, p.file_url, p.file_type, p.visibility, p.destination_id, p.created_at, u.profile_img_url, CONCAT(u.first_name, ' ', u.last_name) as artist_name 
            FROM posts p INNER JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC";
    $result = mysqli_query($link, $sql);
    if ($result === false) { outputError(500); }
    $ret = [];
    while ($fila = mysqli_fetch_assoc($result)) {
        settype($fila['id'], 'integer');
        settype($fila['user_id'], 'integer');
        settype($fila['destination_id'], 'integer');
        $ret[] = $fila;
    }
    outputJson($ret);
}

// GET User Posts
function getPostsConParametros($id = null) {
    global $link;
    $id_limpio = (int)$id;
    if ($id_limpio <= 0) { outputJson([]); die; }
    $sql = "SELECT p.*, user_id, p.visibility, p.destination_id, u.profile_img_url, CONCAT(u.first_name, ' ', u.last_name) as artist_name 
            FROM posts p INNER JOIN users u ON p.user_id = u.id WHERE p.user_id = $id_limpio ORDER BY p.created_at DESC";
    $result = mysqli_query($link, $sql);
    if ($result === false) { outputError(500); }
    $ret = [];
    while ($fila = mysqli_fetch_assoc($result)) {
        settype($fila['id'], 'integer');
        settype($fila['user_id'], 'integer');
        settype($fila['destination_id'], 'integer');
        $ret[] = $fila;
    }
    outputJson($ret); 
}

// GET site_config
function getSiteconfig() {
    global $link;
    $sql = "SELECT * FROM site_config";
    $result = mysqli_query($link, $sql);
    if ($result===false) { outputError(500); }
    $ret = [];
    while ($fila = mysqli_fetch_assoc($result)) {
        settype($fila['id'], 'integer');
        settype($fila['maintenance_mode'], 'integer');
        $ret[] = $fila;
    }
    outputJson($ret);
}

// POST Login
function postLogin() {
    global $link;

    $input = file_get_contents("php://input");
    $data = json_decode($input, true);

    if (!isset($data['email']) || !isset($data['password'])) {
        outputJson(['status' => 'error', 'message' => 'Faltan datos'], 400);
    }

    $email = mysqli_real_escape_string($link, $data['email']);
    $password = $data['password'];

    // 1. Buscar usuario
    $sql = "SELECT * FROM users WHERE email = '$email'";
    $result = mysqli_query($link, $sql);

    if ($row = mysqli_fetch_assoc($result)) {
        
        // 2. Verificar Contraseña
        if (password_verify($password, $row['password'])) {
            
            // LÓGICA DE MANTENIMIENTO (PERMITE ADMINS Y OWNER)
            
            // A. Consultar estado del sitio
            $sql_config = "SELECT maintenance_mode FROM site_config LIMIT 1";
            $res_config = mysqli_query($link, $sql_config);
            
            if ($res_config && mysqli_num_rows($res_config) > 0) {
                $config = mysqli_fetch_assoc($res_config);
                
                $maintenance = (int)$config['maintenance_mode'];
                $userRole = (int)$row['role']; // 0=User, 1=Admin, 2=Owner

                // B. CONDICIÓN ADICIONALES:
                // Si hay mantenimiento (1)
                // Y el usuario es MENOR que 1 (es decir, es 0 / Usuario Común)
                // (Esto asegura que Roles 1 y 2 pasen sin problemas)
                if ($maintenance === 1 && $userRole < 1) {
                    
                    http_response_code(503); 
                    echo json_encode([
                        'status' => 'error', 
                        'message' => 'Mantenimiento activado'
                    ]);
                    exit; // DETENER EJECUCIÓN
                }
            }

            // 3. Verificar estado de cuenta (Bloqueado/Activo)
            if ((int)$row['status'] === 0) {
                outputJson(['status' => 'error', 'message' => 'Usuario bloqueado.'], 403);
                return;
            }

            // 4. Generar Token
            $jwt = generarJWT($row['id'], $row['email'], $row['role']);
            unset($row['password']);

            outputJson([
                'status' => 'success',
                'message' => 'Login exitoso',
                'token' => $jwt,
                'user' => $row
            ]);

        } else {
            outputJson(['status' => 'error', 'message' => 'Contraseña incorrecta'], 401);
        }
    } else {
        outputJson(['status' => 'error', 'message' => 'Usuario no encontrado'], 404);
    }
}

// POST Users (Registro)
function postUsers() {
    global $link;
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['first_name']) || empty($data['last_name']) || empty($data['email']) || empty($data['password']) || empty($data['artist_type'])) {
        outputError(400);
    }

    $first_name = mysqli_real_escape_string($link, $data['first_name']);
    $last_name = mysqli_real_escape_string($link, $data['last_name']);
    $email = mysqli_real_escape_string($link, $data['email']);
    $artist_type_raw = is_array($data['artist_type']) ? implode(', ', $data['artist_type']) : $data['artist_type'];
    $artist_type = mysqli_real_escape_string($link, $artist_type_raw);
    $bio = !empty($data['bio']) ? mysqli_real_escape_string($link, $data['bio']) : '';
    
    $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);

    // Se asume imagen default al registrar
    $sql = "INSERT INTO users (first_name, last_name, email, password, artist_type, bio, profile_img_url, role) 
            VALUES ('$first_name', '$last_name', '$email', '$passwordHash', '$artist_type', '$bio', 'default_profile.png', 0)";

    if (mysqli_query($link, $sql)) {
        $userId = mysqli_insert_id($link);
        $token = generarJWT($userId, $email, 0); 
        outputJson([ "status" => "success", "token" => $token, "user" => ["id" => $userId, "first_name" => $first_name, "role" => 0] ], 201);
    } else {
        outputError(500);
    }
}

// POST Posts (EN BASE64 POR SI EL ARCHIVO ES UN .MP3)
function postPosts() {
    global $link;
    // Leemos JSON 
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['user_id']) || !isset($data['title'])) { 
        outputError(400); 
    }
    
    $userId = mysqli_real_escape_string($link, $data['user_id']);
    $title = mysqli_real_escape_string($link, $data['title']);
    $description = isset($data['description']) ? mysqli_real_escape_string($link, $data['description']) : '';
    $fileType = mysqli_real_escape_string($link, $data['file_type']);
    
    // CAPTURAMOS LOS NUEVOS CAMPOS
    $visibility = isset($data['visibility']) ? mysqli_real_escape_string($link, $data['visibility']) : 'public';
    
    // Si destination_id no viene o es vacío, lo tratamos como NULL para SQL
    $destinationId = (isset($data['destination_id']) && !empty($data['destination_id'])) 
                     ? mysqli_real_escape_string($link, $data['destination_id']) 
                     : "NULL";
    
    $fileUrl = 'none';

    // Manejo de Base64 para el archivo del post
    if (isset($data['file_data']) && !empty($data['file_data']) && isset($data['file_name'])) {
        $ext = pathinfo($data['file_name'], PATHINFO_EXTENSION);
        $nombreArchivo = time() . "_" . preg_replace('/[^a-zA-Z0-9]/', '', basename($data['file_name'], ".".$ext)) . "." . $ext;
        
        if (guardarBase64($data['file_data'], $nombreArchivo)) {
            $fileUrl = $nombreArchivo;
        }
    }

    // INSERT ACTUALIZADO CON LOS 7 CAMPOS
    // Nota: $destinationId no lleva comillas simples por si es NULL
    $sql = "INSERT INTO posts (user_id, title, description, file_url, file_type, visibility, destination_id) 
            VALUES ($userId, '$title', '$description', '$fileUrl', '$fileType', '$visibility', $destinationId)";

    if (mysqli_query($link, $sql)) {
        outputJson(["status" => "success", "message" => "Publicación procesada"]);
    } else {
        outputError(500);
    }
}

// PATCH Users (Edición de Perfil con BASE64)
function patchUsers($id) {
    global $link;
    
    // 1. Validar token
    $editor = validarToken(); 
    // Asegurar de dónde viene el ID y Role ($editor['id'], $editor['data']['id'])
    $id_editor = isset($editor['data']) ? (int)$editor['data']['id'] : (int)$editor['id'];
    $rol_editor = isset($editor['data']) ? (int)$editor['data']['role'] : (int)$editor['role'];
    
    $id_usuario_modificar = (int)$id;

    // 2. Obtener datos originales
    $sql_search = "SELECT * FROM users WHERE id = $id_usuario_modificar";
    $res_search = mysqli_query($link, $sql_search);
    $original = mysqli_fetch_assoc($res_search);

    if (!$original) { outputJson(['status'=>'error', 'message'=>'Usuario no encontrado'], 404); }

    // 3. Verificación de Jerarquías (Lógica corregida)
    $rol_destino = (int)$original['role'];
    $puedeEditar = false;

    // A. Es el mismo usuario
    if ($id_editor === $id_usuario_modificar) {
        $puedeEditar = true;
    }
    // B. Es Owner (Rol 2) editando a cualquiera inferior
    else if ($rol_editor === 2 && $rol_destino < 2) {
        $puedeEditar = true;
    }
    // C. Es Admin (Rol 1) editando a un User (Rol 0)
    else if ($rol_editor === 1 && $rol_destino === 0) {
        $puedeEditar = true;
    }

    if (!$puedeEditar) { outputJson(['status'=>'error', 'message'=>'No tienes permiso'], 403); }

    // 4. Leer Datos
    $data = json_decode(file_get_contents('php://input'), true);

    // Campos básicos
    $first_name = !empty($data['first_name']) ? mysqli_real_escape_string($link, $data['first_name']) : $original['first_name'];
    $last_name = !empty($data['last_name']) ? mysqli_real_escape_string($link, $data['last_name']) : $original['last_name'];
    $email = !empty($data['email']) ? mysqli_real_escape_string($link, $data['email']) : $original['email'];
    $artist_type = !empty($data['artist_type']) ? mysqli_real_escape_string($link, $data['artist_type']) : $original['artist_type'];
    $bio = isset($data['bio']) ? mysqli_real_escape_string($link, $data['bio']) : $original['bio'];
    
    // Password (solo si se envía)
    $password = !empty($data['password']) ? password_hash($data['password'], PASSWORD_DEFAULT) : $original['password'];
    
    // Rol (Solo Owner puede cambiar roles)
    $role = ($rol_editor === 2 && isset($data['role'])) ? (int)$data['role'] : (int)$original['role'];
    
    // Estado (Nuevo campo para Admin/Owner)
    // Permitimos cambiar status si eres Admin u Owner
    $status = (isset($data['status']) && ($rol_editor === 1 || $rol_editor === 2)) 
              ? (int)$data['status'] 
              : (int)$original['status'];

    // 5. Gestión de Imagen
    $profile_img_url = $original['profile_img_url'];
    if (isset($data['profile_img_data']) && !empty($data['profile_img_data']) && isset($data['profile_img_name'])) {
        $ext = pathinfo($data['profile_img_name'], PATHINFO_EXTENSION);
        $nombre_archivo = "profile_" . $id_usuario_modificar . "_" . time() . "." . $ext;
        
        if (guardarBase64($data['profile_img_data'], $nombre_archivo)) {
            $profile_img_url = $nombre_archivo;
            if ($original['profile_img_url'] !== 'default_profile.png') {
                $ruta_vieja = "../uploads/" . $original['profile_img_url'];
                if (file_exists($ruta_vieja)) { unlink($ruta_vieja); }
            }
        }
    }

    // 6. Update
    $sql_update = "UPDATE users SET 
                    first_name = '$first_name', 
                    last_name = '$last_name', 
                    email = '$email', 
                    password = '$password', 
                    role = $role, 
                    artist_type = '$artist_type', 
                    bio = '$bio', 
                    profile_img_url = '$profile_img_url',
                    status = $status 
                  WHERE id = $id_usuario_modificar";

    if (mysqli_query($link, $sql_update)) {
        outputJson([ "status" => "success", "new_img" => $profile_img_url ]);
    } else {
        outputJson(['status'=>'error', 'message'=>mysqli_error($link)], 500);
    }
}

// PATCH Posts (Edición de Publicación con Base64 y ID de destino)
function patchPosts($id) {
    global $link;
    
    // 1. Validar Token y permisos
    $editor = validarToken();
    $id_editor = (int)$editor['id'];
    $rol_editor = (int)$editor['role'];
    $id_post = (int)$id;

    // 2. Verificar existencia del post
    $sql = "SELECT * FROM posts WHERE id = $id_post";
    $res = mysqli_query($link, $sql);
    $original = mysqli_fetch_assoc($res);
    
    if (!$original) { 
        outputError(404); // Post no encontrado
    }

    // 3. Verificar permisos (dueño del post o rol de administrador/owner)
    if ($id_editor !== (int)$original['user_id'] && $rol_editor !== 2) { 
        outputError(401); 
    }

    // 4. Capturar y Validar el JSON de entrada
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        outputJson([
            "status" => "error",
            "message" => "JSON inválido recibido del frontend",
            "debug_received" => $input
        ]);
        exit;
    }

    // 5. Capturar datos (si no vienen en el JSON, mantener los originales)
    $title = isset($data['title']) ? mysqli_real_escape_string($link, $data['title']) : $original['title'];
    $description = isset($data['description']) ? mysqli_real_escape_string($link, $data['description']) : $original['description'];
    $file_type = isset($data['file_type']) ? mysqli_real_escape_string($link, $data['file_type']) : $original['file_type'];
    $visibility = isset($data['visibility']) ? mysqli_real_escape_string($link, $data['visibility']) : $original['visibility'];
    
    // Manejo de destination_id (NULL si no viene o está vacío)
    $destination_id = (isset($data['destination_id']) && $data['destination_id'] !== "") 
                      ? "'" . mysqli_real_escape_string($link, $data['destination_id']) . "'" 
                      : "NULL";

    $file_url = $original['file_url']; 

    // 6. Gestión de nuevo archivo si existe
    if (isset($data['file_data']) && !empty($data['file_data']) && isset($data['file_name'])) {
        $ext = pathinfo($data['file_name'], PATHINFO_EXTENSION);
        $nombre_nuevo = time() . "_" . preg_replace('/[^a-zA-Z0-9]/', '', basename($data['file_name'], ".".$ext)) . "." . $ext;
        
        if (guardarBase64($data['file_data'], $nombre_nuevo)) {
            // Borrar archivo anterior si no es el valor por defecto
            if ($original['file_url'] !== 'none' && !empty($original['file_url'])) {
                $ruta_vieja = "../uploads/" . $original['file_url'];
                if (file_exists($ruta_vieja)) { @unlink($ruta_vieja); }
            }
            $file_url = $nombre_nuevo;
        }
    }

    // 7. SQL UPDATE
    $sql_update = "UPDATE posts SET 
                    title = '$title', 
                    description = '$description', 
                    file_type = '$file_type', 
                    file_url = '$file_url',
                    visibility = '$visibility',
                    destination_id = $destination_id 
                  WHERE id = $id_post";

    if (mysqli_query($link, $sql_update)) {
        // Devolvemos el post actualizado para que Angular pueda refrescar la vista sin recargar
        outputJson([
            "status" => "success", 
            "message" => "Publicación actualizada",
            "data" => [
                "id" => $id_post,
                "title" => $title,
                "description" => $description,
                "file_url" => $file_url
            ]
        ]);
    } else {
        // Si hay error en el SQL, lo mostramos para debuggear
        outputJson([
            "status" => "error",
            "message" => "Error al ejecutar el UPDATE",
            "mysql_error" => mysqli_error($link)
        ]);
    }
}

// PATCH Site Config (Exclusivo Owner - Rol 2)
function patchSiteconfig() {
    global $link;

    // 1. Validar Token y obtener datos del usuario que hace la petición
    $solicitante = validarToken();
    $rol_solicitante = isset($solicitante['role']) ? (int)$solicitante['role'] : 0;

    // 2. Verificar permisos estrictos: SOLO EL OWNER (Rol 2)
    if ($rol_solicitante !== 2) {
        outputJson(['status' => 'error', 'message' => 'No tienes permiso para modificar la configuración del sitio.'], 403);
    }

    // 3. Capturar los datos enviados en el cuerpo de la petición (JSON)
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        outputJson(['status' => 'error', 'message' => 'JSON inválido'], 400);
    }

    // 4. Preparar los campos a actualizar
    // Usamos el ID 1 porque la configuración es única para todo el sitio
    $id_config = 1;

    // Obtenemos la configuración actual para no sobrescribir con vacíos si no se envían todos los datos
    $sql_actual = "SELECT * FROM site_config WHERE id = $id_config";
    $res_actual = mysqli_query($link, $sql_actual);
    $config_actual = mysqli_fetch_assoc($res_actual);

    if (!$config_actual) {
        // Si por alguna razón no existe la config ID 1, devolvemos error (o podrías hacer un INSERT)
        outputJson(['status' => 'error', 'message' => 'Configuración no encontrada'], 404);
    }

    // Asignamos los nuevos valores o mantenemos los actuales si no vienen en el JSON
    $site_name = isset($data['site_name']) ? mysqli_real_escape_string($link, $data['site_name']) : $config_actual['site_name'];
    
    // Para maintenance_mode, verificamos si viene setedado y lo convertimos a entero (0 o 1)
    $maintenance_mode = isset($data['maintenance_mode']) ? (int)$data['maintenance_mode'] : (int)$config_actual['maintenance_mode'];
    
    $welcome_text = isset($data['welcome_text']) ? mysqli_real_escape_string($link, $data['welcome_text']) : $config_actual['welcome_text'];

    // 5. Ejecutar la actualización
    $sql_update = "UPDATE site_config SET 
                    site_name = '$site_name', 
                    maintenance_mode = $maintenance_mode, 
                    welcome_text = '$welcome_text' 
                   WHERE id = $id_config";

    if (mysqli_query($link, $sql_update)) {
        outputJson([
            "status" => "success", 
            "message" => "Configuración del sitio actualizada correctamente",
            "data" => [
                "site_name" => $site_name,
                "maintenance_mode" => $maintenance_mode,
                "welcome_text" => $welcome_text
            ]
        ]);
    } else {
        outputJson(['status' => 'error', 'message' => 'Error al actualizar la configuración: ' . mysqli_error($link)], 500);
    }
}

// DELETE Users
function deleteUsers($id) {
    global $link;
    $id_usuario_eliminar = (int)$id;
    
    // 1. Validar Token (Extracción robusta)
    $editor = validarToken();
    $id_editor = isset($editor['data']) ? (int)$editor['data']['id'] : (int)$editor['id'];
    $rol_editor = isset($editor['data']) ? (int)$editor['data']['role'] : (int)$editor['role'];

    // 2. Obtener datos del usuario a eliminar
    $sql_busqueda = "SELECT role, profile_img_url FROM users WHERE id = $id_usuario_eliminar";
    $res = mysqli_query($link, $sql_busqueda);
    $usuario_destino = mysqli_fetch_assoc($res);

    if (!$usuario_destino) { outputJson(['status'=>'error', 'message'=>'Usuario no encontrado'], 404); }

    $rol_destino = (int)$usuario_destino['role'];

    // 3. MATRIZ DE PERMISOS 
    $puede_eliminar = false;

    // Caso A: Usuario se elimina a sí mismo (Excepto si es Owner, por seguridad del sistema)
    if ($id_editor === $id_usuario_eliminar) {
        if ($rol_destino === 2) {
             outputJson(["status" => "error", "message" => "El Owner no puede eliminarse a sí mismo."], 403);
        }
        $puede_eliminar = true;
    }
    // Caso B: Owner elimina a cualquiera (menos a otro Owner si existiera)
    else if ($rol_editor === 2 && $rol_destino < 2) {
        $puede_eliminar = true;
    }
    // Caso C: Admin elimina a Usuario normal
    else if ($rol_editor === 1 && $rol_destino === 0) {
        $puede_eliminar = true;
    }

    if (!$puede_eliminar) {
        outputJson(['status'=>'error', 'message'=>'No tienes permiso para eliminar este usuario'], 403);
    }

    // 4. Proceder con el borrado
    // Borrar foto si no es la default
    if ($usuario_destino['profile_img_url'] !== 'default_profile.png') {
        $ruta = "../uploads/" . $usuario_destino['profile_img_url'];
        if (file_exists($ruta)) { unlink($ruta); }
    }

    // El borrado en cascada de SQL se encarga de posts y followers
    $sql = "DELETE FROM users WHERE id = $id_usuario_eliminar";
    
    if (mysqli_query($link, $sql)) {
        outputJson(["status" => "success", "message" => "Usuario eliminado correctamente"]);
    } else {
        outputJson(['status'=>'error', 'message'=>mysqli_error($link)], 500);
    }
}

// DELETE Posts
function deletePosts($id) {
    global $link;
    $id = (int)$id;
    $editor = validarToken();
    $id_editor = (int)$editor['id'];
    $rol_editor = (int)$editor['role'];

    $sql = "SELECT user_id, file_url FROM posts WHERE id = $id";
    $res = mysqli_query($link, $sql);
    $post = mysqli_fetch_assoc($res);
    
    if (!$post) outputError(404);
    if ($id_editor !== (int)$post['user_id'] && $rol_editor < 1) outputError(401);

    if ($post['file_url'] !== 'none') {
        $ruta = "../uploads/" . $post['file_url'];
        if (file_exists($ruta)) unlink($ruta);
    }

    $sql = "DELETE FROM posts WHERE id = $id";
    if (mysqli_query($link, $sql)) outputJson(["status" => "success"]);
    else outputError(500);
}

/**
 * POST /follow
 * Crea una nueva relación de seguimiento.
 * Espera un JSON: { "follower_id": X, "followed_id": Y }
 */
function postFollowers() {
    global $link;
    validarToken(); // Protegemos la ruta
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['follower_id']) || !isset($data['followed_id'])) {
        outputError(400);
    }

    $follower = (int)$data['follower_id'];
    $followed = (int)$data['followed_id'];

    if ($follower === $followed) {
        outputJson(["status" => "error", "message" => "No puedes seguirte a ti mismo"], 400);
    }

    $sql = "INSERT INTO followers (follower_id, followed_id) VALUES ($follower, $followed)";

    if (mysqli_query($link, $sql)) {
        outputJson(["status" => "success", "message" => "Ahora sigues a este artista"], 201);
    } else {
        // Si ya existe devolvemos error 
        if (mysqli_errno($link) == 1062) {
            outputJson(["status" => "error", "message" => "Ya sigues a este artista"], 409);
        }
        outputError(500);
    }
}

/**
 * GET /follow
 * Obtiene la lista global de todas las relaciones (opcional/admin)
 */
function getFollowers() {
    global $link;
    validarToken();
    $sql = "SELECT * FROM followers";
    $result = mysqli_query($link, $sql);
    $ret = [];
    while ($fila = mysqli_fetch_assoc($result)) {
        settype($fila['id'], 'integer');
        settype($fila['follower_id'], 'integer');
        settype($fila['followed_id'], 'integer');
        $ret[] = $fila;
    }
    outputJson($ret);
}

/**
 * Obtiene quiénes siguen a un usuario específico o a quiénes sigue.
 * Retorna ambos conteos y listas.
 */
function getFollowersConParametros($id) {
    global $link;
    $id = (int)$id;

    // Obtener Seguidores 
    $sql_followers = "SELECT u.id, u.first_name, u.last_name, u.profile_img_url 
                      FROM followers f INNER JOIN users u ON f.follower_id = u.id 
                      WHERE f.followed_id = $id";
    $res_f = mysqli_query($link, $sql_followers);
    $followers_list = [];
    while($row = mysqli_fetch_assoc($res_f)) { $followers_list[] = $row; }

    // Obtener aquellos que nos siguen
    $sql_following = "SELECT u.id, u.first_name, u.last_name, u.profile_img_url 
                      FROM followers f INNER JOIN users u ON f.followed_id = u.id 
                      WHERE f.follower_id = $id";
    $res_ing = mysqli_query($link, $sql_following);
    $following_list = [];
    while($row = mysqli_fetch_assoc($res_ing)) { $following_list[] = $row; }

    outputJson([
        "user_id" => $id,
        "followers_count" => count($followers_list),
        "following_count" => count($following_list),
        "followers" => $followers_list,
        "following" => $following_list
    ]);
}

/**
 * DELETE follow, lógica de Unfollow
 * este borrará por el ID de la tabla followers.
 */
function deleteFollowers($id) {
    global $link;
    $user = validarToken(); // Obtenemos el usuario logueado
    $follower_id = (int)$user['id']; 
    $followed_id = (int)$id; // El ID que viene en la URL es al que queremos dejar de seguir

    // Borramos DONDE yo soy el seguidor Y el otro es el seguido
    $sql = "DELETE FROM followers WHERE follower_id = $follower_id AND followed_id = $followed_id";
    
    if (mysqli_query($link, $sql)) {
        // Verificamos si realmente se borró algo
        if (mysqli_affected_rows($link) > 0) {
            outputJson(["status" => "success", "message" => "Dejaste de seguir a este artista"]);
        } else {
            // Si no se borró nada, es porque no lo seguías, pero devolvemos success para que el front no se trabe
            outputJson(["status" => "success", "message" => "No lo seguías, pero todo ok"]);
        }
    } else {
        outputError(500);
    }
}

// RESTORE DB
function postRestore() {
    global $link;
    $data = json_decode(file_get_contents('php://input'), true);

    if ($data['email'] === 'bautista.owner@gmail.com' && $data['password'] === '123456') {
        
        $archivo_sql = '../database/musiclab_db.sql';
        
        if (!file_exists($archivo_sql)) {
            outputJson(["status" => "error", "message" => "Archivo SQL no encontrado"], 500);
        }

        $sql_content = file_get_contents($archivo_sql);

        // Ejecutar multi-query
        if (mysqli_multi_query($link, $sql_content)) {
            $error_encontrado = null;
            
            // Recorrer todos los resultados uno por uno
            do {
                // Liberar resultado actual si existe
                if ($result = mysqli_store_result($link)) {
                    mysqli_free_result($result);
                }
                
                // Verificar si hubo error al preparar el SIGUIENTE resultado
                if (mysqli_errno($link)) {
                    $error_encontrado = mysqli_error($link);
                    break; // Salimos del bucle ante el primer error
                }
            } while (mysqli_more_results($link) && mysqli_next_result($link));

            // Si salimos del bucle y hubo error
            if ($error_encontrado) {
                outputJson([
                    "status" => "error", 
                    "message" => "La restauración se detuvo por un error SQL: " . $error_encontrado
                ], 500);
            } else {
                outputJson(["status" => "success", "message" => "Base de datos restaurada correctamente."]);
            }

        } else {
            // Error en la primera instrucción
            outputJson([
                "status" => "error", 
                "message" => "Error inicial MySQL: " . mysqli_error($link)
            ], 500);
        }

    } else {
        header('HTTP/1.1 401 Unauthorized'); exit;
    }
}

?>