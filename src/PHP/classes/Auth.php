<?php

/**
 *  Copyright ©2018
 *  Written by:
 *  Maximilian Mayrhofer
 *  Wendelin Muth
 */
class Auth
{
    private static function Login($id, $password, $school, $save)
    {

        self::Logout();

        $_SESSION["timeoutVar"] = "set";

        if (strtolower($school) == "emp") {
            $id = mb_strtoupper($id, 'UTF-8');
            if (MySecure::EmpLogin($id, $password)) {
                if ($save) {
                    self::SaveLogin($school, $id, $password);
                }
                return true;
            }
            return false;
        }

        $_SESSION["server"] = WebUntis::GetServer($school);
        $school = WebUntis::GetCorrectSchoolname($school);

        if (null === $id) {
            if (WebUntis::TestNoAccLogin($school)) {
                $_SESSION["school"] = $school;

                if ($save) {
                    self::SaveLogin($school);
                }
                return true;
            }
            return false;
        }
        $id = mb_strtoupper($id, 'UTF-8');

        if (!WebUntis::TestLogin($school, $id, $password)) {
            return false;
        }

        $_SESSION["school"] = $school;
        $_SESSION["user"] = $id;
        $_SESSION["password"] = MySecure::Encrypt($password, $id);
        $_SESSION["secret"] = WebUntis::Secret($password, $id);

        if ($save) {
            self::SaveLogin($school, $id, $password);
        }
        return true;
    }
    public static function TryLogin($id, $password, $school, $save, $dontEcho = false)
    {
        if (self::Login($id, $password, $school, $save)) {
            if (BasicTools::IsSenseful($_SESSION["user"])) {

                $pInfo = WebUntis::GetPersonalInfo();
                $pInfoDec = json_decode($pInfo, true);
                if (true === $pInfoDec["data"]["isTeacher"]) {
                    $_SESSION["isTeacher"] = true;
                } else {
                    $_SESSION["isTeacher"] = false;
                }

                $_SESSION["userId"] = $pInfoDec["data"]["loginServiceConfig"]["user"]["personId"] . "";
                if ("-1" == $_SESSION["userId"]) {
                    trigger_error("#error027", E_USER_ERROR);
                }

                $result = DB_Query::AskDB(STANDARDDATABASE, "SELECT userRole from login_extraordinaries where school=? and userId=?", $_SESSION["school"], $_SESSION["userId"]);
                if (count($result) > 0) {
                    foreach ($result as $values) {
                        if ("1" === $values["userRole"]) {
                            $_SESSION["isBeta"] = true;
                        }

                        if ("2" === $values["userRole"]) {
                            $_SESSION["isClassAdmin"] = true;
                        }
                    }
                }

                if (!BasicTools::IsSenseful($_SESSION["isClassAdmin"])) {
                    $_SESSION["isClassAdmin"] = false;
                }

                if (!BasicTools::IsSenseful($_SESSION["isBeta"])) {
                    $_SESSION["isBeta"] = false;
                }

                if ($dontEcho) {
                    return $dontEcho;
                }

                return $pInfo;
            } else {
                if ($dontEcho) {
                    return $dontEcho;
                }

                return "school:" . $_SESSION["school"];
            }
        } else {
            if ($dontEcho) {
                return !$dontEcho;
            }

            trigger_error("#error002", E_USER_ERROR);
        }
    }

    public static function SaveLogin($school, $id = null, $password = null)
    {
        $usertest = DB_Query::AskDB(STANDARDDATABASE, "Select * from login_users where username= ?;", $school . $id);

        if (count($usertest) > 0) {
            $encryptKey = $usertest[0]["encryptKey"];
            MySecure::SetCookie("school", $school);
            MySecure::SetCookie("id", $id);
            MySecure::SetCookie("password", MySecure::Encrypt($password, $encryptKey));
        } else {
            $encryptKey = MySecure::MakeCode();
            DB_Query::AskDB(STANDARDDATABASE, "Insert into login_users values(null,?,?,null);", $school . $id, $encryptKey);
            MySecure::SetCookie("school", $school);
            MySecure::SetCookie("id", $id);
            MySecure::SetCookie("password", MySecure::Encrypt($password, $encryptKey));
        }
    }

    public static function Logout()
    {
        setcookie("school", "", time() - 3600, "/");
        setcookie("id", "", time() - 3600, "/");
        setcookie("password", "", time() - 3600, "/");
        if (session_status() != PHP_SESSION_NONE) {
            session_destroy();
            session_start();
            $_SESSION["timeoutVar"] = "set";
        }
    }

    public static function CookieLogin()
    {
        DB_Query::AskDB(STANDARDDATABASE, "DELETE from login_users where lastEdit < DATE_SUB(NOW(), INTERVAL 5 YEAR)");
        if (!BasicTools::IsSenseful($_COOKIE["school"])) {
            return false;
        }

        if (!BasicTools::IsSenseful($_COOKIE["id"]) || !BasicTools::IsSenseful($_COOKIE["password"])) {
            return self::TryLogin(null, null, MySecure::ReadCookie("school"), true, true);
        }

        $res = DB_Query::AskDB(STANDARDDATABASE, "Select * from login_users where username= ?;", MySecure::ReadCookie("school") . MySecure::ReadCookie("id"));

        if (!count($res) > 0) {
            return false;
        }
        $pw = MySecure::Decrypt(MySecure::ReadCookie("password"), $res[0]["encryptKey"]);

        if (strtolower(MySecure::ReadCookie("school")) == "emp") {
            if (MySecure::EmpLogin(MySecure::ReadCookie("id"), $pw)) {
                self::SaveLogin(MySecure::ReadCookie("school"), MySecure::ReadCookie("id"), $pw);
                return true;
            }
        }
        return self::TryLogin(MySecure::ReadCookie("id"), $pw, MySecure::ReadCookie("school"), true, true);
    }
}
