<?php

define("DBBASE", "musiclab_db");
define("DBUSER", "root");
define("DBPASS", "");
define("DBHOST", "localhost");

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