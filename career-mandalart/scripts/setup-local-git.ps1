# 로컬 Git 자동배포 1회 설정 스크립트 (Windows PowerShell)
#
#   powershell -ExecutionPolicy Bypass -File scripts\setup-local-git.ps1
#
# 만드는 것:
#   1) 이 폴더를 Git 저장소로 초기화 (main / develop 브랜치)
#   2) 로컬 "배포 서버" 역할의 bare 저장소  : $ServerRoot\career-mandalart.git
#   3) 배포용 체크아웃 폴더                    : $ServerRoot\career-mandalart-deploy
#   4) bare 저장소에 post-receive 훅 설치 → push 하면 자동 배포
#   5) 이 저장소에 pre-commit 훅(타입검사) 연결
param(
  [string]$ServerRoot = "$HOME\git-server"
)
$ErrorActionPreference = 'Stop'

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw 'Git 이 없습니다. https://git-scm.com/download/win 에서 설치 후 다시 실행하세요.'
}

$project = Split-Path -Parent $PSScriptRoot
$bare = Join-Path $ServerRoot 'career-mandalart.git'
$deploy = Join-Path $ServerRoot 'career-mandalart-deploy'

Set-Location $project
if (-not (Test-Path .git)) {
  git init -b main | Out-Null
}
git config core.hooksPath .githooks

New-Item -ItemType Directory -Force $ServerRoot | Out-Null
if (-not (Test-Path $bare)) {
  git init --bare -b main $bare | Out-Null
}

# 훅은 Git for Windows 의 sh 로 실행되므로 슬래시 경로 + LF 줄바꿈으로 설치
$hook = (Get-Content -Raw scripts\post-receive) -replace '__DEPLOY_DIR__', ($deploy -replace '\\', '/')
$hook = $hook -replace "`r`n", "`n"
[IO.File]::WriteAllText((Join-Path $bare 'hooks\post-receive'), $hook, (New-Object Text.UTF8Encoding $false))

if (-not (git remote | Select-String -Quiet '^local$')) {
  git remote add local $bare
}

if (-not (git rev-parse -q --verify HEAD)) {
  git add -A
  git commit -m 'chore: 커리어 만다라트 초기 프로젝트' | Out-Null
}
if (-not (git branch --list develop)) {
  git branch develop
}

Write-Host ''
Write-Host '설정 완료' -ForegroundColor Green
Write-Host "  배포 서버 저장소 : $bare"
Write-Host "  배포 로그        : $bare\deploy.log"
Write-Host ''
Write-Host '사용법'
Write-Host '  git push local develop   → 검사 + preview 채널 OTA 업데이트'
Write-Host '  git push local main      → 검사 + production 채널 OTA 업데이트'
Write-Host '  git tag v1.0.0; git push local v1.0.0 → iOS/Android 스토어 빌드'
