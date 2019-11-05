<?php

// Please note that this script is only for demo, for production we suggest to check file type, file size and others on server for security

$target_dir = "uploads/";
$target_file = $target_dir . basename($_FILES["file"]["name"]);

move_uploaded_file($_FILES["file"]["tmp_name"], $target_file);

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $target_file);
finfo_close($finfo);

$arr = [
    'file_name' => basename($_FILES["file"]["name"]),
    'file_size' => filesize($target_file),
    'file_type' => $mime,
    'file_thumbnail' =>  in_array(explode('/', $mime)[1], ['png', 'jpg', 'jpeg']) ? getBaseUrl() . $target_file : ''
];

function getBaseUrl() 
{
    $currentPath 	= $_SERVER['PHP_SELF'];
    $pathInfo 		= pathinfo($currentPath); 
    $hostName 		= $_SERVER['HTTP_HOST'];
    $protocol 		= strtolower(substr($_SERVER["SERVER_PROTOCOL"], 0, 5)) == 'https://' ? 'https://' : 'http://';
    return $protocol . $hostName . $pathInfo['dirname'] . "/";
}

echo json_encode($arr);