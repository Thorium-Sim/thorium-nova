# GPU-Enabled Development Container Setup

This guide explains how to use the GPU-enabled development container for Thorium Nova AI.

## Prerequisites

### Host System Requirements
- NVIDIA GPU (GTX 1060 or better recommended)
- NVIDIA drivers installed (version 470+ recommended)
- Docker with NVIDIA Container Toolkit
- Visual Studio Code with Dev Containers extension

### Installing NVIDIA Container Toolkit

**Ubuntu/Debian:**
```bash
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit
sudo systemctl restart docker
```

**Windows (WSL2):**
1. Install NVIDIA GPU drivers for WSL from: https://developer.nvidia.com/cuda/wsl
2. Ensure Docker Desktop has WSL2 backend enabled
3. Enable GPU support in Docker Desktop settings

## Using the GPU-Enabled Container

### Option 1: Switch Existing Container to GPU Mode

1. Open the Command Palette (Ctrl/Cmd + Shift + P)
2. Run "Dev Containers: Rebuild Container"
3. When prompted for configuration, choose `.devcontainer/devcontainer.gpu.json`

### Option 2: Fresh Setup with GPU Support

1. Clone the repository
2. Open in VS Code
3. When prompted to open in container, click "Show Configuration"
4. Select `.devcontainer/devcontainer.gpu.json`
5. Click "Reopen in Container"

## Verifying GPU Setup

Once the container is running, verify GPU access:

```bash
# Check if GPU is detected
nvidia-smi

# Check AI services status
scripts/manage-ai-services.sh status

# Test AI services
scripts/manage-ai-services.sh test
```

## GPU vs CPU Mode

The setup automatically detects GPU availability:

### GPU Mode (NVIDIA GPU Available)
- Full ComfyUI image generation capabilities
- Accelerated Ollama model inference
- Support for larger AI models
- Real-time image processing

### CPU Mode (No GPU)
- Limited ComfyUI functionality
- Slower model inference
- Restricted to smaller models
- Basic AI features only

## Troubleshooting

### GPU Not Detected in Container

1. Verify host GPU drivers:
   ```bash
   nvidia-smi  # Run on host system
   ```

2. Check Docker GPU support:
   ```bash
   docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi
   ```

3. Ensure devcontainer is using GPU configuration:
   - Check that `.devcontainer/devcontainer.gpu.json` is being used
   - Rebuild container if needed

### ComfyUI Failing to Start

If ComfyUI keeps restarting:
```bash
# Check logs
scripts/manage-ai-services.sh logs comfyui

# Try CPU mode if GPU issues persist
docker exec thorium-comfyui python main.py --cpu
```

### Performance Issues

1. Monitor GPU usage:
   ```bash
   watch -n 1 nvidia-smi
   ```

2. Check available GPU memory before loading large models

3. Adjust model sizes based on available VRAM

## Switching Between GPU and CPU Modes

To switch between configurations:

1. **GPU → CPU**: Rebuild with `.devcontainer/devcontainer.json`
2. **CPU → GPU**: Rebuild with `.devcontainer/devcontainer.gpu.json`

The management scripts automatically detect and adapt to available hardware.