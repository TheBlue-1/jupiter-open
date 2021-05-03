<?php

/**
 *  Copyright ©2018
 *  Written by:
 *  Maximilian Mayrhofer
 *  Wendelin Muth
 */
//not fin
require __DIR__ . "/main.php";
header("Cache-Control:no-cache,must-revalidate");

switch (BasicTools::PostTest("type")) {
    case "get":
        Get();
        break;
    case "set":
        Set();
        break;
    default:
        trigger_error("#error004", E_USER_ERROR);
}

function Get()
{
    $array = explode(",", BasicTools::PostTest("getType"));
    $length = count($array);
    for ($i = 0; $i < $length; $i++) {
        switch ($array[$i]) {
            case "":
                break;
            case "messages":
                echo DB_Requests::GetMessages(BasicTools::PostTestOpt("msgType", "%"), BasicTools::PostTestOpt("msgCount", 30), BasicTools::PostTestOpt("reviewed", null));
                break;
            default:
                trigger_error("#warning002|$array[$i]", E_USER_WARNING);
                break;
        }
        if ($i + 1 != $length) {
            echo "[᚜#~SPLITTER~#᚛]";
        }
    }
}
function Set()
{
    $array = explode(",", BasicTools::PostTest("setType"));
    $length = count($array);
    for ($i = 0; $i < $length; $i++) {
        switch ($array[$i]) {
            case "":
                break;
            case "addEmp":
                MySecure::AddEmp(BasicTools::PostTest("username"), BasicTools::PostTest("rank"), BasicTools::PostTest("school"), BasicTools::PostTest("password"), BasicTools::PostTest("uUsername"), BasicTools::PostTest("uPassword"));
                break;
            case "editEmp":
                MySecure::EditEmp(BasicTools::PostTest("username"), BasicTools::PostTest("rank"), BasicTools::PostTest("school"), BasicTools::PostTest("password"), BasicTools::PostTest("uUsername"), BasicTools::PostTest("uPassword"));
                break;
            case "delMessage":
                DB_Requests::DelMessage(BasicTools::PostTest("id"));
                break;
            case "seeMessage":
                DB_Requests::SeeMessage(BasicTools::PostTest("id"));
                break;
            default:
                trigger_error("#warning002|$array[$i]", E_USER_WARNING);
                break;
        }
        if ($i + 1 != $length) {
            echo "[᚜#~SPLITTER~#᚛]";
        }
    }
}
