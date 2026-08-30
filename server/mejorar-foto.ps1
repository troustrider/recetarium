param(
  [Parameter(Mandatory=$true)][string]$In,
  [Parameter(Mandatory=$true)][string]$Out,
  [int]$W = 1200,
  [int]$H = 900,
  [double]$Sat = 1.12,
  [double]$Con = 1.06,
  [double]$Bri = 0.02,
  [double]$Zoom = 1.0
)

Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Image]::FromFile($In)

# recorte centrado a la proporción pedida
$objetivo = $W / $H
$actual = $src.Width / $src.Height
if ($actual -gt $objetivo) {
  $ch = $src.Height
  $cw = [int]($src.Height * $objetivo)
} else {
  $cw = $src.Width
  $ch = [int]($src.Width / $objetivo)
}
if ($Zoom -gt 1.0) {
  $cw = [int]($cw / $Zoom)
  $ch = [int]($ch / $Zoom)
}
$cx = [int](($src.Width - $cw) / 2)
$cy = [int](($src.Height - $ch) / 2)
$rect = New-Object System.Drawing.Rectangle($cx, $cy, $cw, $ch)

$dst = New-Object System.Drawing.Bitmap($W, $H)
$g = [System.Drawing.Graphics]::FromImage($dst)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

# saturación + contraste + brillo en una sola matriz
$lr = 0.3086; $lg = 0.6094; $lb = 0.0820
$s = $Sat
$cm = New-Object System.Drawing.Imaging.ColorMatrix
$cm.Matrix00 = ((1 - $s) * $lr + $s) * $Con
$cm.Matrix01 = ((1 - $s) * $lr) * $Con
$cm.Matrix02 = ((1 - $s) * $lr) * $Con
$cm.Matrix10 = ((1 - $s) * $lg) * $Con
$cm.Matrix11 = ((1 - $s) * $lg + $s) * $Con
$cm.Matrix12 = ((1 - $s) * $lg) * $Con
$cm.Matrix20 = ((1 - $s) * $lb) * $Con
$cm.Matrix21 = ((1 - $s) * $lb) * $Con
$cm.Matrix22 = ((1 - $s) * $lb + $s) * $Con
$cm.Matrix33 = 1
$t = (1 - $Con) / 2 + $Bri
$cm.Matrix40 = $t; $cm.Matrix41 = $t; $cm.Matrix42 = $t; $cm.Matrix44 = 1

$ia = New-Object System.Drawing.Imaging.ImageAttributes
$ia.SetColorMatrix($cm)

$destRect = New-Object System.Drawing.Rectangle(0, 0, $W, $H)
$g.DrawImage($src, $destRect, $rect.X, $rect.Y, $rect.Width, $rect.Height, [System.Drawing.GraphicsUnit]::Pixel, $ia)
$g.Dispose()

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$params = New-Object System.Drawing.Imaging.EncoderParameters(1)
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 88)
$dst.Save($Out, $codec, $params)

$dst.Dispose()
$src.Dispose()
Write-Output "$([System.IO.Path]::GetFileName($Out)) $W x $H"
