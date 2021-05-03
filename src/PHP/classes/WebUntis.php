<?php

/**
 *  Copyright ©2018
 *  Written by:
 *  Maximilian Mayrhofer
 *  Wendelin Muth
 */
const CLASSTYPE = 1;
const TEACHERTYPE = 2;
const SUBJECTTYPE = 3;
const ROOMTYPE = 4;
const STUDENTTYPE = 5;
class WebUntis
{
    const INPUT_SERVER = "[SERVER-HIER-REIN]";
    const USE_CACHE = true;
    const MAKE_CACHE = true;
    const RENEW_CACHE = true;
    private static $topicalityTested = false;
    private static $logLastTime;

    static function TestNoAccLogin($school)
    {
        self::AskUntis("https://" . self::INPUT_SERVER . "/WebUntis/?school=" . $school);
        $result = self::AskUntis("https://" . self::INPUT_SERVER . "/WebUntis/api/public/timetable/weekly/pageconfig?type=1&date=2018-06-25");
        if (strpos($result, '"isSessionTimeout":true') === false) {
            return true;
        }
        return false;
    }

    /**
     * $url = aufzurufende url (string) (enthält get)
     * $post = post parameter ("type=type&obst=banane" oder null)
     */
    private static function AskUntis($url, $post = null, $try = 0, $isFuckinDelete = false)
    {
        if (strpos($url, self::INPUT_SERVER) !== false) {
            $url = str_replace(self::INPUT_SERVER, BasicTools::TestSessVar("server"), $url);
        }
        $cookies = "";

        if (!BasicTools::IsSenseful($_SESSION["cookieNames"])) {
            $_SESSION["cookieNames"] = array();
            $_SESSION["cookieValues"] = array();
        } else {
            for ($i = 0; $i < count($_SESSION["cookieNames"]); $i++) {
                $cookies .= $_SESSION["cookieNames"][$i] . "=" . $_SESSION["cookieValues"][$i] . "; ";
            }
        }
        $ch = curl_init();
        /**
         * curl opt:
         * 0 gefunden
         * 1 überprüft passt ziemlich sicher für uns
         * 2 überprüft passt nicht ganz so sicher
         * vllt gebraucht
         * CURLOPT_CRLF
         * CURLOPT_UNRESTRICTED_AUTH
         * CURLOPT_USERPWD
         * passende zahl für:
         * CURLOPT_CONNECTTIMEOUT (sec)
         * CURLOPT_MAXREDIRS
         * CURLOPT_PORT
         * CURLOPT_TIMEOUT
         * passender string für
         * CURLOPT_DEFAULT_PROTOCOL
         * passendes array für:
         */
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); //0
        curl_setopt($ch, CURLOPT_AUTOREFERER, true); //1
        //curl_setopt($ch, CURLOPT_COOKIESESSION, true);//2
        curl_setopt($ch, CURLOPT_HEADERFUNCTION, "self::ReadHeader");
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); //1
        curl_setopt($ch, CURLOPT_FRESH_CONNECT, true); //1
        curl_setopt($ch, CURLOPT_HEADER, false); //1 zum testen ob der header richig is true
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        //curl_setopt($ch,CURLOPT_MUTE , false);//1
        curl_setopt($ch, CURLOPT_NETRC, true); // 2
        curl_setopt($ch, CURLOPT_COOKIEJAR, ""); //0 cookies gehn so ned
        curl_setopt($ch, CURLOPT_COOKIEFILE, ""); //0 cookies gehn so ned
        curl_setopt($ch, CURLOPT_COOKIE, $cookies); //1
        curl_setopt($ch, CURLOPT_URL, $url); // 1
        $header[] = "Connection: keep-alive";
        $header[] = "Accept: application/json";
        $header[] = "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36";
        if (null === $post) {
            curl_setopt($ch, CURLOPT_HTTPGET, true); // 1
            $header[] = "Content-Type: application/x-www-form-urlencoded";
        } else {
            //curl_setopt($ch,CURLOPT_CUSTOMREQUEST,"POST");//verschieden 1-2
            curl_setopt($ch, CURLOPT_POST, true); //1
            curl_setopt($ch, CURLOPT_POSTFIELDS, $post); // 1
            if (strpos($post, "{") === 0) {
                $header[] = 'Content-Type: application/json';
                $header[] = 'Content-Length: ' . strlen($post);
            } else {
                $header[] = "Content-Type: application/x-www-form-urlencoded";
            }
        }
        if ($isFuckinDelete) {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "DELETE");
        }
        //$header[]="Accept-Encoding: gzip, deflate, br";
        //$header[]="Accept-Language: de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7";
        curl_setopt($ch, CURLOPT_HTTPHEADER, $header);
        $result = curl_exec($ch);
        if (false === $result) {
            curl_close($ch);
            if (TableChange::$isQuestioning) {
                BasicTools::Log("error001", "questioning");
                return "";
            } else {
                trigger_error("#error001", E_USER_ERROR);
            }
        }
        if (curl_getinfo($ch, CURLINFO_HTTP_CODE) != "200") {
            $rCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            if (500 == $rCode) {
                if (TableChange::$isQuestioning) {
                    BasicTools::Log("error012", "questioning");
                    return "";
                } else {
                    trigger_error("#error012", E_USER_ERROR);
                }
            } else if (403 == $rCode) {
                if (TableChange::$isQuestioning) {
                    BasicTools::Log("error013", "questioning");
                    return "";
                } else {
                    trigger_error("#error013", E_USER_ERROR);
                }
            } else {
                if (TableChange::$isQuestioning) {
                    BasicTools::Log("error014", "questioning");
                    return "";
                } else {
                    trigger_error("#error014|" . $rCode, E_USER_ERROR);
                }
            }
        }
        if (strpos($result, "<title>Maintenance work</title>") !== false) {
            if (TableChange::$isQuestioning) {
                BasicTools::Log("error024", "questioning");
                return "";
            } else {
                trigger_error("#error024", E_USER_ERROR);
            }
        }
        if (strpos($result, '"ERR_TTVIEW_NOTALLOWED_ONDATE"') !== false) {
            if (TableChange::$isQuestioning) {
                BasicTools::Log("error028", "questioning");
                return "";
            } else {
                trigger_error("#error028", E_USER_ERROR);
            }
        }

        if (strpos($result, "ssoReauthentication") !== false) {
            self::Login();
            if ($try > 2) {
                curl_close($ch);
                if (TableChange::$isQuestioning) {
                    BasicTools::Log("error015", "questioning");
                    return "";
                } else {
                    trigger_error("#error015", E_USER_ERROR);
                }
            }
            return WebUntis::AskUntis($url, $post, $try + 1);
        }
        BasicTools::Log($result, "debugger");
        curl_close($ch);
        return $result;
    }

    private static function Login($try = 0)
    {
        $logLastTime = time();
        $result = self::AskUntis(
            "https://" . self::INPUT_SERVER . "/WebUntis/j_spring_security_check",
            "school=" . urlencode(BasicTools::TestSessVar("school")) . "&j_username=" . urlencode(BasicTools::TestSessVar("user")) . "&j_password=" . urlencode(MySecure::Decrypt(BasicTools::TestSessVar("password"), BasicTools::TestSessVar("user"))) .
                "&token="
        );
        BasicTools::Log("[INFO] WebUntis::Login(): Server: " . $_SESSION['server'] . " Username: " . $_SESSION['user'] . ", Response: $result ", "login");

        if (strpos($result, "blocked") !== false) {
            if (TableChange::$isQuestioning) {
                BasicTools::Log("error007", "questioning");
                return "";
            } else {
                trigger_error("#error007", E_USER_ERROR);
            }
        }
        if (strpos($result, "SUCCESS") == false) {
            if ($try < 3) {
                self::Login($try + 1);
            } else {
                if (TableChange::$isQuestioning) {
                    BasicTools::Log("error016", "questioning");
                    return "";
                } else {
                    trigger_error("#error016", E_USER_ERROR);
                }
            }
        }
    }

    static function TestLogin($school, $username, $password)
    {
        $result = self::AskUntis(
            "https://" . self::INPUT_SERVER . "/WebUntis/j_spring_security_check",
            "school=" . urlencode($school) . "&j_username=" . urlencode($username) . "&j_password=" . urlencode($password) . "&token="
        );
        $b = debug_backtrace();
        BasicTools::Log("[INFO] WebUntis::TestLogin(): Server: " . $_SESSION['server'] . " Username: $username, Response: $result"/* \n".json_encode($b)*/, "login");

        if (strpos($result, "SUCCESS") !== false) {
            return true;
        }
        if (strpos($result, "blocked") !== false) {
            trigger_error("#error007| Ihr Account wurde bei Untis gebannt!", E_USER_ERROR);
        }
        return false;
    }

    static function GetCorrectSchoolname($school)
    {
        $result = self::GetSchoolInfo($school);
        $result = json_decode($result, true);
        return $result["loginName"];
    }

    static function GetSchoolInfo($school)
    {
        $result = self::FindSchoolsContaining($school);
        $result = json_decode($result, true);
        if (!BasicTools::IsSenseful($result["result"]["schools"][0])) {
            trigger_error("#error011", E_USER_ERROR);
        }

        return json_encode($result["result"]["schools"][0], true);
    }

    static function FindSchoolsContaining($string)
    {
        return self::AskUntis("https://mobile.webuntis.com/ms/schoolquery2", '{"id":"wu_schulsuche-' . time() . '","method":"searchSchool","params":[{"search":"' . $string . '"}],"jsonrpc":"2.0"}');
    }
    private static function CleanCache()
    {
        DB_Query::AskDB(STANDARDDATABASE, "DELETE from cache_querys where cache_querys.school in (select a.school from (select * from cache_querys) as a join cache_info where cache_info.lastLook < DATE_SUB(NOW(), INTERVAL 30 DAY) and a.school like concat(cache_info.school,'%'))");
        DB_Query::AskDB(STANDARDDATABASE, "DELETE from cache_info where  lastLook < DATE_SUB(NOW(), INTERVAL 30 DAY)");
    }

    static function GetClasses($date) //montag der abfragewoche (2018-12-31)
    {
        return self::AskFor("https://" . self::INPUT_SERVER . "/WebUntis/api/public/timetable/weekly/pageconfig?type=1&date=" . $date, null);
    }

    private static function AskFor($url, $post = null, $forwholeschool = true, $nevercache = false, $isFuckinDelete = false)
    {
        $url = str_replace(self::INPUT_SERVER, BasicTools::TestSessVar("server"), $url);
        if (!$forwholeschool && !BasicTools::IsSenseful($_SESSION["user"])) {
            trigger_error("#warning001", E_USER_WARNING);
            return "";
        }
        if (self::USE_CACHE && !$nevercache) {
            $answer = self::GetCache(BasicTools::TestSessVar("school"), $url, $forwholeschool);
            if (false !== $answer) {
                return $answer;
            }
        }
        $answer = self::AskUntis($url, $post, 0, $isFuckinDelete);
        if (strpos($answer, '"isSessionTimeout":true') !== false) {
            if (BasicTools::IsSenseful($_SESSION["user"])) {
                $ch = self::Login();
            } else {
                $ch = self::NoAccLogin();
            }
            $answer = self::AskUntis($url, $post);
        }
        if (self::MAKE_CACHE && !$nevercache) {
            self::SetCache($url, $answer, $forwholeschool);
            new TableChange($answer, $url);
        }

        return $answer;
    }

    private static function GetCache($school, $query, $forwholeschool)
    {
        self::TestTopicality($school);
        if (!$forwholeschool) {
            $school = $school . BasicTools::TestSessVar("user");
        }
        $result = DB_Query::AskDB(STANDARDDATABASE, "SELECT answer from cache_querys where school= ? and query= ?;", $school, $query);
        if (BasicTools::IsSenseful($result[0]["answer"])) {
            return $result[0]["answer"];
        }
        return false;
    }

    private static function NoAccLogin($try = 0)
    {
        self::AskUntis("https://" . self::INPUT_SERVER . "/WebUntis/?school=" . BasicTools::TestSessVar("school"));
        $result = self::AskUntis("https://" . self::INPUT_SERVER . "/WebUntis/api/public/timetable/weekly/pageconfig?type=1&date=2018-06-25");
        if (strpos($result, '"isSessionTimeout":true') !== false) {
            if ($try < 3) {
                self::NoAccLogin($try + 1);
            } else {
                trigger_error("#error016", E_USER_ERROR);
            }
        }
    }

    private static function SetCache($query, $answer, $forwholeschool)
    {
        $school = BasicTools::TestSessVar("school");
        if (!$forwholeschool) {
            $school = $school . BasicTools::TestSessVar("user");
        }
        $result = DB_Query::AskDB(STANDARDDATABASE, "SELECT * from cache_querys where school=? and query=?", $school, $query);
        if (!is_array($result) || count($result) == 0) {
            DB_Query::AskDB(STANDARDDATABASE, "INSERT into cache_querys values(null,?,?,?)", $school, $query, $answer);
        }
    }

    private static function TestTopicality($school)
    {
        if (!self::$topicalityTested) {
            self::$topicalityTested = true;
            if (self::RENEW_CACHE) {
                $result = DB_Query::AskDB(STANDARDDATABASE, "SELECT * from cache_info where school=?", $school);
                if (!is_array($result) || count($result) == 0) {
                    DB_Query::AskDB(STANDARDDATABASE, "INSERT into cache_info values(null,?,0,0)", $school);
                }
                $lastT = self::GetlastTruncate($school);
                if (is_array($lastT) && !count($lastT) == 0) {
                    if (strtotime($lastT["lastLook"]) < strtotime($lastT["CURRENT_TIMESTAMP"]) - 60) {
                        $answer = self::AskFor("https://" . self::INPUT_SERVER . "/WebUntis/api/public/timetable/weekly/pageconfig?type=1", null, true, true);
                        $array = json_decode($answer, true);
                        if (!BasicTools::IsSenseful($array["data"]["lastImportTimestamp"])) {
                            BasicTools::Log("
                        Topicality failData(no timestamp found):
                        " . json_encode($array) . "
                        ");
                        }

                        if ($array["data"]["lastImportTimestamp"] > $lastT["lastTruncate"]) {
                            BasicTools::Log("Truncate " . $_SESSION["school"] . ": lit: " . date("d.m.Y H:i:s", $array["data"]["lastImportTimestamp"] / 1000) . " lt:" . date("d.m.Y H:i:s", $lastT["lastTruncate"] / 1000), "trun");
                            DB_Query::AskDB(STANDARDDATABASE, "DELETE from cache_querys where school Like Concat(?,'%')", $school);
                            DB_Query::AskDB(STANDARDDATABASE, "UPDATE cache_info SET lastTruncate = ? WHERE school = ?;", $array["data"]["lastImportTimestamp"], $school);
                            DB_Query::AskDB(STANDARDDATABASE, "UPDATE cache_info SET lastLook = null WHERE school=?;", $school);
                            self::CleanCache();
                            // Notifications::SchoolUpdateNotfication();
                            return;
                        }
                        DB_Query::AskDB(STANDARDDATABASE, "UPDATE cache_info SET lastLook = null WHERE school=?;", $school);
                    }
                }
            }
        }
    }

    static function GetlastTruncate($school)
    {
        self::TestTopicality($school);
        $result = DB_Query::AskDB(STANDARDDATABASE, "Select lastLook,CURRENT_TIMESTAMP,lastTruncate from cache_info where school=?", $school);
        if (is_array($result) && !count($result) == 0) {
            return $result[0];
        }
        return null;
    }

    static function GetStudents($date, $klid = -1)
    {
        //montag der abfragewoche (2018-12-31)

        return self::AskFor("https://" . self::INPUT_SERVER . "/WebUntis/api/public/timetable/weekly/pageconfig?type=5&id=0&date=" . $date . "&filter.klasseId=" . $klid, null);
    }

    static function GetClassId($uid = null)
    {
        if (null == $uid) {
            $uid = BasicTools::TestSessVar("userId");
        }

        if ("-1" == $uid) {
            trigger_error("#error027", E_USER_ERROR);
        }

        $class = json_decode(WebUntis::GetClassRoles(date("Ymd"), date("Ymd")), true);
        if (BasicTools::IsSenseful($class["data"]["personKlasseMap"][$uid])) {
            return $class["data"]["personKlasseMap"][$uid];
        } else {
            return "NO_CLASS_FOUND";
        }
    }

    static function GetServer($school)
    {
        $result = self::GetSchoolInfo($school);
        $result = json_decode($result, true);
        return $result["server"];
    }

    static function GetTeachers($date)
    {
        //montag der abfragewoche (2018-12-31)
        return self::AskFor("https://" . self::INPUT_SERVER . "/WebUntis/api/public/timetable/weekly/pageconfig?type=2&date=" . $date, null);
    }

    static function GetSubjects($date)
    {
        //montag der abfragewoche (2018-12-31)
        return self::AskFor("https://" . self::INPUT_SERVER . "/WebUntis/api/public/timetable/weekly/pageconfig?type=3&date=" . $date, null);
    }

    static function GetRoomsAndBuildings($date, $bdid = -1)
    {
        //montag der abfragewoche (2018-12-31)
        return self::AskFor("https://" . self::INPUT_SERVER . "/WebUntis/api/public/timetable/weekly/pageconfig?type=4&date=" . $date . "&filter.buildingId=" . $bdid, null);
    }

    static function GetGeneralGridInfo()
    {
        return self::AskFor("https://" . self::INPUT_SERVER . "/WebUntis/api/public/timegrid", null);
    }

    static function GetTimeGrid($date, $type, $id, $own = true)
    {
        //montag der abfragewoche (2018-12-31)
        if ($own) {
            TableChange::AskForTables();
        }

        $result = self::AskFor("https://" . self::INPUT_SERVER . "/WebUntis/api/public/timetable/weekly/data?elementType=" . $type . "&elementId=" . $id . "&date=" . $date . "&formatId=1", null);
        $result = json_decode($result, true);
        $result['requestDate'] = time() * 1000;

        return json_encode($result);
    }
    static function GetTimeGridInfo($date, $type, $id, $startTime = "00", $endTime = "2400", $period = "")
    {
        if ("" != $period) {
            $period = "&selectedPeriodId=" . $period;
        }
        return self::AskFor("https://" . self::INPUT_SERVER . "/WebUntis/api/public/period/info?date=$date&starttime=$startTime&endtime=$endTime&elemid=$id&elemtype=$type&ttFmtId=1$period", null);
    }
    static function GetInfo()
    {
        return self::AskFor("https://" . self::INPUT_SERVER . "/WebUntis/api/public/info/infoWidgetData", null);
    }

    static function GetNews($date)
    {
        //heutiger tag (20181231)
        return self::AskFor("https://" . self::INPUT_SERVER . "/WebUntis/api/public/news/newsWidgetData?date=" . $date, null, true, true);
    }

    static function GetAbsence($stid, $startdate, $enddate, $excusestatus = -1)
    {
        return self::AskFor("https://" . self::INPUT_SERVER . "/WebUntis/api/classreg/absences/students?studentId=" . $stid . "&startDate=" . $startdate . "&endDate=" . $enddate . "&excuseStatusId=" .
            $excusestatus . "&includeTodaysAbsence=true", null, false, true);
    }
    static function GetConsultationRegistredations()
    {
        return self::AskFor("https://" . self::INPUT_SERVER . "/WebUntis/api/public/officehours/registrations", null, false, true);
    }
    static function GetConsultationRegInfo($period, $teacher)
    {
        return self::AskFor("https://" . self::INPUT_SERVER . "/WebUntis/api/public/officehours/registrationdata?periodId=$period&teacherId=$teacher", null, true, true);
    }
    static function ConsultationRegister($period, $teacher, $date, $start, $end, $text = "", $ttext = "")
    {
        return self::AskFor("https://" . self::INPUT_SERVER . "/WebUntis/api/public/officehours/registrations", json_encode(array("periodId" => $period, "teacherId" => $teacher, "date" => $date, "startTime" => $start, "endTime" => $end, "userText" => $text, "teacherText" => $ttext)), false, true);
    }
    static function ConsultationUnregister($period, $teacher, $text = "")
    {
        return self::AskFor("https://" . self::INPUT_SERVER . "/WebUntis/api/public/officehours/registrations?periodId=$period&teacherId=$teacher&userText=$text", null, false, true, true);
    }
    static function GetClassRoles($startdate, $enddate)
    {
        //heutiger tag (20181231)
        return self::AskFor("https://" . self::INPUT_SERVER . "/WebUntis/api/classreg/classservices?startDate=" . $startdate . "&endDate=" . $enddate, null, false);
    }

    static function GetHomeworks($startdate, $enddate)
    {
        //heutiger tag (20181231)
        return self::AskFor("https://" . self::INPUT_SERVER . "/WebUntis/api/homeworks/lessons?startDate=" . $startdate . "&endDate=" . $enddate, null, false, true);
    }

    static function GetExams($startdate, $enddate)
    {
        //heutiger tag (20181231)
        return self::AskFor("https://" . self::INPUT_SERVER . "/WebUntis/api/exams?startDate=" . $startdate . "&endDate=" . $enddate, null, false, true);
    }
    static function GetReport($startdate, $enddate, $splittype, $absenceids)
    {
        //heutiger tag (20181231)
        return self::AskFor("https://" . self::INPUT_SERVER . "/WebUntis/reports.do?name=Excuse&format=pdf&rpt_sd=$startdate&rpt_ed=$enddate&excuseStatusId=-1&withLateness=true&withAbsences=true&excuseGroup=$splittype&$absenceids", null, false, true);
    }
    static function GetReportInfo()
    {
        return self::AskFor("https://" . self::INPUT_SERVER . "/WebUntis/api/polling/REPORT", null, false, true);
    }
    static function DownloadReport($id)
    {
        return base64_encode(self::AskFor("https://" . self::INPUT_SERVER . "/WebUntis/reports.do?msgId=0&get=$id&name=Excuse&format=pdf", null, false, true));
    }

    static function GetClasses2()
    {
        //andere abfrage
        return self::AskFor("https://" . self::INPUT_SERVER . "/WebUntis/api/public/officehours/classes", null);
    }

    static function GetPersonalInfo()
    {
        //gibt sehr viel zurück (auch benutzerdaten)
        $pI = self::AskFor("https://" . self::INPUT_SERVER . "/WebUntis/api/app/config", null, false);
        $pI = json_decode($pI, true);
        if (BasicTools::TestSessVar("rank", false) !== false) {

            $pI["adminName"] = BasicTools::TestSessVar("aUsername");
        }
        if (BasicTools::TestSessVar("user", false)) {
            $pI["classId"] = "" . WebUntis::GetClassId($pI["data"]["loginServiceConfig"]["user"]["personId"] . "");
        }
        $pI = json_encode($pI);
        return $pI;
    }

    static function GetConsultationHours($date, $clientId = -1)
    {
        //heutiger tag (20181231)
        return self::AskFor("https://" . self::INPUT_SERVER . "/WebUntis/api/public/officehours/hours?date=" . $date . "&klasseId=" . $clientId, null);
    }

    private static function ReadHeader($ch, $hLine)
    {
        if (preg_match('/^set-cookie:\s*(.*?)=([^\n\r\s;]+)/i', $hLine, $cookie) == 1) {
            $key = array_search($cookie[1], $_SESSION["cookieNames"]);
            if (false === $key) {
                $_SESSION["cookieNames"][] = $cookie[1];
                $_SESSION["cookieValues"][] = $cookie[2];
            } else {
                $_SESSION["cookieNames"][$key] = $cookie[1];
                $_SESSION["cookieValues"][$key] = $cookie[2];
            }
        }
        return strlen($hLine);
    }

    static function AvailableRooms($start, $end)
    {
        $auth = self::GenerateAuthentication();
        return self::AskUntis(
            "https://neilo.webuntis.com/WebUntis/jsonrpc_intern.do?school=Spengergasse&v=a4.2.9",
            '{"id":"availablerooms-test' . time() .
                '","method":"getAvailableRooms2017","params":[{"startDateTime":"' . $start . '","endDateTime":"' . $end . '","auth":{"clientTime":' . $auth["clientTime"] . ',"otp":' . $auth["otp"] . ',"user":"' . $auth["user"] . '"}}],"jsonrpc":"2.0"}'
        );
    }
    static function DelAbsence($id)
    {
        $auth = self::GenerateAuthentication();
        return self::AskUntis(
            "https://neilo.webuntis.com/WebUntis/jsonrpc_intern.do?school=Spengergasse&v=a4.2.9",
            '{"id":"absencedelete-test' . time() .
                '","method":"deleteAbsence2017","params":[{"absenceId":"' . $id . '","auth":{"clientTime":' . $auth["clientTime"] . ',"otp":' . $auth["otp"] . ',"user":"' . $auth["user"] . '"}}],"jsonrpc":"2.0"}'
        );
    }
    static function Secret($pw, $un)
    {


        $res = self::AskUntis(
            "https://neilo.webuntis.com/WebUntis/jsonrpc_intern.do?school=Spengergasse&v=a4.2.9",
            '{"id":"secret-test' . time() .
                '","method":"getAppSharedSecret","params":[{"password":"' . $pw . '","userName":"' . $un . '","token":null}],"jsonrpc":"2.0"}'
        );

        return json_decode($res, true)["result"];
    }

    static function Premium()
    {
        $auth = self::GenerateAuthentication();
        return self::AskUntis(
            "https://neilo.webuntis.com/WebUntis/jsonrpc_intern.do?school=Spengergasse&v=a4.2.9",
            '{"id":"premium-test' . time() .
                '","method":"isPremiumAvailable","params":[{"auth":{"clientTime":' . $auth["clientTime"] . ',"otp":' . $auth["otp"] . ',"user":"' . $auth["user"] . '"}}],"jsonrpc":"2.0"}'
        );
    }


    static function AppInfo()
    {
        return self::AskUntis(
            "https://neilo.webuntis.com/WebUntis/jsonrpc_intern.do?school=Spengergasse&v=a4.2.9",
            '{"id":"meintest-' . time() . '","method":"getAppInfo","params":[],"jsonrpc":"2.0"}'
        );
    }


    private static function GenerateAuthentication()
    {
        $time = time() * 1000;
        $pw = BasicTools::TestSessVar("secret");
        $pw = strtoupper($pw);
        $pw = Base32::decode($pw);
        $otp = (new Totp("sha1", 0, 30000))->GenerateToken($pw, $time);



        return array("clientTime" => $time, "otp" => intval($otp), "user" => $_SESSION["user"]);
    }
}
