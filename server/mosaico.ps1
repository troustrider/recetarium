param(
  [string]$Dir,
  [string]$Salida,
  [int]$Cols = 4,
  [int]$Celda = 220,
  [int]$Etiqueta = 26
)

Add-Type -AssemblyName System.Drawing

$files = Get-ChildItem -Path $Dir -Filter '*.jpg' | Sort-Object Name
if ($files.Count -eq 0) { Write-Output 'sin imagenes'; exit 1 }

$rows = [Math]::Ceiling($files.Count / $Cols)
$w = $Cols * $Celda
$h = $rows * ($Celda + $Etiqueta)

$bmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::White)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$font = New-Object System.Drawing.Font('Segoe UI', 9)
$brush = [System.Drawing.Brushes]::Black

for ($i = 0; $i -lt $files.Count; $i++) {
  $col = $i % $Cols
  $row = [Math]::Floor($i / $Cols)
  $x = $col * $Celda
  $y = $row * ($Celda + $Etiqueta)
  try {
    $img = [System.Drawing.Image]::FromFile($files[$i].FullName)
    $ratio = [Math]::Min($Celda / $img.Width, $Celda / $img.Height)
    $nw = [int]($img.Width * $ratio)
    $nh = [int]($img.Height * $ratio)
    $g.DrawImage($img, $x + ($Celda - $nw) / 2, $y + ($Celda - $nh) / 2, $nw, $nh)
    $img.Dispose()
  } catch {}
  $etq = [System.IO.Path]::GetFileNameWithoutExtension($files[$i].Name)
  $g.DrawString($etq, $font, $brush, $x + 4, $y + $Celda + 4)
}

$g.Dispose()
$bmp.Save($Salida, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$bmp.Dispose()
Write-Output "$($files.Count) imagenes -> $Salida"
