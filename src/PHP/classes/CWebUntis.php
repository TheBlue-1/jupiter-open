<?php

class CWebUntis
{

    static function GetTeachersClasses()
    {
        if (!BasicTools::TestSessVar("isTeacher", false) !== true) {
            trigger_error("#error025", E_USER_ERROR);
        }

        $classes = array();
        $allClasses = json_decode(WebUntis::GetClasses(date("Y-m-d")), true)["data"]["elements"];
        foreach ($allClasses as $class) {
            if ($class["classteacher"]["name"] == $_SESSION["user"]) {
                $classes[] = array("id" => $class["id"], "name" => $class["name"], "students" => json_decode(WebUntis::GetStudents(date("Y-m-d"), true), $class["id"]), "admins" => DB_Requests::GetAdmins($class["id"]));
            }
        }
        return $classes;
    }
    static function GetTeachersClassIds()
    {
        $arr = self::GetTeachersClasses();
        $res = array();
        for ($i = 0; $i < count($arr); $i++) {
            $res[] = $arr[$i]["id"] . "";
        }
        return $res;
    }
}
