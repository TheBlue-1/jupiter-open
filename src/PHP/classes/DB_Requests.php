<?php
class DB_Requests
{
    public static function GetAdmins($class)
    {
        return DB_Query::AskDB(STANDARDDATABASE, "SELECT userId from login_extraordinaries where userRole=2 and class=? and school=?", $class, BasicTools::TestSessVar("school"));
    }
    public static function SetAdmin($class, $id)
    {

        if (!self::AllowedToEdit($class)) {
            trigger_error("#error025", E_USER_ERROR);
        }

        if (self::IsAlradyAdmin($class, $id)) {
            return;
        }

        DB_Query::AskDB(STANDARDDATABASE, "INSERT into login_extraordinaries values (null,?,?,2,?)", BasicTools::TestSessVar("school"), $id, $class);
    }
    public static function DeleteAdmin($class, $id)
    {

        if (!self::AllowedToEdit($class)) {
            trigger_error("#error025", E_USER_ERROR);
        }

        if (!self::IsAlradyAdmin($class, $id)) {
            return;
        }

        DB_Query::AskDB(STANDARDDATABASE, "DELETE from login_extraordinaries where school=? and userId=? and class=? and userRole=2", BasicTools::TestSessVar("school"), $id, $class);
    }
    private static function IsAlradyAdmin($class, $id)
    {
        $ans = DB_Query::AskDB(STANDARDDATABASE, "SELECT id from login_extraordinaries where school=? and userId=? and class=? and userRole=2", BasicTools::TestSessVar("school"), $id, $class);

        if (count($ans) > 0) {
            return true;
        }

        return false;
    }
    private static function AllowedToEdit($class)
    {
        return in_array($class, BasicTools::TestSessVar("classes"));
    }

    public static function AddFCMToken($token)
    {
        if (!MySecure::IsPersonalLogged()) {
            trigger_error("#error025", E_USER_ERROR);
        }

        $res = DB_Query::AskDB(STANDARDDATABASE, "SELECT id from notification_clients where school=? and userId=?", BasicTools::TestSessVar("school"), BasicTools::TestSessVar("userId"));
        if (count($res) == 0) {
            DB_Query::AskDB(STANDARDDATABASE, "INSERT INTO notification_clients (school,userId,registrationToken,lastEdit) values(?,?,?,null)", BasicTools::TestSessVar("school"), BasicTools::TestSessVar("userId"), $token);
            $res = DB_Query::AskDB(STANDARDDATABASE, "SELECT id from notification_clients where school=? and userId=?", BasicTools::TestSessVar("school"), BasicTools::TestSessVar("userId"));
        }
        DB_Query::AskDB(STANDARDDATABASE, "INSERT INTO notification_token (token, clientId) VALUES(?,?)", $token, $res[0]["id"]);
        Notifications::WelcomeNotification($token);
    }

    public static function RemoveFCMToken($token)
    {
        if (!MySecure::IsPersonalLogged()) {
            trigger_error("#error025", E_USER_ERROR);
        }
        DB_Query::AskDB(STANDARDDATABASE, "DELETE FROM notification_token WHERE token = ?", $token);
    }

