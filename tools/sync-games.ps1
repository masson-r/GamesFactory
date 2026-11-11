# Synchronise les jeux sources vers play/<jeu>/ (dossiers 100 % générés : ne rien éditer à la main dedans).
# Usage :  .\tools\sync-games.ps1            (tous les jeux)
#          .\tools\sync-games.ps1 tamer     (un seul jeu)
param([string]$Only = '')

$root = Split-Path $PSScriptRoot -Parent

# --- À ADAPTER si les projets changent d'emplacement -------------------------
$games = @(
  @{ slug = 'hop-and-lock'
     # Projet Vite : lancer `npm run build` dans le dossier source avant la synchro.
     src  = 'C:\Projets\Claude\dist'
     xd   = @()
     xf   = @() },
  @{ slug = 'tamer'
     src  = 'C:\Projets\VibeProjects\JeuBaptiste\tamer'
     # Fichiers de travail qui ne servent pas au jeu.
     xd   = @('tests', '.scratch')
     xf   = @('*.md', 'message.txt', 'regle_tamer', 'desktop.ini') }
)
# -----------------------------------------------------------------------------

foreach ($g in $games) {
  if ($Only -and $Only -ne $g.slug) { continue }
  if (-not (Test-Path $g.src)) { Write-Warning "[$($g.slug)] source introuvable : $($g.src)"; continue }
  $dst = Join-Path $root "play\$($g.slug)"
  $args = @($g.src, $dst, '/MIR', '/NFL', '/NDL', '/NJH', '/NJS', '/NP')
  if ($g.xd.Count) { $args += '/XD'; $args += $g.xd }
  if ($g.xf.Count) { $args += '/XF'; $args += $g.xf }
  robocopy @args | Out-Null
  if ($LASTEXITCODE -ge 8) { Write-Error "[$($g.slug)] échec robocopy ($LASTEXITCODE)"; continue }
  $n = (Get-ChildItem $dst -Recurse -File | Measure-Object).Count
  Write-Host "[$($g.slug)] OK -> play\$($g.slug) ($n fichiers)"
}
$global:LASTEXITCODE = 0
