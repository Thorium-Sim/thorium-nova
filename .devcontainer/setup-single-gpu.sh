#!/bin/bash
# .devcontainer/setup-single-gpu.sh

echo "🚀 Setting up Thorium Nova with GPU support..."

# Function to check if GPU is available
check_gpu() {
    if command -v nvidia-smi &> /dev/null; then
        nvidia-smi &> /dev/null
        return $?
    else
        return 1
    fi
}

# Display GPU status
if check_gpu; then
    echo "🎮 GPU detected!"
    nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv
else
    echo "⚠️  No GPU detected. Some AI features will run in CPU mode."
fi

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

# Create environment file with GPU settings
echo "⚙️ Creating environment file..."
cat > .env.local << EOF
# AI Service Endpoints (will connect to host Docker)
OLLAMA_ENDPOINT=http://host.docker.internal:11434
COMFYUI_ENDPOINT=http://host.docker.internal:8188
DEEPSEEK_ENDPOINT=http://host.docker.internal:8000
REDIS_ENDPOINT=redis://host.docker.internal:6379

# AI Configuration
AI_AGENTS_ENABLED=true
MAX_AI_AGENTS=4
AI_MODEL_PREFERENCE=gpu

# GPU Configuration
CUDA_VISIBLE_DEVICES=0
ENABLE_GPU_ACCELERATION=true

# Development
NODE_ENV=development
DEBUG=thorium:ai
EOF

# Copy GPU-enabled management script
echo "📋 Setting up GPU-enabled AI service manager..."
cp /workspaces/thorium-nova-ai/scripts/manage-ai-services-gpu.sh scripts/manage-ai-services.sh
chmod +x scripts/manage-ai-services.sh

# Install Python AI dependencies if GPU is available
if check_gpu; then
    echo "🐍 Installing Python AI dependencies for GPU..."
    pip3 install --upgrade pip
    pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
    pip3 install transformers accelerate diffusers
fi

# Start AI services with GPU support
echo "🔄 Starting AI services..."
bash scripts/manage-ai-services.sh start

# Wait for services to initialize
echo "⏳ Waiting for services to initialize..."
sleep 10

# Run initial tests
echo "🧪 Running initial tests..."
bash scripts/manage-ai-services.sh test

echo "✅ GPU-enabled setup complete!"
echo ""
echo "🎯 Quick start commands:"
echo "  bun run dev                          - Start Thorium Nova"
echo "  scripts/manage-ai-services.sh status - Check AI services"
echo "  scripts/manage-ai-services.sh test   - Test AI connections"
echo "  scripts/manage-ai-services.sh logs   - View service logs"
echo ""

if check_gpu; then
    echo "🎮 GPU Features Enabled:"
    echo "  - Accelerated LLM inference with Ollama"
    echo "  - GPU-powered image generation with ComfyUI"
    echo "  - CUDA-accelerated model loading"
else
    echo "⚠️  Running in CPU mode. For best performance, ensure:"
    echo "  - NVIDIA GPU drivers are installed on the host"
    echo "  - Docker has GPU support enabled"
    echo "  - Restart the devcontainer after installing drivers"
fi