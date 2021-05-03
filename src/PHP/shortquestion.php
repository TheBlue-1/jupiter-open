<?php

/**
 *  Copyright ©2018
 *  Written by:
 *  Maximilian Mayrhofer
 *  Wendelin Muth
 */
require __DIR__ . "/main.php";

if (!BasicTools::IsSenseful($_REQUEST['x'])) {
    die();
}
$l = strlen($_REQUEST['x']);
for ($i = 0; $i < $l; $i++) {
    switch ($_REQUEST['x'][$i]) {
        case 'l':
            echo IsLogged();
            break;
        case 'r':
            echo GetRank();
            break;
        case 'p':
            echo IsPerson();
            break;
    }
}
function IsLogged()
{
    if (BasicTools::IsSenseful($_SESSION["school"])) {
        return 1;
    }
    Auth::CookieLogin();
    if (BasicTools::IsSenseful($_SESSION["school"])) {
        return 1;
    }
    return 0;
}

function GetRank()
{
    if (BasicTools::IsSenseful($_SESSION["rank"])) {
        return $_SESSION["rank"];
    }

    return 0;
}

function IsPerson()
{
    if (BasicTools::IsSenseful($_SESSION["user"])) {
        return 1;
    }

    return 0;
}
