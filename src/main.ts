import { App, debounce, Plugin, Setting, MarkdownPostProcessorContext, MarkdownView } from 'obsidian';
import { EnhancedTreemapSettings, EnhancedTreemapSettingTab, DEFAULT_SETTINGS } from './settings';
import EnhancedTreemap from './enhancedtreemap';

export default class EnhancedTreemapPlugin extends Plugin {
    settings: EnhancedTreemapSettings;
    enhancedtreemap: EnhancedTreemap;

    postprocessor = async (element: HTMLElement, context: MarkdownPostProcessorContext) => {
        // only create the tree if there is a code block containing the expected text
        var codeblock = element.querySelector("code");
        if (codeblock == null) return;
        var text = codeblock.textContent;
        if (text != null) {
            try {
                var data = JSON.parse(text);
                var type = data.type;
                if (type == "enhancedtreemap") {
                    await this.enhancedtreemap.renderEnhancedTreemap(element, context);
                }
            } catch(e) { 
                if (text.includes('"type": "enhancedtreemap"'))
                    await this.enhancedtreemap.renderEnhancedTreemap(element, context);
            }
        }
    }

    //private debouncedRefresh: () => void = () => null;
    //private debouncedRefresh = debounce(() => this.app.workspace.trigger("enhancedtreemap:refresh"), 100, true);
    //private debouncedRefresh = debounce(() => console.log("debounce called"), 100, true);

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new EnhancedTreemapSettingTab(this.app, this));
        this.enhancedtreemap = new EnhancedTreemap(this);
        this.registerMarkdownPostProcessor((el, ctx) => { this.postprocessor(el, ctx) });
        this.registerEvent(this.app.workspace.on("resize", () => { this.app.workspace.trigger("enhancedtreemap:refresh") }));
        //this.registerEvent(this.app.workspace.on("resize", () => { this.debouncedRefresh }));
    }

    onunload() { }

    async loadSettings() { 
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()); 
    }

    async saveSettings() { 
        await this.saveData(this.settings); 
        this.app.workspace.trigger("enhancedtreemap:refresh");
        //this.debouncedRefresh = debounce(() => this.app.workspace.trigger("enhancedtreemap:refresh"), 100, true);
    }
}

