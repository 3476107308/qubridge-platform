param(
    [string]$PythonPath
)

$ErrorActionPreference = 'Stop'
$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $PythonPath) {
    $bundledPython = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
    $PythonPath = if (Test-Path -LiteralPath $bundledPython) { $bundledPython } else { 'python' }
}
try {
    $version = & $PythonPath -c 'import sys; print(".".join(map(str, sys.version_info[:2])))'
} catch {
    throw '找不到可用的 Python；请用 -PythonPath 指定 Python 3.10–3.12 的 python.exe'
}
if ($LASTEXITCODE -ne 0 -or $version -notin @('3.10', '3.11', '3.12')) {
    throw '请指定 Python 3.10–3.12，例如 .\setup-web.ps1 -PythonPath C:\path\to\python.exe'
}

$environmentDir = Join-Path $projectDir '.web-venv'
$tempDir = Join-Path $projectDir '.web-tmp'
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
$env:TEMP = $tempDir
$env:TMP = $tempDir
if (-not (Test-Path -LiteralPath $environmentDir)) {
    & $PythonPath -m venv $environmentDir
    if ($LASTEXITCODE -ne 0) { throw '创建 Python 虚拟环境失败' }
}

$environmentPython = Join-Path $environmentDir 'Scripts\python.exe'
& $environmentPython -m pip install --no-cache-dir -r (Join-Path $projectDir 'requirements-web.txt')
if ($LASTEXITCODE -ne 0) { throw '安装依赖失败' }
Write-Host "环境就绪。运行：& '$environmentPython' '$projectDir\app.py'"
