#!/bin/bash
# .devcontainer/setup.sh

echo "🚀 Setting up Thorium Nova development environment..."

# Install dependencies
echo "📦 Installing dependencies..."
bun install || echo "Will install dependencies when Thorium project is ready"

# Setup git
echo "🔧 Setting up git..."
git config --global --add safe.directory /workspace

# Create directories
echo "📁 Creating directories..."
mkdir -p src/server/src/ai-services/{ollama,comfyui,agents,shared}
mkdir -p assets/ai-generated/{portraits,textures,sounds}
mkdir -p scripts

# Create environment file
echo "⚙️ Creating environment file..."
cat > .env.local << EOF
# AI Service Endpoints
OLLAMA_ENDPOINT=http://ollama:11434
COMFYUI_ENDPOINT=http://comfyui:8188

# AI Configuration
AI_AGENTS_ENABLED=true
MAX_AI_AGENTS=4

# Development
NODE_ENV=development
DEBUG=thorium:ai
EOF

# Create test script
cat > scripts/test-services.sh << 'EOF'
#!/bin/bash
echo "🧪 Testing AI services..."

echo "Testing Ollama..."
curl -s http://ollama:11434/api/tags && echo "✅ Ollama OK" || echo "❌ Ollama failed"

echo "Testing ComfyUI..."
curl -s http://comfyui:8188/system_stats && echo "✅ ComfyUI OK" || echo "❌ ComfyUI failed"
EOF

chmod +x scripts/test-services.sh

echo "✅ Setup complete!"