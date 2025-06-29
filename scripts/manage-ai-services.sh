#!/bin/bash
# AI Services Manager

case "$1" in
  start)
    echo "🚀 Starting AI services..."
    
    # Start Ollama
    echo "Starting Ollama..."
    docker run -d --name thorium-ollama \
      -p 11434:11434 \
      -v thorium_ollama_data:/root/.ollama \
      --restart unless-stopped \
      ollama/ollama:latest
    
    # Start ComfyUI
    echo "Starting ComfyUI..."
    docker run -d --name thorium-comfyui \
      -p 8188:8188 \
      -v thorium_comfyui_data:/app \
      --restart unless-stopped \
      yanwk/comfyui-boot:latest
    
    echo "✅ AI services started!"
    ;;
    
  stop)
    echo "🛑 Stopping AI services..."
    docker stop thorium-ollama thorium-comfyui 2>/dev/null || true
    docker rm thorium-ollama thorium-comfyui 2>/dev/null || true
    echo "✅ AI services stopped!"
    ;;
    
  status)
    echo "📊 AI Services Status:"
    echo "Ollama: $(docker inspect -f '{{.State.Status}}' thorium-ollama 2>/dev/null || echo 'not running')"
    echo "ComfyUI: $(docker inspect -f '{{.State.Status}}' thorium-comfyui 2>/dev/null || echo 'not running')"
    ;;
    
  test)
    echo "🧪 Testing AI services..."
    echo "Testing Ollama..."
    curl -s http://localhost:11434/api/tags && echo "✅ Ollama OK" || echo "❌ Ollama failed"
    echo "Testing ComfyUI..."
    curl -s http://localhost:8188/system_stats && echo "✅ ComfyUI OK" || echo "❌ ComfyUI failed"
    ;;
    
  *)
    echo "Usage: $0 {start|stop|status|test}"
    exit 1
    ;;
esac
