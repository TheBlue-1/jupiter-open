<?php

/**
 *  Copyright ©2018
 *  Written by:
 *  Maximilian Mayrhofer
 *  Wendelin Muth
 */
class BasicTools
{
    const DEBUG_MODE = false;
    static $multiStates = array();
    static $settings;
    public static function PostMultiTest($name)
    {
        $values = explode(",", self::PostTest($name));
        if (!self::IsSenseful(self::$multiStates[$name])) {
            self::$multiStates[$name] = 0;
        } else {
            self::$multiStates[$name]++;
        }
        if (!count($values) > self::$multiStates[$name]) {
            trigger_error("#error008|$name", E_USER_ERROR);
        }

        return $values[self::$multiStates[$name]];
    }

    public static function Utf8Strrev($str)
    {
        preg_match_all('/./us', $str, $ar);
        return implode(array_reverse($ar[0]));
    }

    public static function PostTest($name)
    {
        if (!self::IsSenseful($_POST[$name])) {
            trigger_error("#error010|$name", E_USER_ERROR);
        }
        return $_POST[$name];
    }

    public static function IsSenseful(&$var)
    {
        if (isset($var)) {
            if (false == $var) {
                if (0 === $var || "0" === $var || 0.0 === $var || false === $var || is_array($var)) {
                    return true;
                }
                return false;
            }
            return true;
        }
        return false;
    }

    public static function PostTestOpt($name, $sonst = "-1")
    {
        if (!self::IsSenseful($_POST[$name])) {
            return $sonst;
        }
        return $_POST[$name];
    }
    public static function CorrectRoot($path, $proof = true)
    {
        if (self::IsSenseful($_COOKIE["devbranch"])) {
            $path = "/.branches/" . $_COOKIE["devbranch"] . $path;
        }
        if (!file_exists($_SERVER['DOCUMENT_ROOT'] . $path) && $proof) {
            self::Log("Error: " . $path, "filesearch");
            self::SendError(404);
        }
        return $_SERVER['DOCUMENT_ROOT'] . $path;
    }
    public static function FileContents($path)
    {

        return file_get_contents(self::CorrectRoot($path));
    }
    public static function SendError($code)
    {

        $_GET["c"] = $code;
        require self::CorrectRoot("/ERRORDOCS/index.php");
        die();
    }
    public static function Log($text, $debug = false)
    {
        if ($debug) {
            if (self::DEBUG_MODE) {
                if (!file_exists(__DIR__ . "/../../LOG/_" . $debug . "log.txt")) {
                    file_put_contents(__DIR__ . "/../../LOG/_" . $debug . "log.txt", "");
                }

                if (filesize(__DIR__ . "/../../LOG/_" . $debug . "log.txt") > 777000) {
                    file_put_contents(__DIR__ . "/../../LOG/_" . $debug . "log.txt", "");
                }
                file_put_contents(__DIR__ . "/../../LOG/_" . $debug . "log.txt", "[" . date("d.m.Y H:i:s", time()) . "]" . str_replace("\n", "\n                       ", $text) . "\n", FILE_APPEND);
            }
            return;
        }
        if (!file_exists(self::CorrectRoot("/LOG/_log.txt", false))) {
            file_put_contents(self::CorrectRoot("/LOG/_log.txt", false), "");
        }

        if (filesize(self::CorrectRoot("/LOG/_log.txt")) > 777000) {
            rename(self::CorrectRoot("/LOG/_log.txt"), self::CorrectRoot("/LOG/log[" . date("Y.m.d H:i:s", time()) . "].txt", false));
        }

        file_put_contents(self::CorrectRoot("/LOG/_log.txt"), "[" . date("d.m.Y H:i:s", time()) . "]" . str_replace("\n", "\n                       ", $text) . "\n", FILE_APPEND);
    }

    public static function Setting($name)
    {
        if (!self::IsSenseful($settings)) {
            $settings = array();
            $settingArr = explode("&", self::IsSenseful($_COOKIE["settings"]) ? $_COOKIE["settings"] : "");
            foreach ($settingArr as $setting) {
                if (self::IsSenseful($setting)) {
                    $parts = explode("=", $setting);
                    $settings[$parts[0]] = urldecode($parts[1]);
                }
            }
        }
        return self::IsSenseful($settings[$name]) ? $settings[$name] : false;
    }
    public static function TestSessVar($name, $throwError = true)
    {
        if (self::IsSenseful($_SESSION[$name])) {
            return $_SESSION[$name];
        }
        //login vars
        if ("user" == $name || "isTeacher" == $name || "isClassAdmin" == $name || "userId" == $name || "school" == $name || "server" == $name || "password" == $name) {
            Auth::CookieLogin();
        } //cquery vars
        else if ("class" == $name || "classes" == $name) {
            if ("class" == $name) {
                $_SESSION[$name] = "" . WebUntis::GetClassId();
            } else if ("classes" == $name) {
                $_SESSION[$name] = CWebUntis::GetTeachersClassIds();
            }
        }
        if (self::IsSenseful($_SESSION[$name])) {
            return $_SESSION[$name];
        }
        if ($throwError) {
            $b = debug_backtrace()[0];
            self::Log("in file: $b[file] in line: $b[line] with param: " . $b["args"][0], "sessionVar");
            trigger_error("#error006|$name", E_USER_ERROR);
        } else {
            return false;
        }
    }

    public static function WriteArray($array, $d = 0)
    {
        if (100 === $d) {
            die("<h1>To Much Inner Arrays</h1>");
        }
        $t = "";
        for ($i = 0; $d > $i; $i++) {
            $t .= "&nbsp;&nbsp;&nbsp;&nbsp;";
        }
        foreach ($array as $key => $text) {
            if (is_array($text)) {
                echo $t . "&nbsp;+&nbsp;" . $key . "<br>";
                self::WriteArray($text, $d + 1);
            } else {
                echo $t . "&nbsp;-&nbsp;";
                self::WriteText($key . " : " . $text);

                echo "<br>";
            }
        }
    }

    public static function WriteText($text, $return = false)
    {
        if ($return) {
            return htmlspecialchars($text);
        }
        echo htmlspecialchars($text);
    }
}
