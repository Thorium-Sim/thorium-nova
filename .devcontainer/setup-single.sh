#!/bin/bash
# .devcontainer/setup-single.sh

echo "🚀 Setting up Thorium Nova in single container..."

# Install Bun
echo "📦 Installing Bun..."
curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"

# Install project dependencies
echo "📦 Installing project dependencies..."
cd /workspace
bun install || echo "Will install when Thorium project is ready"

# Setup directories
echo "📁 Creating AI service directories..."
mkdir -p src/server/src/ai-services/{ollama,comfyui,agents,shared}
mkdir -p assets/ai-generated/{portraits,textures,sounds}
mkdir -p scripts

# Create environment file
echo "⚙️ Creating environment file..."
cat > .env.local << EOF
# AI Service Endpoints (will connect to host Docker)
OLLAMA_ENDPOINT=http://host.docker.internal:11434
COMFYUI_ENDPOINT=http://host.docker.internal:8188

# AI Configuration
AI_AGENTS_ENABLED=true
MAX_AI_AGENTS=4

# Development
NODE_ENV=development
DEBUG=thorium:ai
EOF

# Create AI service management script
cat > scripts/manage-ai-services.sh << 'EOF'
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
EOF

chmod +x scripts/manage-ai-services.sh

# Start AI services
echo "🔄 Starting AI services..."
bash scripts/manage-ai-services.sh start

echo "✅ Setup complete!"
echo ""
echo "🎯 Quick start commands:"
echo "  bun run dev              - Start Thorium Nova"
echo "  scripts/manage-ai-services.sh status - Check AI services"
echo "  scripts/manage-ai-services.sh test   - Test AI connections"