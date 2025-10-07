<template>
  <div ref="mermaidContainer" class="mermaid-container">
    <div ref="mermaidElement" class="mermaid" v-html="output"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import mermaid from 'mermaid'
import mediumZoom from 'medium-zoom'

interface Props {
  code: string
  id?: string
}

const props = defineProps<Props>()
const mermaidElement = ref<HTMLElement>()
const mermaidContainer = ref<HTMLElement>()
const output = ref('')

onMounted(async () => {
  // 初始化 mermaid
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    fontFamily: 'inherit'
  })

  // 生成唯一ID
  const id = props.id || `mermaid-${Math.random().toString(36).substr(2, 9)}`

  // 解码代码
  const decodedCode = decodeURIComponent(props.code)

  try {
    // 渲染图表
    const { svg } = await mermaid.render(id, decodedCode)
    output.value = svg

    // 等待 DOM 更新后应用缩放功能
    await nextTick()

    if (mermaidElement.value) {
      const svgElement = mermaidElement.value.querySelector('svg')
      if (svgElement) {
        // 为 SVG 添加样式，使其可点击
        svgElement.style.cursor = 'zoom-in'
        svgElement.style.transition = 'opacity 0.2s'

        // 应用 medium-zoom
        mediumZoom(svgElement, {
          background: 'rgba(0, 0, 0, 0.9)',
          margin: 48
        })

        // 添加悬停效果
        svgElement.addEventListener('mouseenter', () => {
          svgElement.style.opacity = '0.85'
        })
        svgElement.addEventListener('mouseleave', () => {
          svgElement.style.opacity = '1'
        })
      }
    }
  } catch (error) {
    console.error('Mermaid rendering error:', error)
    output.value = `<div class="mermaid-error">Error rendering diagram: ${error}</div>`
  }
})
</script>

<style scoped>
.mermaid-container {
  text-align: center;
  margin: 1rem 0;
}

.mermaid {
  display: inline-block;
}

.mermaid-error {
  color: #e74c3c;
  padding: 1rem;
  border: 1px solid #e74c3c;
  border-radius: 4px;
  background-color: #fdf2f2;
}
</style>
