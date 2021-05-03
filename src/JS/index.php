<?php
require __DIR__ . "/../PHP/main.php";
header("Content-Type: application/javascript");
header("Cache-Control: max-age=86400, must-revalidate", true);
$script = "";
$comment = "//";
foreach (glob(BasicTools::CorrectRoot("/JS/*.js", false)) as $filename) {
    $script .= file_get_contents($filename) . "\n";
    $comment .= $filename . ", ";
}
foreach (glob(BasicTools::CorrectRoot("/JS/models/*.js", false)) as $filename) {
    $script .= file_get_contents($filename) . "\n";
    $comment .= $filename . ", ";
}
$comment .= "end  \n";
echo $comment . $script;
