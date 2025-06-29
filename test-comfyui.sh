#!/bin/bash
# Test ComfyUI connectivity from inside the devcontainer

echo "🧪 Testing ComfyUI connectivity..."

# Test using localhost (if ports are forwarded)
echo "Testing localhost:8188..."
if curl -s http://localhost:8188/system_stats > /dev/null 2>&1; then
    echo "✅ ComfyUI accessible at http://localhost:8188"
    curl -s http://localhost:8188/system_stats | jq . 2>/dev/null || curl -s http://localhost:8188/system_stats
else
    echo "❌ ComfyUI not accessible at localhost:8188"
fi

echo ""
echo "Testing host.docker.internal:8188..."
if curl -s http://host.docker.internal:8188/system_stats > /dev/null 2>&1; then
    echo "✅ ComfyUI accessible at http://host.docker.internal:8188"
else
    echo "❌ ComfyUI not accessible at host.docker.internal:8188"
fi

# Test other services
echo ""
echo "Testing other AI services..."

if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama running at localhost:11434"
else
    echo "❌ Ollama not running"
fi

if nc -zv localhost 6379 2>&1 | grep -q succeeded; then
    echo "✅ Redis running at localhost:6379"
else
    echo "❌ Redis not running"
fi