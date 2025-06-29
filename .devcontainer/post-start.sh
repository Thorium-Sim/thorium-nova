#!/bin/bash
# .devcontainer/post-start.sh

echo "🔄 Starting Thorium Nova development environment..."

# Wait for AI services to be healthy
echo "⏳ Waiting for AI services to be ready..."

# Wait for DeepSeek
echo "Checking DeepSeek API..."
until curl -s http://deepseek-api:8000/health > /dev/null 2>&1; do
  echo "DeepSeek not ready, waiting..."
  sleep 5
done
echo "✅ DeepSeek API is ready!"

# Wait for Ollama
echo "Checking Ollama..."
until curl -s http://ollama:11434/api/tags > /dev/null 2>&1; do
  echo "Ollama not ready, waiting..."
  sleep 5
done
echo "✅ Ollama is ready!"

# Wait for ComfyUI
echo "Checking ComfyUI..."
until curl -s http://comfyui:8188/system_stats > /dev/null 2>&1; do
  echo "ComfyUI not ready, waiting..."
  sleep 5
done
echo "✅ ComfyUI is ready!"

# Wait for Redis
echo "Checking Redis..."
until nc -z redis 6379; do
  echo "Redis not ready, waiting..."
  sleep 2
done
echo "✅ Redis is ready!"

# Test AI service connections
echo "🧪 Testing AI service connections..."
node -e "
const test = async () => {
  try {
    const deepseekResponse = await fetch('http://deepseek-api:8000/health');
    console.log('DeepSeek status:', deepseekResponse.status);
    
    const ollamaResponse = await fetch('http://ollama:11434/api/tags');
    console.log('Ollama status:', ollamaResponse.status);
    
    const comfyuiResponse = await fetch('http://comfyui:8188/system_stats');
    console.log('ComfyUI status:', comfyuiResponse.status);
  } catch (error) {
    console.error('Connection test failed:', error.message);
  }
};
test();
"

# Download initial Ollama models in background
echo "🔄 Starting Ollama model downloads in background..."
bash scripts/setup-ollama-models.sh &

echo "🎉 All services are ready! Happy coding!"