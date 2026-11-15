# Makes the web copies of the photos listed in src/_data/photos.json, from the
# originals in private/documents/photos/ (which never leave this computer).
#
# For each photo it writes two sizes to src/assets/img/photos/:
#   <file>-800.jpg   for the grid on the Photos page
#   <file>-1600.jpg  opened when someone clicks a photo
# The copies are drawn fresh, so nothing from the phone comes along: no
# location, no camera details, no date. Photos not listed in photos.json are
# never copied, even if their original is in the folder.
#
# Run from the repo folder after changing photos.json (Windows only):
#   powershell -File scripts/make-photos.ps1

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$src = Join-Path $root "private\documents\photos"
$out = Join-Path $root "src\assets\img\photos"
New-Item -ItemType Directory -Force $out | Out-Null

$data = Get-Content (Join-Path $root "src\_data\photos.json") -Raw -Encoding UTF8 | ConvertFrom-Json
$files = @($data.groups | ForEach-Object { $_.photos } | ForEach-Object { $_.file })

$jpeg = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$params = New-Object System.Drawing.Imaging.EncoderParameters 1
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality, [long]80)

foreach ($name in $files) {
  $from = Join-Path $src "$name.jpg"
  if (-not (Test-Path $from)) { throw "Missing original: private/documents/photos/$name.jpg" }
  $img = [System.Drawing.Image]::FromFile($from)
  try {
    # Phones often save a photo sideways plus a note saying which way is up.
    if ($img.PropertyIdList -contains 0x0112) {
      switch ($img.GetPropertyItem(0x0112).Value[0]) {
        3 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone) }
        6 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }
        8 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone) }
      }
    }
    foreach ($size in 800, 1600) {
      $scale = [Math]::Min([double]1, [double]$size / [Math]::Max($img.Width, $img.Height))
      $w = [int][Math]::Round($img.Width * $scale); $h = [int][Math]::Round($img.Height * $scale)
      $bmp = New-Object System.Drawing.Bitmap $w, $h
      $g = [System.Drawing.Graphics]::FromImage($bmp)
      $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $g.DrawImage($img, 0, 0, $w, $h)
      $g.Dispose()
      $bmp.Save((Join-Path $out "$name-$size.jpg"), $jpeg, $params)
      $bmp.Dispose()
    }
    Write-Output "Wrote $name ($($img.Width)x$($img.Height) original)"
  } finally { $img.Dispose() }
}

# Remove web copies of photos no longer listed.
Get-ChildItem $out -Filter *.jpg | Where-Object { $files -notcontains ($_.BaseName -replace '-(800|1600)$', '') } | ForEach-Object {
  Remove-Item $_.FullName; Write-Output "Removed $($_.Name)"
}
