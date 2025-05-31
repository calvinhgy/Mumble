# AI提示词模板库

## 1. 核心提示词模板

以下模板是Mumble应用中用于图像生成的核心提示词结构。这些模板将根据用户输入和环境数据动态填充。

### 1.1 通用基础模板

```
一幅{style}风格的作品，描绘了{subject}{action}在{environment}中的场景，整体氛围{emotion}，{weather_description}，{time_description}，{technical_params}。
```

### 1.2 场景特定模板

#### 城市场景模板

```
一幅{style}风格的{city_name}城市景观，展现了{landmark_or_street}，{human_activity}，在{time_of_day}的{weather_condition}下，{light_description}照亮了场景，营造出{emotion}的氛围，{technical_params}。
```

#### 自然场景模板

```
一幅{style}风格的自然风景，展示了{location_name}的{natural_element}，{weather_description}为场景增添了{emotion}氛围，{time_of_day}的光线{light_quality}，{technical_params}。
```

#### 抽象概念模板

```
一幅{style}风格的抽象表现，通过{visual_elements}象征性地表达{abstract_concept}，色彩以{color_scheme}为主，营造出{emotion}的感觉，受到{location_name}的{weather_condition}和{time_of_day}的启发，{technical_params}。
```

### 1.3 情感特定模板

#### 喜悦/兴奋模板

```
一幅充满活力的{style}作品，以明亮的色彩和动态构图捕捉{subject}{energetic_action}的瞬间，在{environment}中洋溢着欢乐的氛围，{weather_and_time}增强了场景的喜悦感，{technical_params}。
```

#### 沉思/平静模板

```
一幅平静的{style}作品，以柔和的色调和和谐的构图展现{subject}在{environment}中{calm_action}的场景，{weather_and_time}营造出宁静的氛围，整体透露出沉思的情绪，{technical_params}。
```

#### 忧郁/悲伤模板

```
一幅情感深沉的{style}作品，通过低饱和度的色彩和强烈的明暗对比，描绘{subject}在{environment}中{emotional_action}的场景，{weather_and_time}强化了忧郁的氛围，{technical_params}。
```

## 2. 风格变体模板

### 2.1 艺术风格模板

#### 印象派风格

```
一幅印象派风格的作品，以明显的笔触和鲜活的色彩捕捉{subject}在{environment}的瞬间印象，{weather_and_time}的光线通过斑驳的色彩表现，营造出{emotion}的氛围，{technical_params}。
```

#### 水彩风格

```
一幅水彩画风格的作品，以透明的色彩层次和柔和的边缘描绘{subject}在{environment}中的场景，水彩的流动感与{weather_condition}相呼应，整体氛围{emotion}，{technical_params}。
```

#### 赛博朋克风格

```
一幅赛博朋克风格的未来城市景观，展现了{location_name}的高科技未来版本，霓虹灯在{weather_condition}中闪烁，{subject}在充满科技感的{environment}中{action}，营造出{emotion}的氛围，高对比度，饱和的紫色和蓝色调，{technical_params}。
```

#### 极简主义风格

```
一幅极简主义风格的作品，通过简约的线条和有限的色彩表达{subject}在{environment}中的本质，留白和负空间创造出{emotion}的感觉，{weather_and_time}以最简形式暗示，{technical_params}。
```

### 2.2 媒介特定模板

#### 数字插画风格

```
一幅精致的数字插画，描绘{subject}在{environment}中{action}的场景，色彩鲜明，线条清晰，{weather_and_time}通过数字绘画技术精确呈现，整体风格现代而精致，营造出{emotion}的氛围，{technical_params}。
```

#### 摄影风格

```
一张高质量摄影作品，捕捉{subject}在{environment}中的真实瞬间，{weather_and_time}创造出独特的光线条件，镜头焦距适中，景深适当，呈现出{emotion}的氛围，照片级别的细节和真实感，{technical_params}。
```

#### 复古电影风格

```
一帧复古电影风格的画面，展现{subject}在{environment}中的场景，带有胶片颗粒感和轻微的色彩偏移，{weather_and_time}通过电影化的光线处理增强了{emotion}的氛围，宽银幕比例，电影级构图，{technical_params}。
```

## 3. 环境数据整合模板

### 3.1 天气条件模板

#### 晴天模板

```
在明媚阳光下，{subject}在{location_name}的{environment}中{action}，阳光照射创造出清晰的阴影和明亮的高光，天空呈现出纯净的蓝色，整体氛围{emotion}，{style}风格，{technical_params}。
```

#### 雨天模板

```
在{location_name}的雨中，{subject}在{environment}{action}，雨滴在表面形成闪烁的反射，湿润的地面映照着周围的光线，雨帘为场景增添了朦胧感，整体氛围{emotion}，{style}风格，{technical_params}。
```

#### 雾天模板

```
在{location_name}的雾气中，{subject}若隐若现地在{environment}{action}，雾气柔化了轮廓和远处的景物，创造出神秘而朦胧的氛围，有限的可见度增强了{emotion}的感觉，{style}风格，{technical_params}。
```

### 3.2 时间特定模板

#### 黎明/日出模板

```
在{location_name}的黎明时分，初升的太阳为{environment}镀上一层金色光芒，{subject}在这温暖的晨光中{action}，长长的阴影和金红色的光线创造出充满希望的氛围，整体感觉{emotion}，{style}风格，{technical_params}。
```

