const storageKey = 'three-atlas.language';

export const translations = {
  en: {
    pageTitle: 'The End of Time · Codex 6.1 sol',
    description: 'An interactive cosmic elegy about silence, memory, and the last remaining light.',
    experience: 'The End of Time, an interactive 3D experience',
    canvas: 'Cosmic scene. Drag to orbit, scroll to zoom, hold to release gravity, and double-click crystals to collect memories.',
    atlasReturn: 'Back to Three Atlas', atlasName: 'Three Atlas',
    home: 'Return to the opening view',
    brand: 'TERMINAL ARCHIVE', brandSubtitle: 'AT THE EDGE OF ETERNITY',
    edition: 'An interactive cosmic elegy', editionSubtitle: 'TIME IS ALL THAT REMAINS',
    settings: 'Experience settings', switchLanguage: 'Switch to Chinese / 切换为中文',
    title: 'The end <span>of time<span class="title-period">.</span></span>',
    subtitle: 'AT THE EDGE OF ETERNITY', explore: 'Into the silence',
    observation: 'OBSERVATION /', beyond: 'BEYOND THE LAST LIGHT',
    singularity: 'The last singularity', singularitySubtitle: 'THE LAST SINGULARITY',
    hold: 'GRAVITATIONAL RESONANCE', chaptersLabel: 'Explore chapters',
    timeControls: 'Control time', reverse: 'Reverse time', pause: 'Pause time', resume: 'Resume time', forward: 'Let time move forward',
    flowing: 'TIME IS PASSING', reversing: 'TIME IS UNRAVELING', frozen: 'THIS MOMENT, FOREVER',
    speed: 'SPEED', speedLabel: 'Flow of time',
    gestures: 'Drag to orbit · Scroll to approach', gesturesMore: 'Hold to bend time · Double-click to remember',
    linger: 'Before everything disappears, stay a while.', memories: 'Memories', memoriesLabel: 'View collected memories',
    audioOn: 'SOUND ON', audioOff: 'SOUND OFF', audioEnable: 'Enable ambient sound', audioDisable: 'Disable ambient sound',
    fullscreenEnter: 'Enter fullscreen', fullscreenExit: 'Exit fullscreen',
    help: 'Open the interaction guide', guideClose: 'Close the interaction guide',
    guideKicker: 'A FIELD GUIDE TO THE END', guideTitle: 'You are the last observer.',
    guidePoem: 'There is nowhere you need to arrive.<br>Let your gaze drift through the stardust, and find what we left behind.',
    guide: [
      ['Drag / Swipe with one finger', 'Orbit the ruins of this celestial clock.'],
      ['Scroll / Pinch with two fingers', 'Approach the singularity, or drift into the infinite.'],
      ['Press and hold without moving', 'Gather gravity. Release to send a ripple through spacetime.'],
      ['Double-click a glowing memory crystal', 'Recover three moments of what it meant to be human.'],
      ['Space / R / H / Esc', 'Pause / Reverse / Hide the interface / Close the panel.'],
      ['Arrow keys / + / − / C / Hold G', 'Orbit / Zoom / Recover the next memory / Charge gravity.']
    ],
    guideEnter: 'Continue exploring', memoryClose: 'Close memory', memoryReturn: 'Let the memory drift on',
    memoryKicker: 'FRAGMENTS OF WHAT WE WERE', memoryFragment: 'TIME FRAGMENT {number}',
    memoryEmptyTitle: 'Some light has yet to go out.',
    memoryEmptyText: 'Three memory crystals drift around the celestial clock.<br>Find the small, glowing diamonds. Double-click to bring them back.',
    memoryLocked: 'An undiscovered memory', memoryLockedText: 'A little light is still waiting for your gaze.',
    memoryEnding: 'The universe will grow cold.<br>But the moments in which we were loved have happened. Nothing can take them back.',
    collect: 'Double-click · Recover a memory', revisit: 'Double-click · Revisit a memory',
    loading: 'Arriving at the end of time', loadingSubtitle: 'ASSEMBLING THE LAST LIGHT',
    fatalTitle: 'The journey is not over yet.', fatalDefault: 'Please open this experience in a modern browser with WebGL 2 support.',
    fatalWebgl: 'Please use a browser with WebGL 2 support and enable hardware acceleration, then try again.',
    fatalLoad: 'The scene could not be loaded. Please refresh and try again.', retry: 'Try again',
    toastExplore: 'Orbit the clock. Find three memory crystals that still hold a little warmth.',
    toastReverse: 'Let everything return to a time before it faded.', toastForward: 'Let time move forward.',
    toastPulse: 'You left an echo in spacetime.', toastRestore: 'Press H to restore the interface.',
    toastFullscreenUnsupported: 'Fullscreen is unavailable here. Press H for an unobstructed view.',
    toastFullscreenFailed: 'Fullscreen is unavailable. Press H to hide the interface.',
    toastContextLost: 'The graphics context was interrupted. Waiting for it to recover.',
    toastAudioFailed: 'Ambient sound is unavailable in this browser.',
    chapters: [
      {name:'CHAPTER I · EVENT HORIZON', label:'Event horizon', poem:'When the last star goes dark,<br>will time still remember us?'},
      {name:'CHAPTER II · RINGS OF MEMORY', label:'Memory rings', poem:'Everything we left unsaid<br>becomes stardust around the night.'},
      {name:'CHAPTER III · THE LAST LIGHT', label:'The last light', poem:'We were here, for a moment.<br>Light will carry us farther.'}
    ],
    memoryEntries: [
      {title:'An ordinary morning', label:'MEMORY 01 / WARMTH', text:'Someone is making coffee in the kitchen. Sunlight slips past the rim of a cup and rests on the back of your hand. Back then, everyone thought there would be so many more mornings like this.'},
      {title:'The goodbye we never said', label:'MEMORY 02 / CONNECTION', text:'Before the train departed, someone waved to you through the glass. You have forgotten the destination, but you still remember the hand that would not let go.'},
      {title:'We once looked up', label:'MEMORY 03 / WONDER', text:'Long ago, on a blue planet, we looked up for the first time and asked the stars: is anyone there? Now, the universe remembers the question.'}
    ]
  },
  zh: {
    pageTitle: '时间的尽头 · Codex 6.1 sol',
    description: '时间的尽头。一场关于寂静、记忆与最后一束光的交互式宇宙挽歌。',
    experience: '时间的尽头，三维交互体验',
    canvas: '宇宙场景。拖动环绕，滚轮缩放，长按释放引力，双击时间遗物收集记忆。',
    atlasReturn: '返回三维图鉴', atlasName: '三维图鉴',
    home: '回到初始视角', brand: '零点档案', brandSubtitle: 'THE TERMINAL ARCHIVE',
    edition: '一场可交互的宇宙挽歌', editionSubtitle: 'AN INTERACTIVE COSMIC ELEGY',
    settings: '体验设置', switchLanguage: 'Switch to English / 切换为英文',
    title: '时间的<span>尽头<span class="title-period">。</span></span>',
    subtitle: 'THE END OF TIME', explore: '向寂静深处',
    observation: '观测 /', beyond: '越过最后一束光',
    singularity: '终末奇点', singularitySubtitle: 'THE LAST SINGULARITY',
    hold: '引力共振', chaptersLabel: '探索章节',
    timeControls: '控制时间', reverse: '倒转时间', pause: '暂停时间', resume: '继续时间', forward: '时间向前流动',
    flowing: '时间正在流逝', reversing: '时间正在倒流', frozen: '这一瞬，成为永恒',
    speed: '流速', speedLabel: '时间流速',
    gestures: '拖动环绕 · 滚轮靠近', gesturesMore: '长按释放引力 · 双击拾取记忆',
    linger: '在一切消失之前，停留片刻。', memories: '记忆', memoriesLabel: '查看已收集的记忆',
    audioOn: '声音 开', audioOff: '声音 关', audioEnable: '开启环境声音', audioDisable: '关闭环境声音',
    fullscreenEnter: '进入全屏', fullscreenExit: '退出全屏', help: '查看交互指南', guideClose: '关闭交互指南',
    guideKicker: '终末观测指南', guideTitle: '你是最后的观察者。',
    guidePoem: '不必抵达任何地方。让目光穿过星尘，<br>在宇宙的余温里，找回一些被遗忘的瞬间。',
    guide: [
      ['拖动鼠标 / 单指滑动', '自由环绕这座天文遗迹'],
      ['滚轮 / 双指缩放', '靠近奇点，或退入无垠'],
      ['原地长按', '积蓄引力，松开释放时空涟漪'],
      ['双击发光的记忆晶体', '拾回三个属于人类的瞬间'],
      ['空格 / R / H / Esc', '暂停 / 倒流 / 隐藏界面 / 关闭面板'],
      ['方向键 / + / − / C / 长按 G', '环绕 / 缩放 / 拾取下一枚记忆 / 积蓄引力']
    ],
    guideEnter: '继续探索', memoryClose: '关闭记忆', memoryReturn: '让记忆继续漂流',
    memoryKicker: '我们曾经存在的碎片', memoryFragment: '拾回的第 {number} 枚时间碎片',
    memoryEmptyTitle: '还有一些光，尚未熄灭。',
    memoryEmptyText: '三枚记忆晶体，正漂浮在天文钟的周围。<br>寻找细小的发光菱形，双击，把它们带回来。',
    memoryLocked: '尚未拾回的记忆', memoryLockedText: '有一束光，仍在等待你的目光。',
    memoryEnding: '宇宙终将冷却。<br>但那些曾被爱过的瞬间，已经发生，永不撤回。',
    collect: '双击 · 拾取记忆', revisit: '双击 · 重温记忆',
    loading: '正在抵达时间的尽头', loadingSubtitle: '凝聚最后一束光',
    fatalTitle: '还未抵达宇宙的尽头', fatalDefault: '请使用支持 WebGL 2 的现代浏览器打开作品。',
    fatalWebgl: '请使用支持 WebGL 2 的浏览器，并开启硬件加速后重新进入。',
    fatalLoad: '场景载入遇到了问题，请刷新后重新进入。', retry: '重新进入',
    toastExplore: '拖动环绕，寻找三枚仍有温度的记忆晶体。',
    toastReverse: '让一切，回到尚未消逝的时候。', toastForward: '让时间继续向前。',
    toastPulse: '你留下了一道，时空的回声。', toastRestore: '按 H 恢复界面',
    toastFullscreenUnsupported: '此浏览器不支持全屏，可按 H 隐藏界面沉浸探索。',
    toastFullscreenFailed: '全屏暂不可用；按 H 可隐藏界面。',
    toastContextLost: '图形上下文已中断，正在等待恢复。', toastAudioFailed: '此浏览器暂不支持环境声音。',
    chapters: [
      {name:'第一章 · 事件视界', label:'事件视界', poem:'当最后一颗恒星熄灭，<br>时间，是否还会记得我们。'},
      {name:'第二章 · 记忆星环', label:'记忆星环', poem:'所有未曾说完的话，<br>都成为环绕永夜的星尘。'},
      {name:'第三章 · 最后的光', label:'最后的光', poem:'我们曾短暂地存在，<br>而光，会替我们走得更远。'}
    ],
    memoryEntries: [
      {title:'一个平凡的清晨', label:'记忆 01 / 温暖', text:'有人在厨房里煮咖啡。阳光穿过杯沿，落在你的手背。那时，所有人都以为，这样的清晨还会有很多。'},
      {title:'尚未说出的再见', label:'记忆 02 / 羁绊', text:'列车开动之前，有人隔着玻璃向你挥手。你忘记了目的地，却一直记得，那只不肯放下的手。'},
      {title:'我们曾仰望星空', label:'记忆 03 / 好奇', text:'很久以前，在一颗蓝色的行星上，我们第一次抬起头，问星星：那里，有谁吗。如今，宇宙记得这个问题。'}
    ]
  }
};

let language = 'zh';
try {
  const saved = localStorage.getItem(storageKey);
  if (saved === 'en' || saved === 'zh') language = saved;
} catch { /* Storage can be unavailable in private or restricted contexts. */ }

export function getLanguage(){ return language; }
export function t(key, values = {}){
  const value = key.split('.').reduce((object, part) => object?.[part], translations[language]);
  if (typeof value !== 'string') throw new Error(`Missing translation: ${language}.${key}`);
  return value.replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match);
}

export function setLanguage(next){
  if (next !== 'en' && next !== 'zh') return;
  language = next;
  try { localStorage.setItem(storageKey, next); } catch { /* Switching still works without persistence. */ }
}

export function applyTranslations(){
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  document.title = t('pageTitle');
  document.querySelector('meta[name="description"]').content = t('description');
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  // HTML comes exclusively from the fixed dictionaries above.
  document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll('[data-i18n-label]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nLabel)); });
  document.querySelectorAll('[data-language]').forEach(el => { el.classList.toggle('selected', el.dataset.language === language); });
  document.querySelector('#language-toggle').title = t('switchLanguage');
}
