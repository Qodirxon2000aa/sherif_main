<?php
/**
 * gift_order.php — frontend (Mini App) bilan mos: faqat bitta toza JSON chiqadi.
 * Serverda `uzbstar/gift_order.php` o‘rniga qo‘ying yoki mavjud faylni shu mantiq bilan yangilang.
 */

ob_start();

/** Bufferdagi barcha “noise”ni tashlab, faqat JSON chiqaradi */
function gift_order_json_response(array $payload, int $httpCode = 200): void
{
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
    http_response_code($httpCode);
    header('Content-Type: application/json; charset=utf-8');

    $flags = JSON_UNESCAPED_UNICODE;
    if (defined('JSON_INVALID_UTF8_SUBSTITUTE')) {
        $flags |= JSON_INVALID_UTF8_SUBSTITUTE;
    }

    $json = json_encode($payload, $flags);
    if ($json === false) {
        $fallback = [
            'ok' => false,
            'status' => 'failed',
            'message' => 'JSON encode error',
        ];
        $json = json_encode($fallback, JSON_UNESCAPED_UNICODE);
    }

    echo $json;
    exit;
}

function gift_order_discard_buffer_and_exit(): void
{
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
    exit;
}

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    gift_order_discard_buffer_and_exit();
}

error_reporting(0);
date_default_timezone_set('Asia/Tashkent');

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/../StarsBot/function.php';

$week = trim((string) file_get_contents(__DIR__ . '/../StarsBot/admin/week.txt'));

// ====================== LOG FUNKSIYASI ======================
function writeGiftLog($message, $data = null)
{
    $logFile = __DIR__ . '/gift_logs.txt';
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[{$timestamp}] {$message}";
    if ($data !== null) {
        $logMessage .= "\n" . json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }
    $logMessage .= "\n" . str_repeat('-', 80) . "\n";
    @file_put_contents($logFile, $logMessage, FILE_APPEND);
}

// ====================== INPUT ======================
$input = file_get_contents('php://input');
writeGiftLog('=== INPUT REQUEST ===', [
    'method' => $_SERVER['REQUEST_METHOD'] ?? '',
    'raw_input' => $input,
    'headers' => function_exists('getallheaders') ? getallheaders() : [],
]);

$data = json_decode($input, true);
writeGiftLog('Decoded JSON data', $data);

if (!isset($data['initData']) || $data['initData'] === '' || $data['initData'] === null) {
    writeGiftLog('ERROR: initData missing');
    gift_order_json_response([
        'ok' => false,
        'status' => 'failed',
        'message' => 'initData is required',
    ]);
}

$initData = $data['initData'];

// ====================== VALIDATION (Telegram initData) ======================
function validateTelegramWebAppData($initData, $botToken)
{
    parse_str($initData, $params);

    if (!isset($params['hash'])) {
        return false;
    }

    $receivedHash = $params['hash'];
    unset($params['hash']);
    ksort($params);

    $dataCheckArray = [];
    foreach ($params as $key => $value) {
        $dataCheckArray[] = $key . '=' . $value;
    }
    $dataCheckString = implode("\n", $dataCheckArray);

    $secretKey = hash_hmac('sha256', $botToken, 'WebAppData', true);
    $calculatedHash = hash_hmac('sha256', $dataCheckString, $secretKey, true);

    return hash_equals($calculatedHash, hex2bin($receivedHash));
}

$isValid = validateTelegramWebAppData($initData, $bot_token);
writeGiftLog('InitData validation result', ['is_valid' => $isValid]);

if (!$isValid) {
    writeGiftLog('ERROR: Invalid initData');
    gift_order_json_response([
        'ok' => false,
        'status' => 'failed',
        'message' => 'Invalid initData. Authentication failed.',
    ]);
}

// ====================== USER_ID ======================
parse_str($initData, $params);
if (!isset($params['user'])) {
    writeGiftLog('ERROR: User data not found in initData');
    gift_order_json_response([
        'ok' => false,
        'status' => 'failed',
        'message' => 'User data not found in initData',
    ]);
}

