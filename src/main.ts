import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, FileSystemAdapter} from 'obsidian';
import EnhancedTreeMap from './enhancedtreemap';

interface EnhancedTreemapSettings {
    // Size & Shape Options
    aspect:               float;
    aspect_w:             float;
    aspect_h:             float;
    fixed_width:          bool;
    width:                float;
    header_size:          float;
    cell_padding:         float;
    text_padding:         float;
    head_padding:         float;
    text_size:            float;
    sort:                 bool;

    // Alignment Options
    horizontal_alignment: string;
    vertical_alignment:   string;
    header_alignment:     string;

    // Color Options
    border_h:             float;
    border_s:             float;
    border_l:             float;
    border_a:             float;
    fill_h:               float;
    fill_s:               float;
    fill_l:               float;
    fill_a:               float;
    header_s:             float;
    header_h:             float;
    header_l:             float;
    header_a:             float;
    text_h:               float;
    text_s:               float;
    text_l:               float;
    text_a:               float;

    // Other Styling Options
    shading:              bool;
    shadow:               bool;
    shadow_size:          float;
    show_headers:         bool;
    show_values:          bool;
}

const DEFAULT_SETTINGS: EnhancedTreemapSettings = {
    // Size & Shape Options
    aspect:               1,
    aspect_w:             1,
    aspect_h:             1,
    fixed_width:          false,
    width:                500,
    cell_padding:         8,
    text_padding:         8,
    head_padding:         8,
    sort:                 true,
    text_size:            13,
    header_size:          16,

    // Alignment Options
    horizontal_alignment: "left",
    vertical_alignment:   "top",
    header_alignment:     "left",

    // Color Options
    border_h:             0,
    border_s:             0,
    border_l:             0,
    border_a:             0.5,

    fill_h:               0,
    fill_s:               0,
    fill_l:               0.25,
    fill_a:               1,

    text_h:               0,
    text_s:               0,
    text_l:               0.8,
    text_a:               1,

    header_h:             0,
    header_s:             0,
    header_l:             0.9,
    header_a:             1,

    // Other Styling Options
    shading:              true,
    shadow:               true,
    shadow_size:          0,
    show_headers:         true,
    show_values:          false
}

export default class EnhancedTreemapPlugin extends Plugin {
    settings: EnhancedTreemapSettings;
    enhancedtreemap: EnhancedTreeMap;

    /*
       Description: 
       Called By: 
       Calls: 
       Parameters: 
       Return Values: 
       Side Effects: 
    */
    postprocessor = async (element: HTMLElement, context: MarkdownPostProcessorContext) => {
        // only create the tree if there is a code block containing the expected text
        var codeblock = element.querySelector("code");
        if (codeblock == null) return;
        var data = codeblock.textContent;
        if (data.match(/"type": "enhancedtreemap"/)) {
            await this.enhancedtreemap.renderEnhancedTreeMap(element, context);
        }
    }

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new SampleSettingTab(this.app, this));
        this.enhancedtreemap = new EnhancedTreeMap(this);
        this.registerMarkdownPostProcessor((el, ctx) => this.postprocessor(el, ctx));

		/*this.app.workspace.onLayoutReady(() => {
			this.previousWidth = window.innerWidth;
			this.toggleSidebars();
			app.workspace.on('resize', () => this.toggleSidebars());
		});*/

        // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
        // Using this function will automatically remove the event listener when this plugin is disabled.
        //this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
        //    console.log('click', evt);
        //});

        // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
        //this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
    }

    onunload() { }

    async loadSettings() { this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()); }

    async saveSettings() { 
        await this.saveData(this.settings); 
        app.workspace.activeLeaf.rebuildView();
    }
}

class SampleSettingTab extends PluginSettingTab {
    plugin: EnhancedTreemapPlugin;

