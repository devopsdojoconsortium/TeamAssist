<?php
error_reporting(0);
// THIS FILE IS FOR SSO INTEGRATION VIA SITEMINDER, AND IT ASSUMES A USERS EID SECURED IN SITEMINDER HEADER IS SUFFICIENT
// FOR AUTHENTICATION AND UNIQUE ACCESS. 

// USE / ADAPT / DEBUG AS IT FITS FOR YOUR PURPOSES. 
// ====> DO NOT POST SECURITY-SENSITIVE DATA BACK TO OSS REPO <====

// NO WARRANTY IMPLIED 

// print_r(get_browser(null, true));
// phpinfo();
// Step-1: Extract JSON payload object of needed vars for EventStore
$SSOHeaders = array();
$SSOMap = array("EID" => "employeeId", "eid" => "eid", "FirstName" => "firstName",
  "LastName" => "lastName", "Email" => "email");
// https://techpatterns.com/downloads/scripts/browser_detection_php_ar.txt
$devObj = array(
  "EID" => "959000",
  "eid" => "x123424",
  "FirstName" => "Eric",
  "LastName" => "Tester",
  "Email" => "devCrew@cg.com"
);

$cookie_name = "ttID";
$days = 1;
$HTTP_Headers = preg_match("/domain.com/", $_SERVER['HTTP_HOST']) ? getallheaders() : $devObj; //getallheaders();
if(!$HTTP_Headers["EID"])
  $HTTP_Headers = $devObj;
if($_GET['idassume'] && $HTTP_Headers["eid"] == "VnotAUser") // QS AND already not accepted via SSO
  $HTTP_Headers = array(
    "EID" => "999000",
    "eid" => $_GET['idassume'],
    "FirstName" => "idassume User",
    "LastName" => "Testing",
    "Email" => "devCrew@cmp.com"
  );
  
$teamTrekID  = preg_replace("/\W+/", "" , crypt(strtolower($HTTP_Headers["eid"]), 'teamTrekIDCryptSalt'));
$curlStr = "";
// Step-2: If ttID cookie is not present, then do an HTTP POST to EventStore
if(!isset($_COOKIE[$cookie_name])) {

  foreach ($SSOMap as $key => $skey) {
    $SSOHeaders[$skey] = $HTTP_Headers[$key];
  }
  $SSOHeaders["eid"] = strtolower($SSOHeaders["eid"]); // need it lowercase!
  $SSOHeaders["eStamp"] = intval(time() / 60); // minuteStamp
  $SSOHeaders["ip"] = $_SERVER['REMOTE_ADDR'];
  //$SSOHeaders["uAgent"] = get_browser(null, true); // was string $_SERVER['HTTP_USER_AGENT']
  $SSOHeaders["uAgent"] = $_SERVER['HTTP_USER_AGENT'];
  $SSOUserInfoJson = json_encode($SSOHeaders);

  # SSL can be enabled or disabled so get the protocol that is in use
  # and use that one.
  $protocol = "http";
  # _SERVER["HTTPS"] is set to a non-empty value if the script was
  # queried through the HTTPS protocol.
  if($_SERVER["HTTPS"] != "")
    $protocol = "https";
  $esHostName = getenv('ES_HOST_NAME') || "localhost";
  //post user info to EventStore
  // -- TODO: Centralize EventStore settings (see also: src/uiConfig.js)
  $EvenStoreStreamURL = $protocol . '://' . $esHostName . ':2113/streams/session_' . $teamTrekID;
  if(strlen($esHostName) < 5 || preg_match("/localhost/", $_SERVER['HTTP_HOST'])) // for dev env only
    $EvenStoreStreamURL =  $protocol . '://localhost:2113/streams/session_' . $teamTrekID;
  // if(preg_match("/ditServerSession/i", $_SERVER['REQUEST_URI']))
  $curl_headers = array(
    'Content-Type: application/json',
    'Content-Length: ' . strlen($SSOUserInfoJson),
    'ES-EventType: SessionPosted',
    'ES-EventId: ' . UUID::v4()
  );
  $curlStr = 'curl -H "Accept: application/json" -H "' . join('" -H "', $curl_headers) . '" -X POST -d ';
  $curlStr .= "'" . $SSOUserInfoJson . "' " . $EvenStoreStreamURL;

  $curlResp = shell_exec($curlStr);
  // need error output to deal with.
}