$userData = json_decode($params['user'], true);
$user_id = isset($userData['id']) ? (int) $userData['id'] : 0;
writeGiftLog('User ID extracted', ['user_id' => $user_id, 'user_data' => $userData]);

if ($user_id <= 0) {
    writeGiftLog('ERROR: Invalid user_id');
    gift_order_json_response([
        'ok' => false,
        'status' => 'failed',
        'message' => 'Invalid user_id',
    ]);
}

// ====================== PARAMETRLAR ======================
$gift_id = isset($data['gift_id']) ? (int) $data['gift_id'] : 0;
$username = isset($data['username']) ? trim((string) $data['username']) : '';
$comment = isset($data['comment']) ? trim((string) $data['comment']) : '';
$anonim = (isset($data['anonim']) && $data['anonim'] === 'true') ? 'true' : 'false';

writeGiftLog('Request parameters', [
    'gift_id' => $gift_id,
    'username' => $username,
    'comment' => $comment,
    'anonim' => $anonim,
]);

if ($gift_id <= 0 || $username === '') {
    writeGiftLog('ERROR: Missing required parameters');
    gift_order_json_response([
        'ok' => false,
        'status' => 'failed',
        'message' => 'Missing parameters (gift_id and username required)',
    ]);
}

$user_id_safe = (int) $user_id;
$gift_id_safe = (int) $gift_id;
$username_esc = mysqli_real_escape_string($connect, $username);

// ====================== NARX / MIQDOR (info.php) ======================
$info = json_decode((string) file_get_contents('https://tezpremium.uz/MilliyDokon/gifts/info.php'), true);
writeGiftLog('Gift info API response', $info);

$overall = 0;
$amount = 0;
if (isset($info['gifts']) && is_array($info['gifts'])) {
    foreach ($info['gifts'] as $gift) {
        if (isset($gift['id']) && (int) $gift['id'] === $gift_id_safe) {
            $overall = isset($gift['price']) ? (float) $gift['price'] : 0;
            $amount = isset($gift['amount']) ? $gift['amount'] : 0;
            break;
        }
    }
}

writeGiftLog('Gift price and amount', [
    'gift_id' => $gift_id_safe,
    'price' => $overall,
    'amount' => $amount,
]);

if ($overall == 0) {
    writeGiftLog('ERROR: Gift price not found');
    gift_order_json_response([
        'ok' => false,
        'status' => 'failed',
        'message' => 'Gift price not found',
    ]);
}

// ====================== BALANS ======================
$user_balance_query = mysqli_query($connect, "SELECT `balance` FROM `users` WHERE `user_id` = '$user_id_safe' LIMIT 1");
$user_balance_row = mysqli_fetch_assoc($user_balance_query);

if (!$user_balance_row) {
    writeGiftLog('ERROR: User not found in database', ['user_id' => $user_id_safe]);
    gift_order_json_response(['ok' => false, 'message' => 'User not found']);
}

$current_balance = (float) $user_balance_row['balance'];
writeGiftLog('User balance check', [
    'user_id' => $user_id_safe,
    'current_balance' => $current_balance,
    'required' => $overall,
]);

if ($current_balance < $overall) {
    writeGiftLog('ERROR: Insufficient balance', [
        'user_id' => $user_id_safe,
        'current_balance' => $current_balance,
        'required' => $overall,
    ]);
    gift_order_json_response(['ok' => false, 'message' => 'Insufficient balance']);
}

// ====================== TASHQI API ======================
$api = 'https://multinet.uz/testpy/send?username=' . urlencode($username)
    . '&gift_id=' . $gift_id_safe
    . '&comment=' . urlencode($comment)
    . '&anonim=' . $anonim;

writeGiftLog('Calling external API', ['api_url' => $api]);

$ch = curl_init($api);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 20,
]);
$response = curl_exec($ch);

writeGiftLog('External API response', [
    'raw_response' => $response,
    'curl_error' => curl_error($ch),
]);

