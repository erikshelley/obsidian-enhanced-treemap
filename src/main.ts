import { App, debounce, MarkdownPostProcessorContext, Plugin, Setting  } from 'obsidian';
import { EnhancedTreemapSettings, EnhancedTreemapSettingTab, DEFAULT_SETTINGS } from './settings';
import EnhancedTreemap from './enhancedtreemap';

export default class EnhancedTreemapPlugin extends Plugin {
    settings: EnhancedTreemapSettings;
    enhancedtreemap: EnhancedTreemap;

    /*
       This function is called for each code block after the markdown is turned into HTML but before it is rendered.
       The call is registered by registerMarkdownProcessor in the onload method. If "type": "enhancedtreemap" is detected 
       in the code block the renderEnhancedTreemap method is called in the EnhancedTreemap class.
    */
    postprocessor = async (element: HTMLElement, context: MarkdownPostProcessorContext) => {
        var codeblock = element.querySelector("code");
        if (codeblock != null) {
            var text = codeblock.textContent;
            if (text != null) {
                try {
                    var data = JSON.parse(text);
                    var type = data.type;
                    if (type == "enhancedtreemap") {
                        await this.enhancedtreemap.renderEnhancedTreemap(element, context);
                    }
                } catch(e) {
                    // if the JSON is invalid the EnhancedTreemap class will report the error instead of drawing a treemap
                    if (text.includes('"type": "enhancedtreemap"'))
                        await this.enhancedtreemap.renderEnhancedTreemap(element, context);
                }
            }
        }
    }

    // Debounce is used to prevent repeatedly calling a function too quickly
    // The enhancedtreemap:refresh event trigger is defined in src/enhancedtreemap.ts
    private debouncedRefresh = debounce(() => this.app.workspace.trigger("enhancedtreemap:refresh"), 1000, true);

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new EnhancedTreemapSettingTab(this.app, this));
        this.enhancedtreemap = new EnhancedTreemap(this);
        this.registerMarkdownPostProcessor((el, ctx) => { this.postprocessor(el, ctx) });
        this.registerEvent(this.app.workspace.on("resize", this.debouncedRefresh ));
    }

    onunload() {
        this.app.workspace.off("resize", this.debouncedRefresh );
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        this.debouncedRefresh();
    }
}

