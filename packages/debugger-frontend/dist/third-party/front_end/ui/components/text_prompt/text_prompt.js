import*as t from"../../../core/platform/platform.js";import*as e from"../../lit-html/lit-html.js";const s=new CSSStyleSheet;s.replaceSync(":host{white-space:pre;overflow:hidden;display:flex}input{font-size:14px}.prefix{flex:none;color:var(--sys-color-primary)}.text-prompt-input{flex:auto;position:relative}.text-prompt-input input{width:100%;border:none;outline:none;position:absolute;left:0;padding:0;z-index:2;background-color:transparent}.text-prompt-input .suggestion{color:var(--sys-color-state-disabled);position:absolute;left:0;z-index:1}\n/*# sourceURL=textPrompt.css */\n");class i extends Event{static eventName="promptinputchanged";data;constructor(t){super(i.eventName),this.data=t}}class n extends HTMLElement{static litTagName=e.literal`devtools-text-prompt`;#t=this.attachShadow({mode:"open"});#e="";#s="";#i="";connectedCallback(){this.#t.adoptedStyleSheets=[s]}set data(t){this.#e=t.ariaLabel,this.#s=t.prefix,this.#i=t.suggestion,this.#n()}get data(){return{ariaLabel:this.#e,prefix:this.#s,suggestion:this.#i}}focus(){this.#o().focus()}#o(){const t=this.#t.querySelector(".input");if(!t)throw new Error("Expected an input element!");return t}moveCaretToEndOfInput(){this.setSelectedRange(this.#a().length,this.#a().length)}onInput(){this.#r().value=this.#a(),this.dispatchEvent(new i(this.#a()))}onKeyDown(e){e.key===t.KeyboardUtilities.ENTER_KEY&&e.preventDefault()}setSelectedRange(t,e){if(t<0)throw new RangeError("Selected range start must be a nonnegative integer");const s=this.#a().length;e>s&&(e=s),e<t&&(e=t),this.#o().setSelectionRange(t,e)}setPrefix(t){this.#s=t,this.#n()}setSuggestion(t){this.#i=t,this.#r().value+=this.#i,this.#n()}setText(t){this.#o().value=t,this.#r().value=this.#a(),this.#o().hasFocus()&&(this.moveCaretToEndOfInput(),this.#o().scrollIntoView())}#r(){const t=this.#t.querySelector(".suggestion");if(!t)throw new Error("Expected an suggestion element!");return t}#a(){return this.#o().value||""}#n(){const t=e.html`
      <span class="prefix">${this.#s} </span>
      <span class="text-prompt-input"><input class="input" aria-label=${this.#e} spellcheck="false" @input=${this.onInput} @keydown=${this.onKeyDown}/><input class="suggestion" aria-label=${this.#e+" Suggestion"}></span>`;e.render(t,this.#t,{host:this})}}customElements.define("devtools-text-prompt",n);var o=Object.freeze({__proto__:null,PromptInputEvent:i,TextPrompt:n});export{o as TextPrompt};
