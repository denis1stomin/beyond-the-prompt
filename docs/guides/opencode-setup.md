---
title: "Настройка OpenCode на macOS, Windows и Linux"
description: "Подключение DeepSeek, Z.ai, Kimi и OpenAI, безопасное хранение ключей и VS Code."
---

# OpenCode: установка и подключение моделей

> **Статус проверки:** автор проверил подход к настройке с **OpenCode v2.3.0 (V2)** на macOS **18 ноября 2026 года**. Windows и Linux не проверены. Команды ниже устанавливают V2 и могут установить более свежую версию. Точная версия доступна на [странице релиза v2.3.0](https://github.com/anomalyco/opencode/releases/tag/v2.3.0).

> **Актуальность:** исходная инструкция подготовлена 17 ноября 2026 года. Команды и способы авторизации зависят от версий CLI, тарифов и региона. Перед запуском сверяйте их с официальной документацией. **Не вставляйте ключи в репозиторий.**

Эта инструкция охватывает macOS, Windows и Linux. Для Claude Code CLI есть [отдельный гайд](/guides/claude-code-cli).

## 1. Установка OpenCode через Homebrew

Откройте Terminal. Проверьте Homebrew:

```bash
brew --version
```

Если Homebrew не установлен, используйте инструкцию с [brew.sh](https://brew.sh/). Затем:

Если OpenCode уже установлен, проверьте `opencode --version`. Обе версии используют одну команду. Сохраните копию настроек V1 и удалите установленную менеджером пакетов V1 перед установкой V2. См. [переход с V1](https://opencode.ai/docs/migrate-v1/).

```bash
brew install anomalyco/tap/opencode-v2
opencode --version
```

Если формула недоступна, проверьте актуальный способ установки в [документации OpenCode](https://opencode.ai/docs/). Для запуска в проекте:

```bash
cd /путь/к/вашему/репозиторию
opencode
```

Перед выполнением команд из интернета всегда проверяйте источник. Не вставляйте секретные ключи в публичные репозитории или чаты.

## 2. Безопасно сохраняем API-ключи в Keychain

Ниже отдельная команда для каждого провайдера. Выполняйте только для тех, у кого уже есть ключ. Команда `security ... -w` без значения предложит ввести секрет. Не записывайте API-ключ в открытом виде в постоянные переменные среды (например, в `~/.zshrc`, `~/.bashrc` или системные настройки). Для запуска допускается временно передавать ключ из Keychain в переменную окружения процесса, как показано ниже; это не сохраняет его в конфигурационных файлах.

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

Проверка существования записи без отображения секрета:

```bash
security find-generic-password -a "$USER" -s "opencode-deepseek" >/dev/null 2>&1 && echo "Ключ DeepSeek найден"
```

Keychain защищает ключ в покое, но при передаче его агенту через переменную окружения ключ становится доступен процессу и потенциально его дочерним процессам. Не запускайте непроверенные команды в агентной сессии.

<span id="временныи-запуск-без-записи-ключа-в-auth-json"></span>

### Временный запуск с ключом из окружения

Добавьте функцию в профиль Bash/zsh (сам ключ в профиль не попадает):

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

Подоболочка сохраняет окружение родительского терминала даже при ошибке CLI. Это временная передача секрета, а не хранилище. Ключ доступен процессу и его потомкам; строки в управляемой памяти нельзя гарантированно стереть.

`--standalone` запускает отдельный сервер с временным окружением. По умолчанию CLI V2 может подключиться к общему серверу, окружение которого отличается от окружения терминала. Для одной интеграции сохранённая учётная запись имеет приоритет перед подключением через переменную окружения.

**Интерактивное подключение.** Вызовите `/connect`, выберите провайдера и пройдите вход по API-ключу или OAuth. Затем выберите модель в `/models`. V2 сохраняет ключи и токены OAuth в базе SQLite сервера (для локальной релизной сборки обычно `~/.local/share/opencode/opencode.db`). Локальный путь показывает `opencode debug paths db`. Удалите сохранённую запись через `/connect` или `opencode auth logout`. Отзыв ключа у провайдера и удаление из Keychain выполняются отдельно. Если нужен только ключ из окружения, пропустите интерактивный ввод. Не сохраняйте ключи в аргументах команд, истории, профиле оболочки, файлах `.env` или Git. [Хранилище V2](https://opencode.ai/docs/cli/providers/#storage)

Чтобы явно связать переменные окружения с провайдерами из каталога, задайте `providers` в файле проекта `opencode.json`. Оставьте нужные записи. Выберите запись для вашего ключа. OpenCode может подхватить поддерживаемые переменные окружения встроенных провайдеров без явной привязки. [Провайдеры V2](https://opencode.ai/docs/providers/) · [Справочник по миграции](https://opencode.ai/docs/migrate-v1/#providers)

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

## 3. Подключение DeepSeek

Шаг 1. Создайте API-ключ в [DeepSeek Platform](https://platform.deepseek.com/) и сохраните его в Keychain по инструкции выше.

Шаг 2. Откройте новый Terminal и запустите OpenCode с ключом, извлечённым из Keychain:

```bash
oc-keychain "opencode-deepseek" DEEPSEEK_API_KEY
```

Шаг 3. Для env-режима используйте `/models`; повторно вводить ключ не нужно. Альтернативный режим с локальным сохранением: в OpenCode используйте `/connect` и выберите DeepSeek, если он присутствует в списке. При запросе ключа вставьте его через предусмотренный механизм подключения. Затем `/models` и выберите доступную модель DeepSeek.

Если провайдер не обнаружен автоматически, воспользуйтесь [руководством по пользовательским провайдерам OpenCode](https://opencode.ai/docs/providers/). Endpoint обычного OpenAI-совместимого DeepSeek API: `https://api.deepseek.com`. Конкретные идентификаторы моделей смотрите в [документации DeepSeek](https://api-docs.deepseek.com/); не используйте устаревшие ID наугад.

## 4. Подключение Z.ai / GLM

### Обычный API Z.ai

**Проверено автором на macOS 20 ноября 2026 года.** OpenCode получил ответ от **GLM-4.7-Flash** с ключом Z.ai из Keychain. Z.ai указывает эту модель как бесплатную. [Тарифы API Z.ai](https://docs.z.ai/guides/overview/pricing)

1. Создайте ключ на [странице ключей Z.ai](https://z.ai/manage-apikey/apikey-list) и сохраните его в Keychain под именем `opencode-zai`.
2. Добавьте запись `zai` из примера конфигурации V2 выше. Поле `settings.apiKey` читает `{env:ZAI_API_KEY}`, поэтому передайте функции имя `ZAI_API_KEY`.
3. Запустите OpenCode:

   ```bash
   oc-keychain "opencode-zai" ZAI_API_KEY
   ```

4. Откройте `/models`, выберите **GLM-4.7-Flash** у провайдера **Z.AI** и отправьте короткий запрос. ID модели обычного API — `zai/glm-4.7-flash`. **GLM-4.7-FlashX** — отдельная платная модель.

### Z.AI Coding Plan

У подписки отдельный провайдер **Z.AI Coding Plan**. Если у вас есть подписка, используйте провайдера и адрес API из [инструкции Z.ai для OpenCode](https://docs.z.ai/devpack/tool/opencode).

## 5. Подключение Kimi / Moonshot

Moonshot AI предлагает оба сервиса под брендом Kimi. Провайдера в OpenCode выбирайте по тому, где был создан ключ. [Официальное сравнение API](https://www.kimi.com/en/help/kimi-code/faq)

| Где создан ключ | Оплата | Провайдер OpenCode | Переменная окружения | Глобальный адрес API |
| --- | --- | --- | --- | --- |
| [Kimi API Platform](https://platform.kimi.ai/console/api-keys) | По фактическому использованию | **Moonshot AI** (`moonshotai`) | `MOONSHOT_API_KEY` | `https://api.moonshot.ai/v1` |
| [Консоль Kimi Code](https://www.kimi.com/code/console) | Квота подписки | **Kimi For Coding (kimi.ai)** (`kimi-code-plan-global`) | `KIMI_API_KEY` | `https://api.kimi.ai/coding/v1` |

### Moonshot AI (Kimi API Platform)

**Проверено автором 20 ноября 2026 года.** На macOS OpenCode успешно выполнил запрос с ключом Platform из Keychain, переданным через `MOONSHOT_API_KEY`. Модель выбрана в `/models` у провайдера **Moonshot AI**.

Сохраните ключ Platform в Keychain под именем `opencode-moonshot`, затем запустите:

```bash
oc-keychain "opencode-moonshot" MOONSHOT_API_KEY
```

Если ключ Platform уже сохранён под именем `opencode-kimi`, укажите это имя при запуске. В `/models` выберите модель у **Moonshot AI**. Если одинаковое название модели встречается у нескольких провайдеров, смотрите на подпись провайдера.

### Kimi For Coding

Этот вариант использует квоту подписки. Шаги ниже приведены по документации Kimi. [Интеграция Kimi Code](https://www.kimi.com/code/docs/en/third-party-tools/opencode.html)

Шаг 1. Создайте API-ключ в [консоли Kimi Code](https://www.kimi.com/code/console) и сохраните его в Keychain под именем `opencode-kimi`.

Шаг 2. Запустите OpenCode и выберите модель **Kimi For Coding (kimi.ai)** в `/models` либо укажите модель при запуске:

```bash
oc-keychain "opencode-kimi" KIMI_API_KEY --model kimi-code-plan-global/k3.1-pro
```

При ошибке авторизации выполните `oc-keychain "opencode-kimi" KIMI_API_KEY auth list`. Строка `environment` означает, что OpenCode обнаружил переменную. Запись `stored` для того же провайдера имеет приоритет. Чтобы использовать ключ из Keychain, удалите сохранённую учётную запись этого провайдера через `/connect` и перезапустите OpenCode. [Авторизация в OpenCode](https://opencode.ai/docs/cli/providers/#environment)

## 6. ChatGPT Plus / Pro и OpenAI API

**Вариант A — вход через ChatGPT.** Запустите `opencode`, откройте `/connect`, выберите OpenAI и, если в вашей версии есть вариант *Sign in with ChatGPT*, следуйте браузерной авторизации. Затем выберите доступную модель через `/models`. Наличие Plus/Pro не гарантирует, что этот способ доступен в вашей стране или текущей версии OpenCode.

**Вариант B — OpenAI API.** Создайте отдельный API-ключ в [OpenAI Platform](https://platform.openai.com/). API имеет отдельный учёт использования и баланс; подписка не означает безлимитный API. Условия возможных API-кредитов проверяйте в [официальной документации](https://developers.openai.com/api/docs/guides/chatgpt-api-credits). Сохраните ключ:

```bash
security add-generic-password -U -a "$USER" -s "opencode-openai" -w
```

Для запуска с ключом:

```bash
oc-keychain "opencode-openai" OPENAI_API_KEY
```

Для env-режима выберите модель в `/models`, не вводя ключ в `/connect`. В обоих вариантах необходимо соблюдать региональные ограничения OpenAI. Использование из России может быть недоступно.

## 7. Работа с VS Code

Откройте Git-репозиторий в VS Code, затем меню *Terminal → New Terminal*. Выполните соответствующую команду запуска из раздела провайдера. Изменения OpenCode появятся в файловой системе и в панели Source Control VS Code.

Если там запускается другая установка, проверьте `opencode --version`. Расширение и сочетания клавиш из раздела об устаревшей версии документированы для V1.

## 8. Проверка и устранение ошибок

1. Проверьте, что `opencode --version` работает.
2. Проверьте запись Keychain командой из раздела 2.
3. Запустите OpenCode из каталога тестового Git-репозитория.
4. Для временного ключа из окружения используйте функцию запуска и выберите модель в `/models`. Для интерактивного входа сначала вызовите `/connect`.
5. Попросите агента: «Изучи проект, опиши структуру и предложи план, не изменяя файлы».
6. При 401 проверьте API-ключ, при 403 — права доступа и региональные условия, при 404 — endpoint и ID модели, при 429 — лимиты и баланс.

Проверка версии и обновление:

```bash
opencode --version
brew update
brew upgrade anomalyco/tap/opencode-v2
```

Для удаления ключа (пример DeepSeek):

```bash
security delete-generic-password -a "$USER" -s "opencode-deepseek"
```

Важно: наличие API-ключа или возможность оплаты не отменяет региональных условий провайдера. Не передавайте свои ключи посторонним. Для приватного кода отдельно изучите политику обработки данных выбранного API.

Если проблема в общем сервере, проверьте `opencode service status`. Просмотр логов и диагностика описаны в [руководстве V2](https://opencode.ai/docs/troubleshooting/). Перед публикацией логов удалите секреты и приватные данные проекта.

---

Справочные ссылки: [OpenCode](https://opencode.ai/docs/) · [DeepSeek](https://api-docs.deepseek.com/) · [Z.ai](https://docs.z.ai/) · [Moonshot](https://platform.moonshot.ai/) · [OpenAI API](https://platform.openai.com/docs/).

---

## 9. Windows 10/11: OpenCode

Скачайте CLI для Windows своей архитектуры из [документации OpenCode V2](https://opencode.ai/docs/#cli) и поместите `opencode.exe` в каталог из PATH. Проверьте `opencode --version` в новом терминале. Для функции ниже используйте PowerShell **7.5+**. В WSL2 используйте инструкцию для Linux: у WSL свои домашний каталог и хранилище секретов.

### Windows: ключ DeepSeek с защитой DPAPI

В PowerShell сохраните секрет в файл, зашифрованный средствами Windows для текущей учётной записи:

```powershell
$dir = Join-Path $HOME ".config\opencode-secrets"
New-Item -ItemType Directory -Force $dir | Out-Null
Read-Host "DeepSeek API key" -AsSecureString | Export-Clixml (Join-Path $dir "deepseek.xml")
```

Создайте функцию запуска в профиле PowerShell. Ключ будет передан через env; прежнее значение и факт существования переменной восстановятся в `finally`. Нужен PowerShell 7.5+: в нём пустая env-переменная отличается от отсутствующей. На старых версиях этот пример останавливается. DPAPI работает только на Windows под той же учётной записью и на том же компьютере:

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

Перезапустите PowerShell, затем используйте `oc-deepseek`. Для Z.ai и Kimi создайте отдельные файлы `zai.xml` и `kimi.xml` по той же схеме и замените имя переменной на `ZAI_API_KEY` либо `KIMI_API_KEY` в отдельных функциях. Имена переменных должны совпадать с конфигурацией провайдера в OpenCode.

## 10. Linux: OpenCode и секреты

Для Ubuntu/Debian и других дистрибутивов с Node.js LTS и npm:

```bash
node --version
npm install -g @opencode/cli
opencode --version
```

На Linux можно использовать Secret Service (GNOME Keyring / KWallet) через `secret-tool`. Для Debian/Ubuntu:

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

В Bash сохраните ключ блоком выше; его `read -rsp` не предназначен для zsh. Функция запуска ниже подходит Bash и zsh. Добавьте её в `~/.bashrc` или `~/.zshrc`:

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

После открытия нового терминала выполните `oc-deepseek`. Для Z.ai и Kimi используйте отдельные атрибуты `provider zai` и `provider kimi` с переменными `ZAI_API_KEY` и `KIMI_API_KEY` соответственно. Secret Service требует работающего сеанса/разблокированного keyring; на headless-сервере удобнее использовать менеджер секретов либо интерактивный ввод ключа при запуске.

## 11. ChatGPT, VS Code и проверка {#_13-chatgpt-vs-code-и-проверка}

**ChatGPT Plus/Pro не равен OpenAI API.** Для OpenCode используйте официальный доступный способ входа через `/connect`, если он поддерживается вашей версией и регионом. Для OpenAI API нужен отдельный ключ и отдельный учёт использования; возможные кредиты зависят от условий плана. Не вводите пароль ChatGPT в сторонние скрипты.

```bash
cd /path/to/project
opencode
# Внутри: /connect, затем /models
```

В Windows путь может выглядеть как `cd C:\Users\you\Projects\repo`. В VS Code откройте встроенный терминал и запускайте агент из корня Git-репозитория. На первом запуске проверьте чтение файлов, вызовы инструментов, потоковые ответы и списания в кабинете API.

**Безопасность:** никогда не публикуйте API-ключи, не добавляйте секреты в Git, не используйте общие ключи продавцов для приватного кода. Даже при хранении в Keychain/DPAPI/Secret Service ключ на время выполнения доступен процессу агента.

Документация: [OpenCode](https://opencode.ai/docs/) · [Claude Code](https://code.claude.com/docs/en/setup) · [DeepSeek](https://api-docs.deepseek.com/) · [Z.ai](https://docs.z.ai/) · [Kimi](https://platform.moonshot.ai/).

## Устаревшая версия: OpenCode V1 {#opencode-v1-legacy}

Для существующих установок V1 пакет называется `opencode-ai` в npm или `anomalyco/tap/opencode` в Homebrew. В V1 используются `provider` и `options.apiKey`. Пример для существующего проекта на V1:

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

V1 сохраняет учётные данные интерактивного входа в `~/.local/share/opencode/auth.json`; для удаления записи провайдера используйте `opencode auth logout`. В документации расширения VS Code для V1 указаны `Cmd+Esc` (macOS) и `Ctrl+Esc` (Windows/Linux) для открытия или переключения на сессию. Запуск V1 не проверялся. [Установка V1](https://opencode.ai/v1/docs/) · [Провайдеры V1](https://opencode.ai/v1/docs/providers/) · [CLI V1](https://opencode.ai/v1/docs/cli/) · [IDE V1](https://opencode.ai/v1/docs/ide/)

## Источники и границы проверки

Официальная документация просмотрена **18 ноября 2026 года**. Это проверка источников, не подтверждение успешной установки или работы платных API. Подход с v2.3.0 на macOS проверен автором 18.11.2026 в исходном объёме; это не означает проверки каждого провайдера или команды. Windows/DPAPI и Linux/Secret Service на целевых ОС не исполнялись. Проверены только shell-функции с фиктивными ключами и заглушками на macOS. V1 в этом окружении не запускался. 20 ноября 2026 года автор также проверил успешный запрос через Moonshot AI на macOS с ключом Platform из Keychain.

| API / план | Endpoint и модель на дату просмотра | Авторизация и ограничения |
| --- | --- | --- |
| [DeepSeek API](https://api-docs.deepseek.com/) | `https://api.deepseek.com`, `deepseek-flash`; для Claude Code отдельный `/anthropic` | Bearer API key; [tool calls](https://api-docs.deepseek.com/guides/tool_calls/) документированы, но здесь не тестировались |
| [Z.ai API](https://docs.z.ai/guides/overview/quick-start) | `https://api.z.ai/api/paas/v4`, `glm-5.3` | Standard API key; [function calling](https://docs.z.ai/guides/capabilities/function-calling) зависит от модели Автор проверил GLM-4.7-Flash через обычный API на macOS 20 ноября 2026 года. |
| [GLM Coding Plan](https://docs.z.ai/devpack/quick-start) | Chat Completions: `https://api.z.ai/api/coding/paas/v4` | Отдельный ключ плана; только поддерживаемые инструменты. [OpenCode](https://docs.z.ai/devpack/tool/opencode): провайдер Z.AI Coding Plan |
| [Kimi API](https://platform.kimi.ai/docs/get-your-api-key) | `https://api.moonshot.ai/v1`, `kimi-k3.1-pro` | Bearer API key; [tool calls](https://platform.kimi.ai/docs/guide/use-kimi-api-to-complete-tool-calls) документированы. [Интеграция](https://platform.kimi.ai/docs/guide/open-code) основана на V1 1.18.3; это версия источника, не локального теста Автор проверил запрос через провайдера Moonshot AI 20 ноября 2026 года. |
| [Kimi For Coding (kimi.ai)](https://models.opencode.ai/providers/kimi-code-plan-global/) | `https://api.kimi.ai/coding/v1`, `k3.1-pro` | Ключ из консоли Kimi Code через `KIMI_API_KEY` |
| [OpenAI API](https://developers.openai.com/api/reference/overview) | `https://api.openai.com/v1`; ID из `/models` и кабинета | Bearer API key; [function calling](https://developers.openai.com/api/docs/guides/function-calling) зависит от модели. OAuth ChatGPT — отдельный путь, описанный в [OpenCode V2](https://opencode.ai/docs/providers/#chatgpt) |

Инструкция для V2 сверена с разделами [установка](https://opencode.ai/docs/#cli), [конфигурация](https://opencode.ai/docs/config/), [провайдеры](https://opencode.ai/docs/providers/), [CLI](https://opencode.ai/docs/cli/), [вход через CLI](https://opencode.ai/docs/cli/providers/) и [диагностика](https://opencode.ai/docs/troubleshooting/). Перед платным запуском проверьте ID моделей, баланс, доступность в регионе и условия обработки данных.