#### 黄昏/日落模板

```
在{location_name}的日落时分，{subject}在{environment}中{action}，被夕阳的金红色光芒笼罩，天空呈现出丰富的橙红色和紫色渐变，长阴影拉伸across地面，营造出{emotion}的氛围，{style}风格，{technical_params}。
```

#### 夜晚模板

```
在{location_name}的夜晚，{subject}在{environment}中{action}，被{light_source}的光线部分照亮，夜空{sky_description}，黑暗与光明的对比创造出{emotion}的氛围，{style}风格，{technical_params}。
```

### 3.3 地点特定模板

#### 城市地标模板

```
在{city_name}标志性的{landmark_name}附近，{subject}{action}，周围是城市特有的{city_specific_elements}，{weather_and_time}赋予场景独特的氛围，整体感觉{emotion}，{style}风格，{technical_params}。
```

#### 自然地标模板

```
在{location_name}壮观的{natural_landmark}，{subject}{action}，周围是令人惊叹的自然风光，包括{natural_elements}，{weather_and_time}强化了场景的壮丽感，整体氛围{emotion}，{style}风格，{technical_params}。
```

## 4. 特殊场景模板

### 4.1 低质量输入处理模板

#### 最小输入模板

```
一幅{style}风格的作品，捕捉一个人在{location_name}的{environment}中沉思的瞬间，周围环境反映了{weather_condition}和{time_of_day}的特点，整体氛围平静而内省，{technical_params}。
```

#### 模糊输入模板

```
一幅{style}风格的意象作品，模糊地表达了在{location_name}的{environment}中的情绪瞬间，{weather_and_time}的元素增强了场景的氛围，色彩和构图反映{emotion}的感觉，{technical_params}。
```

### 4.2 抽象概念处理模板

#### 情绪表达模板

```
一幅{style}风格的抽象表现，通过{visual_metaphor}象征性地表达{emotion}的情绪，色彩以{color_scheme}为主，受到{location_name}的{weather_condition}和{time_of_day}的启发，线条和形状传达内心状态，{technical_params}。
```

#### 思想概念模板

```
一幅{style}风格的概念性作品，通过{visual_elements}表达关于{abstract_concept}的思考，场景设置在{location_name}的{environment}中，{weather_and_time}的元素作为概念的视觉背景，整体氛围深思而富有哲理，{technical_params}。
```

## 5. 技术参数模板

### 5.1 高质量渲染模板

```
高分辨率，精细细节，平衡构图，自然光影，逼真质感
```

### 5.2 艺术效果模板

```
艺术化渲染，富有表现力的笔触，和谐的色彩平衡，有意的构图，强调情感表达
```

### 5.3 电影效果模板

```
电影级构图，戏剧性光影，景深效果，宽银幕比例，电影色调
```

## 6. 提示词组合示例

以下是完整提示词组合的示例，展示了如何将各个模板组件组合成最终的提示词：

### 示例1：城市雨夜

```
一幅印象派风格的夜景，展现雨中的上海街道，霓虹灯光在湿润的路面上形成模糊而梦幻的倒影，行人撑着伞走过闪烁的街景，营造出宁静而又充满诗意的氛围，雨滴在路灯光晕中闪烁，高分辨率，精细细节，平衡构图。
```

### 示例2：海边日出

```
一幅写实风格的三亚海滩日出场景，金红色的阳光从海平面缓缓升起，温暖的光芒洒在平静的海面上形成金色光路，前景是细腻的沙滩，远处可见几只海鸟掠过，整体氛围宁静而治愈，传达出内心平静的感受，精细渲染，自然光影，广角构图。
```

### 示例3：城市黄昏

```
一幅水彩风格的北京黄昏景象，夕阳的金色光芒穿过城市天际线，照亮了天安门广场，游客的剪影点缀在开阔的空间中，暖色调的天空与城市建筑形成鲜明对比，整体氛围温暖而怀旧，柔和的色彩过渡，平衡构图，细腻的光影表现。
```

## 7. 变量说明

以下是模板中使用的主要变量及其含义：

| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| {style} | 艺术风格 | 印象派、水彩、写实、赛博朋克 |
| {subject} | 场景主体 | 一个年轻女子、一群孩子、一只猫 |
| {action} | 主体动作 | 漫步、凝视、奔跑、微笑 |
| {environment} | 环境场景 | 繁华的街道、宁静的公园、海滩 |
| {emotion} | 情感氛围 | 平静的、欢快的、忧郁的、神秘的 |
| {location_name} | 地点名称 | 上海、北京、三亚、杭州 |
| {weather_condition} | 天气状况 | 雨天、晴朗、多云、雾气 |
| {time_of_day} | 一天中的时间 | 黎明、正午、黄昏、夜晚 |
| {light_description} | 光线描述 | 温暖的阳光、柔和的月光、闪烁的霓虹灯 |
| {technical_params} | 技术参数 | 高分辨率，平衡构图，精细细节 |

## 8. 使用指南

1. 根据用户语音内容和情感分析选择适当的基础模板
2. 根据检测到的环境数据选择相应的环境模板
3. 根据语音内容和情感选择合适的艺术风格
4. 填充所有必要变量，确保描述具体而有视觉表现力
5. 添加适当的技术参数以确保图像质量
6. 检查最终提示词的长度和一致性
7. 提交给DALL-E API进行图像生成
