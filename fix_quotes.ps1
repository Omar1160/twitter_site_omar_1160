$path = 'C:\Users\omari\Documents\Twitter Site\twitter_site_omar_1160\agency-site\src\app\app.html'
$content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

# Replace left and right curly double quotes with standard ASCII double quotes
$content = $content.Replace([char]8220, [char]34)  # U+201C left double quote
$content = $content.Replace([char]8221, [char]34)  # U+201D right double quote

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($path, $content, $utf8NoBom)
Write-Host "Done - quotes fixed!"
