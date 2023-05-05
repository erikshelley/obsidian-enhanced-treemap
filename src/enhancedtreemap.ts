import { MarkdownPostProcessorContext, MarkdownRenderChild } from 'obsidian';
import EnhancedTreemapPlugin from './main';
import { EnhancedTreemapSettings } from './settings';
import * as d3 from 'd3';

export default class EnhancedTreemap {
    plugin: EnhancedTreemapPlugin;

    constructor(plugin: EnhancedTreemapPlugin) {
        this.plugin = plugin;
    }

    async renderEnhancedTreemap(element: HTMLElement, ctx: MarkdownPostProcessorContext) {
        var renderer: EnhancedTreemapRenderChild;

        // need this "await" on adding the svg to the DOM before adding the text otherwise getComputedTextLength does not work
        await this.plugin.app.workspace.onLayoutReady(() => {
            renderer = new EnhancedTreemapRenderChild(element, this, ctx, this.plugin.settings);
            ctx.addChild(renderer);
        });

        await this.plugin.app.workspace.onLayoutReady(() => {
            renderer.renderEnhancedTreemap();
        });
    }
}

class EnhancedTreemapRenderChild extends MarkdownRenderChild {
    basePath:             string;
    ctx:                  MarkdownPostProcessorContext;
    data:                 any;
    uuid:                 number;
    element:              HTMLElement;
    enhancedtreemap:      EnhancedTreemap;
    error:                boolean;
    svg:                  SVGSVGElement|null;
    svg_height:           number;
    svg_id:               string;
    svg_width:            number;

    // Treemap Settings
    aspect_ratio:         number;
    aspect_w:             number;
    aspect_h:             number;
    outer_padding:        number;
    fixed_width:          boolean;
    h_shadow_size:        number;
    h_text_padding:       number;
    shadow_size:          number;
    show_headers:         boolean;
    show_values:          boolean;
    sort_by_value:        boolean;
    width:                number;

    // Header Settings
    h_border_color:       Array<number>;
    h_fill:               Array<number>;
    h_halign:             string;
    h_shading:            boolean;
    h_shadow:             boolean;
    h_text_color:         Array<number>;
    h_text_size:          number;

    // Cell Settings
    border_color:         Array<number>;
    fill:                 Array<number>;
    halign:               string;
    shading:              boolean;
    shadow:               boolean;
    text_color:           Array<number>;
    text_padding:         number;
    text_size:            number;
    valign:               string;

    constructor(element: HTMLElement, enhancedtreemap: EnhancedTreemap, ctx: MarkdownPostProcessorContext, settings: EnhancedTreemapSettings) {
        super(element);
        this.basePath             = settings.basePath;
        this.ctx                  = ctx;
        this.element              = element;
        this.enhancedtreemap      = enhancedtreemap;
        this.error                = false;
        this.svg_id               = "enhancedtreemap";
        this.svg_height           = 10;
        this.svg_width            = 10;

        // Treemap Settings
        this.aspect_ratio         = settings.aspect_ratio;
        this.aspect_w             = settings.aspect_w;
        this.aspect_h             = settings.aspect_h;
        this.outer_padding        = settings.outer_padding;
        this.fixed_width          = settings.fixed_width;
        this.h_shadow_size        = settings.h_shadow_size;
        this.h_text_padding       = settings.h_text_padding;
        this.shadow_size          = settings.shadow_size;
        this.show_headers         = settings.show_headers;
        this.show_values          = settings.show_values;
        this.sort_by_value        = settings.sort_by_value;
        this.width                = settings.width;

        // Header Settings
        this.h_border_color       = settings.h_border_color.map((x) => x);
        this.h_fill               = settings.h_fill.map((x) => x);
        this.h_halign             = settings.h_halign;
        this.h_shading            = settings.h_shading;
        this.h_shadow             = settings.h_shadow;
        this.h_text_color         = settings.h_text_color.map((x) => x);
        this.h_text_size          = settings.h_text_size;

        // Cell SEttings
        this.border_color         = settings.border_color.map((x) => x);
        this.fill                 = settings.fill.map((x) => x);
        this.halign               = settings.halign;
        this.shading              = settings.shading;
        this.shadow               = settings.shadow;
        this.text_color           = settings.text_color.map((x) => x);
        this.text_padding         = settings.text_padding;
        this.text_size            = settings.text_size;
        this.valign               = settings.valign;

    }