setcookie($cookie_name, $teamTrekID, time() + $days * 86400, "/"); //reset the cookie

//echo "<br> RESPONSE:" . $curlResp; // = `curl -H "Accept: application/json" -H "Content-type: application/json" -X POST -d '{"id":100}' http://localhost/api/postJsonReader.do`
//if($curlStr)
  echo "<!--" . $_SERVER['REMOTE_ADDR'] . $_SERVER['HTTP_HOST'] . $esHostName . " )))  $curlStr  -->";

//phpinfo();

class UUID {
  public static function v3($namespace, $name) {
    if(!self::is_valid($namespace)) return false;

    // Get hexadecimal components of namespace
    $nhex = str_replace(array('-','{','}'), '', $namespace);

    // Binary Value
    $nstr = '';

    // Convert Namespace UUID to bits
    for($i = 0; $i < strlen($nhex); $i+=2) {
      $nstr .= chr(hexdec($nhex[$i].$nhex[$i+1]));
    }

    // Calculate hash value
    $hash = md5($nstr . $name);

    return sprintf('%08s-%04s-%04x-%04x-%12s',

      // 32 bits for "time_low"
      substr($hash, 0, 8),

      // 16 bits for "time_mid"
      substr($hash, 8, 4),

      // 16 bits for "time_hi_and_version",
      // four most significant bits holds version number 3
      (hexdec(substr($hash, 12, 4)) & 0x0fff) | 0x3000,

      // 16 bits, 8 bits for "clk_seq_hi_res",
      // 8 bits for "clk_seq_low",
      // two most significant bits holds zero and one for variant DCE1.1
      (hexdec(substr($hash, 16, 4)) & 0x3fff) | 0x8000,

      // 48 bits for "node"
      substr($hash, 20, 12)
    );
  }

  public static function v4() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',

      // 32 bits for "time_low"
      mt_rand(0, 0xffff), mt_rand(0, 0xffff),

      // 16 bits for "time_mid"
      mt_rand(0, 0xffff),

      // 16 bits for "time_hi_and_version",
      // four most significant bits holds version number 4
      mt_rand(0, 0x0fff) | 0x4000,

      // 16 bits, 8 bits for "clk_seq_hi_res",
      // 8 bits for "clk_seq_low",
      // two most significant bits holds zero and one for variant DCE1.1
      mt_rand(0, 0x3fff) | 0x8000,

      // 48 bits for "node"
      mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
  }

  public static function v5($namespace, $name) {
    if(!self::is_valid($namespace)) return false;

    // Get hexadecimal components of namespace
    $nhex = str_replace(array('-','{','}'), '', $namespace);

    // Binary Value
    $nstr = '';

    // Convert Namespace UUID to bits
    for($i = 0; $i < strlen($nhex); $i+=2) {
      $nstr .= chr(hexdec($nhex[$i].$nhex[$i+1]));
    }

    // Calculate hash value
    $hash = sha1($nstr . $name);

    return sprintf('%08s-%04s-%04x-%04x-%12s',

      // 32 bits for "time_low"
      substr($hash, 0, 8),

      // 16 bits for "time_mid"
      substr($hash, 8, 4),

      // 16 bits for "time_hi_and_version",
      // four most significant bits holds version number 5
      (hexdec(substr($hash, 12, 4)) & 0x0fff) | 0x5000,

      // 16 bits, 8 bits for "clk_seq_hi_res",
      // 8 bits for "clk_seq_low",
      // two most significant bits holds zero and one for variant DCE1.1
      (hexdec(substr($hash, 16, 4)) & 0x3fff) | 0x8000,

      // 48 bits for "node"
      substr($hash, 20, 12)
    );
  }

  public static function is_valid($uuid) {
    return preg_match('/^\{?[0-9a-f]{8}\-?[0-9a-f]{4}\-?[0-9a-f]{4}\-?'.
                      '[0-9a-f]{4}\-?[0-9a-f]{12}\}?$/i', $uuid) === 1;
  }
}

// Usage
// Named-based UUID.
//$v3uuid = UUID::v3('1546058f-5a25-4334-85ae-e68f2a44bbaf', 'SomeRandomString');
//$v5uuid = UUID::v5('1546058f-5a25-4334-85ae-e68f2a44bbaf', 'SomeRandomString');

// Pseudo-random UUID
//$v4uuid = UUID::v4();

?>