if ($response === false) {
    writeGiftLog('ERROR: API not responding');
    gift_order_json_response([
        'ok' => false,
        'status' => 'failed',
        'message' => 'Gifts API not responding',
    ]);
}

$api_data = json_decode((string) $response, true);
writeGiftLog('API decoded response', $api_data);

if (!$api_data || empty($api_data['ok'])) {
    writeGiftLog('ERROR: Gift send failed', $api_data);
    gift_order_json_response([
        'ok' => false,
        'status' => 'failed',
        'message' => 'Gift send failed',
        'api' => is_array($api_data) ? $api_data : null,
    ]);
}

// ====================== SANA ======================
$date = date('d.m.Y');
$time = date('H:i');
$last = "$date | $time";
$month = date('m');

// ====================== ORDER ======================
$amount_sql = mysqli_real_escape_string($connect, (string) $amount);
$overall_sql = mysqli_real_escape_string($connect, (string) $overall);

$q = $connect->query(
    "INSERT INTO orders (`user_id`, `amount`, `sent`, `status`, `date`, `turi`, `umumiy`) VALUES ('$user_id_safe', '$amount_sql', '$username_esc', 'Successful', '" . mysqli_real_escape_string($connect, $last) . "', 'Stars Gift', '$overall_sql')"
);

if (!$q) {
    writeGiftLog('ERROR: Order insert failed', ['mysql_error' => mysqli_error($connect)]);
    gift_order_json_response([
        'ok' => false,
        'status' => 'failed',
        'message' => 'Insert failed',
    ]);
}

$order_id = (int) $connect->insert_id;
writeGiftLog('Order created', ['order_id' => $order_id]);

// ====================== HISOBOT ======================
$hisobot = mysqli_fetch_assoc(mysqli_query($connect, "SELECT * FROM `hisobot` WHERE `sana` = '" . mysqli_real_escape_string($connect, $date) . "' LIMIT 1"));

if (!$hisobot) {
    mysqli_query(
        $connect,
        "INSERT INTO `hisobot` (`sana`, `summa`, `foyda`, `soat`, `month`) VALUES ('" . mysqli_real_escape_string($connect, $date) . "', '0', '0', '" . mysqli_real_escape_string($connect, $time) . "', '" . mysqli_real_escape_string($connect, $month) . "')"
    );
    $mavjud_aylanma = 0;
    writeGiftLog('New hisobot entry created', ['date' => $date]);
} else {
    $mavjud_aylanma = (float) $hisobot['summa'];
    writeGiftLog('Existing hisobot found', ['current_summa' => $mavjud_aylanma]);
}

$aylanmamiz = $mavjud_aylanma + $overall;
mysqli_query(
    $connect,
    "UPDATE `hisobot` SET `summa` = '" . mysqli_real_escape_string($connect, (string) $aylanmamiz) . "' WHERE `sana` = '" . mysqli_real_escape_string($connect, $date) . "'"
);

writeGiftLog('Hisobot updated', [
    'previous_summa' => $mavjud_aylanma,
    'new_summa' => $aylanmamiz,
]);

// ====================== BALANS ======================
$new_balance = $current_balance - $overall;
$update_balance = mysqli_query(
    $connect,
    "UPDATE `users` SET `balance` = '" . mysqli_real_escape_string($connect, (string) $new_balance) . "' WHERE `user_id` = '$user_id_safe'"
);

writeGiftLog('Balance updated', [
    'user_id' => $user_id_safe,
    'old_balance' => $current_balance,
    'new_balance' => $new_balance,
    'deducted' => $overall,
]);

if (!$update_balance) {
    writeGiftLog('ERROR: Failed to update balance', ['mysql_error' => mysqli_error($connect)]);
    gift_order_json_response(['ok' => false, 'message' => 'Failed to update balance']);
}

// ====================== HISTORY ======================
$res = mysqli_query($connect, "SELECT * FROM `history` WHERE `user_id` = '$user_id_safe' LIMIT 1");
$row = mysqli_fetch_assoc($res);