    async onload() {
        var code = this.element.querySelector("code");
        if (code != null) {
            if (code.textContent != null) {
                try {
                    this.data = JSON.parse(code.textContent);
                } catch(e) {
                    this.handleError(e);
                }
                this.parseSettings();
                if (!this.error) {
                    var parentDiv = this.element.querySelector("pre");
                    var svg = this.emptySVG();
                    if (parentDiv != null && svg != null) {
                        parentDiv.replaceWith(svg);
                        this.svg = this.element.querySelector("svg");
                    }
                }
            }
        }
    }

    handleError(message: string) {
        this.error = true;
        const wrapper = document.createElement("div");
        wrapper.textContent = message;
        wrapper.setAttribute("style", "color: red");
        var parentDiv = this.element.querySelector("pre");
        if (parentDiv != null) parentDiv.replaceWith(wrapper);
    }

    verifyNumber(value: number, setting: string, low: number, high: number) {
        if (Number.isNaN(value)) this.handleError(setting + " must be a number!");
        if (low != null && value < low) this.handleError(setting + " must be >= " + low);
        if (high != null && value > high) this.handleError(setting + " must be <= " + high);
        return value;
    }

    verifyBoolean(value: boolean, setting: string) {
        if (typeof value != "boolean") this.handleError(setting + " must be true or false (no quotes)!");
        return value;
    }

    verifyString(value: string, setting: string, value_list: Array<string>) {
        if (!value_list.includes(value)) this.handleError(setting + "must be in this list: " + value_list);
        return value;
    }

