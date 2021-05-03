<?php

/**
 *  Copyright ©2018
 *  Written by:
 *  Maximilian Mayrhofer
 *  Wendelin Muth
 */
class EasyCurl
{
    private static $curl = null;

    public static function AskCurl($url, $post = null)
    {
        if (null == self::$curl) {
            self::MakeCurlInstance();
        }
        if (null != $post) {
            curl_setopt(self::$curl, CURLOPT_POST, true);
            curl_setopt(self::$curl, CURLOPT_POSTFIELDS, $post);
            curl_setopt(self::$curl, CURLOPT_COOKIEFILE, BasicTools::CorrectRoot("/LOG/cookies.txt", false));
            curl_setopt(self::$curl, CURLOPT_COOKIEJAR, BasicTools::CorrectRoot("/LOG/cookies.txt", false));
        }
        curl_setopt(self::$curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt(self::$curl, CURLOPT_URL, $url);
        return curl_exec(self::$curl);
    }

    private static function MakeCurlInstance()
    {
        self::$curl = curl_init();
    }
}