if (!$row) {
    mysqli_query(
        $connect,
        "INSERT INTO history (`user_id`, `payments`, `stars`, `premium`, `actives`, `last`) VALUES ('$user_id_safe', '$overall_sql', '$amount_sql', '0', '1', '" . mysqli_real_escape_string($connect, $last) . "')"
    );
    writeGiftLog('New history entry created', ['user_id' => $user_id_safe]);
} else {
    $jami = (float) $row['stars'] + (float) $amount;
    $jami1 = (float) $row['payments'] + $overall;
    mysqli_query(
        $connect,
        "UPDATE `history` SET `payments` = '" . mysqli_real_escape_string($connect, (string) $jami1) . "', `stars` = '" . mysqli_real_escape_string($connect, (string) $jami) . "', `last` = '" . mysqli_real_escape_string($connect, $last) . "', `actives` = actives + 1 WHERE `user_id` = '$user_id_safe'"
    );
    writeGiftLog('History updated', [
        'user_id' => $user_id_safe,
        'new_total_payments' => $jami1,
        'new_total_stars' => $jami,
    ]);
}

// ====================== WEEKLY ======================
$week_esc = mysqli_real_escape_string($connect, $week);
$res1 = mysqli_query($connect, "SELECT * FROM `weekly` WHERE `user_id` = '$user_id_safe' AND `week` = '$week_esc' LIMIT 1");
$row1 = mysqli_fetch_assoc($res1);

if (!$row1) {
    mysqli_query(
        $connect,
        "INSERT INTO `weekly` (`user_id`, `week`, `summa`, `harid`) VALUES ('$user_id_safe', '$week_esc', '$overall_sql', '$amount_sql')"
    );
    writeGiftLog('New weekly entry created', ['user_id' => $user_id_safe, 'week' => $week]);
} else {
    $summa = (float) $row1['summa'] + $overall;
    $harid = (float) $row1['harid'] + (float) $amount;
    mysqli_query(
        $connect,
        "UPDATE `weekly` SET `summa` = '" . mysqli_real_escape_string($connect, (string) $summa) . "', `harid` = '" . mysqli_real_escape_string($connect, (string) $harid) . "' WHERE `user_id` = '$user_id_safe' AND `week` = '$week_esc'"
    );
    writeGiftLog('Weekly updated', [
        'user_id' => $user_id_safe,
        'week' => $week,
        'new_summa' => $summa,
        'new_harid' => $harid,
    ]);
}

// ====================== ADMIN ======================
$settings = mysqli_fetch_assoc(mysqli_query($connect, 'SELECT * FROM `settings` WHERE `id` = 1 LIMIT 1'));
$proof = $settings['logs'] ?? null;
$sent = sent($username);

$admin_message = "<tg-emoji emoji-id='5848021027782661221'>🌟</tg-emoji> <b>Buyurtma <code>#$order_id</code>\n\n<tg-emoji emoji-id='5208468047714600000'>👤</tg-emoji> Qabul qiluvchi: $sent\n<tg-emoji emoji-id='5942783678668085067'>⭐️</tg-emoji> Turi: Gift\n<tg-emoji emoji-id='5071491301443110142'>📊</tg-emoji> Miqdori: $amount stars\n<tg-emoji emoji-id='5472027899789843495'>💰</tg-emoji> Narxi: $overall so'm\n<tg-emoji emoji-id='5382194935057372936'>⏱️</tg-emoji> Status: yuborilgan.</b>";

writeGiftLog('Sending admin notification', [
    'admin_chat' => $proof,
    'message' => $admin_message,
]);

if ($proof) {
    sms($proof, $admin_message);
}

// ====================== JAVOB (frontend bilan bir xil shakl) ======================
$final_response = [
    'ok' => true,
    'status' => 'success',
    'order_id' => $order_id,
    'api' => $api_data,
];

writeGiftLog('=== OUTPUT RESPONSE ===', $final_response);

gift_order_json_response($final_response);