    parseSettings() {
        if (this.data == null) return;
        var settings: Array<any>;
        settings = this.data.settings;
        if (settings) {
            settings.forEach(setting => {
                // Treemap Settings
                if (setting.aspect_ratio != null) {
                    var aspect = 1;
                    var ratio = setting.aspect_ratio.split(":");
                    if (ratio[0] == 0 || ratio[1] == 0) this.handleError("aspect_ratio cannot include any zeros");
                    else aspect = ratio[0] / ratio[1];
                    this.aspect_ratio = this.verifyNumber(aspect, "aspect_ratio", 0, Number.MAX_SAFE_INTEGER);
                    this.aspect_w = ratio[0];
                    this.aspect_h = ratio[1];
                }
                if (setting.outer_padding != null) 
                    this.outer_padding = this.verifyNumber(setting.outer_padding, "outer_padding", 0, Number.MAX_SAFE_INTEGER);
                if (setting.fixed_width != null) 
                    this.fixed_width = setting.fixed_width;
                if (setting.h_shadow_size != null) 
                    this.h_shadow_size = this.verifyNumber(setting.h_shadow_size, "h_shadow_size", 0, Number.MAX_SAFE_INTEGER);
                if (setting.h_text_padding != null) 
                    this.h_text_padding = this.verifyNumber(setting.h_text_padding, "h_text_padding", 0, Number.MAX_SAFE_INTEGER);
                if (setting.shadow_size != null) 
                    this.shadow_size = this.verifyNumber(setting.shadow_size, "shadow_size", 0, Number.MAX_SAFE_INTEGER);
                if (setting.show_headers != null) 
                    this.show_headers = this.verifyBoolean(setting.show_headers, "show_headers");
                if (setting.sort_by_value != null) 
                    this.sort_by_value = this.verifyBoolean(setting.sort_by_value, "sort_by_value");
                if (setting.width != null) 
                    this.width = this.verifyNumber(setting.width, "width", 1, Number.MAX_SAFE_INTEGER);
                
                // Header Settings
                if (setting.h_border_color != null) {
                    if (setting.h_border_color.h != null) 
                        this.h_border_color[0] = this.verifyNumber(setting.h_border_color.h, "h_border_color hue", 0, 360);
                    if (setting.h_border_color.s != null) 
                        this.h_border_color[1] = this.verifyNumber(setting.h_border_color.s, "h_border_color saturation", 0, 1);
                    if (setting.h_border_color.l != null) 
                        this.h_border_color[2] = this.verifyNumber(setting.h_border_color.l, "h_border_color lightness", 0, 1);
                    if (setting.h_border_color.a != null) 
                        this.h_border_color[3] = this.verifyNumber(setting.h_border_color.a, "h_border_color alpha", 0, 1);
                }
                if (setting.h_fill != null) {
                    if (setting.h_fill.h != null) 
                        this.h_fill[0] = this.verifyNumber(setting.h_fill.h, "h_fill hue", 0, 360);
                    if (setting.h_fill.s != null) 
                        this.h_fill[1] = this.verifyNumber(setting.h_fill.s, "h_fill saturation", 0, 1);
                    if (setting.h_fill.l != null) 
                        this.h_fill[2] = this.verifyNumber(setting.h_fill.l, "h_fill lightness", 0, 1);
                    if (setting.h_fill.a != null) 
                        this.h_fill[3] = this.verifyNumber(setting.h_fill.a, "h_fill alpha", 0, 1);
                }
                if (setting.h_halign != null) 
                    this.h_halign = this.verifyString(setting.h_halign, "h_halign", ["left", "center", "right"]);
                if (setting.h_shading != null) 
                    this.h_shading = this.verifyBoolean(setting.h_shading, "h_shading");
                if (setting.h_shadow != null) 
                    this.h_shadow = this.verifyBoolean(setting.h_shadow, "h_shadow");
                if (setting.h_text_color != null) {
                    if (setting.h_text_color.h != null) 
                        this.h_text_color[0] = this.verifyNumber(setting.h_text_color.h, "h_text_color hue", 0, 360);
                    if (setting.h_text_color.s != null) 
                        this.h_text_color[1] = this.verifyNumber(setting.h_text_color.s, "h_text_color saturation", 0, 1);
                    if (setting.h_text_color.l != null) 
                        this.h_text_color[2] = this.verifyNumber(setting.h_text_color.l, "h_text_color lightness", 0, 1);
                    if (setting.h_text_color.a != null) 
                        this.h_text_color[3] = this.verifyNumber(setting.h_text_color.a, "h_text_color alpha", 0, 1);
                }
                if (setting.h_text_size != null) 
                    this.h_text_size = this.verifyNumber(setting.h_text_size, "h_text_size", 1, Number.MAX_SAFE_INTEGER); 
                if (this.show_headers == false) this.h_text_size = 0;

                // Cell Settings
                if (setting.border_color != null) {
                    if (setting.border_color.h != null) 
                        this.border_color[0] = this.verifyNumber(setting.border_color.h, "border_color hue", 0, 360);
                    if (setting.border_color.s != null) 
                        this.border_color[1] = this.verifyNumber(setting.border_color.s, "border_color saturation", 0, 1);
                    if (setting.border_color.l != null) 
                        this.border_color[2] = this.verifyNumber(setting.border_color.l, "border_color lightness", 0, 1);
                    if (setting.border_color.a != null) 
                        this.border_color[3] = this.verifyNumber(setting.border_color.a, "border_color alpha", 0, 1);
                }
                if (setting.fill != null) {
                    if (setting.fill.h != null) 
                        this.fill[0] = this.verifyNumber(setting.fill.h, "fill hue", 0, 360);
                    if (setting.fill.s != null) 
                        this.fill[1] = this.verifyNumber(setting.fill.s, "fill saturation", 0, 1);
                    if (setting.fill.l != null) 
                        this.fill[2] = this.verifyNumber(setting.fill.l, "fill lightness", 0, 1);
                    if (setting.fill.a != null) 
                        this.fill[3] = this.verifyNumber(setting.fill.a, "fill alpha", 0, 1);
                }
                if (setting.halign != null) 
                    this.halign = this.verifyString(setting.halign, "halign", ["left", "center", "right"]);
                if (setting.shading != null) 
                    this.shading = this.verifyBoolean(setting.shading, "shading");
                if (setting.shadow != null) 
                    this.shadow = this.verifyBoolean(setting.shadow, "shadow");
                if (setting.show_values != null) 
                    this.show_values = this.verifyBoolean(setting.show_values, "show_values");
                if (setting.text_color != null) {
                    if (setting.text_color.h != null) 
                        this.text_color[0] = this.verifyNumber(setting.text_color.h, "text_color hue", 0, 360);
                    if (setting.text_color.s != null) 
                        this.text_color[1] = this.verifyNumber(setting.text_color.s, "text_color saturation", 0, 1);
                    if (setting.text_color.l != null) 
                        this.text_color[2] = this.verifyNumber(setting.text_color.l, "text_color lightness", 0, 1);
                    if (setting.text_color.a != null) 
                        this.text_color[3] = this.verifyNumber(setting.text_color.a, "text_color alpha", 0, 1);
                }
                if (setting.text_padding != null) 
                    this.text_padding = this.verifyNumber(setting.text_padding, "text_padding", 0, Number.MAX_SAFE_INTEGER);
                if (setting.text_size != null) 
                    this.text_size = this.verifyNumber(setting.text_size, "text_size", 1, Number.MAX_SAFE_INTEGER); 
                if (setting.valign != null) 
                    this.valign = this.verifyString(setting.valign, "vertical_alignment", ["top", "center", "bottom"]);
            });
        }
    }

