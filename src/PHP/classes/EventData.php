<?php

/**
 *  Copyright ©2018
 *  Written by:
 *  Maximilian Mayrhofer
 *  Wendelin Muth
 */

class EventData
{
    /**
     * Type:
     * 1=Homework
     * 2=Test
     * OwnerType:
     * 1=Student (stdn name)
     * 2=Class (cl id)
     */

    public static function GetEvents($startTime, $endTime, $ownerType, $type, $owner)
    {
        $where = array();
        $whereArr = array();
        if (BasicTools::IsSenseful($startTime)) {
            $where[] = "startTime >= ?";
            $whereArr[] = $startTime;
        }
        if (BasicTools::IsSenseful($endTime)) {
            $where[] = "startTime <= ?";
            $whereArr[] = $endTime;
        }
        if (BasicTools::IsSenseful($ownerType)) {
            $where[] = "ownerType = ?";
            $whereArr[] = $ownerType;
        }
        if (BasicTools::IsSenseful($type)) {
            $where[] = "type = ?";
            $whereArr[] = $type;
        }
        if (BasicTools::IsSenseful($owner)) {
            $where[] = "owner = ?";
            $whereArr[] = $owner;
        }
        if (BasicTools::TestSessVar("isTeacher", false) === true) {
            $qMarks = str_repeat('?,', count(BasicTools::TestSessVar("classes")));
            if (strlen($qMarks) > 0) {
                $qMarks = substr($qMarks, 0, strlen($qMarks) - 1);
            }

            $where[] = "(((ownerType = 1 and owner=?) or (ownerType = 2 and owner in ($qMarks))) and school=? or ownerType = 3)";
            $whereArr[] = BasicTools::TestSessVar("user");
            foreach (BasicTools::TestSessVar("classes") as $id) {
                $whereArr[] = $id;
            }
            $whereArr[] = BasicTools::TestSessVar("school");
        } else {
            $where[] = "(((ownerType = 1 and owner=?) or (ownerType = 2 and owner=?)) and school=? or ownerType = 3)";
            $whereArr[] = BasicTools::TestSessVar("user");
            $whereArr[] = BasicTools::TestSessVar("class");
            $whereArr[] = BasicTools::TestSessVar("school");
        }

        $whereString = " where ";
        for ($i = 0; $i < count($where); $i++) {
            $whereString .= $where[$i] . " and ";
        }
        $whereString = substr($whereString, 0, strlen($whereString) - 5);
        return self::Get($whereString, $whereArr);
    }

    private static function Get($where, $whereArr)
    {
        $re = DB_Query::AskDB(STANDARDDATABASE, "SELECT id,startTime,endTime,title,description,owner,type,ownerType,lastEditBy from events_data" . $where, $whereArr);

        return $re;
    }

    public static function AddEvent($startTime, $endTime, $title, $description, $owner, $type, $ownerType)
    {

        $arr = array("startTime" => $startTime, "endTime" => $endTime, "title" => $title, "description" => $description, "owner" => $owner, "type" => $type, "ownerType" => $ownerType);
        self::TestWithAll($arr);

        $testCountData = DB_Query::AskDB(STANDARDDATABASE, "SELECT id from events_data where ownerType = 1 and owner=? and school=?", $owner, BasicTools::TestSessVar("school"));
        if (count($testCountData) >= 777) {
            trigger_error("#error022", E_USER_ERROR);
        }
        self::DeleteOldEvents();
        self::Add($arr);
    }

    private static function TestWithAll($arr)
    {

        if (!(BasicTools::TestSessVar("isTeacher", false) === true && 2 == $arr["ownerType"] && in_array($arr["owner"], BasicTools::TestSessVar("classes")) ||
            BasicTools::TestSessVar("isClassAdmin", false) === true && 2 == $arr["ownerType"] && BasicTools::TestSessVar("class") == $arr["owner"] || 1 == $arr["ownerType"] && BasicTools::TestSessVar("user") == $arr["owner"]) || "NO_CLASS_FOUND" == $arr["owner"]) {

            trigger_error("#error025", E_USER_ERROR);
        }
    }

    private static function Add($arr)
    {
        DB_Query::AskDB(
            STANDARDDATABASE,
            "INSERT into events_data (startTime,endTime,title,description,owner,type,ownerType,school,lastEditBy) values (?,?,?,?,?,?,?,?,?)",
            $arr["startTime"],
            $arr["endTime"],
            $arr["title"],
            $arr["description"],
            $arr["owner"],
            $arr["type"],
            $arr["ownerType"],
            BasicTools::TestSessVar("school"),
            BasicTools::TestSessVar("user")
        );
    }

    public static function EditEvent($startTime, $endTime, $title, $description, $owner, $type, $ownerType, $id)
    {
        self::TestWithId($id);
        $arr = array("startTime" => $startTime, "endTime" => $endTime, "title" => $title, "description" => $description, "owner" => $owner, "type" => $type, "ownerType" => $ownerType, "id" => $id);
        self::TestWithAll($arr);
        self::Edit($arr);
    }

    private static function TestWithId($id)
    {
        $answer = DB_Query::AskDB(STANDARDDATABASE, "SELECT * from events_data where id =? and school=?", $id, BasicTools::TestSessVar("school"));
        if (count($answer) < 1) {
            trigger_error("#error023", E_USER_ERROR);
        }

        self::TestWithAll($answer[0]);
    }

    public static function DeleteEvent($id)
    {
        self::TestWithId($id);
        self::Delete(array("id" => $id));
    }

    private static function Delete($arr)
    {
        DB_Query::AskDB(STANDARDDATABASE, "DELETE from events_data where id =? and school=?", $arr["id"], BasicTools::TestSessVar("school"));
    }

    private static function Edit($arr)
    {
        DB_Query::AskDB(
            STANDARDDATABASE,
            "UPDATE events_data set startTime= ?,endTime= ?,title= ?,description= ?,owner= ?,type= ?,ownertype= ?,lastEditBy= ? where id =? and school=?",
            $arr["startTime"],
            $arr["endTime"],
            $arr["title"],
            $arr["description"],
            $arr["owner"],
            $arr["type"],
            $arr["ownerType"],
            BasicTools::TestSessVar("user"),
            $arr["id"],
            BasicTools::TestSessVar("school")
        );
    }
    private static function DeleteOldEvents()
    {
        DB_Query::AskDB(STANDARDDATABASE, "DELETE from events_data where endTime < " . (round(microtime(true) * 1000) - 17280000000));
    }
}
