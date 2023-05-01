import { App, Plugin, Setting } from 'obsidian';
import { SettingTab, DEFAULT_SETTINGS } from './settings';
import EnhancedTreemap from './enhancedtreemap';

export default class EnhancedTreemapPlugin extends Plugin {
    settings: EnhancedTreemapSettings;
    enhancedtreemap: EnhancedTreemap;

    postprocessor = async (element: HTMLElement, context: MarkdownPostProcessorContext) => {
        // only create the tree if there is a code block containing the expected text
        var codeblock = element.querySelector("code");
        if (codeblock == null) return;
        try {
            var data = JSON.parse(codeblock.textContent);
            var type = data.type;
            if (type == "enhancedtreemap") {
                await this.enhancedtreemap.renderEnhancedTreemap(element, context);
            }
        } catch(e) { }
    }

    async onload() {
        await this.loadSettings();
        this.elements = [];
        this.contexts = [];
        this.addSettingTab(new SettingTab(this.app, this));
        this.enhancedtreemap = new EnhancedTreemap(this);
        this.registerMarkdownPostProcessor((el, ctx) => { this.postprocessor(el, ctx) });

        /*app.workspace.on('resize', () => { });*/

		/*this.app.workspace.onLayoutReady(() => {
			this.previousWidth = window.innerWidth;
			this.toggleSidebars();
			app.workspace.on('resize', () => this.toggleSidebars());
		});*/
    }

    onunload() { }

    async loadSettings() { this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()); }

    async saveSettings() { 
        await this.saveData(this.settings); 
        app.workspace.activeLeaf.rebuildView();
    }
}

