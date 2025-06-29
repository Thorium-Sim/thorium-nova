#!/bin/bash
# .devcontainer/post-create.sh

echo "🚀 Setting up Thorium Nova development environment..."

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Setup git hooks
echo "🔧 Setting up git hooks..."
git config --global --add safe.directory /workspace
git config core.fileMode false

# Create AI services directories
echo "🤖 Setting up AI services directories..."
mkdir -p src/server/src/ai-services/{deepseek,comfyui,agents,shared}
mkdir -p assets/ai-generated/{portraits,textures,sounds}

# Setup environment files
echo "⚙️ Creating environment configuration..."
if [ ! -f .env.local ]; then
cat > .env.local << EOF
# AI Service Endpoints
DEEPSEEK_ENDPOINT=http://deepseek-api:8000
OLLAMA_ENDPOINT=http://ollama:11434
COMFYUI_ENDPOINT=http://comfyui:8188
REDIS_URL=redis://redis:6379

# AI Configuration
AI_AGENTS_ENABLED=true
MAX_AI_AGENTS=4
AI_RESPONSE_TIMEOUT=30000
AI_IMAGE_GENERATION=true
OLLAMA_DEFAULT_MODEL=llama3.2:3b

# Development
NODE_ENV=development
DEBUG=thorium:ai,thorium:agents
EOF
fi

# Initialize AI service configurations
echo "🧠 Initializing AI configurations..."
mkdir -p config/ai-services

cat > config/ai-services/deepseek.json << EOF
{
  "model": "deepseek-chat",
  "temperature": 0.7,
  "maxTokens": 2000,
  "systemPrompts": {
    "agent": "You are a crew member on a starship. Respond in character based on your role and personality.",
    "npc": "You are creating an NPC for a space simulation. Be creative but consistent with sci-fi themes.",
    "story": "You are helping to create an engaging story moment in a space adventure."
  }
}
EOF

cat > config/ai-services/ollama.json << EOF
{
  "defaultModel": "llama3.2:3b",
  "availableModels": [
    "llama3.2:3b",
    "llama3.2:1b",
    "mistral:7b",
    "codellama:7b",
    "neural-chat:7b"
  ],
  "modelConfigs": {
    "agent": {
      "model": "llama3.2:3b",
      "temperature": 0.7,
      "top_p": 0.9,
      "num_ctx": 2048
    },
    "creative": {
      "model": "llama3.2:3b",
      "temperature": 0.9,
      "top_p": 0.95,
      "num_ctx": 4096
    },
    "analytical": {
      "model": "mistral:7b",
      "temperature": 0.3,
      "top_p": 0.8,
      "num_ctx": 8192
    }
  },
  "systemPrompts": {
    "agent": "You are a crew member on a starship. Respond in character based on your role and personality. Keep responses concise but engaging.",
    "npc": "You are creating an NPC for a space simulation. Be creative but consistent with sci-fi themes. Provide rich character details.",
    "story": "You are helping to create an engaging story moment in a space adventure. Focus on drama and character development."
  }
}
EOF
{
  "model": "deepseek-chat",
  "temperature": 0.7,
  "maxTokens": 2000,
  "systemPrompts": {
    "agent": "You are a crew member on a starship. Respond in character based on your role and personality.",
    "npc": "You are creating an NPC for a space simulation. Be creative but consistent with sci-fi themes.",
    "story": "You are helping to create an engaging story moment in a space adventure."
  }
}
EOF

cat > config/ai-services/comfyui.json << EOF
{
  "workflows": {
    "npc_portrait": "workflows/npc_portrait.json",
    "planet_texture": "workflows/planet_texture.json",
    "ship_design": "workflows/ship_design.json"
  },
  "defaultSettings": {
    "width": 512,
    "height": 512,
    "steps": 20,
    "cfg": 7.0
  }
}
EOF

# Create sample workflows directory
mkdir -p workflows

# Create initial ComfyUI workflows
echo "🎨 Setting up ComfyUI workflows..."
mkdir -p comfyui-workflows

cat > comfyui-workflows/npc_portrait_basic.json << 'EOF'
{
  "1": {
    "inputs": {
      "text": "portrait of alien character, sci-fi, detailed, high quality",
      "clip": ["4", 1]
    },
    "class_type": "CLIPTextEncode"
  },
  "2": {
    "inputs": {
      "text": "blurry, low quality, cartoon",
      "clip": ["4", 1]
    },
    "class_type": "CLIPTextEncode"
  },
  "3": {
    "inputs": {
      "seed": 42,
      "steps": 20,
      "cfg": 7.0,
      "sampler_name": "euler",
      "scheduler": "normal",
      "denoise": 1.0,
      "model": ["4", 0],
      "positive": ["1", 0],
      "negative": ["2", 0],
      "latent_image": ["5", 0]
    },
    "class_type": "KSampler"
  },
  "4": {
    "inputs": {
      "ckpt_name": "v1-5-pruned-emaonly.ckpt"
    },
    "class_type": "CheckpointLoaderSimple"
  },
  "5": {
    "inputs": {
      "width": 512,
      "height": 512,
      "batch_size": 1
    },
    "class_type": "EmptyLatentImage"
  },
  "6": {
    "inputs": {
      "samples": ["3", 0],
      "vae": ["4", 2]
    },
    "class_type": "VAEDecode"
  },
  "7": {
    "inputs": {
      "filename_prefix": "npc_portrait",
      "images": ["6", 0]
    },
    "class_type": "SaveImage"
  }
}
EOF

# Setup Ollama models download script
cat > scripts/setup-ollama-models.sh << 'EOF'
#!/bin/bash
echo "📥 Setting up Ollama models..."

# Wait for Ollama to be ready
echo "Waiting for Ollama to start..."
until curl -s http://ollama:11434/api/tags > /dev/null 2>&1; do
  sleep 5
done

# Pull recommended models for AI agents
echo "Downloading llama3.2:3b (lightweight, good for agents)..."
curl -X POST http://ollama:11434/api/pull -d '{"name": "llama3.2:3b"}'

echo "Downloading llama3.2:1b (ultra-lightweight for simple responses)..."
curl -X POST http://ollama:11434/api/pull -d '{"name": "llama3.2:1b"}'

echo "Downloading mistral:7b (analytical tasks)..."
curl -X POST http://ollama:11434/api/pull -d '{"name": "mistral:7b"}'

echo "✅ Ollama models setup complete!"
EOF

chmod +x scripts/setup-ollama-models.sh

echo "✅ Post-create setup complete!"