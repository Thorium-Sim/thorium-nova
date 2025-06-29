#!/bin/bash
# Run this script on your HOST machine (not inside the devcontainer)

echo "🚀 Starting ComfyUI with GPU support on host..."

# Check for GPU
if command -v nvidia-smi &> /dev/null && nvidia-smi &> /dev/null; then
    echo "🎮 GPU detected! Enabling GPU acceleration..."
    
    # Start ComfyUI with GPU
    docker run -d --name thorium-comfyui \
      -p 8188:8188 \
      -v thorium_comfyui_data:/app \
      -v thorium_comfyui_models:/app/models \
      -v thorium_comfyui_output:/app/output \
      --restart unless-stopped \
      --gpus all \
      -e NVIDIA_VISIBLE_DEVICES=all \
      -e NVIDIA_DRIVER_CAPABILITIES=compute,utility \
      yanwk/comfyui-boot:latest
else
    echo "⚠️  No GPU detected. Starting in CPU mode..."
    
    # Start ComfyUI with CPU
    docker run -d --name thorium-comfyui \
      -p 8188:8188 \
      -v thorium_comfyui_data:/app \
      -v thorium_comfyui_models:/app/models \
      -v thorium_comfyui_output:/app/output \
      --restart unless-stopped \
      -e COMMANDLINE_ARGS="--cpu" \
      yanwk/comfyui-boot:latest
fi

# Also start other AI services
echo "Starting Ollama..."
docker run -d --name thorium-ollama \
  -p 11434:11434 \
  -v thorium_ollama_data:/root/.ollama \
  --restart unless-stopped \
  ${GPU_FLAGS:+--gpus all} \
  ollama/ollama:latest

echo "Starting Redis..."
docker run -d --name thorium-redis \
  -p 6379:6379 \
  -v thorium_redis_data:/data \
  --restart unless-stopped \
  redis:7-alpine

echo "✅ Services started! Waiting for initialization..."
sleep 10

# Test ComfyUI
echo "Testing ComfyUI..."
if curl -s http://localhost:8188/system_stats > /dev/null 2>&1; then
    echo "✅ ComfyUI is running at http://localhost:8188"
else
    echo "❌ ComfyUI failed to start. Check logs with: docker logs thorium-comfyui"
fi

# Show GPU status if available
if command -v nvidia-smi &> /dev/null; then
    echo ""
    echo "📊 GPU Status:"
    nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu --format=csv
fi