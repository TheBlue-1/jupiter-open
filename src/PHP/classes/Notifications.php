<?php

/**
 *  Copyright ©2018
 *  Written by:
 *  Maximilian Mayrhofer
 *  Wendelin Muth
 */
class Notifications
{

    const SERVER_KEY = "key";
    const STANDARD_ICON = "/DATA/logo/logo256.png";

    private static function Notify($ids, $message, $options = array())
    {
        if (count($ids) === 0) {
            return;
        }
        if (!BasicTools::IsSenseful($options['notification']) || !BasicTools::IsSenseful($options['notification']['icon'])) {
            $message['icon'] = "https://" . $_SERVER["SERVER_NAME"] . self::STANDARD_ICON;
        }
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, "https://fcm.googleapis.com/fcm/send");
        curl_setopt($ch, CURLOPT_HTTPHEADER, array("Content-Type: application/json; charset=utf-8", "Authorization: key=" . self::SERVER_KEY));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HEADER, false);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        $options['notification'] = $message;
        foreach (array_chunk($ids, 1000) as $idsChunk) {
            $options['registration_ids'] = $idsChunk;
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($options));
            $response = curl_exec($ch);

            BasicTools::Log($response, "FCM");
        }
        curl_close($ch);
    }

    public static function TableChangeNotification($school, $date, $type, $id)
    {
        $qresult = DB_Query::AskDB(
            STANDARDDATABASE,
            "SELECT DISTINCT token FROM notification_clients
             JOIN notification_table ON notification_clients.timetable = notification_table.id
             JOIN notification_token ON clientId = notification_clients.id
             WHERE notification_table.ownerType = ? AND notification_table.school = ?
             AND userId <> ?",
            $type,
            $school,
            BasicTools::TestSessVar("userId")
        );
        $ids = array_map(function ($row) {
            return $row["token"];
        }, $qresult);

        switch ($type) {
            case 1:
                $type = "class";
                break;
            case 2:
                $type = "teacher";
                break;
            case 3:
                $type = "subject";
                break;
            case 4:
                $type = "room";
                break;
            case 5:
                $type = "student";
                break;
        }
        $date = strtotime($date);
        $bdate = date("d.m.Y", $date);
        $date = date("Ymd", $date);

        self::Notify($ids, array(
            "title" => "Stundenplanänderung",
            "body" => "Dein abonierter Stundenplan hat eine Änderung in der Woche vom $bdate",
            "click_action" => "https://$_SERVER[SERVER_NAME]/table/#date=$date&type=$type&id=$id"
        ));
    }

    public static function ReviewNotfication($type, $user)
    {
        $qresult = DB_Query::AskDB(
            STANDARDDATABASE,
            "SELECT DISTINCT token FROM notification_clients 
             JOIN login_extraordinaries ON notification_clients.school = login_extraordinaries.school AND notification_clients.userId = login_extraordinaries.userId
             JOIN notification_token ON clientId = notification_clients.id"
        );
        $ids = array_map(function ($row) {
            return $row["token"];
        }, $qresult);
        self::Notify(
            $ids,
            array(
                "title" => "Jupiter Review Reminder",
                "body" => "Ein $type wurde von $user gemeldet!\nBitte schau es dir an.",
                "click_action" => "https://$_SERVER[SERVER_NAME]/review",
            )
        );
    }

    public static function SchoolUpdateNotfication()
    {
        $qresult = DB_Query::AskDB(
            STANDARDDATABASE,
            "SELECT DISTINCT token FROM notification_clients
             JOIN notification_token ON clientId = id
             WHERE school = ?",
            BasicTools::TestSessVar("school")
        );
        $ids = array_map(function ($row) {
            return $row["token"];
        }, $qresult);
        self::Notify($ids, array(
            "title" => "Stundenplanänderung",
            "body" => "Deine Schule hat etwas an deinem Stundenplan geändert.",
            "click_action" => "https://$_SERVER[SERVER_NAME]/table/",
        ));
    }

    public static function WelcomeNotification($token)
    {
        self::Notify(array($token), array(
            "title" => "Benachrichtigungen aktiviert",
            "body" => "Danke, dass du Benachrichtigungen aktiviert hast.",
            "click_action" => "https://$_SERVER[SERVER_NAME]/",
        ));
    }
}