    constructor(app: App, plugin: EnhancedTreemapPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;

        containerEl.empty();

        containerEl.createEl('h1', {text: 'Enhanced TreeMap Settings'});
        containerEl.createEl('h2', {text: 'Size & Shape Settings'});

        new Setting(containerEl)
            .setName('Aspect Ratio')
            .setDesc('Default Aspect Ratio (width:height)')
            .addText(text => text
                .setValue(this.plugin.settings.aspect_w.toString() + ":" + this.plugin.settings.aspect_h.toString())
                .onChange(async (value) => {
                    var ratio = value.split(":");
                    if (ratio[0] > 0 && ratio[1] > 0) {
                        this.plugin.settings.aspect_w = ratio[0];
                        this.plugin.settings.aspect_h = ratio[1];
                        this.plugin.settings.aspect = ratio[0] / ratio[1];
                        await this.plugin.saveSettings();
                    }
                }));

        new Setting(containerEl)
            .setName("Fixed Width")
            .setDesc("Fixed Width or Adpative Width by Default")
            .addToggle((t) => {
                t.setValue(this.plugin.settings.fixed_width).onChange(async (v) => {
                    this.plugin.settings.fixed_width = v;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName('TreeMap Width')
            .setDesc('Default TreeMap Width (if Fixed Width)')
            .addText(text => text
                .setValue(this.plugin.settings.width.toString())
                .onChange(async (value) => {
                    if (value > 0) {
                        this.plugin.settings.width = value;
                        await this.plugin.saveSettings();
                    }
                }));

        new Setting(containerEl)
            .setName('Header Text Size')
            .setDesc('Default Header Text Size')
            .addText(text => text
                .setValue(this.plugin.settings.header_size.toString())
                .onChange(async (value) => {
                    if (value > 0) {
                        this.plugin.settings.header_size = value;
                        await this.plugin.saveSettings();
                    }
                }));

        new Setting(containerEl)
            .setName('Text Size')
            .setDesc('Default Text Size')
            .addText(text => text
                .setValue(this.plugin.settings.text_size.toString())
                .onChange(async (value) => {
                    if (value > 0) {
                        this.plugin.settings.text_size = value;
                        await this.plugin.saveSettings();
                    }
                }));

        new Setting(containerEl)
            .setName('Cell Padding Size')
            .setDesc('Default Padding Size Around Cells')
            .addText(text => text
                .setValue(this.plugin.settings.cell_padding.toString())
                .onChange(async (value) => {
                    if (value > 0) {
                        this.plugin.settings.cell_padding = value;
                        await this.plugin.saveSettings();
                    }
                }));

        new Setting(containerEl)
            .setName('Text Padding Size')
            .setDesc('Default Text Padding Size')
            .addText(text => text
                .setValue(this.plugin.settings.text_padding.toString())
                .onChange(async (value) => {
                    if (value > 0) {
                        this.plugin.settings.text_padding = value;
                        await this.plugin.saveSettings();
                    }
                }));

        new Setting(containerEl)
            .setName('Header Padding Size')
            .setDesc('Default Header Padding Size')
            .addText(text => text
                .setValue(this.plugin.settings.head_padding.toString())
                .onChange(async (value) => {
                    if (value > 0) {
                        this.plugin.settings.head_padding = value;
                        await this.plugin.saveSettings();
                    }
                }));

        new Setting(containerEl)
            .setName("Sort")
            .setDesc("Sort by Size by Default")
            .addToggle((t) => {
                t.setValue(this.plugin.settings.sort).onChange(async (v) => {
                    this.plugin.settings.sort = v;
                    await this.plugin.saveSettings();
                });
            });

        containerEl.createEl('br');
        containerEl.createEl('h2', {text: 'Alignment Settings'});

        new Setting(containerEl)
            .setName("Horizontal Alignment")
            .setDesc("Default Text Horizontal Alignment")
            .addDropdown((d) => {
                d.addOption("left", "Left");
                d.addOption("center", "Center");
                d.addOption("right", "Right");
                d.setValue(this.plugin.settings.horizontal_alignment);
                d.onChange(async (v) => {
                    this.plugin.settings.horizontal_alignment = d.getValue() as string;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("Vertical Alignment")
            .setDesc("Default Text Vertical Alignment")
            .addDropdown((d) => {
                d.addOption("top", "Top");
                d.addOption("center", "Center");
                d.addOption("bottom", "Bottom");
                d.setValue(this.plugin.settings.vertical_alignment);
                d.onChange(async (v) => {
                    this.plugin.settings.vertical_alignment = d.getValue() as string;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("Header Alignment")
            .setDesc("Default Header Alignment")
            .addDropdown((d) => {
                d.addOption("left", "Left");
                d.addOption("center", "Center");
                d.addOption("right", "Right");
                d.setValue(this.plugin.settings.header_alignment);
                d.onChange(async (v) => {
                    this.plugin.settings.header_alignment = d.getValue() as string;
                    await this.plugin.saveSettings();
                });
            });

        containerEl.createEl('br');
        containerEl.createEl('h2', {text: 'Color Settings'});

        new Setting(containerEl)
            .setName("Border Color")
            .setDesc("Default Hue, Saturation, Lightness and Alpha (Transparency) for Borders")
            .addText((text) => {
                var hsla = this.plugin.settings.border_h + ", ";
                hsla += this.plugin.settings.border_s + ", ";
                hsla += this.plugin.settings.border_l + ", ";
                hsla += this.plugin.settings.border_a;
                text.setValue(hsla).onChange(async (v) => {
                    var values = v.split(", ");
                    if (values[0] >= 0 && values[0] <= 360) this.plugin.settings.border_h = values[0];
                    if (values[1] >= 0 && values[1] <= 1) this.plugin.settings.border_s = values[1];
                    if (values[2] >= 0 && values[2] <= 1) this.plugin.settings.border_l = values[2];
                    if (values[3] >= 0 && values[3] <= 1) this.plugin.settings.border_a = values[3];
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("Fill Color")
            .setDesc("Default Hue, Saturation, Lightness and Alpha (Transparency) Fill")
            .addText((text) => {
                var hsla = this.plugin.settings.fill_h + ", ";
                hsla += this.plugin.settings.fill_s + ", ";
                hsla += this.plugin.settings.fill_l + ", ";
                hsla += this.plugin.settings.fill_a;
                text.setValue(hsla).onChange(async (v) => {
                    var values = v.split(", ");
                    if (values[0] >= 0 && values[0] <= 360) this.plugin.settings.fill_h = values[0];
                    if (values[1] >= 0 && values[1] <= 1) this.plugin.settings.fill_s = values[1];
                    if (values[2] >= 0 && values[2] <= 1) this.plugin.settings.fill_l = values[2];
                    if (values[3] >= 0 && values[3] <= 1) this.plugin.settings.fill_a = values[3];
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("Text Color")
            .setDesc("Default Hue, Saturation, Lightness and Alpha (Transparency) for Text")
            .addText((text) => {
                var hsla = this.plugin.settings.text_h + ", ";
                hsla += this.plugin.settings.text_s + ", ";
                hsla += this.plugin.settings.text_l + ", ";
                hsla += this.plugin.settings.text_a;
                text.setValue(hsla).onChange(async (v) => {
                    var values = v.split(", ");
                    if (values[0] >= 0 && values[0] <= 360) this.plugin.settings.text_h = values[0];
                    if (values[1] >= 0 && values[1] <= 1) this.plugin.settings.text_s = values[1];
                    if (values[2] >= 0 && values[2] <= 1) this.plugin.settings.text_l = values[2];
                    if (values[3] >= 0 && values[3] <= 1) this.plugin.settings.text_a = values[3];
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("Header Text Color")
            .setDesc("Default Hue, Saturation, Lightness and Alpha (Transparency) for Header Text")
            .addText((text) => {
                var hsla = this.plugin.settings.header_h + ", ";
                hsla += this.plugin.settings.header_s + ", ";
                hsla += this.plugin.settings.header_l + ", ";
                hsla += this.plugin.settings.header_a;
                text.setValue(hsla).onChange(async (v) => {
                    var values = v.split(", ");
                    if (values[0] >= 0 && values[0] <= 360) this.plugin.settings.header_h = values[0];
                    if (values[1] >= 0 && values[1] <= 1) this.plugin.settings.header_s = values[1];
                    if (values[2] >= 0 && values[2] <= 1) this.plugin.settings.header_l = values[2];
                    if (values[3] >= 0 && values[3] <= 1) this.plugin.settings.header_a = values[3];
                    await this.plugin.saveSettings();
                });
            });

        containerEl.createEl('br');
        containerEl.createEl('h2', {text: 'Other Styling Settings'});

        new Setting(containerEl)
            .setName("Shading")
            .setDesc("Add Shading by Default")
            .addToggle((t) => {
                t.setValue(this.plugin.settings.shading).onChange(async (v) => {
                    this.plugin.settings.shading = v;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("Drop Shadows")
            .setDesc("Add Drop Shadows by Default")
            .addToggle((t) => {
                t.setValue(this.plugin.settings.shadow).onChange(async (v) => {
                    this.plugin.settings.shadow = v;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName('Shadow Size')
            .setDesc('Default Shadow Size')
            .addText(text => text
                .setValue(this.plugin.settings.shadow_size.toString())
                .onChange(async (value) => {
                    if (value > 0) {
                        this.plugin.settings.shadow_size = value;
                        await this.plugin.saveSettings();
                    }
                }));

        new Setting(containerEl)
            .setName("Show Headers")
            .setDesc("Show Headers by Default")
            .addToggle((t) => {
                t.setValue(this.plugin.settings.show_headers).onChange(async (v) => {
                    this.plugin.settings.show_headers = v;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("Show Values")
            .setDesc("Show Values by Default")
            .addToggle((t) => {
                t.setValue(this.plugin.settings.show_values).onChange(async (v) => {
                    this.plugin.settings.show_values = v;
                    await this.plugin.saveSettings();
                });
            });

    }
}

