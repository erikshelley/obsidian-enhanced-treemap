import { App, ButtonComponent, debounce, MarkdownPostProcessorContext, MarkdownRenderChild, setIcon } from 'obsidian';
import EnhancedTreemapPlugin from './main';
import { EnhancedTreemapSettings } from './settings';
import * as d3 from 'd3';
const d3ToPng = require('d3-svg-to-png');


// extend obsidian workspace object with enhancedtreemap:refresh event
declare module "obsidian" {
    interface Workspace {
        on(name: "enhancedtreemap:refresh", callback: () => void, ctx?: any): EventRef;
    }
}


export default class EnhancedTreemap {
    app:    App;
    plugin: EnhancedTreemapPlugin;

    constructor(app: App, plugin: EnhancedTreemapPlugin) {
        this.app = app;
        this.plugin = plugin;
    }

    async renderEnhancedTreemap(element: HTMLElement, ctx: MarkdownPostProcessorContext) {
        let renderer: EnhancedTreemapRenderChild;

        await this.plugin.app.workspace.onLayoutReady(() => {
            renderer = new EnhancedTreemapRenderChild(this.app, element, this, ctx, this.plugin.settings);
            ctx.addChild(renderer);
        });
    }
}


class EnhancedTreemapRenderChild extends MarkdownRenderChild {
    app:                  App;
    ctx:                  MarkdownPostProcessorContext;
    data:                 any;
    uuid:                 number;
    previous_uuid:        number;
    element:              HTMLElement;
    enhancedtreemap:      EnhancedTreemap;
    error:                boolean;
    pluginsettings:       EnhancedTreemapSettings;
    settings:             EnhancedTreemapSettings;
    svg:                  SVGSVGElement|null;
    svg_height:           number;
    svg_id:               string;
    svg_width:            number;

    constructor(app: App, element: HTMLElement, enhancedtreemap: EnhancedTreemap, ctx: MarkdownPostProcessorContext, settings: EnhancedTreemapSettings) {
        super(element);
        this.app                  = app;
        this.ctx                  = ctx;
        this.element              = element;
        this.enhancedtreemap      = enhancedtreemap;
        this.error                = false;
        this.svg_id               = "enhancedtreemap";
        this.svg_height           = 10;
        this.svg_width            = 10;
        this.pluginsettings       = settings;
    }

    private debouncedRefresh = debounce(() => this.render(), 500, true);

    async onload() {
        this.registerEvent(this.enhancedtreemap.plugin.app.workspace.on("enhancedtreemap:refresh", this.debouncedRefresh));
        this.render();
    }

    async render() {
        this.loadSettings();  // load settings every time a treemap is rendered in case they were updated
        this.verifyJSON();
        this.parseSettings(); // parse the treemap settings to override the plugin settings
        this.addEmptySVG();
        await this.enhancedtreemap.plugin.app.workspace.onLayoutReady(() => { this.renderEnhancedTreemap(); });
    }

    // make a deep copy of the plugin settings so if they are changed for a treemap they are not changed for the plugin
    loadSettings() { this.settings = JSON.parse(JSON.stringify(this.pluginsettings)); }

    // show an error message instead of an SVG in place of the code block
    handleError(message: string) {
        this.error = true;
        const wrapper = document.createElement("div");
        wrapper.textContent = message;
        wrapper.setAttribute("style", "color: red");
        const parentDiv = this.element.querySelector("pre");
        if (parentDiv != null) parentDiv.replaceWith(wrapper);
    }

    // make sure the JSON can be parsed
    verifyJSON() {
        const code = this.element.querySelector("code");
        if (code != null) {
            const json = code.textContent;
            if (json != null) {
                try {
                    this.data = JSON.parse(json);
                } catch(e) {
                    this.handleError(e);
                }
            }
        }
    }

    // raise an error if a number setting is invalid
    verifyNumber(value: number, setting: string, low: number, high: number) {
        if (Number.isNaN(value)) this.handleError(setting + " must be a number!");
        if (low != null && value < low) this.handleError(setting + " must be >= " + low);
        if (high != null && value > high) this.handleError(setting + " must be <= " + high);
        return value;
    }

