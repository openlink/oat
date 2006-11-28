<?php
	$q = '';
	if (isset($_GET['q'])) { $q = $_GET['q']; }
	$res = file_get_contents('http://www.google.com/search?q='.urlencode($q));
	$part = preg_match('/of about <b>([^<]+)<\/b>/',$res,$regs);
	$out = 0;
	if ($part) { $out = $regs[1]; }
	echo $out;
?>