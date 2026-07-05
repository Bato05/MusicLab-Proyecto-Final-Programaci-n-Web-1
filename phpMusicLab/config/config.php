<?php

define("DBBASE", "if0_42343048_MusicLabSQLinfinityFree");
define("DBUSER", "if0_42343048");
define("DBPASS", "eae9ktGVFL8ySND");
define("DBHOST", "sql201.infinityfree.com");

// puente a la base de datos
$link = mysqli_connect(DBHOST, DBUSER, DBPASS, DBBASE);
if ($link === false) {
print "Falló la conexión: ". mysqli_connect_error();
die;
}

mysqli_set_charset($link, "utf8");
/*
fundamental para que los nombres con acentos o eñes de los artistas se guarden y lean correctamente en la base de datos. Sin esto, Angular podría recibir caracteres que no sabe interpretar.
*/

?>
