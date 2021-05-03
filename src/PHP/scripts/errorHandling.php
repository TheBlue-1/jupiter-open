<?php

/**
 *  Copyright ©2018
 *  Written by:
 *  Maximilian Mayrhofer
 *  Wendelin Muth
 */
set_error_handler("ErrorHandler", E_ALL);
register_shutdown_function("FatalErrorHandler");

function FatalErrorHandler()
{
    BasicTools::Log("Time:", "time");
    $errfile = "unknown file";
    $errstr = "shutdown";
    $errno = E_CORE_ERROR;
    $errline = 0;

    $error = error_get_last();

    if (E_ERROR == $error["type"] || E_PARSE == $error["type"] || E_COMPILE_ERROR == $error["type"] || E_CORE_ERROR == $error["type"] || E_RECOVERABLE_ERROR == $error["type"]) {
        $errno = $error["type"];
        $errfile = $error["file"];
        $errline = $error["line"];
        $errstr = $error["message"];

        ErrorHandler($errno, $errstr, $errfile, $errline);
    } else {
        if (null !== $error) {
            $errno = $error["type"];
            $errfile = $error["file"];
            $errline = $error["line"];
            $errstr = $error["message"];
            BasicTools::Log("[ErrorOnEndFound]\nType:" . GetErrorType($error["type"]) . "\nFile:" . $error["file"] . "\nLine:" . $error["line"] . "\nMsg:" . $error["message"], "end");
        }
    }
}

function ErrorHandler($grad, $msg, $file, $line)
{

    if (isset($GLOBALS["link"])) {
        if (E_ERROR == $grad || E_PARSE == $grad || E_COMPILE_ERROR == $grad || E_CORE_ERROR == $grad || E_RECOVERABLE_ERROR == $grad) {
            BasicTools::SendError(500);
        }

        BasicTools::Log("[ErrorUnhandled]\nType:" . GetErrorType($grad) . "\nFile:" . $file . "\nLine:" . $line . "\nMsg:" . $msg, "pageLoad");
        return;
    }
    if (strpos($msg, "#") === 0 && E_USER_ERROR == $grad) {
        BasicTools::Log("[Errorhandled]\nType:" . GetErrorType($grad) . "\nFile:" . $file . "\nLine:" . $line . "\nMsg:" . $msg);

        http_response_code(700);
        die(GetErrorMsg($msg));
    }

    if (strpos($msg, "#") === 0 && E_USER_WARNING == $grad) {
        BasicTools::Log("[Errorhandled]\nType:" . GetErrorType($grad) . "\nFile:" . $file . "\nLine:" . $line . "\nMsg:" . $msg);

        http_response_code(710);
        echo (GetErrorMsg($msg));
        die();
    }

    $errortype = GetErrorType($grad);
    if (E_USER_ERROR == $grad || E_ERROR == $grad || E_PARSE == $grad || E_COMPILE_ERROR == $grad || E_CORE_ERROR == $grad || E_RECOVERABLE_ERROR == $grad) {
        ErrorHandler(E_USER_ERROR, "#error000|Ein Fehler mit Grad $errortype ist aufgetreten.<br> Meldung: $msg <br> Datei: <b>$file</b> Zeile: <b>$line</b><br>", $file, $line);
    }
    ErrorHandler(E_USER_WARNING, "#warning000|Eine Warnung ($errortype) ist aufgetreten.<br> Meldung: $msg <br> Datei: <b>$file</b> Zeile: <b>$line</b><br>", $file, $line);
}

function GetErrorType($type)
{
    switch ($type) {
        case E_ERROR: // 1 //
            return 'E_ERROR';
        case E_WARNING: // 2 //
            return 'E_WARNING';
        case E_PARSE: // 4 //
            return 'E_PARSE';
        case E_NOTICE: // 8 //
            return 'E_NOTICE';
        case E_CORE_ERROR: // 16 //
            return 'E_CORE_ERROR';
        case E_CORE_WARNING: // 32 //
            return 'E_CORE_WARNING';
        case E_COMPILE_ERROR: // 64 //
            return 'E_COMPILE_ERROR';
        case E_COMPILE_WARNING: // 128 //
            return 'E_COMPILE_WARNING';
        case E_USER_ERROR: // 256 //
            return 'E_USER_ERROR';
        case E_USER_WARNING: // 512 //
            return 'E_USER_WARNING';
        case E_USER_NOTICE: // 1024 //
            return 'E_USER_NOTICE';
        case E_STRICT: // 2048 //
            return 'E_STRICT';
        case E_RECOVERABLE_ERROR: // 4096 //
            return 'E_RECOVERABLE_ERROR';
        case E_DEPRECATED: // 8192 //
            return 'E_DEPRECATED';
        case E_USER_DEPRECATED: // 16384 //
            return 'E_USER_DEPRECATED';
    }
    return "UNKNOWN($type)";
}
function GetErrorMsg($msg)
{
    $data = "";
    if (strpos($msg, "|") !== false) {
        $msgps = explode("|", $msg);
        $msg = $msgps[0];
        $data = $msgps[1];
    }
    $errorList = json_decode(BasicTools::FileContents("/DATA/misc/errorList.json"), true);
    if (!BasicTools::IsSenseful($errorList[$msg])) {
        $data = $msg;
        $msg = "#error999";
    }
    $errorList[$msg]["errorData"] = array($data);
    return json_encode($errorList[$msg], true);
}
