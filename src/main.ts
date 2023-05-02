import { App, Plugin, Setting, MarkdownPostProcessorContext, MarkdownView } from 'obsidian';
import { EnhancedTreemapSettings, EnhancedTreemapSettingTab, DEFAULT_SETTINGS } from './settings';
import EnhancedTreemap from './enhancedtreemap';

export default class EnhancedTreemapPlugin extends Plugin {
    settings: EnhancedTreemapSettings;
    enhancedtreemap: EnhancedTreemap;

    postprocessor = async (element: HTMLElement, context: MarkdownPostProcessorContext) => {
        // only create the tree if there is a code block containing the expected text
        var codeblock = element.querySelector("code");
        if (codeblock == null) return;
        try {
            var text = codeblock.textContent;
            if (text != null) {
                var data = JSON.parse(text);
                var type = data.type;
                if (type == "enhancedtreemap") {
                    await this.enhancedtreemap.renderEnhancedTreemap(element, context);
                }
            }
        } catch(e) { }
    }

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new EnhancedTreemapSettingTab(this.app, this));
        this.enhancedtreemap = new EnhancedTreemap(this);
        this.registerMarkdownPostProcessor((el, ctx) => { this.postprocessor(el, ctx) });
    }

    onunload() { }

    async loadSettings() { 
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()); 
    }

    async saveSettings() { 
        await this.saveData(this.settings); 
        // Not sure how to get the treemaps to refresh after settings are updated
        // rebuildView works with "npm run dev" but does not work with "npm run build"

        //this.app.workspace.updateOptions();
        //const view = app.workspace.getActiveViewOfType(MarkdownView);
        //const editor = view.editor;
        //editor.refresh();
        //if (view) {
        //    if (view.leaf) view.leaf.rebuildView();
        //}
    }
}

