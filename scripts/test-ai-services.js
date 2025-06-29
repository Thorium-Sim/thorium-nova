// scripts/test-ai-services.js
import net from 'net';

async function testServices() {
  console.log('🧪 Testing AI Services...\n');
  
  // Test DeepSeek
  try {
    const deepseekResponse = await fetch('http://172.17.0.1:8000/v1/models');
    const deepseekData = await deepseekResponse.json();
    console.log('✅ DeepSeek API: Connected');
    console.log('   Available models:', deepseekData.data?.map(m => m.id) || 'Unknown');
  } catch (error) {
    console.log('❌ DeepSeek API: Failed -', error.message);
  }
  
  // Test Ollama
  try {
    const ollamaResponse = await fetch('http://172.17.0.1:11434/api/tags');
    const ollamaData = await ollamaResponse.json();
    console.log('✅ Ollama: Connected');
    console.log('   Available models:', ollamaData.models?.map(m => m.name) || 'None downloaded yet');
    
    // Test generation
    const testGenResponse = await fetch('http://172.17.0.1:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:3b',
        prompt: 'Hello, respond with just "AI test successful"',
        stream: false
      })
    });
    if (testGenResponse.ok) {
      console.log('   Generation test: ✅ Working');
    }
  } catch (error) {
    console.log('❌ Ollama: Failed -', error.message);
  }
  
  // Test ComfyUI
  try {
    const comfyuiResponse = await fetch('http://172.17.0.1:8188/system_stats');
    const comfyuiData = await comfyuiResponse.json();
    console.log('✅ ComfyUI: Connected');
    console.log('   System info:', comfyuiData.system || 'Available');
  } catch (error) {
    console.log('❌ ComfyUI: Failed -', error.message);
  }
  
  // Test Redis
  try {
    const socket = new net.Socket();
    await new Promise((resolve, reject) => {
      socket.connect(6379, '172.17.0.1', resolve);
      socket.on('error', reject);
      setTimeout(() => reject(new Error('Timeout')), 5000);
    });
    socket.destroy();
    console.log('✅ Redis: Connected');
  } catch (error) {
    console.log('❌ Redis: Failed -', error.message);
  }
  
  console.log('\n🎉 Service test complete!');
}

testServices().catch(console.error);