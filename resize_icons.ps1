Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\iamwe\Documents\Nexify Connect\android\app\src\main\res\drawable\logo.png"
$resDir = "C:\Users\iamwe\Documents\Nexify Connect\android\app\src\main\res"

if (-not (Test-Path $srcPath)) {
    Write-Error "Source logo.png not found at $srcPath"
    exit 1
}

$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)

$sizes = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

foreach ($folder in $sizes.Keys) {
    $size = $sizes[$folder]
    $destFolder = Join-Path $resDir $folder
    if (-not (Test-Path $destFolder)) {
        New-Item -ItemType Directory -Path $destFolder | Out-Null
    }
    
    # Create resized bitmap
    $newBmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($newBmp)
    
    # Set high quality resize settings
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    # Draw original image into new size with 10% padding so legacy icons are not zoomed
    $padding = [Math]::Max(1, [int]($size * 0.10))
    $newSize = $size - ($padding * 2)
    $g.DrawImage($bmp, $padding, $padding, $newSize, $newSize)
    
    # Save as ic_launcher.png and ic_launcher_round.png
    $destFile1 = Join-Path $destFolder "ic_launcher.png"
    $destFile2 = Join-Path $destFolder "ic_launcher_round.png"
    
    # Delete if already exists to overwrite cleanly
    if (Test-Path $destFile1) { Remove-Item $destFile1 -Force }
    if (Test-Path $destFile2) { Remove-Item $destFile2 -Force }
    
    $newBmp.Save($destFile1, [System.Drawing.Imaging.ImageFormat]::Png)
    $newBmp.Save($destFile2, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $g.Dispose()
    $newBmp.Dispose()
    
    Write-Host "Generated $folder/ic_launcher.png ($size x $size)"
}

$bmp.Dispose()
Write-Host "Launcher icons generated successfully!"
