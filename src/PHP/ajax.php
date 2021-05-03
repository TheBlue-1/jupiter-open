<?php

/**
 *  Copyright ©2018
 *  Written by:
 *  Maximilian Mayrhofer
 *  Wendelin Muth
 */
require __DIR__ . "/main.php";
header("Cache-Control:no-cache,must-revalidate");

switch (BasicTools::PostTest("type")) {
    case "put":
        Put();
        break;
    case "get":
        Get();
        break;
    case "login":
        Login();
        break;
    case "logout":
        Logout();
        break;
    case "validateChapta":
        ValidateChapta();
        break;
    default:
        trigger_error("#error004|" . BasicTools::PostTest("type"), E_USER_ERROR);
}
function ValidateChapta()
{
    echo EasyCurl::AskCurl("https://www.google.com/recaptcha/api/siteverify", "response=" . BasicTools::PostTest("response") . "&secret=6Lf2pGkUAAAAALZ2X-ZsflVbVb1mf9N7KuuZSvsA");
}

function Logout()
{
    Auth::Logout();
}

function Get()
{
    $array = explode(",", BasicTools::PostTest("getType"));
    $length = count($array);
    for ($i = 0; $i < $length; $i++) {
        switch ($array[$i]) {
            case "":
                break;
            case "additionalLinks":
                echo GetAdditionalLinks();
                break;
            case "school":
                echo (BasicTools::TestSessVar("school", false)) ? "school:" . $_SESSION["school"] : "";
                break;
            case "teachersClasses":
                echo json_encode(CWebUntis::GetTeachersClasses());
                break;
            case "consultationRegs":
                echo WebUntis::GetConsultationRegistredations();
                break;
            case "consultationRegInfo":
                echo WebUntis::GetConsultationRegInfo(BasicTools::PostTest("period"), BasicTools::PostTest("teacher"));
                break;
            case "cacheDates":
                echo json_encode(WebUntis::GetLastTruncate(BasicTools::PostTestOpt("school")));
                break;
            case "getEvents":
                echo json_encode(array("data" => array("events" => EventData::GetEvents(
                    BasicTools::PostTestOpt("startTime", null),
                    BasicTools::PostTestOpt("endTime", null),
                    BasicTools::PostTestOpt("ownerType", null),
                    BasicTools::PostTestOpt("eventType", null),
                    mb_strtoupper(BasicTools::PostTestOpt("owner", null), "UTF-8")
                ), "isAdmin" => BasicTools::TestSessVar("isClassAdmin"))));
                break;
            case "schoolInfo":
                echo WebUntis::GetSchoolInfo(BasicTools::PostTest("school"));
                break;
            case "findSchools":
                echo WebUntis::FindSchoolsContaining(BasicTools::PostTest("string"));
                break;
            case "personalInfo":
                echo WebUntis::GetPersonalInfo();
                break;
            case "classes":
                echo WebUntis::GetClasses(BasicTools::PostMultiTest("date"));
                break;
            case "availableRooms":
                echo WebUntis::AvailableRooms(BasicTools::PostTest("startDate"), BasicTools::PostTest("endDate"));
                break;
            case "versionHistory":
                echo explode("<!--CHANGELOG-->", BasicTools::FileContents("/HTML/sites/versionhistory.html"))[1];
                break;
            case "teachers":
                echo WebUntis::GetTeachers(BasicTools::PostMultiTest("date"));
                break;
            case "subjects":
                echo WebUntis::GetSubjects(BasicTools::PostMultiTest("date"));
                break;
            case "rooms":
                echo WebUntis::GetRoomsAndBuildings(BasicTools::PostMultiTest("date"), BasicTools::PostTestOpt("bdid"));
                break;
            case "students":
                echo WebUntis::GetStudents(BasicTools::PostMultiTest("date"), BasicTools::PostTestOpt("classId"));
                break;
            case "timegridInfo":
                echo WebUntis::GetGeneralGridInfo();
                break;
            case "timegridPeriodInfo":
                echo WebUntis::GetTimeGridInfo(BasicTools::PostMultiTest("date"), BasicTools::PostTest("ownerType"), BasicTools::PostTest("id"), BasicTools::PostTestOpt("startTime", "00"), BasicTools::PostTestOpt("endTime", "2400"), BasicTools::PostTestOpt("period", ""));
                break;
            case "timegrid":
                echo WebUntis::GetTimeGrid(BasicTools::PostMultiTest("date"), BasicTools::PostMultiTest("timegridType"), BasicTools::PostTest("id"));
                break;
            case "info":
                echo WebUntis::GetInfo();
                break;
            case "news":
                echo WebUntis::GetNews(BasicTools::PostMultiTest("date"));
                break;
            case "absence":
                echo WebUntis::GetAbsence(BasicTools::PostTest("stid"), BasicTools::PostTest("astartdate"), BasicTools::PostTest("aenddate"), BasicTools::PostTestOpt("excusestatus"));
                break;
            case "roles":
                echo WebUntis::GetClassRoles(BasicTools::PostTest("rstartdate"), BasicTools::PostTest("renddate"));
                break;
            case "homeworks":
                echo WebUntis::GetHomeworks(BasicTools::PostTest("hstartdate"), BasicTools::PostTest("henddate"));
                break;
            case "exams":
                echo WebUntis::GetExams(BasicTools::PostTest("estartdate"), BasicTools::PostTest("eenddate"));
                break;
            case "reportInfo":
                echo WebUntis::GetReportInfo();
                break;
            case "downloadReport":
                echo WebUntis::DownloadReport(BasicTools::PostTest("id"));
                break;
            case "report":
                echo WebUntis::GetReport(BasicTools::PostTest("restartdate"), BasicTools::PostTest("reenddate"), BasicTools::PostTest("splittype"), BasicTools::PostTest("ids"));
                break;
            case "consultationHours":
                echo WebUntis::GetConsultationHours(BasicTools::PostMultiTest("date"), BasicTools::PostTestOpt("clid"));
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
function Put()
{
    $array = explode(",", BasicTools::PostTest("putType"));
    $length = count($array);
    for ($i = 0; $i < $length; $i++) {
        switch ($array[$i]) {
            case "":
                break;
            case "consultationReg":
                WebUntis::ConsultationRegister((int) BasicTools::PostTest("period"), (int) BasicTools::PostTest("teacher"), (int) BasicTools::PostTest("date"), (int) BasicTools::PostTest("startTime"), (int) BasicTools::PostTest("endTime"), BasicTools::PostTestOpt("text", ""), BasicTools::PostTestOpt("ttext", ""));
                break;
            case "consultationUnreg":
                WebUntis::ConsultationUnregister((int) BasicTools::PostTest("period"), (int) BasicTools::PostTest("teacher"), BasicTools::PostTestOpt("text", ""));
                break;
            case "putMsg":
                PutMsg(BasicTools::PostTestOpt("msgType", "1"));
                break;
            case "putAutoReport":
                // PutReport(BasicTools::PostTest("log"), BasicTools::PostTest("os"), BasicTools::PostTest("browser"), (int) BasicTools::PostTest("hadInternet") == "true", BasicTools::PostTest("site"), BasicTools::PostTest("settings"), BasicTools::PostTestOpt("additionalData", ""));
                break;
            case "addEvent":
                EventData::AddEvent(
                    BasicTools::PostTest("startTime"),
                    BasicTools::PostTest("endTime"),
                    BasicTools::PostTest("title"),
                    BasicTools::PostTestOpt("description", ""),
                    mb_strtoupper(BasicTools::PostTest("owner"), 'UTF-8'),
                    BasicTools::PostTest("eventType"),
                    BasicTools::PostTest("ownerType")
                );
                break;
            case "editEvent":
                EventData::EditEvent(
                    BasicTools::PostTest("startTime"),
                    BasicTools::PostTest("endTime"),
                    BasicTools::PostTest("title"),
                    BasicTools::PostTestOpt("description", ""),
                    mb_strtoupper(BasicTools::PostTest("owner"), 'UTF-8'),
                    BasicTools::PostTest("eventType"),
                    BasicTools::PostTest("ownerType"),
                    BasicTools::PostTest("id")
                );
                break;
            case "deleteEvent":
                EventData::DeleteEvent(BasicTools::PostTest("id"));
                break;
            case "addAdmin":
                DB_Requests::SetAdmin(BasicTools::PostTest("class"), BasicTools::PostTest("id"));
                break;
            case "setting":
                DB_Requests::SetSetting(BasicTools::PostTest("setting"), BasicTools::PostTestOpt("value", null));
                break;
            case "deleteAdmin":
                DB_Requests::DeleteAdmin(BasicTools::PostTest("class"), BasicTools::PostTest("id"));
                break;
            case "fcmRegistration":
                DB_Requests::AddFCMToken(BasicTools::PostTest("token"));
                break;
            case "fcmUnregistration":
                DB_Requests::RemoveFCMToken(BasicTools::PostTest("token"));
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
function PutMsg($type)
{
    if (BasicTools::TestSessVar("putspam", false) > time() - 60) {
        if ($_SESSION["putcount"] > 1) {
            trigger_error("#error021", E_USER_ERROR);
        }
    } else {
        $_SESSION["putcount"] = 0;
        $_SESSION["putspam"] = time();
    }

    $_SESSION["putcount"]++;
    if (BasicTools::IsSenseful($_SESSION["user"])) {
        $user = $_SESSION["user"];
    } else {
        if (Auth::CookieLogin()) {
            if (BasicTools::IsSenseful($_SESSION["user"])) {
                $user = $_SESSION["user"];
            }
        }
    }
    if (!BasicTools::IsSenseful($user)) {
        if ("problem" == $type) {
            $user = "ANONYM";
        } else {
            trigger_error("#error006|user", E_USER_ERROR);
        }
    }
    DB_Query::AskDB(
        STANDARDDATABASE,
        "INSERT into feedback_messages (`user`, `email`, `msg`, `log`, `type`, `timestamp`) VALUES (?,?,?,?,?,NULL)",
        $user,
        DB_Query::TestLength(BasicTools::PostTestOpt("email", "Keine Email Angegeben"), 255),
        DB_Query::TestLength(BasicTools::PostTest("msg"), 65535),
        DB_Query::TestLength(gzcompress(BasicTools::PostTest("log"), 7), 65535),
        $type
    );

    Notifications::ReviewNotfication($type, $user);
}
function PutReport(string $log, string $os, string $browser, int $hi, string $sit, string $set, string $add)
{
    if (!($counter = BasicTools::TestSessVar("autoRepCounter", false))) {
        $counter = [1, time()];
    } else {
        if ($_SESSION["autoRepCounter"][1] + 100 < time()) {
            $counter = [1, time()];
        } else {
            $counter[0]++;
            if ($counter[0] > 100) {
                echo "too much reports";
            }
            return;
        }
    }

    DB_Query::AskDB(
        STANDARDDATABASE,
        "INSERT into feedback_report (log,username,os,browser,externIp,hadInternet,site,settings,additionalData) VALUES (?,?,?,?,?,?,?,?,?)",
        $log,
        (string) BasicTools::TestSessVar("user", false),
        $os,
        $browser,
        $_SERVER["REMOTE_ADDR"],
        $hi,
        $sit,
        $set,
        $add
    );
}
function Login()
{
    $b = false;
    if (BasicTools::PostTest("saveLogin") === "true") {
        $b = true;
    }
    echo Auth::TryLogin(BasicTools::PostTestOpt("username", null), BasicTools::PostTestOpt("password", null), BasicTools::PostTest("school"), $b);
}
