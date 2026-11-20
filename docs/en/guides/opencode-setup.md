---
title: "OpenCode setup on macOS, Windows and Linux"
description: "Connect DeepSeek, Z.ai, Kimi and OpenAI, store keys safely and work in VS Code."
---

<span id="opencode-cross-platform-setup"></span>

# OpenCode: installation and model connections

> **Verification:** the author tested the setup approach with **OpenCode v2.3.0 (V2)** on macOS on **November 18, 2026**. Windows and Linux remain untested. The installation commands below currently install V2 and may deliver a newer release. For the exact version, see the [v2.3.0 release](https://github.com/anomalyco/opencode/releases/tag/v2.3.0).

> **Currency:** the original instructions were prepared on November 17, 2026. Commands and authentication depend on CLI versions, plans and region. Check official documentation before running them. **Do not put keys in the repository.**

This guide covers macOS, Windows and Linux. Claude Code CLI has a [separate guide](/en/guides/claude-code-cli).

<span id="_1-install"></span>

## 1. Install OpenCode with Homebrew

Open Terminal. Check Homebrew:

```bash
brew --version
```

If Homebrew is missing, follow [brew.sh](https://brew.sh/). Then:

If you already have OpenCode, check `opencode --version`. Both versions use the same command. Keep a copy of your V1 setup and remove the package-managed V1 installation before installing V2. See [Migrate from V1](https://opencode.ai/docs/migrate-v1/).

```bash
brew install anomalyco/tap/opencode-v2
opencode --version
```

If the formula is unavailable, check installation in the [OpenCode documentation](https://opencode.ai/docs/). To start in a project:

```bash
cd /path/to/your/repository
opencode
```

Always check the source before running commands from the internet. Do not paste secret keys into public repositories or chats.

<span id="_4-store-secrets-safely"></span>

## 2. Store API keys in Keychain

The commands below are separate for each provider. Run only those for which you already have a key. `security ... -w` without a value prompts for the secret. Do not store plaintext API keys in persistent environment settings (`~/.zshrc`, `~/.bashrc` or system settings). A temporary process environment variable can carry a key from Keychain, as shown below; this does not write it to configuration files.

### DeepSeek

```bash
security add-generic-password -U -a "$USER" -s "opencode-deepseek" -w
```

### Z.ai

```bash
security add-generic-password -U -a "$USER" -s "opencode-zai" -w
```

### Kimi

```bash
security add-generic-password -U -a "$USER" -s "opencode-kimi" -w
```

Check that an entry exists without showing the secret:

```bash
security find-generic-password -a "$USER" -s "opencode-deepseek" >/dev/null 2>&1 && echo "DeepSeek key found"
```

Keychain protects the key at rest. Once passed through an environment variable, the key is available to the agent process and potentially its children. Do not run untrusted commands in an agent session.

<span id="temporary-launch-without-writing-the-key-to-auth-json"></span>

### Temporary launch with an environment key

Add this function to your Bash/zsh profile (the key itself is not written there):

```bash
oc-keychain() (
  command -v opencode >/dev/null 2>&1 || { echo "OpenCode not found" >&2; return 1; }
  command -v security >/dev/null 2>&1 || return 1
  local key service="$1" variable="$2"
  shift 2
  key="$(security find-generic-password -a "$USER" -s "$service" -w)" || { echo "Keychain read failed" >&2; return 1; }
  [ -n "$key" ] || { echo "Empty key" >&2; return 1; }
  export "$variable=$key"
  opencode --standalone "$@"
)
```

The subshell preserves the parent terminal environment even when the CLI fails. This is temporary secret transport, not storage. The process and its children can access the key; managed strings cannot be guaranteed to be erased from memory.

`--standalone` starts a private server with the temporary environment. The default V2 CLI can connect to a shared server whose environment differs from the terminal’s. A saved account takes precedence over an environment connection for the same integration.

**Interactive sign-in.** Run `/connect`, choose the provider and complete its API-key or OAuth flow. Then select a model in `/models`. V2 saves keys and OAuth tokens in the server’s SQLite database (usually `~/.local/share/opencode/opencode.db` for the local release build). Use `opencode debug paths db` to find the local path. Remove a saved account in `/connect` or with `opencode auth logout`. Revoking a key at the provider and deleting it from Keychain are separate actions. For environment-only use, skip interactive key entry. Keep plaintext keys out of command arguments, shell history, profiles, `.env` files and Git. [V2 credential storage](https://opencode.ai/docs/cli/providers/#storage)

To explicitly map environment variables to catalog providers, use the V2 `providers` map in the project’s `opencode.json`. Keep the entries you need. Keep the provider that matches your key. OpenCode can detect the built-in providers’ supported environment variables without these explicit mappings. [V2 providers](https://opencode.ai/docs/providers/) · [V2 migration reference](https://opencode.ai/docs/migrate-v1/#providers)

```json
{
  "$schema": "https://opencode.ai/config.json",
  "providers": {
    "deepseek": { "settings": { "apiKey": "{env:DEEPSEEK_API_KEY}" } },
    "zai": { "settings": { "apiKey": "{env:ZAI_API_KEY}" } },
    "kimi-code-plan-global": { "settings": { "apiKey": "{env:KIMI_API_KEY}" } },
    "moonshotai": { "settings": { "apiKey": "{env:MOONSHOT_API_KEY}" } },
    "openai": { "settings": { "apiKey": "{env:OPENAI_API_KEY}" } }
  }
}
```

<span id="_2-choose-a-provider"></span>
<span id="_3-connect-in-opencode"></span>

## 3. Connect DeepSeek

Step 1. Create an API key at [DeepSeek Platform](https://platform.deepseek.com/) and store it in Keychain as above.

Step 2. Open a new Terminal and start OpenCode with the key retrieved from Keychain:

```bash
oc-keychain "opencode-deepseek" DEEPSEEK_API_KEY
```

Step 3. For env mode, use `/models`; do not enter the key again. Alternatively, for local credential storage, use `/connect` and choose DeepSeek if listed. Enter the key through the connection flow, then select an available DeepSeek model in `/models`.

If the provider is not detected automatically, follow the [custom provider guide](https://opencode.ai/docs/providers/). The standard OpenAI-compatible DeepSeek endpoint is `https://api.deepseek.com`. Check model IDs in the [DeepSeek documentation](https://api-docs.deepseek.com/); do not guess obsolete IDs.

## 4. Connect Z.ai / GLM

### Standard Z.ai API

**Verified by the author on macOS on November 20, 2026.** OpenCode returned a response from **GLM-4.7-Flash** using a Z.ai API key loaded from Keychain. Z.ai lists this model as free. [Z.ai API pricing](https://docs.z.ai/guides/overview/pricing)

1. Create a key on the [Z.ai API key page](https://z.ai/manage-apikey/apikey-list) and save it in Keychain as `opencode-zai`.
2. Include the `zai` entry from the V2 config example above. Its `settings.apiKey` reads `{env:ZAI_API_KEY}`, so pass `ZAI_API_KEY` to the wrapper.
3. Launch OpenCode:

   ```bash
   oc-keychain "opencode-zai" ZAI_API_KEY
   ```

4. Open `/models`, choose **GLM-4.7-Flash** under **Z.AI**, and send a short prompt. The standard API model ID is `zai/glm-4.7-flash`. **GLM-4.7-FlashX** is a separate paid model.

### Z.AI Coding Plan

The subscription uses a separate **Z.AI Coding Plan** provider. If you have that subscription, use the provider and endpoint in Z.ai’s [OpenCode integration guide](https://docs.z.ai/devpack/tool/opencode).

## 5. Connect Kimi / Moonshot

Moonshot AI offers both services under the Kimi brand. Use the site where you created the key to choose the provider in OpenCode. [Official API comparison](https://www.kimi.com/en/help/kimi-code/faq)

| Key source | Billing | OpenCode provider | Environment variable | Global API base URL |
| --- | --- | --- | --- | --- |
| [Kimi API Platform](https://platform.kimi.ai/console/api-keys) | Pay-as-you-go | **Moonshot AI** (`moonshotai`) | `MOONSHOT_API_KEY` | `https://api.moonshot.ai/v1` |
| [Kimi Code Console](https://www.kimi.com/code/console) | Membership quota | **Kimi For Coding (kimi.ai)** (`kimi-code-plan-global`) | `KIMI_API_KEY` | `https://api.kimi.ai/coding/v1` |

### Moonshot AI (Kimi API Platform)

**Verified by the author on November 20, 2026.** A request succeeded in OpenCode on macOS using a Platform key loaded from Keychain via `MOONSHOT_API_KEY` and a model selected under **Moonshot AI** in `/models`.

Save the Platform key in Keychain as `opencode-moonshot`, then launch:

```bash
oc-keychain "opencode-moonshot" MOONSHOT_API_KEY
```

If the Platform key is already saved under `opencode-kimi`, pass that service name instead. In `/models`, select a model under **Moonshot AI**. Check the provider label when the same model name appears under multiple providers.

### Kimi For Coding

This setup uses the membership quota. The steps below follow Kimi’s documentation. [Kimi Code integration](https://www.kimi.com/code/docs/en/third-party-tools/opencode.html)

Step 1. Create an API key in the [Kimi Code Console](https://www.kimi.com/code/console) and store it in Keychain as `opencode-kimi`.

Step 2. Launch OpenCode and select **Kimi For Coding (kimi.ai)** in `/models`, or select the model at launch:

```bash
oc-keychain "opencode-kimi" KIMI_API_KEY --model kimi-code-plan-global/k3.1-pro
```

If you get an authentication error, run `oc-keychain "opencode-kimi" KIMI_API_KEY auth list`. An `environment` entry confirms OpenCode detected the variable. A `stored` account for the same provider takes priority. For Keychain-only use, remove that saved account in `/connect` and relaunch. [OpenCode authentication](https://opencode.ai/docs/cli/providers/#environment)

## 6. ChatGPT Plus / Pro and OpenAI API

**Option A — ChatGPT sign-in.** Start `opencode`, open `/connect`, choose OpenAI and, if your version offers *Sign in with ChatGPT*, follow browser authentication. Then select an available model in `/models`. Plus/Pro does not guarantee this method is available in your country or OpenCode version.

**Option B — OpenAI API.** Create a separate key at [OpenAI Platform](https://platform.openai.com/). API usage and balance are tracked separately; a subscription does not mean unlimited API access. Check possible API credit benefits in the [official documentation](https://developers.openai.com/api/docs/guides/chatgpt-api-credits). Store the key:

```bash
security add-generic-password -U -a "$USER" -s "opencode-openai" -w
```

To launch with the key:

```bash
oc-keychain "opencode-openai" OPENAI_API_KEY
```

For env mode, choose a model in `/models` without entering the key into `/connect`. Both options require compliance with OpenAI regional restrictions. Use from Russia may be unavailable.

## 7. Work in VS Code

Open a Git repository in VS Code, then *Terminal → New Terminal*. Run the appropriate provider launch command. OpenCode changes appear in the filesystem and VS Code Source Control.

Check `opencode --version` there if it resolves a different installation. The extension and keyboard shortcuts in the legacy section are documented for V1.

<span id="_5-test-safely"></span>

## 8. Verification and troubleshooting

1. Check that `opencode --version` works.
2. Check the Keychain entry using the command in section 2.
3. Start OpenCode from a test Git repository.
4. For a temporary environment key, use the launch wrapper and select the model in `/models`. For interactive sign-in, use `/connect` first.
5. Ask: “Inspect this project, describe its structure and propose a plan without changing files.”
6. For 401 check the key; for 403 permissions and regional terms; for 404 endpoint and model ID; for 429 limits and balance.

Check the version and update:

```bash
opencode --version
brew update
brew upgrade anomalyco/tap/opencode-v2
```

To remove a key (DeepSeek example):

```bash
security delete-generic-password -a "$USER" -s "opencode-deepseek"
```

An API key or payment capability does not override regional terms. Do not share keys. For private code, review the selected API's data policy separately.

If the shared server is the problem, check `opencode service status`. Consult [V2 troubleshooting](https://opencode.ai/docs/troubleshooting/) for logs and service diagnostics. Remove secrets and private project data before sharing logs.

---

References: [OpenCode](https://opencode.ai/docs/) · [DeepSeek](https://api-docs.deepseek.com/) · [Z.ai](https://docs.z.ai/) · [Moonshot](https://platform.moonshot.ai/) · [OpenAI API](https://platform.openai.com/docs/).

---

## 9. Windows 10/11: OpenCode

Download the Windows CLI binary for your architecture from [OpenCode V2](https://opencode.ai/docs/#cli) and put `opencode.exe` in a directory on PATH. Check `opencode --version` from a new terminal. Use PowerShell **7.5+** for the function below. WSL2 uses the Linux procedure and its own home directory and secret store.

### Windows: DPAPI-protected DeepSeek key

In PowerShell, store the secret in a file encrypted by Windows for the current account:

```powershell
$dir = Join-Path $HOME ".config\opencode-secrets"
New-Item -ItemType Directory -Force $dir | Out-Null
Read-Host "DeepSeek API key" -AsSecureString | Export-Clixml (Join-Path $dir "deepseek.xml")
```

Create a launch function in your PowerShell profile. It passes the key through env, then restores the previous value and whether the variable existed in `finally`. PowerShell 7.5+ distinguishes empty and absent env values. This example stops on older versions. DPAPI works only on Windows under the same account and on the same computer:

```powershell
if (!(Test-Path -LiteralPath $PROFILE)) { New-Item -ItemType File -Path $PROFILE | Out-Null }
notepad $PROFILE
```



```powershell
function oc-deepseek {
  if (!$IsWindows -or $PSVersionTable.PSVersion -lt [version]'7.5') { throw "Requires Windows and PowerShell 7.5+" }
  $cli = Get-Command opencode -CommandType Application -ErrorAction Stop
  $path = Join-Path $HOME ".config\opencode-secrets\deepseek.xml"
  if (!(Test-Path -LiteralPath $path -PathType Leaf)) { throw "Secret file missing" }
  try { $secure = Import-Clixml -LiteralPath $path -ErrorAction Stop } catch { throw "Cannot decrypt secret file" }
  if ($secure -isnot [Security.SecureString] -or $secure.Length -eq 0) { throw "Invalid or empty secret" }
  $existed = Test-Path Env:DEEPSEEK_API_KEY
  $previous = if ($existed) { (Get-Item Env:DEEPSEEK_API_KEY).Value } else { $null }
  $ptr = [IntPtr]::Zero
  try {
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    $key = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    if ([string]::IsNullOrWhiteSpace($key)) { throw "Empty secret" }
    $env:DEEPSEEK_API_KEY = $key
    & $cli.Source --standalone @args
    if ($LASTEXITCODE -ne 0) { throw "OpenCode exited with code $LASTEXITCODE" }
  } finally {
    if ($existed) { Set-Item Env:DEEPSEEK_API_KEY -Value $previous } else { Remove-Item Env:DEEPSEEK_API_KEY -ErrorAction SilentlyContinue }
    if ($ptr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
    $key = $null
  }
}
```

Restart PowerShell and use `oc-deepseek`. For Z.ai and Kimi create separate `zai.xml` and `kimi.xml` files in the same way, and replace the variable with `ZAI_API_KEY` or `KIMI_API_KEY` in separate functions. Variable names must match the OpenCode provider configuration.

## 10. Linux: OpenCode and secrets

For Ubuntu/Debian and other distributions with Node.js LTS and npm:

```bash
node --version
npm install -g @opencode/cli
opencode --version
```

On Linux, Secret Service (GNOME Keyring / KWallet) is accessible through `secret-tool`. On Debian/Ubuntu:

```bash
sudo apt update
sudo apt install libsecret-tools
# Bash: subshell avoids changing an existing KEY in the parent shell.
(
  read -rsp "DeepSeek API key: " KEY || exit 1
  echo
  [ -n "$KEY" ] || exit 1
  printf %s "$KEY" | secret-tool store --label="OpenCode DeepSeek" app opencode provider deepseek
)
```

Use Bash for the storage block above; its `read -rsp` is not intended for zsh. The launch function below supports Bash and zsh. Add it to `~/.bashrc` or `~/.zshrc`:

```bash
oc-deepseek() (
  command -v opencode >/dev/null 2>&1 || return 1
  command -v secret-tool >/dev/null 2>&1 || return 1
  local key
  key="$(secret-tool lookup app opencode provider deepseek)" || return 1
  if [ -z "$key" ]; then echo "Key not found"; return 1; fi
  DEEPSEEK_API_KEY="$key" opencode --standalone "$@"
)
```

Open a new terminal and run `oc-deepseek`. For Z.ai and Kimi use separate `provider zai` / `provider kimi` attributes with `ZAI_API_KEY` and `KIMI_API_KEY`, respectively. Secret Service needs a running session and unlocked keyring; on headless servers use a secret manager or interactive key entry at launch.

## 11. ChatGPT, VS Code and verification

**ChatGPT Plus/Pro is distinct from the OpenAI API.** In OpenCode, use the officially available `/connect` flow if supported by your version and region. OpenAI API requires a separate key and usage accounting; credit benefits depend on the plan's terms. Do not enter your ChatGPT password into third-party scripts.

```bash
cd /path/to/project
opencode
# Inside: /connect, then /models
```

On Windows a path might be `cd C:\Users\you\Projects\repo`. In VS Code use the integrated terminal and launch from the Git repository root. On first use, verify file reading, tool calls, streaming and usage charges in the provider dashboard.

**Security:** never publish API keys, commit secrets or use shared reseller keys for private code. Even with Keychain/DPAPI/Secret Service, the key is available to the agent process during execution.

Documentation: [OpenCode](https://opencode.ai/docs/) · [Claude Code](https://code.claude.com/docs/en/setup) · [DeepSeek](https://api-docs.deepseek.com/) · [Z.ai](https://docs.z.ai/) · [Kimi](https://platform.moonshot.ai/).

## Legacy: OpenCode V1 {#opencode-v1-legacy}

For existing V1 installations, the package is `opencode-ai` on npm or `anomalyco/tap/opencode` on Homebrew. V1 uses the `provider` map and `options.apiKey`. Example for an existing V1 project:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "deepseek": { "options": { "apiKey": "{env:DEEPSEEK_API_KEY}" } },
    "zai": { "options": { "apiKey": "{env:ZAI_API_KEY}" } },
    "moonshotai": { "options": { "apiKey": "{env:MOONSHOT_API_KEY}" } },
    "openai": { "options": { "apiKey": "{env:OPENAI_API_KEY}" } }
  }
}
```

V1 saves interactive credentials in `~/.local/share/opencode/auth.json`; use `opencode auth logout` to remove the provider entry. The V1 VS Code extension documents `Cmd+Esc` (macOS) and `Ctrl+Esc` (Windows/Linux) for opening or focusing a session. No V1 runtime verification was performed. [V1 install](https://opencode.ai/v1/docs/) · [V1 providers](https://opencode.ai/v1/docs/providers/) · [V1 CLI](https://opencode.ai/v1/docs/cli/) · [V1 IDE](https://opencode.ai/v1/docs/ide/)

## Sources and verification limits

Official documentation reviewed on **November 18, 2026**. This is a source review, not verification of installation or paid API operation. The author's macOS verification with v2.3.0 on November 18, 2026 retains its original scope; it does not establish that every provider or command was tested. Windows/DPAPI and Linux/Secret Service were not executed on their target OS. Only shell functions with fake keys and stubs were tested on macOS. V1 was not run in this review environment. On November 20, 2026, the author also verified a successful request through Moonshot AI on macOS using a Platform key from Keychain.

| API / plan | Endpoint and model at review time | Authentication and limits |
| --- | --- | --- |
| [DeepSeek API](https://api-docs.deepseek.com/) | `https://api.deepseek.com`, `deepseek-flash`; separate `/anthropic` for Claude Code | Bearer API key; [tool calls](https://api-docs.deepseek.com/guides/tool_calls/) documented, not tested here |
| [Z.ai API](https://docs.z.ai/guides/overview/quick-start) | `https://api.z.ai/api/paas/v4`, `glm-5.3` | Standard API key; [function calling](https://docs.z.ai/guides/capabilities/function-calling) depends on the model Author verified GLM-4.7-Flash through the standard API on macOS on November 20, 2026. |
| [GLM Coding Plan](https://docs.z.ai/devpack/quick-start) | Chat Completions: `https://api.z.ai/api/coding/paas/v4` | Separate plan key; supported tools only. [OpenCode](https://docs.z.ai/devpack/tool/opencode): Z.AI Coding Plan provider |
| [Kimi API](https://platform.kimi.ai/docs/get-your-api-key) | `https://api.moonshot.ai/v1`, `kimi-k3.1-pro` | Bearer API key; [tool calls](https://platform.kimi.ai/docs/guide/use-kimi-api-to-complete-tool-calls) documented. [Integration](https://platform.kimi.ai/docs/guide/open-code) based on V1 1.18.3: the source version, not a local test Author verified a request through the Moonshot AI provider on November 20, 2026. |
| [Kimi For Coding (kimi.ai)](https://models.opencode.ai/providers/kimi-code-plan-global/) | `https://api.kimi.ai/coding/v1`, `k3.1-pro` | Kimi Code Console key via `KIMI_API_KEY` |
| [OpenAI API](https://developers.openai.com/api/reference/overview) | `https://api.openai.com/v1`; model IDs from `/models` and your account | Bearer API key; [function calling](https://developers.openai.com/api/docs/guides/function-calling) depends on model. ChatGPT OAuth is a separate path described in [OpenCode V2](https://opencode.ai/docs/providers/#chatgpt) |

V2 instructions were checked against [Install](https://opencode.ai/docs/#cli), [Config](https://opencode.ai/docs/config/), [Providers](https://opencode.ai/docs/providers/), [CLI](https://opencode.ai/docs/cli/), [CLI providers](https://opencode.ai/docs/cli/providers/) and [Troubleshooting](https://opencode.ai/docs/troubleshooting/). Before paid use, recheck model IDs, balance, regional eligibility and data terms.
