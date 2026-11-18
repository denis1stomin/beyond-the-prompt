---
title: "Claude Code CLI: installation and compatible APIs"
description: "Install Claude Code on macOS, Windows and Linux and use a compatible DeepSeek API."
---

<span id="claude-code-cli"></span>

# Claude Code CLI: installation and setup

> **Verification status:** the author has not verified the original commands across the listed OS. Recheck CLI versions, endpoints and command behavior before public release. This is not a test report.

> **Important:** Claude Code is an Anthropic product. Installation does not establish regional eligibility. Third-party models using Anthropic-compatible APIs may not support every feature. Check provider terms and current documentation.

For a more provider-independent tool, see [OpenCode](/en/guides/opencode-setup).

<span id="installation"></span>

## 1. Claude Code CLI: installation by OS

Claude Code's compatibility mode with third-party APIs may break after updates. OpenCode is the primary option here for independent work with DeepSeek/Z.ai/Kimi.

The native installer does not require Node.js. Documented requirements include macOS 13+, Windows 10 1809+, Ubuntu 20.04+/Debian 10+ or supported Linux; 4 GB RAM, x64/ARM64. Windows can use PowerShell; Git Bash is optional. Check the complete requirements before installation. The installers below download and execute remote code: inspect the source first. They were not run here.

### macOS and Linux

```bash
curl -fsSL https://claude.ai/install.sh | bash
claude --version
```

### Windows (PowerShell)

```powershell
irm https://claude.ai/install.ps1 | iex
claude --version
```

If Windows installation fails, check current requirements in the [official Claude Code documentation](https://code.claude.com/docs/en/setup). In WSL2 run Linux commands *inside* WSL.

<span id="example-deepseek-anthropic-compatible-api"></span>

## 2. Claude Code + DeepSeek: temporary launch

DeepSeek documents [Claude Code compatibility](https://api-docs.deepseek.com/quick_start/agent_integrations/claude_code/). Check exact model IDs in your account; they may change. Do not save the token in the repository.

### macOS (zsh + Keychain)

```bash
claude-deepseek() (
  command -v claude >/dev/null 2>&1 || return 1
  local key
  key="$(security find-generic-password -a "$USER" -s "opencode-deepseek" -w)" || return 1
  [ -n "$key" ] || { echo "Empty key" >&2; return 1; }
  ANTHROPIC_BASE_URL="https://api.deepseek.com/anthropic" \
  ANTHROPIC_AUTH_TOKEN="$key" \
  ANTHROPIC_API_KEY="" \
  ANTHROPIC_MODEL="deepseek-flash[1m]" \
  claude "$@"
)
```

Add the function to `~/.zshrc`, open a new terminal and run `claude-deepseek`. `deepseek-flash[1m]` is the ID in DeepSeek's documentation at review time; if incompatible, use the ID recommended by the current documentation.

### Linux (Secret Service)

```bash
claude-deepseek() (
  command -v claude >/dev/null 2>&1 || return 1
  local key
  key="$(secret-tool lookup app opencode provider deepseek)" || return 1
  [ -n "$key" ] || { echo "Empty key" >&2; return 1; }
  ANTHROPIC_BASE_URL="https://api.deepseek.com/anthropic" \
  ANTHROPIC_AUTH_TOKEN="$key" \
  ANTHROPIC_API_KEY="" \
  ANTHROPIC_MODEL="deepseek-flash[1m]" \
  claude "$@"
)
```

### Windows (PowerShell 7.5+ + DPAPI)

First store the key using the [OpenCode guide](/en/guides/opencode-setup); its Windows section creates the DPAPI file. PowerShell before 7.5 does not preserve an empty env value separately from absence, so this function requires 7.5+. On CLI completion or failure it restores all four variables, including empty and absent values:

```powershell
function claude-deepseek {
  if (!$IsWindows -or $PSVersionTable.PSVersion -lt [version]'7.5') { throw "Requires Windows and PowerShell 7.5+" }
  $cli = Get-Command claude -CommandType Application -ErrorAction Stop
  $path = Join-Path $HOME ".config\opencode-secrets\deepseek.xml"
  if (!(Test-Path -LiteralPath $path -PathType Leaf)) { throw "Secret file missing" }
  try { $secure = Import-Clixml -LiteralPath $path -ErrorAction Stop } catch { throw "Cannot decrypt secret file" }
  if ($secure -isnot [Security.SecureString] -or $secure.Length -eq 0) { throw "Invalid or empty secret" }
  $values = @{
    ANTHROPIC_AUTH_TOKEN = $null
    ANTHROPIC_BASE_URL = 'https://api.deepseek.com/anthropic'
    ANTHROPIC_API_KEY = ''
    ANTHROPIC_MODEL = 'deepseek-flash[1m]'
  }
  $saved = @{}
  foreach ($name in $values.Keys) {
    $present = Test-Path "Env:$name"
    $saved[$name] = @{ Present = $present; Value = $(if ($present) { (Get-Item "Env:$name").Value } else { $null }) }
  }
  $ptr = [IntPtr]::Zero
  try {
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    $key = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    if ([string]::IsNullOrWhiteSpace($key)) { throw "Empty secret" }
    $values.ANTHROPIC_AUTH_TOKEN = $key
    foreach ($name in $values.Keys) { Set-Item "Env:$name" -Value $values[$name] }
    & $cli.Source @args
    if ($LASTEXITCODE -ne 0) { throw "Claude Code exited with code $LASTEXITCODE" }
  } finally {
    foreach ($name in $saved.Keys) {
      if ($saved[$name].Present) { Set-Item "Env:$name" -Value $saved[$name].Value } else { Remove-Item "Env:$name" -ErrorAction SilentlyContinue }
    }
    if ($ptr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
    $key = $null
    $values.ANTHROPIC_AUTH_TOKEN = $null
  }
}
```

For Z.ai and Kimi in Claude Code, use **only the Anthropic-compatible endpoint documented by that provider**. A standard OpenAI-compatible URL cannot be substituted directly. Without documented support, use OpenCode.

Bash/zsh subshells leave the parent terminal environment unchanged. Store read failures or empty keys stop launch. DPAPI here is Windows-only, for the same account and computer. The BSTR is freed in `finally`, but this does not guarantee erasure of all string copies in process memory. Env is available to the client and its children, is not a secret store and cannot prevent the client from storing a secret.

`ANTHROPIC_AUTH_TOKEN` carries the DeepSeek key, `ANTHROPIC_BASE_URL` selects the Anthropic-compatible route, and `ANTHROPIC_MODEL` selects the model. Empty `ANTHROPIC_API_KEY` prevents an inherited Anthropic key from being sent in this launch; this is a defensive choice in the example, not a separate DeepSeek requirement. Client settings and default/subagent model variables can override selection: start with a clean test configuration, without subagents, and check advanced settings against the source. Protocol compatibility does not guarantee equivalence to Claude, tool calling, caching or equal cost. Test tools and streaming in a disposable repository before using work code; requests are billed.

## Sources and verification limits

Official documentation reviewed on **November 18, 2026**: [Claude Code setup](https://code.claude.com/docs/en/setup), [settings](https://code.claude.com/docs/en/settings), [DeepSeek + Claude Code](https://api-docs.deepseek.com/quick_start/agent_integrations/claude_code/), [PowerShell env](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables?view=powershell-7.5), [DPAPI / Export-Clixml](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/export-clixml?view=powershell-7.5). This is a source review, not an installation or paid API test. On macOS, only functions with fake keys and CLI stubs were tested; Windows/DPAPI and Linux/Secret Service were not executed on their target OS.