    emptySVG() {
        const wrapper = document.createElement("div");
        wrapper.classList.add("block-language-json");

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.uuid = Math.floor(Math.random() * 100000);
        var svg_id = "enhancedtreemap_" + this.uuid;
        this.svg_id = svg_id;
        svg.setAttribute("id", svg_id);

        if (this.fixed_width == false) { 
            svg.setAttribute("width", "100%"); 
            svg.setAttribute("viewBox", "0 0 " + this.svg_width.toString() + " " + this.svg_height.toString());
        }
        else { 
            this.svg_width = this.width;
            this.svg_height = this.width / this.aspect_ratio;
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
        h_feDropShadow.setAttribute("dx", this.h_shadow_size.toString());
        h_feDropShadow.setAttribute("dy", this.h_shadow_size.toString());
        h_feDropShadow.setAttribute("stdDeviation", this.h_shadow_size.toString());
        h_feDropShadow.setAttribute("flood-opacity", "0.5");
        h_filter.appendChild(h_feDropShadow);
        svg.append(h_filter);

        const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
        filter.setAttribute("id", "shadow_" + this.uuid);
        filter.setAttribute("color-interpolation-filters", "sRGB");
        const feDropShadow = document.createElementNS("http://www.w3.org/2000/svg", "feDropShadow");
        feDropShadow.setAttribute("dx", this.shadow_size.toString());
        feDropShadow.setAttribute("dy", this.shadow_size.toString());
        feDropShadow.setAttribute("stdDeviation", this.shadow_size.toString());
        feDropShadow.setAttribute("flood-opacity", "0.5");
        filter.appendChild(feDropShadow);
        svg.append(filter);

        wrapper.append(svg);
        return wrapper;
    }

    async renderEnhancedTreemap() {
        if (this.error) return;
        var svg_element = document.getElementById(this.svg_id);

        // would be nice to have a better solution here, sometimes this function is called before the svg is in the DOM
        while (svg_element == null) {
            await new Promise(r => setTimeout(r, 100));
            svg_element = document.getElementById(this.svg_id);
        }

        var width = this.svg_width;
        var height = this.svg_height;
        var scale = 1;

        if (!this.fixed_width) {
            scale = this.aspect_ratio;
            if (svg_element.parentElement != null) {
                width = svg_element.parentElement.offsetWidth * scale;
                height = svg_element.parentElement.offsetHeight;
            }
            svg_element.setAttribute("viewBox", "0 0 " + width + " " + height);
        }

        var vertical_alignment = this.valign; // this is needed to access them within wrap function
        var horizontal_alignment = this.halign; // this is needed to access them within wrap function

        // load json data into hierarchy of nodes
        // the ||!d.children adds a default value of 1 for any leaf nodes with no value
        var nodes;
        if (this.sort_by_value) {
            nodes = d3.hierarchy(this.data).sum((d: any) => { return d.value||!d.children; }).sort((a: any, b: any) => b.value - a.value);
        }
        else {
            nodes = d3.hierarchy(this.data).sum((d: any) => { return d.value||!d.children; });
        }

        var svg = d3.select(this.svg).append("g");

        var outer_padding  = this.outer_padding * scale;
        var text_padding   = this.text_padding * scale;
        var h_text_padding = this.h_text_padding * scale;
        var text_size      = this.text_size * scale;
        var h_text_size    = this.h_text_size * scale;

        // add positions to the nodes using the treemap layout
        var treemapLayout = d3.treemap()
            .tile(d3.treemapSquarify.ratio(1))
            .size([width, height])
            .paddingOuter(outer_padding)
            .paddingTop(this.show_headers ? h_text_size + 2 * h_text_padding : outer_padding)
            .paddingInner(outer_padding)
            (nodes);

        // decendants instead of leaves shows all nodes, not just the leaves
        svg.selectAll().data(nodes.descendants()).enter()
            .append("rect")
                .attr("x",      (d: any) => { return d.x0; })
                .attr("y",      (d: any) => { return d.y0; })
                .attr("width",  (d: any) => { return d.x1 - d.x0; })
                .attr("height", (d: any) => { return d.y1 - d.y0; })
                .attr("stroke", (d: any) => { 
                    if (d.children) {
                        if (d.data.border_color == null) {
                            return d3.hsl(this.h_border_color[0], this.h_border_color[1], this.h_border_color[2], this.h_border_color[3]).toString();
                        }
                        else {
                            return d3.hsl(
                                d.data.border_color.h == null ? this.h_border_color[0] : d.data.border_color.h, 
                                d.data.border_color.s == null ? this.h_border_color[1] : d.data.border_color.s, 
                                d.data.border_color.l == null ? this.h_border_color[2] : d.data.border_color.l, 
                                d.data.border_color.a == null ? this.h_border_color[3] : d.data.border_color.a).toString();
                        }
                    }
                    else {
                        if (d.data.border_color == null) {
                            return d3.hsl(this.border_color[0], this.border_color[1], this.border_color[2], this.border_color[3]).toString();
                        }
                        else {
                            return d3.hsl(
                                d.data.border_color.h == null ? this.border_color[0] : d.data.border_color.h, 
                                d.data.border_color.s == null ? this.border_color[1] : d.data.border_color.s, 
                                d.data.border_color.l == null ? this.border_color[2] : d.data.border_color.l, 
                                d.data.border_color.a == null ? this.border_color[3] : d.data.border_color.a).toString();
                        }
                    }
                })
                .attr("fill",   (d: any) => { 
                    if (d.children) {
                        if (d.data.fill == null) { return d3.hsl(this.h_fill[0], this.h_fill[1], this.h_fill[2], this.h_fill[3]).toString(); }
                        else {
                            return d3.hsl(
                                d.data.fill.h == null ? this.h_fill[0] : d.data.fill.h, 
                                d.data.fill.s == null ? this.h_fill[1] : d.data.fill.s, 
                                d.data.fill.l == null ? this.h_fill[2] : d.data.fill.l, 
                                d.data.fill.a == null ? this.h_fill[3] : d.data.fill.a).toString();
                        }
                    }
                    else {
                        if (d.data.fill == null) { return d3.hsl(this.fill[0], this.fill[1], this.fill[2], this.fill[3]).toString(); }
                        else {
                            return d3.hsl(
                                d.data.fill.h == null ? this.fill[0] : d.data.fill.h, 
                                d.data.fill.s == null ? this.fill[1] : d.data.fill.s, 
                                d.data.fill.l == null ? this.fill[2] : d.data.fill.l, 
                                d.data.fill.a == null ? this.fill[3] : d.data.fill.a).toString();
                        }
                    }
                })
                .attr("filter", (d: any) => { 
                    if (d.children) {
                        if (d.data.shadow == null) { if (this.h_shadow) { return "url(#h_shadow_" + this.uuid + ")"; } else return ""; }
                        else { if (d.data.shadow) { return "url(#h_shadow_" + this.uuid + ")"; } else return ""; }
                    }
                    else {
                        if (d.data.shadow == null) { if (this.shadow) { return "url(#shadow_" + this.uuid + ")"; } else return ""; }
                        else { if (d.data.shadow) { return "url(#shadow_" + this.uuid + ")"; } else return ""; }
                    }
                });

        // Images
        svg.selectAll().data(nodes.descendants().filter((d: any) => { return d.data.image; })).enter()
            .append("image")
                .attr("x",          (d: any) => { return d.x0; })
                .attr("y",          (d: any) => { return d.y0; })
                .attr("width",      (d: any) => { return d.x1 - d.x0; })
                .attr("height",     (d: any) => { return d.y1 - d.y0; })
                .attr("xlink:href", (d: any) => { 
                    if (d.data.image.includes("://")) return d.data.image;
                    else return "app://local/" + this.basePath + d.data.image; } );

        // Shading rectangles
        svg.selectAll().data(nodes.descendants()).enter()
            .append("rect")
                .attr("x",      (d: any) => { return d.x0; })
                .attr("y",      (d: any) => { return d.y0; })
                .attr("width",  (d: any) => { return d.x1 - d.x0; })
                .attr("height", (d: any) => { return d.y1 - d.y0; })
                .attr("fill",   (d: any) => { 
                    if (d.children) {
                        if (d.data.shading == null) {
                            return (this.h_shading ? "url(#radialgradient_" + this.uuid + ")" : d3.hsl(0, 0, 0, 0).toString());
                        }
                        else {
                            return (d.data.shading ? "url(#radialgradient_" + this.uuid + ")" : d3.hsl(0, 0, 0, 0).toString());
                        }
                    }
                    else {
                        if (d.data.shading == null) {
                            return (this.shading ? "url(#radialgradient_" + this.uuid + ")" : d3.hsl(0, 0, 0, 0).toString());
                        }
                        else {
                            return (d.data.shading ? "url(#radialgradient_" + this.uuid + ")" : d3.hsl(0, 0, 0, 0).toString());
                        }
                    }
                })
                .append("title").text((d: any) => { return d.data.name; });

        // Cell text
        svg.selectAll().data(nodes.leaves()).enter()
            .append("text")
                .attr("x",           (d: any) => { 
                        if (d.data.halign == "left"   || (d.data.halign == null && this.halign == "left"))   return d.x0 + textPadding(d, scale, text_padding); 
                        if (d.data.halign == "center" || (d.data.halign == null && this.halign == "center")) return d.x0 + 0.5 * (d.x1 - d.x0); 
                        if (d.data.halign == "right"  || (d.data.halign == null && this.halign == "right"))  return d.x1 - textPadding(d, scale, text_padding); 
                })
                .attr("y",           (d: any) => { 
                    if (d.data.valign == "top"     || (d.data.valign == null && this.valign == "top"))    return d.y0 + textPadding(d, scale, text_padding) + textSize(d, scale, text_size);
                    if (d.data.valign == "center"  || (d.data.valign == null && this.valign == "center")) return d.y0 + 0.5 * (d.y1 - d.y0) + 0.3 * textSize(d, scale, text_size);
                    if (d.data.valign == "bottom"  || (d.data.valign == null && this.valign == "bottom")) return d.y1 - textPadding(d, scale, text_padding);
                })
                .attr("v-align",     (d: any) => { return d.data.valign })
                .attr("left",        (d: any) => { return d.x0; })
                .attr("top",         (d: any) => { return d.y0; })
                .attr("width",       (d: any) => { return d.x1 - d.x0 - 2 * textPadding(d, scale, text_padding); })
                .attr("height",      (d: any) => { return d.y1 - d.y0 - 2 * textPadding(d, scale, text_padding); })
                .attr("text-anchor", (d: any) => {
                      if (d.data.halign == "left"   || (d.data.halign == null && this.halign == "left"))   return "start";
                      if (d.data.halign == "center" || (d.data.halign == null && this.halign == "center")) return "middle";
                      if (d.data.halign == "right"  || (d.data.halign == null && this.halign == "right"))  return "end";
                      return "start";
                })
                .attr("font-size",   (d: any) => { return textSize(d, scale, text_size) + "px" })
                .attr("fill",        (d: any) => { 
                    return d.data.text_color == null ? 
                        d3.hsl(this.text_color[0], this.text_color[1], this.text_color[2], this.text_color[3]).toString() : 
                        d3.hsl(
                            d.data.text_color.h == null ? this.text_color[0] : d.data.text_color.h, 
                            d.data.text_color.s == null ? this.text_color[1] : d.data.text_color.s, 
                            d.data.text_color.l == null ? this.text_color[2] : d.data.text_color.l, 
                            d.data.text_color.a == null ? this.text_color[3] : d.data.text_color.a).toString()
                })
                .attr("opacity",     (d: any) => { return ((d.y1 - d.y0 < textSize(d, scale, text_size)) || (d.x1 - d.x0 < 2 * textSize(d, scale, text_size))) ? 0 : 1 })
                .text((d: any) => { return this.show_values ? (d.data.value || 1) + " " + d.data.name : d.data.name; })
                .call(wrap)
                .append("title").text((d: any) => { return d.data.name; });

        // Header text
        if (this.show_headers) {
            svg.selectAll().data(nodes.descendants().filter((d: any) => { return d.children; })).enter()
                .append("text")
                    .attr("x",           (d: any) => { 
                            if (d.data.halign == "left"   || (d.data.halign == null && this.h_halign == "left"))   return d.x0 + 1.0 * h_text_padding; 
                            if (d.data.halign == "center" || (d.data.halign == null && this.h_halign == "center")) return d.x0 + 0.5 * (d.x1 - d.x0); 
                            if (d.data.halign == "right"  || (d.data.halign == null && this.h_halign == "right"))  return d.x1 - 1.0 * h_text_padding; 
                            return "left";
                    })
                    .attr("y",           (d: any) => { return d.y0 + h_text_padding + 0.8 * textSize(d, scale, h_text_size) })
                    .attr("width",       (d: any) => { return d.x1 - d.x0 - 2 * h_text_padding; })
                    .attr("text-anchor", (d: any) => {
                          if (d.data.halign == "left"   || (d.data.halign == null && this.h_halign == "left"))   return "start";
                          if (d.data.halign == "center" || (d.data.halign == null && this.h_halign == "center")) return "middle";
                          if (d.data.halign == "right"  || (d.data.halign == null && this.h_halign == "right"))  return "end";
                          return "start";
                    })
                    .attr("font-size",   (d: any) => { return textSize(d, scale, h_text_size) + "px" })
                    .attr("fill",        (d: any) => { 
                        return d.data.text_color == null ? d3.hsl(this.h_text_color[0], this.h_text_color[1], this.h_text_color[2], this.h_text_color[3]).toString() : 
                            d3.hsl(
                                d.data.text_color.h == null ? this.h_text_color[0] : d.data.text_color.h, 
                                d.data.text_color.s == null ? this.h_text_color[1] : d.data.text_color.s, 
                                d.data.text_color.l == null ? this.h_text_color[2] : d.data.text_color.l, 
                                d.data.text_color.a == null ? this.h_text_color[3] : d.data.text_color.a).toString()
                    })
                    .attr("opacity",     (d: any) => { return ((h_text_size + h_text_padding < textSize(d, scale, h_text_size)) || (d.x1 - d.x0 < textSize(d, scale, h_text_size))) ? 0 : 1 })
                    .text((d: any) => { return d.data.name; })
                    .call(ellipse)
                    .append("title").text((d: any) => { return d.data.name; });
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

        function wrap(text: any) {
            text.each(function() {
                var text = d3.select(this),
                    //words = text.text().split(/\s+/).reverse(),
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
                }
                if (lineNumber > 0) {
                    var startDy: number;
                    if (valign == "top") startDy = 0;
                    if (valign == "center") startDy = -0.5 * lineNumber * lineHeight;
                    if (valign == "bottom") startDy = -lineNumber * lineHeight;
                    text.selectAll("tspan").attr("dy", (d, i) => startDy + lineHeight * i + "em");
                }
            });
        }

        function ellipse(text: any) {
            text.each(function() {
                var text = d3.select(this);
                var width = parseFloat(text.attr("width"));
                var original = text.text();
                var tspan = text.text("").append("tspan").text(original);
                if (!checkWidth(tspan, width)) return;
                tspan.text(original + "...");
                while (checkWidth(tspan, width) && tspan.text().length > 3) {
                    tspan.text(tspan.text().substring(0, tspan.text().length - 4) + "...");
                }
            });
        }

    }

}

