<?php

/**
 *  Copyright ©2018
 *  Written by:
 *  Maximilian Mayrhofer
 *  Wendelin Muth
 */

/**
 * Session Vars:
 * user
 * school
 * server
 * putspam
 * putcount
 * timeoutVar
 * password
 * cookieNames
 * cookieValues
 * secretOpen
 * isTeacher
 * classes
 * isClassAdmin
 * class
 * userId
 * rank
 * aUsername
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);
$etag;
Initialize();

function Initialize()
{
    global $etag;
    //laod files
    foreach (glob(__DIR__ . "/api/*.php", false) as $filename) {
        require $filename;
        $etag += filemtime($filename);
    }
    foreach (glob(__DIR__ . "/classes/*.php", false) as $filename) {
        require $filename;
        $etag += filemtime($filename);
    }
    foreach (glob(__DIR__ . "/scripts/*.php", false) as $filename) {
        require $filename;
        $etag += filemtime($filename);
    }
    $etag = filemtime(BasicTools::CorrectRoot("/PHP/main.php"));
    //etag
    $etag = md5(strval($etag));

    //session
    session_start();
    date_default_timezone_set("Europe/Vienna");

    if (!BasicTools::IsSenseful($_COOKIE["timeoutVar"])) {
        MySecure::SetCookie("timeoutVar", "set");
        $_SESSION["timeoutVar"] = "set";
    } else if (!BasicTools::IsSenseful($_SESSION["timeoutVar"])) {
        if (!Auth::CookieLogin()) {
            $_SESSION["timeoutVar"] = "set";
            BasicTools::Log("[SessionTimeout]" . session_id());
            trigger_error("#error003", E_USER_ERROR);
        }
    }
}

function BaseStart($link)
{
    global $etag;
    //ie no support
    $ua = htmlentities($_SERVER['HTTP_USER_AGENT'], ENT_QUOTES, 'UTF-8');
    if (preg_match('~MSIE|Internet Explorer~i', $ua) || (strpos($ua, 'Trident/7.0; rv:11.0') !== false)) {
        die("<!doctype html><html><body><style>div{}#div1{border:black solid 2px;width:580.8px;height:92px;padding:5px;animation-timing-function: linear;animation-name: shit;animation-duration: 1s; animation-iteration-count: infinite;}#div2{position: absolute;animation-name: happens;animation-timing-function: linear;animation-duration: 30s;animation-direction:alternate; animation-iteration-count: infinite; }#div3{position:relative;width:100%;height:100%;} #div4{position:fixed;top:0px;left:0px;width:100%;height:100%;padding-right:594.8px;padding-bottom:106px;box-sizing: border-box;}@keyframes shit {0%   {background-color:red;}50%  {background-color:white; }100% {background-color:red;}  }@keyframes happens {0%   {top:0%;left:0%;}14%   {top:100%;left:25%;}28%   {top:0%;left:50%;}42%   {top:100%;left:75%;}50%   {top:50%;left:100%;}58%   {top:0%;left:75%;}72%   {top:100%;left:50%;}86%   {top:0%;left:25%;}100%   {top:100%;left:0%;} }</style><div id='div4'><div id='div3'><div id='div2'><div id='div1'>Leider können wir dieses Programm nicht unterstützen!<br>Wir vermuten es liegt an großen Sicherheitslücken oder am Fehlen sämtlicher Funktionen!<br> Zumindest ist es nicht als Browser geeignet!<br>Wir empfehlern Ihnen diese Fehlkonstruktion zu deinstallieren<br>und so etwas wie <a href=\"https://www.google.de/chrome/\">Chrome</a> oder <a href=\"https://www.mozilla.org/de/firefox/\">Firefox</a> zu verwenden!</div></div></div></div></body></html>");
    }

    //Test link
    $link = "/HTML/$link.html";

    $autologged = false;
    if (!BasicTools::IsSenseful($_SESSION["school"])) {
        Auth::CookieLogin();
        if (BasicTools::IsSenseful($_SESSION["school"])) {
            $autologged = true;
        }
    }
    //etag
    $logged = GetLogged($autologged);
    //$etag .= filemtime($link);
    $etag = json_encode($logged) . $etag;
    $etag = md5($etag);
    /*if (BasicTools::IsSenseful($_REQUEST["etag"]) && $_REQUEST["etag"] == $etag) {
    http_response_code(304);
    die();
    }

    header("ETag: $etag");*/

    //Open Secret
    $random = rand(1, 1000000);
    if (111 == $random) {
        header("Location: $_SERVER[SERVER_NAME]/SECRET?secret=thatsAnError");
        die();
    }

    //load html
    $arr = preg_split("/<php-(?:(\w*)\s?\/>)/", BasicTools::FileContents($link), -1, PREG_SPLIT_DELIM_CAPTURE);
    $htm = array();
    for ($i = 1; $i < sizeof($arr); $i += 2) {
        $htm[$arr[$i]] = $arr[$i + 1];
    }
    //test user rank
    if (BasicTools::IsSenseful($htm["minrank"]) && !MySecure::IsAllowed($htm["minrank"])) {
        BasicTools::SendError(403);
    }

    $filename = substr($link, strrpos($link, "/") + 1);
    $site = substr($filename, 0, strrpos($filename, "."));
    $autologged = false;
    if (!BasicTools::IsSenseful($_SESSION["school"])) {
        Auth::CookieLogin();
        if (BasicTools::IsSenseful($_SESSION["school"])) {
            $autologged = true;
        }
    }

    //build and echo site
    $splitTags = preg_split("/<php-(?=\w*\s?\/>)/", BasicTools::FileContents("/HTML/main.html"));
    $splitTags[0] = "<!--Timestamp: " . date("d.m.Y H:i:s", time()) . ", Url: " . $_SERVER["REQUEST_URI"] . "-->\n" . $splitTags[0];
    $additionalLinks = GetAdditionalLinks();
    $cssArr = GetStyle($site, array_key_exists("useapistylesheets", $htm) ? $htm["useapistylesheets"] : "");
    $style = $cssArr[0];
    $theme = $cssArr[1];
    foreach ($splitTags as $index => $split) {
        if (strpos($split, "title") === 0) {
            if (BasicTools::IsSenseful($htm["title"])) {
                echo $htm["title"];
            } else {
                echo "NO TITLE";
            }
        }
        if (strpos($split, "headline") === 0) {
            if (BasicTools::IsSenseful($htm["title"])) {
                $title = str_replace("-", "\u{2011}", $htm["title"]);
                $titlePart = $title;
                if (strpos($title, ": ") !== false || strpos($title, " \u{2011} ") !== false) {
                    $titlePart = preg_split("/(: )|( \u{2011} )/", $title)[0];
                }

                if ("Jupiter" == $titlePart) {
                    echo BasicTools::Utf8Strrev($titlePart);
                } else {
                    echo BasicTools::Utf8Strrev("Jupiter;psbn&\u{2011} " . $titlePart);
                }
            } else {
                echo "retipuJ";
            }
        }
        if (strpos($split, "css") === 0) {
            echo $style;
        }
        if (strpos($split, "userbutton") === 0) {
            echo $logged[0];
        }
        if (strpos($split, "domain") === 0) {
            echo $_SERVER['SERVER_NAME'];
        }

        if (strpos($split, "settings") === 0) {
            echo BasicTools::FileContents("/DATA/misc/settings.json");
        }

        if (strpos($split, "usertext") === 0) {
            echo $logged[1];
        }

        if (strpos($split, "outercontent") === 0 && array_key_exists("outercontent", $htm)) {
            echo $htm["outercontent"];
        }
        if (strpos($split, "content") === 0 && array_key_exists("content", $htm)) {
            echo $htm["content"];
        }

        if (strpos($split, "metas") === 0) {
            if (array_key_exists("metas", $htm)) {
                echo $htm["metas"];
            }

            echo '<meta name="theme-color" content="' . trim($theme) . '"/>';
            if (strpos($_SERVER['SERVER_NAME'], "dev") === 0) {
                echo '<meta name="robots" content="noindex, nofollow">';
            } else {
                echo '<meta name="robots" content="index, follow">';
            }
        }

        if (strpos($split, "outeroverlays") === 0 && array_key_exists("outeroverlays", $htm)) {
            echo $htm["outeroverlays"];
        }

        if (strpos($split, "additionalLinks") === 0) {
            echo $additionalLinks;
        }

        if (strpos($split, "scripts") === 0) {
            if (array_key_exists("scripts", $htm)) {
                echo $htm["scripts"];
            }

            if (null != $logged[2]) {
                echo "<script>
                        autoLogin('" . $logged[2] . "');
                        </script>";
            }
            if (strlen($link) > 13 && strpos($link, "settings.html", strlen($link) - 13)) {
                echo "<script>var serverSideSettings =" . json_encode(DB_Requests::GetSettings()) . "</script>";
            }
        }
        echo preg_replace("/\w*?[ ]*?\/>/", "", $splitTags[$index], 1);
    }
}

