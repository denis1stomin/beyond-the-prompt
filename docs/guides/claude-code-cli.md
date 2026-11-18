---
title: "Claude Code CLI: установка и совместимые API"
description: "Установка Claude Code на macOS, Windows и Linux и пример совместимого DeepSeek API."
---

# Claude Code CLI: установка и настройка

> **Статус проверки:** исходные команды не подтверждены автором на всех перечисленных ОС. Перед публичным релизом перепроверьте версии CLI, API endpoints и работу команд. Материал не является отчётом о тестировании.


> **Важно:** Claude Code — продукт Anthropic. Установка не означает, что сервис доступен в вашем регионе. Сторонние модели через Anthropic-совместимые API могут поддерживать не все функции. Проверяйте условия провайдеров и актуальную документацию.

Для более независимого от провайдера инструмента см. [OpenCode](/guides/opencode-setup).

## 1. Claude Code CLI: установка по ОС {#_11-claude-code-cli-установка-по-ос}

Использование с чужими API и моделями — режим совместимости, который может сломаться после обновления. Для независимой работы с DeepSeek/Z.ai/Kimi основной вариант — OpenCode.

Нативный установщик не требует Node.js. По документации нужны macOS 13+, Windows 10 1809+, Ubuntu 20.04+/Debian 10+ либо поддерживаемый Linux; 4 GB RAM, x64/ARM64. Windows может работать с PowerShell, Git Bash опционален. Проверяйте полный список требований перед установкой. Установщики ниже загружают и выполняют удалённый код: изучите источник перед запуском. Здесь они не запускались.

### macOS и Linux

```bash
curl -fsSL https://claude.ai/install.sh | bash
claude --version
```

### Windows (PowerShell)

```powershell
irm https://claude.ai/install.ps1 | iex
claude --version
```

Если установка Windows не работает, проверьте текущие требования в [официальной документации Claude Code](https://code.claude.com/docs/en/setup). Для WSL2 используйте Linux-команды *внутри* WSL.
## 2. Claude Code + DeepSeek: разовый запуск {#_12-claude-code-deepseek-разовыи-запуск}

У DeepSeek есть [документация по совместимости с Claude Code](https://api-docs.deepseek.com/quick_start/agent_integrations/claude_code/). Сверьте точные ID моделей в своём кабинете: они могут меняться. Не сохраняйте токен в репозитории.

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

Добавьте функцию в `~/.zshrc`, откройте новый терминал и выполните `claude-deepseek`. `deepseek-flash[1m]` — ID из документации DeepSeek на дату проверки; при несовместимости замените его на ID, рекомендованный актуальной документацией DeepSeek.

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

### Windows (PowerShell 7.5+ + DPAPI) {#windows-powershell-dpapi}

Сначала сохраните ключ по [инструкции OpenCode](/guides/opencode-setup#_9-windows-10-11-opencode); Windows DPAPI-файл создаётся в Windows-разделе этой статьи. На PowerShell до 7.5 пустое значение env не сохраняется отдельно от отсутствующего, поэтому функция требует 7.5+. При завершении/ошибке CLI она восстанавливает все четыре переменные, включая пустые и отсутствующие:

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

Для Z.ai и Kimi в Claude Code используйте **только документированный конкретным провайдером Anthropic-совместимый endpoint**. Обычный OpenAI-compatible URL напрямую не подойдёт. При отсутствии такой поддержки используйте OpenCode.

Подоболочки Bash/zsh не меняют окружение родительского терминала. Ошибка чтения хранилища или пустой ключ останавливают запуск. DPAPI здесь только для Windows, того же пользователя и компьютера. BSTR освобождается в `finally`, но это не гарантирует стирание всех копий строки из памяти процесса. Env доступен клиенту и его потомкам, не является хранилищем и не исключает сохранение секрета клиентом.

`ANTHROPIC_AUTH_TOKEN` передаёт ключ DeepSeek, `ANTHROPIC_BASE_URL` выбирает Anthropic-совместимый маршрут, `ANTHROPIC_MODEL` задаёт модель. Пустой `ANTHROPIC_API_KEY` предотвращает передачу унаследованного ключа Anthropic в этом запуске; это защитное решение примера, а не отдельное требование DeepSeek. Настройки клиента и переменные default/subagent-моделей могут переопределять выбор: для первого запуска используйте чистую тестовую конфигурацию, без субагентов, и сверяйте расширенные настройки с источником. Совместимость протокола не гарантирует функциональную эквивалентность Claude, tool calling, кэширование или одинаковую стоимость. Перед рабочим кодом проверьте инструменты и потоковый ответ в тестовом репозитории; запросы платные.

## Источники и границы проверки

Официальная документация просмотрена **18 ноября 2026 года**: [Claude Code setup](https://code.claude.com/docs/en/setup), [настройки](https://code.claude.com/docs/en/settings), [DeepSeek + Claude Code](https://api-docs.deepseek.com/quick_start/agent_integrations/claude_code/), [PowerShell env](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables?view=powershell-7.5), [DPAPI / Export-Clixml](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/export-clixml?view=powershell-7.5). Это проверка источников, не установка и не платный API-тест. macOS: проверены только функции с фиктивным ключом и CLI-заглушкой; Windows/DPAPI и Linux/Secret Service не исполнялись на целевых ОС.
