<?php

// Please note that this script is only for demo purpose, for production we suggest to save file name in database rather than scan directory

$dir = "uploads/";
$a = scandir($dir);
$b = scandir($dir, 1);
$page = $_GET['page'];
$files_per_page = $_GET['files_per_page'];
$search = $_GET['search_file'];
$arr_new = [];

foreach ($b as $key => $file) {
	$finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $dir . $file);
    finfo_close($finfo);

	if ($mime != 'directory') {
		if (!empty($search)) {
			if (strpos($file, $search) !== false) {
				$arr_new[] = [
				    'file_name' => $file,
				    'file_size' => filesize($dir . $file),
				    'file_type' => $mime,
				    'file_thumbnail' =>  in_array(explode('/', $mime)[1], ['png', 'jpg', 'jpeg']) ? getBaseUrl() . $dir . $file : ''
				];
			}
		} else {
			$arr_new[] = [
			    'file_name' => $file,
			    'file_size' => filesize($dir . $file),
			    'file_type' => $mime,
			    'file_thumbnail' =>  in_array(explode('/', $mime)[1], ['png', 'jpg', 'jpeg']) ? getBaseUrl() . $dir . $file : ''
			];
		}
	}
}

$arr_paginated = array_slice($arr_new, (($page * $files_per_page) - $files_per_page), $files_per_page);

$arr = [
	'files' => $arr_paginated,
	'total' => count($arr_new)
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