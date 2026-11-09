/**
 * [Site Domain / Facade -> Image Quantizer & Preset Art Scenes]
 * 包含前端专用 4 幅艺术演示画布场景与 @sandlada/okyct 图像量化适配器转发。
 */

export * from '@sandlada/okyct/adapters';

export interface PresetArtScene {
  id: string;
  name: string;
  subtitle: string;
  drawScene: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
}

/**
 * 内置 4 幅高动态范围艺术测试画布场景（零外部图片 URL 依赖，100% 离线确定性渲染）
 */
export const PRESET_ART_SCENES: PresetArtScene[] = [
  {
    id: 'aurora',
    name: '极光冰川',
    subtitle: '青绿极光与深邃夜空紫',
    drawScene: (ctx, w, h) => {
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#09152B');
      bg.addColorStop(0.5, '#00A884');
      bg.addColorStop(1, '#5E35B1');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#00E5FF';
      ctx.beginPath();
      ctx.arc(w * 0.3, h * 0.4, w * 0.25, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1DE9B6';
      ctx.beginPath();
      ctx.arc(w * 0.7, h * 0.55, w * 0.22, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    id: 'sunset-amber',
    name: '落日熔金',
    subtitle: '绯红晚霞与琥珀金海岸',
    drawScene: (ctx, w, h) => {
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#C2185B');
      bg.addColorStop(0.55, '#FF6F00');
      bg.addColorStop(1, '#283593');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#FFD54F';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.42, w * 0.2, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    id: 'botanical',
    name: '热带雨林',
    subtitle: '翡翠阔叶与鹤望兰橙花',
    drawScene: (ctx, w, h) => {
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#1B5E20');
      bg.addColorStop(0.6, '#2E7D32');
      bg.addColorStop(1, '#004D40');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#FF5722';
      ctx.beginPath();
      ctx.arc(w * 0.65, h * 0.38, w * 0.18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#8BC34A';
      ctx.beginPath();
      ctx.arc(w * 0.28, h * 0.65, w * 0.22, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    id: 'cyber-atelier',
    name: '霓虹赛博',
    subtitle: '电光品红与钴蓝暗夜',
    drawScene: (ctx, w, h) => {
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#1A237E');
      bg.addColorStop(0.5, '#AD1457');
      bg.addColorStop(1, '#00838F');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#FF4081';
      ctx.fillRect(w * 0.15, h * 0.2, w * 0.35, h * 0.45);

      ctx.fillStyle = '#2979FF';
      ctx.fillRect(w * 0.52, h * 0.35, w * 0.35, h * 0.45);
    },
  },
];
