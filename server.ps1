param([int]$port = 8765)
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Prefixes.Add("http://127.0.0.1:$port/")
try {
    $listener.Start()
    Write-Host "HTTP Server listening on http://localhost:$port/"
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $req = $context.Request
        $res = $context.Response
        $localPath = $req.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($localPath)) { $localPath = 'index.html' }
        $fullPath = Join-Path $PSScriptRoot $localPath.Replace('/', '\')
        if (Test-Path $fullPath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($fullPath)
            $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
            $mime = switch ($ext) {
                '.html' { 'text/html; charset=utf-8' }
                '.js'   { 'application/javascript; charset=utf-8' }
                '.css'  { 'text/css; charset=utf-8' }
                '.json' { 'application/json; charset=utf-8' }
                '.png'  { 'image/png' }
                '.jpg'  { 'image/jpeg' }
                '.wav'  { 'audio/wav' }
                '.mp3'  { 'audio/mpeg' }
                default { 'application/octet-stream' }
            }
            $res.ContentType = $mime
            $res.ContentLength64 = $bytes.Length
            $res.AddHeader("Cache-Control", "no-cache, no-store, must-revalidate")
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $res.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
            $res.OutputStream.Write($msg, 0, $msg.Length)
        }
        $res.OutputStream.Close()
    }
} finally {
    $listener.Stop()
}
