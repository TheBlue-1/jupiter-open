<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

require __DIR__ . "../main.php";

if (BasicTools::IsSenseful($_GET["keywords"])) {
    $url = "https://www.google.at/search?q=" . str_replace(" ", "%20", $_GET["keywords"]);
} else {
    die('
<script src="/JS/api/jquery-3.4.1.js"></script><h1>jptr test</h1>   <input type="text" id="keywords">
<button id ="btn" onclick="onBtnClick()">Position abfragen</button>
<script>
function onBtnClick(){
$("#btn").text("läuft...");
var words=$("#keywords").val();
$.ajax({
    url: "/PHP/testGooglePosition.php?keywords="+words.replace(" ","+"),
    method: "GET",
    success: function(data) {
        $("#ans").text(data);
$("#btn").text("Position abfragen");
    },
    error: function(data) {
        $("#ans").text(data);
$("#btn").text("Position abfragen");
    }
});

}
</script><div style="width:100%;height:10px;background-color:gray;"></div><div id="ans"></div>');
}

$pos = 0;
for ($site = 0; $site < 1000; $site += 10) {
    $res = EasyCurl::AskCurl($url . "&start=" . $site);
    $ans = array();
    if (strpos($res, "302 Moved") !== false) {
        die("blocked(ls: $site)");
    }

    preg_match_all('/<h3 class="r"><a href="\/url\?q=(.*?)&/', $res, $ans);
    foreach ($ans[1] as $link) {
        if (strpos($link, "jptr") || strpos($link, "yptr")) {
            die("found on position " . ($pos + 1) . $res);
        } else {
            $pos++;
        }
    }
}
echo "nicht in den ersten 100 Seiten!";