    // raise an error if a boolean setting is invalid
    verifyBoolean(value: boolean, setting: string) {
        if (typeof value != "boolean") this.handleError(setting + " must be true or false (no quotes)!");
        return value;
    }

    // raise an error if a string setting is invalid
    verifyString(value: string, setting: string, value_list: Array<string>) {
        if (!value_list.includes(value)) this.handleError(setting + "must be in this list: " + value_list);
        return value;
    }

    // update settings from plugin defaults with settings from treemap code block
    parseSettings() {
        if (this.data == null) return;
        if (this.error) return;
        let settings: Array<any>;
        settings = this.data.settings;
        if (settings) {
            settings.forEach(setting => {
                // Treemap Settings
                if (setting.aspect_ratio != null) {
                    let aspect = 1;
                    const ratio = setting.aspect_ratio.split(":");
                    if (ratio[0] == 0 || ratio[1] == 0) this.handleError("aspect_ratio cannot include any zeros");
                    else aspect = ratio[0] / ratio[1];
                    this.settings.aspect_ratio = this.verifyNumber(aspect, "aspect_ratio", 0, Number.MAX_SAFE_INTEGER);
                    this.settings.aspect_w = ratio[0];
                    this.settings.aspect_h = ratio[1];
                }
                if (setting.outer_padding != null)
                    this.settings.outer_padding = this.verifyNumber(setting.outer_padding, "outer_padding", 0, Number.MAX_SAFE_INTEGER);
                if (setting.fixed_width != null)
                    this.settings.fixed_width = this.verifyBoolean(setting.fixed_width, "fixed_width");
                if (setting.h_shadow_size != null)
                    this.settings.h_shadow_size = this.verifyNumber(setting.h_shadow_size, "h_shadow_size", 0, Number.MAX_SAFE_INTEGER);
                if (setting.h_text_padding != null)
                    this.settings.h_text_padding = this.verifyNumber(setting.h_text_padding, "h_text_padding", 0, Number.MAX_SAFE_INTEGER);
                if (setting.shadow_size != null)
                    this.settings.shadow_size = this.verifyNumber(setting.shadow_size, "shadow_size", 0, Number.MAX_SAFE_INTEGER);
                if (setting.show_headers != null)
                    this.settings.show_headers = this.verifyBoolean(setting.show_headers, "show_headers");
                if (setting.sort_by_value != null)
                    this.settings.sort_by_value = this.verifyBoolean(setting.sort_by_value, "sort_by_value");
                if (setting.width != null)
                    this.settings.width = this.verifyNumber(setting.width, "width", 1, Number.MAX_SAFE_INTEGER);

                // Header Settings
                if (setting.h_border_color != null) {
                    if (setting.h_border_color.h != null)
                        this.settings.h_border_color[0] = this.verifyNumber(setting.h_border_color.h, "h_border_color hue", 0, 360);
                    if (setting.h_border_color.s != null)
                        this.settings.h_border_color[1] = this.verifyNumber(setting.h_border_color.s, "h_border_color saturation", 0, 1);
                    if (setting.h_border_color.l != null)
                        this.settings.h_border_color[2] = this.verifyNumber(setting.h_border_color.l, "h_border_color lightness", 0, 1);
                    if (setting.h_border_color.a != null)
                        this.settings.h_border_color[3] = this.verifyNumber(setting.h_border_color.a, "h_border_color alpha", 0, 1);
                }
                if (setting.h_fill != null) {
                    if (setting.h_fill.h != null)
                        this.settings.h_fill[0] = this.verifyNumber(setting.h_fill.h, "h_fill hue", 0, 360);
                    if (setting.h_fill.s != null)
                        this.settings.h_fill[1] = this.verifyNumber(setting.h_fill.s, "h_fill saturation", 0, 1);
                    if (setting.h_fill.l != null)
                        this.settings.h_fill[2] = this.verifyNumber(setting.h_fill.l, "h_fill lightness", 0, 1);
                    if (setting.h_fill.a != null)
                        this.settings.h_fill[3] = this.verifyNumber(setting.h_fill.a, "h_fill alpha", 0, 1);
                }
                if (setting.h_halign != null)
                    this.settings.h_halign = this.verifyString(setting.h_halign, "h_halign", ["left", "center", "right"]);
                if (setting.h_shading != null)
                    this.settings.h_shading = this.verifyBoolean(setting.h_shading, "h_shading");
                if (setting.h_shadow != null)
                    this.settings.h_shadow = this.verifyBoolean(setting.h_shadow, "h_shadow");
                if (setting.h_text_color != null) {
                    if (setting.h_text_color.h != null)
                        this.settings.h_text_color[0] = this.verifyNumber(setting.h_text_color.h, "h_text_color hue", 0, 360);
                    if (setting.h_text_color.s != null)
                        this.settings.h_text_color[1] = this.verifyNumber(setting.h_text_color.s, "h_text_color saturation", 0, 1);
                    if (setting.h_text_color.l != null)
                        this.settings.h_text_color[2] = this.verifyNumber(setting.h_text_color.l, "h_text_color lightness", 0, 1);
                    if (setting.h_text_color.a != null)
                        this.settings.h_text_color[3] = this.verifyNumber(setting.h_text_color.a, "h_text_color alpha", 0, 1);
                }
                if (setting.h_text_size != null)
                    this.settings.h_text_size = this.verifyNumber(setting.h_text_size, "h_text_size", 1, Number.MAX_SAFE_INTEGER);
                if (this.settings.show_headers == false)
                    this.settings.h_text_size = 0;

                // Cell Settings
                if (setting.border_color != null) {
                    if (setting.border_color.h != null)
                        this.settings.border_color[0] = this.verifyNumber(setting.border_color.h, "border_color hue", 0, 360);
                    if (setting.border_color.s != null)
                        this.settings.border_color[1] = this.verifyNumber(setting.border_color.s, "border_color saturation", 0, 1);
                    if (setting.border_color.l != null)
                        this.settings.border_color[2] = this.verifyNumber(setting.border_color.l, "border_color lightness", 0, 1);
                    if (setting.border_color.a != null)
                        this.settings.border_color[3] = this.verifyNumber(setting.border_color.a, "border_color alpha", 0, 1);
                }
                if (setting.fill != null) {
                    if (setting.fill.h != null)
                        this.settings.fill[0] = this.verifyNumber(setting.fill.h, "fill hue", 0, 360);
                    if (setting.fill.s != null)
                        this.settings.fill[1] = this.verifyNumber(setting.fill.s, "fill saturation", 0, 1);
                    if (setting.fill.l != null)
                        this.settings.fill[2] = this.verifyNumber(setting.fill.l, "fill lightness", 0, 1);
                    if (setting.fill.a != null)
                        this.settings.fill[3] = this.verifyNumber(setting.fill.a, "fill alpha", 0, 1);
                }
                if (setting.halign != null)
                    this.settings.halign = this.verifyString(setting.halign, "halign", ["left", "center", "right"]);
                if (setting.shading != null)
                    this.settings.shading = this.verifyBoolean(setting.shading, "shading");
                if (setting.shadow != null)
                    this.settings.shadow = this.verifyBoolean(setting.shadow, "shadow");
                if (setting.show_values != null)
                    this.settings.show_values = this.verifyBoolean(setting.show_values, "show_values");
                if (setting.text_color != null) {
                    if (setting.text_color.h != null)
                        this.settings.text_color[0] = this.verifyNumber(setting.text_color.h, "text_color hue", 0, 360);
                    if (setting.text_color.s != null)
                        this.settings.text_color[1] = this.verifyNumber(setting.text_color.s, "text_color saturation", 0, 1);
                    if (setting.text_color.l != null)
                        this.settings.text_color[2] = this.verifyNumber(setting.text_color.l, "text_color lightness", 0, 1);
                    if (setting.text_color.a != null)
                        this.settings.text_color[3] = this.verifyNumber(setting.text_color.a, "text_color alpha", 0, 1);
                }
                if (setting.text_padding != null)
                    this.settings.text_padding = this.verifyNumber(setting.text_padding, "text_padding", 0, Number.MAX_SAFE_INTEGER);
                if (setting.text_size != null)
                    this.settings.text_size = this.verifyNumber(setting.text_size, "text_size", 1, Number.MAX_SAFE_INTEGER);
                if (setting.valign != null)
                    this.settings.valign = this.verifyString(setting.valign, "vertical_alignment", ["top", "center", "bottom"]);
            });
        }
    }

