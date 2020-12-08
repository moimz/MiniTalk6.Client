<?php
/**
 * 이 파일은 미니톡 클라이언트의 일부입니다. (https://www.minitalk.io)
 *
 * 미니톡 채팅위젯에서 사용될 모든 스타일시트를 불러온다.
 * 
 * @file /scripts/widget.css.php
 * @author Arzz (arzz@arzz.com)
 * @license MIT License
 * @version 6.4.0
 * @modified 2020. 12. 6.
 */
REQUIRE_ONCE str_replace(DIRECTORY_SEPARATOR.'styles'.DIRECTORY_SEPARATOR.'widget.css.php','',$_SERVER['SCRIPT_FILENAME']).'/configs/init.config.php';
header("Content-Type:text/css; charset=utf-8");

$channel = isset($_GET['channel']) == true ? $_GET['channel'] : null;
$templet = isset($_GET['templet']) == true ? $_GET['templet'] : null;
$languages = GetDefaultLanguages();
foreach ($languages as $language) {
	if (is_file(__MINITALK_PATH__.'/languages/'.$language.'.json') == true) break;
}

$minifier = new Minifier();
$css = $minifier->css();

$css->add(__MINITALK_PATH__.'/styles/fonts/moimz.css');

/**
 * 언어별 기본 웹폰트를 불러온다.
 */
if ($language == 'ko') {
	$css->add(__MINITALK_PATH__.'/styles/fonts/NanumSquare.css');
	$css->add('html, body {font-family:NanumSquare;}');
}

$css->add(__MINITALK_PATH__.'/styles/widget.css');

if ($templet !== null && is_file(__MINITALK_PATH__.'/templets/'.$templet.'/style.css') == true) {
	$css->add(__MINITALK_PATH__.'/templets/'.$templet.'/style.css');
}

/**
 * 플러그인을 불러온다.
 */
$pluginsPath = @opendir(__MINITALK_PATH__.'/plugins');
while ($plugin = @readdir($pluginsPath)) {
	if ($plugin != '.' && $plugin != '..' && is_dir(__MINITALK_PATH__.'/plugins/'.$plugin) == true) {
		if (is_file(__MINITALK_PATH__.'/plugins/'.$plugin.'/plugin.css') == true) {
			$css->add(__MINITALK_PATH__.'/plugins/'.$plugin.'/plugin.css');
		}
	}
}
@closedir($pluginsPath);

if (strpos($templet,'@') === 0) {
	if (is_dir(__MINITALK_PATH__.'/plugins/'.substr($templet,1)) == true && is_file(__MINITALK_PATH__.'/plugins/'.substr($templet,1).'/channel.css') == true) {
		$css->add(__MINITALK_PATH__.'/plugins/'.substr($templet,1).'/channel.css');
	}
}
?>
/**
 * 이 파일은 미니톡 클라이언트의 일부입니다. (https://www.minitalk.io)
 *
 * 미니톡 채팅위젯에서 사용될 모든 스타일시트를 불러온다.
 * 
 * @file /scripts/widget.css.php
 * @author Arzz (arzz@arzz.com)
 * @license MIT License
 * @version 6.4.0
 * @modified 2020. 12. 6.
 */
<?php echo $css->minify(__MINITALK_PATH__.'/styles'); ?>