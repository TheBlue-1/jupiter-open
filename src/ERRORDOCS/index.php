<?php

/**
 * Copyright ©2018
 * Written by:
 * Maximilian Mayrhofer
 * Wendelin Muth
 */
$link = "error/" . $_GET["c"];
if (!class_exists("BasicTools")) {
    require __DIR__ . "/../PHP/main.php";
}

http_response_code($_GET["c"]);
BaseStart($link);
