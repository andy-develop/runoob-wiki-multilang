#!/bin/bash
# 翻译守护脚本：监控翻译进程，卡住或退出时自动重启
BASE="/Users/andy/Downloads/wiki-multilang"
LOG="/tmp/llm_translate_en.log"
WATCHDOG_LOG="/tmp/translate_watchdog.log"
START_TIME=$(date +%s)

while true; do
    sleep 300  # 每5分钟检查一次

    # 检查翻译进程是否存在
    PID=$(pgrep -f "translate_llm.py en" | head -1)
    if [ -z "$PID" ]; then
        echo "$(date '+%Y-%m-%d %H:%M:%S') 翻译进程不存在，重启" >> "$WATCHDOG_LOG"
        cd "$BASE" && nohup python3 translate_llm.py en 2 >> "$LOG" 2>&1 &
        START_TIME=$(date +%s)
        continue
    fi

    # 进程启动不到10分钟，跳过卡住检查
    ELAPSED=$(( $(date +%s) - START_TIME ))
    if [ "$ELAPSED" -lt 600 ]; then
        continue
    fi

    # 检查最近10分钟是否有文件被修改（判断是否卡住）
    MODIFIED=$(find "$BASE/en" -name "*.html" -mmin -10 2>/dev/null | wc -l)
    if [ "$MODIFIED" -eq 0 ]; then
        echo "$(date '+%Y-%m-%d %H:%M:%S') 翻译卡住(10分钟无文件修改)，杀掉并重启" >> "$WATCHDOG_LOG"
        kill -9 "$PID" 2>/dev/null
        sleep 3
        # 重启Ollama（不杀掉主进程，只杀llama-server）
        pkill -f "llama-server" 2>/dev/null
        sleep 5
        # 确保Ollama主进程在运行
        if ! pgrep -f "ollama serve" > /dev/null; then
            open -a Ollama
            sleep 10
        fi
        cd "$BASE" && nohup python3 translate_llm.py en 2 >> "$LOG" 2>&1 &
        START_TIME=$(date +%s)
    fi
done
