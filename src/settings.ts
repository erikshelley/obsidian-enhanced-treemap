import { App, FileSystemAdapter, normalizePath, PluginSettingTab, Setting } from 'obsidian';
import EnhancedTreemapPlugin from './main';

export interface EnhancedTreemapSettings {
    basePath:       string;
    aspect_w:       number;
    aspect_h:       number;

    // Treemap Settings
    aspect_ratio:   number;
    outer_padding:  number;
    fixed_width:    boolean;
    h_shadow_size:  number;
    h_text_padding: number;
    shadow_size:    number;
    show_headers:   boolean;
    show_values:    boolean;
    sort_by_value:  boolean;
    width:          number;

    // Header Settings
    h_border_color: Array<number>;
    h_fill:         Array<number>;
    h_halign:       string;
    h_shading:      boolean;
    h_shadow:       boolean;
    h_text_color:   Array<number>;
    h_text_size:    number;

    // Cell Settings
    border_color:   Array<number>;
    fill:           Array<number>;
    halign:         string;
    shading:        boolean;
    shadow:         boolean;
    text_color:     Array<number>;
    text_padding:   number;
    text_size:      number;
    valign:         string;

}

export const DEFAULT_SETTINGS: EnhancedTreemapSettings = {
    basePath:       "",

    // Treemap Settings
    aspect_ratio:   1,
    aspect_w:       1,
    aspect_h:       1,
    outer_padding:  8,
    fixed_width:    true,
    h_shadow_size:  4,
    h_text_padding: 8,
    shadow_size:    4,
    show_headers:   true,
    show_values:    false,
    sort_by_value:  true,
    width:          800,

    // Header Settings
    h_border_color: [0, 0, 0, 0.5],
    h_fill:         [0, 0, 0.3, 1],
    h_halign:       "left",
    h_shading:      true,
    h_shadow:       true,
    h_text_color:   [0, 0, 0.9, 1],
    h_text_size:    16,

    // Cell Settings
    border_color:   [0, 0, 0, 0.5],
    fill:           [0, 0, 0.3, 1],
    halign:         "left",
    shading:        true,
    shadow:         true,
    text_color:     [0, 0, 0.8, 1],
    text_padding:   8,
    text_size:      13,
    valign:         "top"

}

export class EnhancedTreemapSettingTab extends PluginSettingTab {
    plugin: EnhancedTreemapPlugin;

    constructor(app: App, plugin: EnhancedTreemapPlugin) {
        super(app, plugin);
        this.plugin = plugin;
        var adapter = app.vault.adapter as FileSystemAdapter;
        this.plugin.settings.basePath = normalizePath(adapter.getBasePath());
    }

    getHSLA(setting: Array<number>): string {
        return setting[0] + ", " + setting[1] + ", " + setting[2] + ", " + setting[3];
    }