    public static function SetSetting($setting, $value)
    {
        if (!MySecure::IsPersonalLogged()) {
            trigger_error("#error025", E_USER_ERROR);
        }

        $sett1 = 0;
        $sett2 = 0;
        $tid = null;
        $res = DB_Query::AskDB(STANDARDDATABASE, "SELECT settings,timetable from notification_clients where school=? and userId=?", BasicTools::TestSessVar("school"), BasicTools::TestSessVar("userId"));
        if (count($res) == 0) {
            DB_Query::AskDB(STANDARDDATABASE, "INSERT into notification_clients (school,userId,lastEdit) values(?,?,null)", BasicTools::TestSessVar("school"), BasicTools::TestSessVar("userId"));
        } else {
            $tid = $res[0]["timetable"];
            if (($res[0]["settings"] & 1) == 1) {
                $sett1 = 1;
            }

            if (($res[0]["settings"] & 2) == 2) {
                $sett2 = 1;
            }
        }
        switch ($setting) {
            case "notificationsSchoolUpdate":
                if (null == $value) {
                    $sett1 = 0;
                } else {
                    $sett1 = $value;
                }

                break;
            case "notificationsSubscribedTimetable":
                if (null == $value) {
                    DB_Query::AskDB(STANDARDDATABASE, "UPDATE notification_clients set timetable = null, lastEdit=null where school=? and userId=?", BasicTools::TestSessVar("school"), BasicTools::TestSessVar("userId"));
                    return;
                }

                $info = explode("|", $value);
                $ttype = (int) $info[0];
                $tuid = (int) $info[1];

                $res = DB_Query::AskDB(STANDARDDATABASE, "SELECT id from notification_table where ownerType=? and ownerId=? and school=?", $ttype, $tuid, BasicTools::TestSessVar("school"));
                if (count($res) == 0) {
                    DB_Query::AskDB(STANDARDDATABASE, "INSERT into notification_table values(null,?,?,?)", $ttype, $tuid, BasicTools::TestSessVar("school"));
                    $res = DB_Query::AskDB(STANDARDDATABASE, "SELECT id from notification_table where ownerType=? and ownerId=? and school=?", $ttype, $tuid, BasicTools::TestSessVar("school"));
                }

                $newTid = $res[0]["id"];

                $res = DB_Query::AskDB(STANDARDDATABASE, "UPDATE notification_clients set timetable = ?,lastEdit=null where school=? and userId=?", $newTid, BasicTools::TestSessVar("school"), BasicTools::TestSessVar("userId"));

                if ($tid != $newTid && null != $tid) {

                    $res = DB_Query::AskDB(STANDARDDATABASE, "SELECT id from notification_clients where timetable=?", $tid);

                    if (count($res) == 0) {

                        DB_Query::AskDB(STANDARDDATABASE, "DELETE from notification_table where id=?", $tid);
                    }
                }

                return;
            case "notificationsAskForForeignTables":
                if (null == $value) {
                    $sett2 = 1;
                } else {
                    $sett2 = $value;
                }

                break;
        }
        $res = DB_Query::AskDB(STANDARDDATABASE, "UPDATE notification_clients set settings = ?,lastEdit=null where school=? and userId=?", $sett2 * 2 + $sett1, BasicTools::TestSessVar("school"), BasicTools::TestSessVar("userId"));
    }

    public static function GetSettings()
    {
        if (!MySecure::IsPersonalLogged()) {
            return "";
        }

        $res = DB_Query::AskDB(STANDARDDATABASE, "SELECT notification_clients.settings,notification_table.ownerType,notification_table.ownerId from notification_clients join notification_table on notification_clients.timetable=notification_table.id where notification_clients.school=? and notification_clients.userId=?", BasicTools::TestSessVar("school"), BasicTools::TestSessVar("userId"));
        if (count($res) == 0) {
            $sett1 = null;
            $sett2 = null;
            $table = null;
        } else {
            if (($res[0]["settings"] & 1) == 1) {
                $sett1 = 1;
            } else {
                $sett1 = 0;
            }

            if (($res[0]["settings"] & 2) == 2) {
                $sett2 = 1;
            } else {
                $sett2 = 0;
            }

            $table = $res[0]["ownerType"] . "|" . $res[0]["ownerId"];
        }

        return array("notificationsSchoolUpdate" => $sett1, "notificationsAskForForeignTables" => $sett2, "notificationsSubscribedTimetable" => $table);
    }
    public static function GetMessages($type, $count, $seen = null)
    {
        if (!MySecure::IsAllowed(5)) {
            trigger_error("#error025", E_USER_ERROR);
        }
        $arr = array();
        $arr[] = $type;
        $seenPart = "";
        if (null !== $seen) {
            $seenPart = "and seen = ?";
            $arr[] = $seen;
        }
        $arr[] = intval($count);
        $res = DB_Query::AskDB(STANDARDDATABASE, "SELECT * from feedback_messages where type like ? $seenPart LIMIT ?", $arr);
        for ($i = 0; $i < count($res); $i++) {
            $res[$i]["log"] = gzuncompress($res[$i]["log"]);
        }
        echo json_encode($res, true);
    }
    public static function DelMessage($id)
    {
        if (!MySecure::IsAllowed(7)) {
            trigger_error("#error025", E_USER_ERROR);
        }

        DB_Query::AskDB(STANDARDDATABASE, "DELETE from feedback_messages where id=?", $id);
    }
    public static function SeeMessage($id)
    {
        if (!MySecure::IsAllowed(5)) {
            trigger_error("#error025", E_USER_ERROR);
        }

        DB_Query::AskDB(STANDARDDATABASE, "UPDATE feedback_messages set seen=1 where id=?", $id);
    }
}
