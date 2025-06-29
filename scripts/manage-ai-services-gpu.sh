#!/bin/bash
# AI Services Manager with GPU Support

# Function to check if GPU is available
check_gpu() {
    if command -v nvidia-smi &> /dev/null; then
        nvidia-smi &> /dev/null
        return $?
    else
        return 1
    fi
}

# Set GPU flags based on availability
GPU_FLAGS=""
if check_gpu; then
    echo "🎮 GPU detected! Enabling GPU acceleration..."
    GPU_FLAGS="--gpus all"
else
    echo "⚠️  No GPU detected. Running in CPU mode..."
fi

case "$1" in
  start)
    echo "🚀 Starting AI services..."
    
    # Start Ollama with GPU support if available
    echo "Starting Ollama..."
    docker run -d --name thorium-ollama \
      -p 11434:11434 \
      -v thorium_ollama_data:/root/.ollama \
      --restart unless-stopped \
      $GPU_FLAGS \
      ollama/ollama:latest
    
    # Start ComfyUI with GPU support
    echo "Starting ComfyUI..."
    if [ -n "$GPU_FLAGS" ]; then
        # GPU-enabled ComfyUI
        docker run -d --name thorium-comfyui \
          -p 8188:8188 \
          -v thorium_comfyui_data:/app \
          -v thorium_comfyui_models:/app/models \
          -v thorium_comfyui_output:/app/output \
          --restart unless-stopped \
          $GPU_FLAGS \
          -e NVIDIA_VISIBLE_DEVICES=all \
          -e NVIDIA_DRIVER_CAPABILITIES=compute,utility \
          yanwk/comfyui-boot:latest
    else
        # CPU-only ComfyUI (lighter image)
        echo "⚠️  Starting ComfyUI in CPU mode (limited functionality)..."
        docker run -d --name thorium-comfyui \
          -p 8188:8188 \
          -v thorium_comfyui_data:/app \
          -v thorium_comfyui_models:/app/models \
          -v thorium_comfyui_output:/app/output \
          --restart unless-stopped \
          -e COMMANDLINE_ARGS="--cpu" \
          yanwk/comfyui-boot:latest
    fi
    
    # Start Redis for caching
    echo "Starting Redis..."
    docker run -d --name thorium-redis \
      -p 6379:6379 \
      -v thorium_redis_data:/data \
      --restart unless-stopped \
      redis:7-alpine
    
    echo "✅ AI services started!"
    
    # Wait a moment for services to initialize
    sleep 5
    
    # Install default models if Ollama is empty
    if docker exec thorium-ollama ollama list 2>&1 | grep -q "No models"; then
        echo "📦 Installing default Ollama models..."
        docker exec thorium-ollama ollama pull llama2:7b
        docker exec thorium-ollama ollama pull codellama:7b
    fi
    ;;
    
  stop)
    echo "🛑 Stopping AI services..."
    docker stop thorium-ollama thorium-comfyui thorium-redis 2>/dev/null || true
    docker rm thorium-ollama thorium-comfyui thorium-redis 2>/dev/null || true
    echo "✅ AI services stopped!"
    ;;
    
  status)
    echo "📊 AI Services Status:"
    echo "GPU Available: $(check_gpu && echo 'Yes' || echo 'No')"
    echo "Ollama: $(docker inspect -f '{{.State.Status}}' thorium-ollama 2>/dev/null || echo 'not running')"
    echo "ComfyUI: $(docker inspect -f '{{.State.Status}}' thorium-comfyui 2>/dev/null || echo 'not running')"
    echo "Redis: $(docker inspect -f '{{.State.Status}}' thorium-redis 2>/dev/null || echo 'not running')"
    
    if check_gpu; then
        echo ""
        echo "📊 GPU Status:"
        nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu --format=csv,noheader
    fi
    ;;
    
  test)
    echo "🧪 Testing AI services..."
    
    echo "Testing Ollama..."
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "✅ Ollama OK"
        echo "   Models: $(docker exec thorium-ollama ollama list 2>/dev/null | tail -n +2 | wc -l)"
    else
        echo "❌ Ollama failed"
    fi
    
    echo "Testing ComfyUI..."
    if curl -s http://localhost:8188/system_stats > /dev/null 2>&1; then
        echo "✅ ComfyUI OK"
        if check_gpu; then
            echo "   GPU Mode: Enabled"
        else
            echo "   CPU Mode: Active (limited performance)"
        fi
    else
        echo "❌ ComfyUI failed"
    fi
    
    echo "Testing Redis..."
    if docker exec thorium-redis redis-cli ping > /dev/null 2>&1; then
        echo "✅ Redis OK"
    else
        echo "❌ Redis failed"
    fi
    ;;
    
  logs)
    echo "📜 Showing logs for $2..."
    case "$2" in
      ollama)
        docker logs -f thorium-ollama
        ;;
      comfyui)
        docker logs -f thorium-comfyui
        ;;
      redis)
        docker logs -f thorium-redis
        ;;
      *)
        echo "Usage: $0 logs {ollama|comfyui|redis}"
        ;;
    esac
    ;;
    
  *)
    echo "Usage: $0 {start|stop|status|test|logs}"
    exit 1
    ;;
esac