    // define an empty SVG element ready for the treemap to be added
    emptySVG() {
        this.previous_uuid = this.uuid;
        this.uuid = Math.floor(Math.random() * 100000);
        this.svg_id = "enhancedtreemap_" + this.uuid;

        const wrapper = document.createElement("div");
        wrapper.classList.add("block-language-json");

        /*
        <button>Save as PNG</button>
        <br>
        <svg id="enhancedtreemap_xxxx" width="800" height="400" name="enhancedtreemap" class="enhancedtreemap">
            <defs>
                <radialGradient id="radialgradient_6828" cx="25%" cy="25%" r="100%">
                    <stop offset="0%" stop-color="hsla(0, 0%, 100%, 10%)"></stop>
                    <stop offset="100%" stop-color="hsla(0, 0%, 0%, 10%)"></stop>
                </radialGradient>
            </defs>
            <filter id="h_shadow_xxxx" color-interpolation-filters="sRGB">
                <feDropShadow dx="4" dy="4" stdDeviation="4" flood-opacity="0.5"></feDropShadow>
            </filter>
            <filter id="shadow_xxxx" color-interpolation-filters="sRGB">
                <feDropShadow dx="4" dy="4" stdDeviation="4" flood-opacity="0.5"></feDropShadow>
            </filter>
        </svg>
        */

        if (this.settings.save_as_png) {
            let saveButton = new ButtonComponent(wrapper)
                .setButtonText("Save as PNG")
                //.setIcon("save") // https://lucide.dev/
                .onClick(() => {
                    d3ToPng("#enhancedtreemap_" + this.uuid, "filename", { scale: 2 });
                });
            const newline = document.createElement("br");
            wrapper.append(newline);
        }

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("id", this.svg_id);

        if (this.settings.fixed_width == false) {
            svg.setAttribute("width", "100%");
            svg.setAttribute("viewBox", "0 0 " + this.svg_width.toString() + " " + this.svg_height.toString());
        }
        else {
            this.svg_width = this.settings.width;
            this.svg_height = this.settings.width / this.settings.aspect_ratio;
            svg.setAttribute("width", this.svg_width.toString());
            svg.setAttribute("height", this.svg_height.toString())
        }

        svg.setAttribute("name", "enhancedtreemap");
        svg.classList.add("enhancedtreemap");

        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

        const radialGradient = document.createElementNS("http://www.w3.org/2000/svg", "radialGradient");
        radialGradient.setAttribute("id", "radialgradient_" + this.uuid);
        radialGradient.setAttribute("cx", "25%");
        radialGradient.setAttribute("cy", "25%");
        radialGradient.setAttribute("r", "100%");

        const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        stop1.setAttribute("offset", "0%");
        stop1.setAttribute("stop-color", "hsla(0, 0%, 100%, 10%)");
        const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        stop2.setAttribute("offset", "100%");
        stop2.setAttribute("stop-color", "hsla(0, 0%, 0%, 10%)");
        radialGradient.appendChild(stop1);
        radialGradient.appendChild(stop2);
        defs.appendChild(radialGradient);
        svg.appendChild(defs);

        const h_filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
        h_filter.setAttribute("id", "h_shadow_" + this.uuid);
        h_filter.setAttribute("color-interpolation-filters", "sRGB");
        const h_feDropShadow = document.createElementNS("http://www.w3.org/2000/svg", "feDropShadow");
        h_feDropShadow.setAttribute("dx", this.settings.h_shadow_size.toString());
        h_feDropShadow.setAttribute("dy", this.settings.h_shadow_size.toString());
        h_feDropShadow.setAttribute("stdDeviation", this.settings.h_shadow_size.toString());
        h_feDropShadow.setAttribute("flood-opacity", "0.5");
        h_filter.appendChild(h_feDropShadow);
        svg.append(h_filter);

        const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
        filter.setAttribute("id", "shadow_" + this.uuid);
        filter.setAttribute("color-interpolation-filters", "sRGB");
        const feDropShadow = document.createElementNS("http://www.w3.org/2000/svg", "feDropShadow");
        feDropShadow.setAttribute("dx", this.settings.shadow_size.toString());
        feDropShadow.setAttribute("dy", this.settings.shadow_size.toString());
        feDropShadow.setAttribute("stdDeviation", this.settings.shadow_size.toString());
        feDropShadow.setAttribute("flood-opacity", "0.5");
        filter.appendChild(feDropShadow);
        svg.append(filter);

        wrapper.append(svg);

        return wrapper;
    }

