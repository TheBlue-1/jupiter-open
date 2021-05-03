<?php

/**
 *  Copyright ©2018
 *  Written by:
 *  Maximilian Mayrhofer
 *  Wendelin Muth
 */
const STANDARDDATABASE = 0;
class DB_Query
{
    static function AskDB()
    {
        $db = func_get_arg(0);
        $statement = func_get_arg(1);
        if (func_num_args() < 3) {
            $var = array();
        } else
        if (is_array(func_get_arg(2))) {
            $var = func_get_arg(2);
        } else {
            $var = array();
            for ($i = 2; $i < func_num_args(); $i++) {
                $var[] = func_get_arg($i);
            }
        }
        try {
            switch ($db) {
                case 0:
                    $conn = self::OpenConn();
                    break;
                default:
                    trigger_error("#error005", E_USER_ERROR);
                    break;
            }
            $stmt = $conn->prepare($statement);
            if (false == $stmt) {
                trigger_error("#error018", E_USER_ERROR);
            }
            $dVarInfo = array();
            for ($i = 0; $i < count($var); $i++) {
                if (is_int($var[$i])) {
                    $var[$i] = (int) $var[$i];
                    $stmt->bindParam($i + 1, $var[$i], PDO::PARAM_INT);
                    $dVarInfo[$i] = "(int)";
                } else if (is_bool($var[$i])) {
                    $var[$i] = (bool) $var[$i];
                    $var[$i] = self::SecureParam($var[$i]);
                    $dVarInfo[$i] = "(bool)";
                } else if (is_null($var[$i])) {
                    $var[$i] = null;
                    $stmt->bindParam($i + 1, $var[$i], PDO::PARAM_NULL);
                    $dVarInfo[$i] = "(null)";
                } else {
                    $var[$i] = self::SecureParam($var[$i]);
                    $stmt->bindParam($i + 1, $var[$i]);
                    $dVarInfo[$i] = "(string)";
                }
            }
            $dStatementParts = explode("?", $statement);
            $dFullStmt = $dStatementParts[0];
            for ($i = 1; $i < count($dStatementParts); $i++) {
                $dFullStmt .= $var[$i - 1] . $dVarInfo[$i - 1] . $dStatementParts[$i];
            }

            BasicTools::Log("[Request]" . $dFullStmt, "d");
            $stmt->execute();
            if (false == $stmt) {
                trigger_error("#error018", E_USER_ERROR);
            }
            $res = $stmt->fetchAll(PDO::FETCH_ASSOC);
            BasicTools::Log("[Answer]" . json_encode($res), "d");
            $stmt = null;
            return $res;
        } catch (Exception $ex) {
            trigger_error("#error017", E_USER_ERROR);
        } finally {
            $conn = null;
        }
    }

    private static function OpenConn()
    {
        $conn = new PDO('db', 'un', 'pw');
        if (!$conn) {
            trigger_error("#error005", E_USER_ERROR);
        }
        return $conn;
    }

    private static function SecureParam($param)
    {
        return stripslashes(addslashes($param));
    }

    static function TestLength($text, $maxLength)
    {
        if (strlen($text) > $maxLength) {
            trigger_error("#error019|a", E_USER_ERROR);
        }
        return self::TestString($text);
    }

    static function TestString($text)
    {
        if (!BasicTools::IsSenseful($text)) {
            trigger_error("#error019|b", E_USER_ERROR);
        }
        if (strpos($text, "#") === 0) {
            trigger_error("#error019|c", E_USER_ERROR);
        }
        return $text;
    }
}
