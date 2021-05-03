<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);
class TableChange
{
    public static $isQuestioning = false;
    private $timegrid = null;
    private $timegridInfo = null;
    private $insert = false;
    public function __construct($timegrid, $timegridInfo)
    {
        $this->timegrid = $timegrid;
        $this->timegridInfo = $timegridInfo;
        $this->CachedNew();
    }
    public function CachedNew()
    {
        if (!$this->TestForTimegrid() || !$this->TestForCorrectness()) {
            return;
        }
        if ($this->IsInteresting()) {
            DB_Query::AskDB(STANDARDDATABASE, "UPDATE notification_oldTableInfo set lastTime=null where date=? and timetable=?", $this->timegridInfo["date"], $this->timegridInfo["tid"]);
        } else {
            return;
        }
        if (!$this->IsNewVersion()) {
            return;
        }
        if ($this->insert) {
            DB_Query::AskDB(STANDARDDATABASE, "INSERT into notification_oldTableInfo values(null,?,?,?,null)", $this->timegrid, $this->timegridInfo["date"], $this->timegridInfo["tid"]);
        } else {
            $this->NotifyUsers();
            DB_Query::AskDB(STANDARDDATABASE, "UPDATE notification_oldTableInfo set hash=? where date=? and timetable=?", $this->timegrid, $this->timegridInfo["date"], $this->timegridInfo["tid"]);
        }
    }

    private function IsInteresting()
    {
        $res = DB_Query::AskDB(STANDARDDATABASE, "SELECT id from notification_table where ownerType=? and ownerID=? and school=?", $this->timegridInfo["type"], $this->timegridInfo["id"], BasicTools::TestSessVar("school"));
        if (count($res) == 0) {
            return false;
        }
        $lastmon = date("Ymd", strtotime("last monday", strtotime("tomorrow")));
        $nextmon = date("Ymd", strtotime("next monday"));
        if ($this->timegridInfo["date"] != $lastmon && $this->timegridInfo["date"] != $nextmon) {
            return false;
        }

        $this->timegridInfo["tid"] = $res[0]["id"];
        return true;
    }
    private function TestForTimegrid()
    {
        if (preg_match("/https:\/\/.*\/WebUntis\/api\/public\/timetable\/weekly\/data\?elementType=(.*)&elementId=(.*)&date=(.*)&formatId=1/", $this->timegridInfo, $matches) == 0) {
            return false;
        }

        $this->timegridInfo = array("date" => preg_replace("/-/", "", $matches[3]), "type" => $matches[1], "id" => $matches[2]);

        return true;
    }
    private function DeleteOld()
    {
        DB_Query::AskDB(STANDARDDATABASE, "DELETE from notification_oldTableInfo where CAST(date AS SIGNED) < CAST(? AS SIGNED)", date("Ymd", time() - 14 * 24 * 60 * 60));
        $res = DB_Query::AskDB(STANDARDDATABASE, "SELECT timetable from notification_clients where lastEdit<DATE_SUB(NOW(), INTERVAL 5 YEAR)");
        DB_Query::AskDB(STANDARDDATABASE, "DELETE from notification_clients where lastEdit<DATE_SUB(NOW(), INTERVAL 5 YEAR)");
        BasicTools::WriteArray($res);
        foreach ($res as $tidh) {
            $tid = $tidh["timetable"];
            $res = DB_Query::AskDB(STANDARDDATABASE, "SELECT id from notification_clients where timetable=?", $tid);

            if (count($res) == 0) {

                DB_Query::AskDB(STANDARDDATABASE, "DELETE from notification_table where id=?", $tid);
            }
        }
    }
    private function TestForCorrectness()
    {
        if (preg_match('/^{"data":{"result":{"data":.*"elementIds":\[\d+?\]/', $this->timegrid) == 0) {
            return false;
        }
        $this->timegrid = json_decode($this->timegrid, true);
        $this->timegrid = md5(json_encode($this->timegrid["data"]["result"]["data"]));
        return true;
    }

    private function IsNewVersion()
    {
        $oldOne = DB_Query::AskDB(STANDARDDATABASE, "SELECT hash from notification_oldTableInfo where date=? and timetable=?", $this->timegridInfo["date"], $this->timegridInfo["tid"]);
        if (count($oldOne) == 0) {
            $this->insert = true;
            return true;
        }

        $oldOne = $oldOne[0]["hash"];
        if ($this->timegrid != $oldOne) {
            return true;
        }

        return false;
    }

    private function NotifyUsers()
    {
        Notifications::TableChangeNotification($_SESSION["school"], $this->timegridInfo["date"], $this->timegridInfo["type"], $this->timegridInfo["id"]);
        $this->DeleteOld();
    }
    const ASKED_TABLES = 5;
    public static function AskForTables()
    {
        if (!BasicTools::TestSessVar("userId", false)) {
            return;
        }

        $res = DB_Query::AskDB(STANDARDDATABASE, "SELECT notification_clients.settings from notification_clients where notification_clients.school=? and notification_clients.userId=?", BasicTools::TestSessVar("school"), BasicTools::TestSessVar("userId"));
        if (count($res) == 0) {
            return;
        }

        if (!($res[0]["settings"] & 2) == 2) {
            return;
        }
        $lastmon = date("Ymd", strtotime("last monday", strtotime("tomorrow")));
        $nextmon = date("Ymd", strtotime("next monday"));
        $bsp = date("Ymd", time() - time() % 7 * 24 * 60 * 60);
        $res = DB_Query::AskDB(STANDARDDATABASE, "SELECT notification_table.ownerType,notification_table.ownerId, notification_oldTableInfo.date from notification_table left join
        (SELECT notification_oldTableInfo.date,notification_oldTableInfo.timetable,notification_oldTableInfo.lastTime from notification_oldTableInfo where notification_oldTableInfo.date=? or notification_oldTableInfo.date=?)as notification_oldTableInfo on notification_table.id=notification_oldTableInfo.timetable
        where school=? and notification_oldTableInfo.lastTime <DATE_SUB(NOW(), INTERVAL 5 MIN) order by notification_oldTableInfo.lastTime", $lastmon, $nextmon, BasicTools::TestSessVar("school"));

        $absent = array();
        foreach ($res as $key => $tabledata) {
            if (null == $tabledata["date"]) {
                array_splice($res, $key, 1);
                $absent[] = array("ownerType" => $tabledata["ownerType"], "ownerId" => $tabledata["ownerId"], "date" => $nextmon);
                $absent[] = array("ownerType" => $tabledata["ownerType"], "ownerId" => $tabledata["ownerId"], "date" => $lastmon);
            } else {
                if (($key = array_search($tabledata, $absent)) !== false) {
                    unset($absent[$key]);
                } else {
                    if ($tabledata["date"] == $lastmon) {

                        $absent[] = array("ownerType" => $tabledata["ownerType"], "ownerId" => $tabledata["ownerId"], "date" => $nextmon);
                    } else {

                        $absent[] = array("ownerType" => $tabledata["ownerType"], "ownerId" => $tabledata["ownerId"], "date" => $lastmon);
                    }
                }
            }
        }

        foreach ($absent as $ab) {
            array_unshift($res, $ab);
        }
        self::$isQuestioning = true;
        foreach ($res as $key => $tabledata) {

            if ($key >= TableChange::ASKED_TABLES) {
                break;
            }

            WebUntis::GetTimeGrid(date("Y-m-d", strtotime($tabledata["date"])), $tabledata["ownerType"], $tabledata["ownerId"], false);
        }
        self::$isQuestioning = false;
    }
}
