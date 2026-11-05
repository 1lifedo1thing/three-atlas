import '../../ui/index.css';
import works from '../../../content/works.json';
import { copy } from './copy.js';
import { h, getLang, setLang, onLang, pick, requestLang, GlobalNav, Hero, SectionHead, FeatureWindow, animateFeatureWindow, Statement, animateStatement, Panels, Principles, Highlights, Roadmap, WorkCard, WorkIndex, Footer, animateFooter, ExperienceShell, Button, Badge, scope, reveal, bindPointerGlow } from '../../ui/index.js';
import { ShowcaseGroup } from '../../ui/components/showcase.js';
const app=document.querySelector('#app');const urlLang=new URL(location.href).searchParams.get('lang');if(urlLang==='zh'||urlLang==='en')setLang(urlLang);
let context,cleanups=[];
function render(){
 context?.revert();cleanups.forEach(fn=>fn());cleanups=[];
 const lang=getLang(),t=copy[lang],zh=lang==='zh',source=works[0];
 const work={...source,featured:false,entry:`../../${source.entry}`,cover:`../../${source.cover}`,preview:source.preview&&`../../${source.preview}`,subtitle:pick(source.subtitle),summary:pick(source.summary),category:pick(source.category),alt:pick(source.coverAlt),author:`${source.author.name} / @${source.author.handle}`,index:0};
 const items=source.highlights.map(item=>({title:pick(item.title),text:pick(item.text),tech:pick(item.tech),image:work.cover,images:work.images,tone:work.tone,focus:item.focus,zoom:item.zoom}));
 const nav=GlobalNav({home:'../../',links:[{label:'Buttons',href:'#buttons'},{label:'Cards',href:'#cards'}],cta:{label:t.enter,href:work.entry},lang:{label:t.langLabel,aria:t.langAria,onToggle:e=>requestLang(zh?'en':'zh',e.currentTarget)}});nav.setScrolled(true);nav.showCta(true);
 const buttonRow=h('div.ui-showcase__row',null,['primary','secondary','ghost'].map(variant=>['sm','md','lg'].map(size=>Button({label:`${variant} · ${size}`,variant,size}))),Button({label:zh?'不可用':'Disabled',attrs:{disabled:true}}),Button({label:zh?'处理中':'Working',attrs:{disabled:true,'aria-busy':'true'}}),Badge({label:t.mode,live:true}),Badge({label:zh?'规划中':'Planned'}));
 const head=(id,title,lede)=>SectionHead({id:`${id}-title`,title,lede,eyebrow:'Atlas UI'});
 const window=FeatureWindow({id:'show-window',work,live:t.mode,meta:[t.featured],enter:{label:t.enterLong,href:work.entry},more:{label:t.more,href:'#show-panels'}});
 const statement=Statement({text:t.statement,muted:t.statementMuted});
 const normal=WorkCard({work,index:0,labels:t}),hover=WorkCard({work,index:0,labels:t}),missing=WorkCard({work:{...work,cover:'../../media/missing-specimen.jpg',images:undefined},index:0,labels:t});hover.querySelector('a').classList.add('is-demo-hover');
 const shell=ExperienceShell({title:source.title,subtitle:work.subtitle,canvasLabel:zh?'作品画布占位':'Work canvas placeholder',home:'../../',backLabel:'Three Atlas'});shell.setAttribute('role','group');shell.showError(zh?'错误状态示例':'Error state specimen');
 const indexProps={head:head('show-index',t.collection),categories:[work.category,zh?'另一个类别':'Another category'],labels:t};
 const footer=Footer({closing:t.closing,columns:[{title:t.colWorks,links:[{label:source.title,href:work.entry}]},{title:t.colAtlas,links:[{label:'Three Atlas',href:'../../'}]},{title:t.colAuthor,links:[{label:'观默 @guanmo_ai',href:'https://x.com/guanmo_ai',external:true}]}],legal:['Atlas UI · Internal component specimens']});
 app.replaceChildren(nav,h('main',null,Hero({eyebrow:'Atlas UI',title:zh?'组件陈列。':'Component specimens.',lede:zh?'中英文界面、交互状态与组件复用检查。':'Interface components and interaction states in both languages.'}),ShowcaseGroup({id:'buttons',label:'Button / Badge',children:buttonRow}),ShowcaseGroup({id:'heads',label:'SectionHead · start / center',children:[head('start',t.aboutTitle,t.aboutLede),SectionHead({id:'center-title',title:t.nextTitle,lede:t.nextLede,align:'center'})]}),window,statement,Panels({id:'show-panels',head:head('show-panels',t.featuredTitle,work.summary),items}),Principles({id:'show-principles',head:head('show-principles',t.aboutTitle,t.aboutLede),items:t.about}),Highlights({id:'show-highlights',head:head('show-highlights',zh?'近看作品。':'A closer look.'),items,labels:{region:zh?'作品图集':'Work gallery',prev:zh?'上一张':'Previous',next:zh?'下一张':'Next'}}),Roadmap({id:'show-roadmap',eyebrow:t.nextEyebrow,title:t.nextTitle,lede:t.nextLede,badge:zh?'规划中':'Planned'}),ShowcaseGroup({id:'cards',label:'WorkCard · default / hover / missing',children:h('div.ui-showcase__cards',null,normal,hover,missing)}),WorkIndex({...indexProps,id:'show-index',select:(query,category)=>!query&&(!category||category===work.category)?[work]:[]}),WorkIndex({...indexProps,id:'show-empty',head:head('show-empty',t.collection),select:()=>[]}),ShowcaseGroup({id:'shell',label:'ExperienceShell · error',children:h('div.ui-showcase__shell',null,shell)})),footer);
 cleanups.push(...[...app.querySelectorAll('.ui-index')].map(index=>()=>index.dispose()));
 context=scope(app,()=>{cleanups.push(bindPointerGlow(app),animateFeatureWindow(window),animateFooter(footer));animateStatement(statement);reveal(app)});
}
onLang(render);render();
