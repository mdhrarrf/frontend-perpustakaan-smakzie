<?php
/**
 * Hostinger PHP API Proxy
 * Mengarahkan request API dari library.smkn1cianjur.sch.id ke backend Laravel
 * tanpa terkena batasan mod_proxy / error 503 pada Hostinger LiteSpeed Shared Hosting.
 */

$backendBase = 'http://be-smakzie.jh-beon.cloud';

// CORS Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Authorization, Content-Type, Accept, X-Requested-With');
    header('Access-Control-Max-Age: 86400');
    exit(0);
}

// Ambil path request asli
$requestUri = $_SERVER['REQUEST_URI'];
$targetUrl = $backendBase . $requestUri;
$method = $_SERVER['REQUEST_METHOD'];

// Kumpulkan request headers dari client
$headers = [];
$incomingHeaders = function_exists('getallheaders') ? getallheaders() : [];
foreach ($incomingHeaders as $name => $value) {
    $lower = strtolower($name);
    // Lewatkan header host dan content-length agar dihitung ulang otomatis oleh cURL
    if (in_array($lower, ['host', 'content-length'])) {
        continue;
    }
    $headers[] = "$name: $value";
}

$ch = curl_init($targetUrl);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_TIMEOUT, 60);

// Forward response headers ke browser
curl_setopt($ch, CURLOPT_HEADERFUNCTION, function ($curl, $header) {
    $len = strlen($header);
    $parts = explode(':', $header, 2);
    if (count($parts) >= 2) {
        $headerName = strtolower(trim($parts[0]));
        if (!in_array($headerName, ['transfer-encoding', 'content-length', 'connection', 'keep-alive'])) {
            header($header, false);
        }
    }
    return $len;
});

// Tangani body request (POST, PUT, PATCH, DELETE)
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';

if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'])) {
    if (stripos($contentType, 'multipart/form-data') !== false) {
        $postData = $_POST;
        foreach ($_FILES as $fileKey => $file) {
            if (!empty($file['tmp_name']) && file_exists($file['tmp_name'])) {
                $postData[$fileKey] = new CURLFile($file['tmp_name'], $file['type'], $file['name']);
            }
        }
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    } else {
        $body = file_get_contents('php://input');
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
}

$response = curl_exec($ch);

if ($response === false) {
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Gagal menghubungi backend: ' . curl_error($ch)
    ]);
    curl_close($ch);
    exit;
}

$statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

http_response_code($statusCode);
header('Access-Control-Allow-Origin: *');
echo $response;