    // add the empty SVG in place of the code block
    addEmptySVG() {
        if (this.error) return;
        const svg = this.emptySVG();
        if (svg != null) {
            const parentDiv = this.element.querySelector("pre");
            if (parentDiv != null) {
                parentDiv.replaceWith(svg);
                this.svg = this.element.querySelector("#enhancedtreemap_" + this.uuid);
            }
            else { // if a refresh happens while in reader view there is no pre element, only our substituted elements
                const svgEl = this.element.querySelector("#enhancedtreemap_" + this.previous_uuid);
                if (svgEl != null) {
                    const parentDivRefresh = svgEl.parentElement;
                    if (parentDivRefresh != null) {
                        parentDivRefresh.replaceWith(svg);
                        this.svg = this.element.querySelector("#enhancedtreemap_" + this.uuid);
                    }
                }
            }
        }
    }

    // use d3.js functions to create the treemap
    async renderEnhancedTreemap() {
        if (this.error) return;

        const svg_element = document.getElementById(this.svg_id);

        // elements are not always added to the DOM right away
        if (svg_element == null) {
            this.debouncedRefresh();
            return;
        }

        let width = this.svg_width;
        let height = this.svg_height;
        let scale = 1;

        // resize SVG to 100% width if it is not fixed width
        if (!this.settings.fixed_width) {
            scale = this.settings.aspect_ratio;
            if (svg_element.parentElement != null) {
                width = svg_element.parentElement.offsetWidth * scale;
                height = svg_element.parentElement.offsetHeight;
            }
            svg_element.setAttribute("viewBox", "0 0 " + width + " " + height);
            // Need these lines when saving non-fixed width SVG as PNG, otherwise it gets cropped when using scale > 1
            svg_element.setAttribute("width", (width / scale).toString());
            svg_element.setAttribute("height", (height / scale).toString());
        }

        const vertical_alignment   = this.settings.valign; // this is needed to access them within wrap function
        const horizontal_alignment = this.settings.halign; // this is needed to access them within wrap function
        const outer_padding        = this.settings.outer_padding * scale;
        const text_padding         = this.settings.text_padding * scale;
        const h_text_padding       = this.settings.h_text_padding * scale;
        const text_size            = this.settings.text_size * scale;
        const h_text_size          = this.settings.h_text_size * scale;


        // load json data into hierarchy of nodes
        // the ||!d.children adds a default value of 1 for any leaf nodes with no value
        let nodes;
        if (this.settings.sort_by_value) {
            nodes = d3.hierarchy(this.data).sum((d: any) => { return d.value||!d.children; }).sort((a: any, b: any) => b.value - a.value);
        }
        else {
            nodes = d3.hierarchy(this.data).sum((d: any) => { return d.value||!d.children; });
        }

        // add positions to the nodes using the treemap layout
        const treemapLayout = d3.treemap()
            .tile(d3.treemapSquarify.ratio(1))
            .size([width, height])
            .paddingOuter(outer_padding)
            .paddingTop(this.settings.show_headers ? outer_padding + h_text_size + 2 * h_text_padding : outer_padding)
            .paddingInner(outer_padding)
            (nodes);

        // add group to the SVG to hold the treemap elements
        let svg = d3.select(this.svg).append("g");

        // Cell rectangles
        // use decendants instead of leaves to show all nodes, not just the leaves
        svg.selectAll().data(nodes.descendants()).enter()
            .append("rect")
                .attr("x",      (d: any) => { return d.x0; })
                .attr("y",      (d: any) => { return d.y0; })
                .attr("width",  (d: any) => { return d.x1 - d.x0; })
                .attr("height", (d: any) => { return d.y1 - d.y0; })
                .attr("stroke", (d: any) => { return d.children ?
                      getDataOrSetting(d.data.border_color, this.settings.h_border_color) :
                      getDataOrSetting(d.data.border_color, this.settings.border_color)
                })
                .attr("fill", (d: any) => { return d.children ?
                      getDataOrSetting(d.data.fill, this.settings.h_fill) :
                      getDataOrSetting(d.data.fill, this.settings.fill)
                })
                .attr("filter", (d: any) => { return d.children ?
                      (getDataOrSetting(d.data.shadow, this.settings.h_shadow) ? "url(#h_shadow_" + this.uuid + ")" : "") :
                      (getDataOrSetting(d.data.shadow, this.settings.shadow) ? "url(#shadow_" + this.uuid + ")" : "")
                });


        // Images
        const toDataURL = function(url: string, callback: any) {
            const xhr = new XMLHttpRequest();
            xhr.onload = function() {
                const reader = new FileReader();
                reader.onloadend = function() {
                    callback(reader.result);
                }
                reader.readAsDataURL(xhr.response);
            };
            xhr.open('GET', url);
            xhr.responseType = 'blob';
            xhr.send();
        };

        // replace images with inline base64 data so they are included when saving svg as png
        function base64Image(image: any) {
            image.each(function() {
                const img = d3.select(this);
                const url = img.attr("href");
                toDataURL(url, (imageData: any) => {
                    img.attr("href", imageData);
                });
            });
        }

        svg.selectAll().data(nodes.descendants().filter((d: any) => { return d.data.image; })).enter()
            .append("image")
                .attr("x",          (d: any) => { return d.x0; })
                .attr("y",          (d: any) => { return d.y0; })
                .attr("width",      (d: any) => { return d.x1 - d.x0; })
                .attr("height",     (d: any) => { return d.y1 - d.y0; })
                .attr("xlink:href", (d: any) => {
                    if (d.data.image.includes("://")) return d.data.image;
                    else return this.app.vault.adapter.getResourcePath(d.data.image); })
                .call(base64Image);


        // Shading rectangles
        svg.selectAll().data(nodes.descendants()).enter()
            .append("rect")
                .attr("x",      (d: any) => { return d.x0; })
                .attr("y",      (d: any) => { return d.y0; })
                .attr("width",  (d: any) => { return d.x1 - d.x0; })
                .attr("height", (d: any) => { return d.y1 - d.y0; })
                .attr("fill", (d: any) => { return d.children ?
                      (getDataOrSetting(d.data.shading, this.settings.h_shading) ? "url(#radialgradient_" + this.uuid + ")" : d3.hsl(0, 0, 0, 0).toString()) :
                      (getDataOrSetting(d.data.shading, this.settings.shading) ? "url(#radialgradient_" + this.uuid + ")" : d3.hsl(0, 0, 0, 0).toString())
                })
                .append("title").text((d: any) => { return d.data.name; });


        // Cell text
        svg.selectAll().data(nodes.leaves()).enter()
            .append("text")
                .attr("x",           (d: any) => {
                      const align = getDataOrSetting(d.data.halign, this.settings.halign);
                      if (align == "left")   return d.x0 + textPadding(d, scale, text_padding);
                      if (align == "center") return d.x0 + 0.5 * (d.x1 - d.x0);
                      if (align == "right")  return d.x1 - textPadding(d, scale, text_padding);
                })
                .attr("y",           (d: any) => {
                      const align = getDataOrSetting(d.data.valign, this.settings.valign);
                      if (align == "top")    return d.y0 + textPadding(d, scale, text_padding) + textSize(d, scale, text_size);
                      if (align == "center") return d.y0 + 0.5 * (d.y1 - d.y0) + 0.3 * textSize(d, scale, text_size);
                      if (align == "bottom") return d.y1 - textPadding(d, scale, text_padding);
                })
                .attr("v-align",     (d: any) => { return d.data.valign })
                .attr("left",        (d: any) => { return d.x0; })
                .attr("top",         (d: any) => { return d.y0; })
                .attr("width",       (d: any) => { return d.x1 - d.x0 - 2 * textPadding(d, scale, text_padding); })
                .attr("height",      (d: any) => { return d.y1 - d.y0 - 2 * textPadding(d, scale, text_padding); })
                .attr("text-anchor", (d: any) => {
                      const align = getDataOrSetting(d.data.halign, this.settings.halign);
                      if (align == "left")   return "start";
                      if (align == "center") return "middle";
                      if (align == "right")  return "end";
                      return "start";
                })
                .attr("font-size",   (d: any) => { return textSize(d, scale, text_size) + "px" })
                .attr("fill",        (d: any) => { return getDataOrSetting(d.data.text_color, this.settings.text_color) })
                .attr("opacity",     (d: any) => { return ((d.y1 - d.y0 < textSize(d, scale, text_size)) || (d.x1 - d.x0 < 2 * textSize(d, scale, text_size))) ? 0 : 1 })
                .text((d: any) => { return this.settings.show_values ? (d.data.value || 1) + " " + d.data.name : d.data.name; })
                .call(wrap)
                .append("title").text((d: any) => { return d.data.name; });


        // Header text
        if (this.settings.show_headers) {
            svg.selectAll().data(nodes.descendants().filter((d: any) => { return d.children; })).enter()
                .append("text")
                    .attr("x",           (d: any) => {
                          const align = getDataOrSetting(d.data.halign, this.settings.h_halign);
                          if (align == "left")   return d.x0 + 1.0 * h_text_padding;
                          if (align == "center") return d.x0 + 0.5 * (d.x1 - d.x0);
                          if (align == "right")  return d.x1 - 1.0 * h_text_padding;
                    })
                    .attr("y",           (d: any) => { return d.y0 + outer_padding/2 + h_text_padding + 0.8 * textSize(d, scale, h_text_size) })
                    .attr("width",       (d: any) => { return d.x1 - d.x0 - 2 * h_text_padding; })
                    .attr("text-anchor", (d: any) => {
                          const align = getDataOrSetting(d.data.halign, this.settings.h_halign);
                          if (align == "left")   return "start";
                          if (align == "center") return "middle";
                          if (align == "right")  return "end";
                          return "start";
                    })
                    .attr("font-size",   (d: any) => { return textSize(d, scale, h_text_size) + "px" })
                    .attr("fill", (d: any) => { return getDataOrSetting(d.data.text_color, this.settings.h_text_color) })
                    .attr("opacity",     (d: any) => { return ((h_text_size + h_text_padding < textSize(d, scale, h_text_size)) || (d.x1 - d.x0 < textSize(d, scale, h_text_size))) ? 0 : 1 })
                    .text((d: any) => { return d.data.name; })
                    .call(ellipse)
                    .append("title").text((d: any) => { return d.data.name; });
        }


        // helper functions
        function getDataOrSetting(data: any, setting: any) {
            if (data != null) {
                if (typeof data === "object" && !Array.isArray(data)) {
                    return d3.hsl(
                        (data.h == null) ? setting[0] : data.h,
                        (data.s == null) ? setting[1] : data.s,
                        (data.l == null) ? setting[2] : data.l,
                        (data.a == null) ? setting[3] : data.a).toString();
                }
                else { return data; }
            }
            else {
                if (Array.isArray(setting)) { return d3.hsl(setting[0], setting[1], setting[2], setting[3]).toString(); }
                else { return setting; }
            }
        }

        function textPadding(d: any, scale: number, padding: number) {
            return d.data.text_padding == null ? padding : scale * d.data.text_padding;
        }

        function textSize(d: any, scale: number, fontsize: number) {
            return d.data.text_size == null ? fontsize : scale * d.data.text_size;
        }

        function checkWidth(tspan: any, width: number) {
            if (tspan.node() == null) return true;
            else return (tspan.node().getComputedTextLength() > width);
        }

        // if text is too long break it into multiple tspans
        function wrap(text: any) {
            text.each(function() {
                let text = d3.select(this),
                    words = text.text().split(/([_-\s])/).reverse(),
                    word,
                    longline,
                    fraction,
                    i,
                    line: string[] = [],
                    lineNumber = 0,
                    lineHeight = 1.1, // ems
                    wordcount  = 0,
                    overflow   = false,
                    x = text.attr("x"),
                    y = text.attr("y"),
                    valign   = text.attr("v-align") == null ? vertical_alignment : text.attr("v-align"),
                    width    = parseFloat(text.attr("width")),
                    height   = parseFloat(text.attr("height")),
                    fontsize = parseFloat(text.attr("font-size").substring(0, text.attr("font-size").length - 2)),
                    dy = 0,
                    tspan = text.text(null)
                                .append("tspan")
                                .attr("x", x)
                                .attr("y", y)
                                .attr("dy", dy + "em");

                words = words.filter(function(t) { return t != ""; });
                while (word = words.pop()) {
                    // add a word to the line
                    line.push(word);
                    wordcount++;

                    // only update the text if we haven't already exceeded the max rows that will fit
                    if (lineNumber * lineHeight * fontsize <= height && !overflow) {
                        tspan.text(line.join(""));

                        // if the current line is too long to fit then remove the last word added
                        while (checkWidth(tspan, width) && !overflow) {

                            // remove the word that made the line too long
                            line.pop();
                            wordcount--;
                            if (wordcount > 0) tspan.text(line.join(""));

                            // if a single word is too long to fit, break it apart
                            if (wordcount == 0) {
                                longline = tspan.text();

                                // find the largest fraction of the word that will fit
                                fraction = 1;
                                while (checkWidth(tspan, width) && tspan.text().length > 2) {
                                    fraction++;
                                    tspan.text(longline.substring(0, longline.length/fraction));
                                }

                                // set the remainder of the long word to be the next word
                                word = longline.substring(longline.length / fraction, longline.length);
                            }

                            // create a new line using the removed word
                            if ((lineNumber + 2) * lineHeight * fontsize <= height && !overflow) {
                                line = [word];
                                wordcount = 1;
                                tspan = text.append("tspan")
                                            .attr("x", x)
                                            .attr("y", y)
                                            .attr("dy", ++lineNumber * lineHeight + dy + "em")
                                            .text(word);

                                // if we are on the last word and it is too long, break it apart
                                if (words.length == 0 && checkWidth(tspan, width)) {
                                    longline = tspan.text();
                                    fraction = 1;
                                    while (checkWidth(tspan, width) && tspan.text().length > 1) {
                                        fraction++;
                                        tspan.text(longline.substring(0, longline.length/fraction));
                                    }
                                    for (i=2; i <= fraction; i++) {
                                        if ((lineNumber + 2) * lineHeight * fontsize <= height) {
                                            tspan = text.append("tspan")
                                                        .attr("x", x)
                                                        .attr("y", y)
                                                        .attr("dy", ++lineNumber * lineHeight + dy + "em")
                                                        .text(longline.substring((i - 1) * longline.length / fraction, i * longline.length / fraction));
                                        }
                                        else { overflow = true; }
                                    }
                                }
                            }
                            else { overflow = true; }
                        }
                    }
                }
                if (overflow == true) {
                    tspan.text(tspan.text() + "...");
                    while (checkWidth(tspan, width) && tspan.text().length > 3) {
                        tspan.text(tspan.text().substring(0, tspan.text().length - 4) + "...");
                    }
                }
                if (lineNumber > 0) {
                    let startDy: number;
                    if (valign == "top") startDy = 0;
                    if (valign == "center") startDy = -0.5 * lineNumber * lineHeight;
                    if (valign == "bottom") startDy = -lineNumber * lineHeight;
                    text.selectAll("tspan").attr("dy", (d, i) => startDy + lineHeight * i + "em");
                }
            });
        }

        // if header text is too long, cut it down to size and add ellipses
        function ellipse(text: any) {
            text.each(function() {
                const text = d3.select(this);
                const width = parseFloat(text.attr("width"));
                const original = text.text();
                let tspan = text.text("").append("tspan").text(original);
                if (!checkWidth(tspan, width)) return;
                tspan.text(original + "...");
                while (checkWidth(tspan, width) && tspan.text().length > 3) {
                    tspan.text(tspan.text().substring(0, tspan.text().length - 4) + "...");
                }
            });
        }

    }

}

