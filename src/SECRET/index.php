<?php

//FIXME: Das geht überhaupt nicht

/**
 * Copyright ©2018
 * Written by:
 * Maximilian Mayrhofer
 * Wendelin Muth
 */

require __DIR__ . "/../PHP/main.php";

if (session_status() != PHP_SESSION_ACTIVE && session_id() == '') session_start();

$link = BasicTools::CorrectRoot("/HTML/sites/supersecret.html");

header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-store");

if (BasicTools::IsSenseful($_GET["secret"])) {
    if ("thatsAnError" == $_GET["secret"]) {
        $_SESSION["secretOpen"] = true;
        $url = "https://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]";
        header("Location: " . strtok($url, '?'));
        die();
    }
} else {
    if (isset($_SESSION["secretOpen"]) && $_SESSION["secretOpen"] == true) {
        unset($_SESSION["secretOpen"]);
        Secret();
        die();
    }
    unset($_SESSION["secretOpen"]);
}

$_GET["c"] = "404";
require __DIR__ . "/../ERRORDOCS/index.php";
die();

function Secret()
{
    global $link;
    BaseStart($link);
}
