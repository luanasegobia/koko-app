# Deja el proyecto Android listo: íconos a partir de docs/logos/koko.png y
# permisos de ubicación (sin ellos "Usar mi ubicación" falla dentro de la app).
# La carpeta android/ no está en git: correr esto después de `npx cap add android`.
#   powershell -ExecutionPolicy Bypass -File scripts/preparar-android.ps1
Add-Type -AssemblyName System.Drawing

$raiz = Split-Path -Parent $PSScriptRoot
$res = Join-Path $raiz 'android\app\src\main\res'
$logo = [System.Drawing.Image]::FromFile((Join-Path $raiz 'docs\logos\koko.png'))
$fondo = [System.Drawing.Color]::FromArgb(255, 254, 254, 254)

# lienzo: tamaño del PNG; escala: cuánto del lienzo ocupa el logo; redondo: recorta en círculo.
function Dibujar([string]$ruta, [int]$lienzo, [double]$escala, [bool]$redondo) {
  $bmp = New-Object System.Drawing.Bitmap $lienzo, $lienzo
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = 'HighQualityBicubic'
  $g.SmoothingMode = 'AntiAlias'
  $g.PixelOffsetMode = 'HighQuality'
  $g.Clear([System.Drawing.Color]::Transparent)
  if ($redondo) {
    $circulo = New-Object System.Drawing.Drawing2D.GraphicsPath
    $circulo.AddEllipse(0, 0, $lienzo, $lienzo)
    $g.FillPath((New-Object System.Drawing.SolidBrush $fondo), $circulo)
    $g.SetClip($circulo)
  } else {
    $g.Clear($fondo)
  }
  $lado = [int]($lienzo * $escala)
  $margen = [int](($lienzo - $lado) / 2)
  $g.DrawImage($logo, $margen, $margen, $lado, $lado)
  $g.Dispose()
  $bmp.Save($ruta, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

# Densidad => tamaño del ícono clásico (48dp) y del frente adaptable (108dp).
$densidades = @{ mdpi = 1; hdpi = 1.5; xhdpi = 2; xxhdpi = 3; xxxhdpi = 4 }
foreach ($d in $densidades.Keys) {
  $carpeta = Join-Path $res "mipmap-$d"
  $f = $densidades[$d]
  Dibujar (Join-Path $carpeta 'ic_launcher.png') ([int](48 * $f)) 1.0 $false
  Dibujar (Join-Path $carpeta 'ic_launcher_round.png') ([int](48 * $f)) 0.9 $true
  # Android 8+ recorta el frente con la forma del launcher: el logo va dentro de la zona segura (66 de 108dp).
  Dibujar (Join-Path $carpeta 'ic_launcher_foreground.png') ([int](108 * $f)) 0.68 $false
}
$logo.Dispose()

# Fondo del ícono adaptable: el mismo blanco del logo.
Set-Content -Encoding utf8 (Join-Path $res 'values\ic_launcher_background.xml') @'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#FEFEFE</color>
</resources>
'@
Write-Output 'Iconos generados en android/app/src/main/res/mipmap-*'

# Permisos de ubicación: el WebView de Capacitor solo le pide permiso al usuario
# si el manifiesto los declara.
$manifiesto = Join-Path $raiz 'android\app\src\main\AndroidManifest.xml'
$xml = [System.IO.File]::ReadAllText($manifiesto)
$permisos = @('ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION')
$faltan = $permisos | Where-Object { $xml -notmatch "android.permission.$_" }
if ($faltan) {
  $lineas = ($faltan | ForEach-Object { "    <uses-permission android:name=`"android.permission.$_`" />" }) -join "`n"
  $xml = $xml.Replace('</manifest>', "$lineas`n</manifest>")
  [System.IO.File]::WriteAllText($manifiesto, $xml)
}
Write-Output 'Permisos de ubicacion declarados en AndroidManifest.xml'
