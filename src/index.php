<?php

/**
 * Copyright ©2018
 * Written by:
 * Maximilian Mayrhofer
 * Wendelin Muth
 */

$link = "sites/welcome";
require __DIR__ . "/PHP/main.php";
if (BasicTools::IsSenseful($_GET["site"])) {
    $link = "sites/" . $_GET["site"];
} else
if ($site = BasicTools::Setting("homePage")) {
    header("Location: https://" . $_SERVER['SERVER_NAME'] . $site);
    die();
}
BaseStart($link);