    setHSLA(value: string, setting: Array<number>): void {
        var values = value.split(", ");
        var h: number = parseFloat(values[0]);
        var s: number = parseFloat(values[1]);
        var l: number = parseFloat(values[2]);
        var a: number = parseFloat(values[3]);
        if (h >= 0 && h <= 360) setting[0] = h;
        if (s >= 0 && s <= 1) setting[1] = s;
        if (l >= 0 && l <= 1) setting[2] = l;
        if (a >= 0 && a <= 1) setting[3] = a;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        containerEl.createEl('h1', { text: 'Enhanced Treemap Settings' } );
        containerEl.createEl('h2', { text: 'Size & Shape' } );

        new Setting(containerEl)
            .setName('Aspect Ratio')
            .setDesc('Default Aspect Ratio (width:height)')
            .addText(text => text
                .setValue(this.plugin.settings.aspect_w.toString() + ":" + this.plugin.settings.aspect_h.toString())
                .onChange(async (value) => {
                    var ratio = value.split(":");
                    var w: number = parseFloat(ratio[0]);
                    var h: number = parseFloat(ratio[1]);
                    if (w > 0 && h > 0) {
                        this.plugin.settings.aspect_w = w;
                        this.plugin.settings.aspect_h = h;
                        this.plugin.settings.aspect_ratio = w / h;
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
            .setName('Treemap Width')
            .setDesc('Default Treemap Width (if Using Fixed Width)')
            .addText(text => text
                .setValue(this.plugin.settings.width.toString())
                .onChange(async (value) => {
                    var w: number = parseFloat(value);
                    if (w > 0) {
                        this.plugin.settings.width = w;
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

        new Setting(containerEl)
            .setName("Sort by Value")
            .setDesc("Sort by Value or No Sort by Default")
            .addToggle((t) => {
                t.setValue(this.plugin.settings.sort_by_value).onChange(async (v) => {
                    this.plugin.settings.sort_by_value = v;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName('Header Text Size')
            .setDesc('Default Header Text Size')
            .addText(text => text
                .setValue(this.plugin.settings.h_text_size.toString())
                .onChange(async (value) => {
                    var size: number = parseFloat(value);
                    if (size > 0) {
                        this.plugin.settings.h_text_size = size;
                        await this.plugin.saveSettings();
                    }
                }));

        new Setting(containerEl)
            .setName('Cell Text Size')
            .setDesc('Default Cell Text Size')
            .addText(text => text
                .setValue(this.plugin.settings.text_size.toString())
                .onChange(async (value) => {
                    var size: number = parseFloat(value);
                    if (size > 0) {
                        this.plugin.settings.text_size = size;
                        await this.plugin.saveSettings();
                    }
                }));


        containerEl.createEl('br');
        containerEl.createEl('h2', {text: 'Shading & Shadows'});

        new Setting(containerEl)
            .setName('Header Shadow Size')
            .setDesc('Default Header Shadow Size')
            .addText(text => text
                .setValue(this.plugin.settings.h_shadow_size.toString())
                .onChange(async (value) => {
                    var size: number = parseFloat(value);
                    if (size > 0) {
                        this.plugin.settings.h_shadow_size = size;
                        await this.plugin.saveSettings();
                    }
                }));

        new Setting(containerEl)
            .setName('Cell Shadow Size')
            .setDesc('Default Cell Shadow Size')
            .addText(text => text
                .setValue(this.plugin.settings.shadow_size.toString())
                .onChange(async (value) => {
                    var size: number = parseFloat(value);
                    if (size > 0) {
                        this.plugin.settings.shadow_size = size;
                        await this.plugin.saveSettings();
                    }
                }));

        new Setting(containerEl)
            .setName("Header Shading")
            .setDesc("Add Header Shading by Default")
            .addToggle((t) => {
                t.setValue(this.plugin.settings.h_shading).onChange(async (v) => {
                    this.plugin.settings.h_shading = v;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("Cell Shading")
            .setDesc("Add Cell Shading by Default")
            .addToggle((t) => {
                t.setValue(this.plugin.settings.shading).onChange(async (v) => {
                    this.plugin.settings.shading = v;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("Header Shadows")
            .setDesc("Add Drop Shadows to Headers by Default")
            .addToggle((t) => {
                t.setValue(this.plugin.settings.h_shadow).onChange(async (v) => {
                    this.plugin.settings.h_shadow = v;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("Cell Shadows")
            .setDesc("Add Cell Shadows by Default")
            .addToggle((t) => {
                t.setValue(this.plugin.settings.shadow).onChange(async (v) => {
                    this.plugin.settings.shadow = v;
                    await this.plugin.saveSettings();
                });
            });


        containerEl.createEl('br');
        containerEl.createEl('h2', { text: 'Color' } );

        new Setting(containerEl)
            .setName("Header Border Color")
            .setDesc("Default Hue, Saturation, Lightness and Alpha (Transparency) for Header Borders")
            .addText((text) => {
                var hsla = this.getHSLA(this.plugin.settings.h_border_color);
                text.setValue(hsla).onChange(async (value) => {
                    this.setHSLA(value, this.plugin.settings.h_border_color);
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("Cell Border Color")
            .setDesc("Default Hue, Saturation, Lightness and Alpha (Transparency) for Cell Borders")
            .addText((text) => {
                var hsla = this.getHSLA(this.plugin.settings.border_color);
                text.setValue(hsla).onChange(async (value) => {
                    this.setHSLA(value, this.plugin.settings.border_color);
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("Header Fill Color")
            .setDesc("Default Hue, Saturation, Lightness and Alpha (Transparency) for Filling Headers")
            .addText((text) => {
                var hsla = this.getHSLA(this.plugin.settings.h_fill);
                text.setValue(hsla).onChange(async (value) => {
                    this.setHSLA(value, this.plugin.settings.h_fill);
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("Cell Fill Color")
            .setDesc("Default Hue, Saturation, Lightness and Alpha (Transparency) for Filling Cells")
            .addText((text) => {
                var hsla = this.getHSLA(this.plugin.settings.fill);
                text.setValue(hsla).onChange(async (value) => {
                    this.setHSLA(value, this.plugin.settings.fill);
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("Header Text Color")
            .setDesc("Default Hue, Saturation, Lightness and Alpha (Transparency) for Header Text")
            .addText((text) => {
                var hsla = this.getHSLA(this.plugin.settings.h_text_color);
                text.setValue(hsla).onChange(async (value) => {
                    this.setHSLA(value, this.plugin.settings.h_text_color);
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("Cell Text Color")
            .setDesc("Default Hue, Saturation, Lightness and Alpha (Transparency) for Cell Text")
            .addText((text) => {
                var hsla = this.getHSLA(this.plugin.settings.text_color);
                text.setValue(hsla).onChange(async (value) => {
                    this.setHSLA(value, this.plugin.settings.text_color);
                    await this.plugin.saveSettings();
                });
            });


        containerEl.createEl('br');
        containerEl.createEl('h2', { text: 'Padding' } );

        new Setting(containerEl)
            .setName('Cell Padding')
            .setDesc('Default Padding Size Around Cells')
            .addText(text => text
                .setValue(this.plugin.settings.outer_padding.toString())
                .onChange(async (value) => {
                    var padding: number = parseFloat(value);
                    if (padding > 0) {
                        this.plugin.settings.outer_padding = padding;
                        await this.plugin.saveSettings();
                    }
                }));

        new Setting(containerEl)
            .setName('Header Text Padding')
            .setDesc('Default Padding Size Around Header Text')
            .addText(text => text
                .setValue(this.plugin.settings.h_text_padding.toString())
                .onChange(async (value) => {
                    var padding: number = parseFloat(value);
                    if (padding > 0) {
                        this.plugin.settings.h_text_padding = padding;
                        await this.plugin.saveSettings();
                    }
                }));

        new Setting(containerEl)
            .setName('Cell Text Padding')
            .setDesc('Default Padding Size Around Cell Text')
            .addText(text => text
                .setValue(this.plugin.settings.text_padding.toString())
                .onChange(async (value) => {
                    var padding: number = parseFloat(value);
                    if (padding > 0) {
                        this.plugin.settings.text_padding = padding;
                        await this.plugin.saveSettings();
                    }
                }));

        containerEl.createEl('br');
        containerEl.createEl('h2', { text: 'Alignment' } );

        new Setting(containerEl)
            .setName("Header Horizontal Alignment")
            .setDesc("Default Horizontal Alignment for Header Text")
            .addDropdown((d) => {
                d.addOption("left", "Left");
                d.addOption("center", "Center");
                d.addOption("right", "Right");
                d.setValue(this.plugin.settings.h_halign);
                d.onChange(async (v) => {
                    this.plugin.settings.h_halign = d.getValue() as string;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("Cell Horizontal Alignment")
            .setDesc("Default Cell Text Horizontal Alignment")
            .addDropdown((d) => {
                d.addOption("left", "Left");
                d.addOption("center", "Center");
                d.addOption("right", "Right");
                d.setValue(this.plugin.settings.halign);
                d.onChange(async (v) => {
                    this.plugin.settings.halign = d.getValue() as string;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("Cell Vertical Alignment")
            .setDesc("Default Cell Text Vertical Alignment")
            .addDropdown((d) => {
                d.addOption("top", "Top");
                d.addOption("center", "Center");
                d.addOption("bottom", "Bottom");
                d.setValue(this.plugin.settings.valign);
                d.onChange(async (v) => {
                    this.plugin.settings.valign = d.getValue() as string;
                    await this.plugin.saveSettings();
                });
            });

    }
}

