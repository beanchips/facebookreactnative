import*as e from"../../core/i18n/i18n.js";import*as a from"../../ui/legacy/legacy.js";const s={layers:"Layers",showLayers:"Show Layers"},r=e.i18n.registerUIStrings("panels/layers/layers-meta.ts",s),i=e.i18n.getLazilyComputedLocalizedString.bind(void 0,r);let n;a.ViewManager.registerViewExtension({location:"panel",id:"layers",title:i(s.layers),commandPrompt:i(s.showLayers),order:100,persistence:"closeable",loadView:async()=>(await async function(){return n||(n=await import("./layers.js")),n}()).LayersPanel.LayersPanel.instance()});