function GetLogged($autologged)
{
    if ($autologged) {
        if (BasicTools::IsSenseful($_SESSION["user"])) {
            $user = $_SESSION["user"];
            if (BasicTools::TestSessVar("rank", false) !== false) {
                $user = BasicTools::TestSessVar("aUsername");
            }

            return array('showAccount()', $user, WebUntis::GetPersonalInfo());
        }
    }
    if (BasicTools::IsSenseful($_SESSION["user"])) {
        $user = $_SESSION["user"];
        if (BasicTools::TestSessVar("rank", false) !== false) {
            $user = BasicTools::TestSessVar("aUsername");
        }

        return array('logout()', $user, "AlreadyLoggedIn");
    }
    if (BasicTools::IsSenseful($_SESSION["school"])) {
        return array('logout()', "ABMELDEN", "school:" . $_SESSION["school"]);
    }
    return array('openLoginPopup()', "Lädt...", null);
}

function GetStyle($site, $apiLinks)
{
    $css = "";
    /// CSS sheets
    $style = "<style>";
    foreach (glob(BasicTools::CorrectRoot("/CSS/*.css", false)) as $filename) {
        $css .= file_get_contents($filename);
    }

    if (BasicTools::IsSenseful($site)) {
        if (file_exists(BasicTools::CorrectRoot("/CSS/sites/" . $site . ".css", false))) {
            $style .= "/*contains " . $site . " css*/";
            $css .= BasicTools::FileContents("/CSS/sites/" . $site . ".css");
        } else {
            $style .= "/*contains no special css (" . $site . ")*/";
        }
    } else {
        $style .= "/*no site set*/";
    }

    $links = explode("|", $apiLinks);
    foreach ($links as $link) {
        if (BasicTools::IsSenseful($link) && strpos($link, "\n") === false) {
            $style .= "/*contains " . $link . " css*/";
            $css .= BasicTools::FileContents("/CSS/api/" . $link . ".css");
        }
    }

    //theme
    if (($themeName = BasicTools::Setting("theme")) !== false) {
        $css .= "/*themestart*/";
        $css .= BasicTools::FileContents("/CSS/themes/" . $themeName . ".css");
        $css .= "/*themeend*/";
    }

    ///Settings
    if (($opacity = BasicTools::Setting("timeOverlayOpacity")) !== false) {
        $css .= ".time-overlay {
            background-color: rgba(0, 0, 0, $opacity);
        }";
    }
    if (($bgcolor = BasicTools::Setting("backgroundColor")) !== false) {
        $css .= ":root {
    --col-background:$bgcolor;
    }";
    }
    if (($colHide = BasicTools::Setting("timeColHide")) !== false) {
        $css .= ".time-wrapper {
    display:$colHide;
    }";
    }
    if (($blackAndWhite = BasicTools::Setting("blackandwhite")) !== false) {
        if ("false" != $blackAndWhite) {
            $css .= "* {
            mix-blend-mode: luminosity;
    }";
        }
    }

    $css = preg_replace('/((["\']).*?\2)|(\s+(?=\s)|\r?\n)/', "$1", $css);

    $splitCssTags = preg_split('/"php-(?=\w*?")/', $css);

    $style .= $css;
    $style .= "</style>";
    preg_match_all("/--col-theme:(.*?);/", $style, $theme);
    return array($style, end($theme[1]));
}

function GetAdditionalLinks()
{
    $additionalLinks = "";
    if (BasicTools::TestSessVar("isTeacher", false) === true) {
        $additionalLinks .= "<a href='/teacher/'>Lehrer-Tools</a>";
    }

    if (BasicTools::TestSessVar("rank", false) >= 7) {
        $additionalLinks .= "<a href='/admin/'>AdminTools</a><a onclick='showLog();'>Log</a><a href='/review/'>Review</a>";
    } else if (($enableLog = BasicTools::Setting("enableLog")) !== false) {
        if ($enableLog == "true") {
            $additionalLinks .= "<a onclick='showLog();'>Log</a>";
        }
    }

    return $additionalLinks;
}
