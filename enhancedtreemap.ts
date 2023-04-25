import { MarkdownRenderChild } from 'obsidian';
import * as d3 from './d3.min.js';

export default class EnhancedTreeMap {
    plugin: ChartPlugin;

    constructor(plugin: ChartPlugin) {
        this.plugin = plugin;
    }

    async renderEnhancedTreeMap(element: HTMLElement, ctx: MarkdownPostProcessorContext) {
        var renderer;

        // need this "await" on adding the svg to the DOM before adding the text otherwise getComputedTextLenght does not work
        await this.plugin.app.workspace.onLayoutReady(() => {
            renderer = new EnhancedTreeMapRenderChild(element, this, ctx);
            ctx.addChild(renderer);
        });

        this.plugin.app.workspace.onLayoutReady(() => {
            renderer.renderEnhancedTreeMap();
        });
    }
}

class EnhancedTreeMapRenderChild extends MarkdownRenderChild {
    svg: HTMLElement;
    ctx: string;
    data: string;
    element: HTMLElement;
    enhancedtreemap: EnhancedTreeMap;

    constructor(element: HTMLElement, enhancedtreemap: EnhancedTreeMap, ctx: MarkdownPostProcessorContext) {
        super(element);
        this.element = element;
        this.enhancedtreemap = enhancedtreemap;
        this.ctx = ctx;
    }

    async onload() {
        this.data = this.element.querySelector("code").textContent;
        var parentDiv = this.element.querySelector("pre");
        parentDiv.replaceWith(this.emptySVG());
        this.svg = this.element.querySelector("svg");
    }

    emptySVG() {
        const wrapper = document.createElement("div");
        wrapper.classList.add("block-language-json");

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("viewBox", "0 0 400 250");
        svg.setAttribute("name", "enhancedtreemap");
        svg.classList.add("enhancedtreemap");

        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

        const radialGradient = document.createElementNS("http://www.w3.org/2000/svg", "radialGradient");
        radialGradient.setAttribute("id", "radialgradient");
        radialGradient.setAttribute("cx", "25%");
        radialGradient.setAttribute("cy", "25%");
        radialGradient.setAttribute("r", "100%");

        const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        stop1.setAttribute("offset", "0%");
        stop1.setAttribute("stop-color", "hsla(0, 0%, 80%, 10%)");
        const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        stop2.setAttribute("offset", "100%");
        stop2.setAttribute("stop-color", "hsla(0, 0%, 20%, 10%)");
        radialGradient.appendChild(stop1);
        radialGradient.appendChild(stop2);
        defs.appendChild(radialGradient);
        svg.appendChild(defs);

        const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
        filter.setAttribute("id", "shadow");
        filter.setAttribute("color-interpolation-filters", "sRGB");

        const feDropShadow = document.createElementNS("http://www.w3.org/2000/svg", "feDropShadow");
        feDropShadow.setAttribute("dx", "2");
        feDropShadow.setAttribute("dy", "2");
        feDropShadow.setAttribute("stdDeviation", "3");
        feDropShadow.setAttribute("flood-opacity", "0.5");
        filter.appendChild(feDropShadow);
        svg.append(filter);
        wrapper.append(svg);
        return wrapper;
    }

    renderEnhancedTreeMap() {
        var data = this.data;
        var svgElement = this.svg;

        // load json data into hierarchy of nodes
        // the ||!d.children adds a default value of 1 for any leaf nodes with no value
        var nodes = d3.hierarchy(JSON.parse(data))
            .sum((d: any) => { return d.value||!d.children; })
            .sort((a, b) => b.value - a.value);

        var svg = d3.select(svgElement).append("g");

        var padding = 4;
        var fontsize = 4;

        // add positions to the nodes using the treemap layout
        var treemapLayout = d3.treemap()
            .size([400, 250])
            .paddingOuter(padding)
            .paddingTop(fontsize + 2.5 * padding)
            .paddingInner(padding)
            (nodes);

        // decendants instead of leaves shows all nodes, not just the leaves
        svg.selectAll("rect").data(nodes.descendants()).enter()
            .append("rect")
                .attr("x",      (d: any) => { return d.x0; })
                .attr("y",      (d: any) => { return d.y0; })
                .attr("width",  (d: any) => { return d.x1 - d.x0; })
                .attr("height", (d: any) => { return d.y1 - d.y0; })
                .attr("stroke", "hsla(0, 0%, 0%, 50%)")
                .attr("fill",   (d: any) => { return d.data.fill == null ? d3.hsl(0, 0, 0.25) : d3.hsl(
                    d.data.fill.h == null ? 0 : d.data.fill.h, 
                    d.data.fill.s == null ? 0 : d.data.fill.s, 
                    d.data.fill.l == null ? 0.25 : d.data.fill.l)})
                .attr("filter", "url(#shadow)");

        svg.selectAll("highlight").data(nodes.descendants()).enter()
            .append("rect")
                .attr("x",      (d: any) => { return d.x0; })
                .attr("y",      (d: any) => { return d.y0; })
                .attr("width",  (d: any) => { return d.x1 - d.x0; })
                .attr("height", (d: any) => { return d.y1 - d.y0; })
                .attr("fill",   "url(#radialgradient)");

        svg.selectAll("text").data(nodes.leaves()).enter()
            .append("text")
                .attr("x",           (d: any) => { return d.x0 + 0.5 * (d.x1 - d.x0); })
                .attr("y",           (d: any) => { return d.y0 + 0.5 * (d.y1 - d.y0) + 0.25 * textsize(d, fontsize) })
                .attr("left",        (d: any) => { return d.x0; })
                .attr("top",         (d: any) => { return d.y0; })
                .attr("width",       (d: any) => { return d.x1 - d.x0 - 2 * padding; })
                .attr("height",      (d: any) => { return d.y1 - d.y0 - 2 * padding; })
                .attr("text-anchor", "middle")
                .attr("font-size",   (d: any) => { return textsize(d, fontsize) + "px" })
                .attr("fill",        (d: any) => { 
                    return d.data.text_color == null ? d3.hsl(0, 0, 0.8) : d3.hsl(
                        d.data.text_color.h == null ? 0 : d.data.text_color.h, 
                        d.data.text_color.s == null ? 0 : d.data.text_color.s, 
                        d.data.text_color.l == null ? 0.8 : d.data.text_color.l)})
                .attr("opacity",     (d: any) => { 
                    return ((d.y1 - d.y0 < textsize(d, fontsize)) || (d.x1 - d.x0 < textsize(d, fontsize))) ? 0 : 1})
                .text((d: any) => { return d.data.name; })
                .call(wrap);

        // label instead of text otherwise it doesn't work
        // use the filter at the end otherwise the previous one doesn't work
        svg.selectAll("label").data(nodes.descendants().filter(function(d) { return d.children; })).enter()
            .append("text")
                .attr("x",           function(d) { return d.x0 + 0.5 * (d.x1 - d.x0); })
                .attr("y",           function(d) { return d.y0 + padding + textsize(d, fontsize) })
                .attr("width",       function(d) { return d.x1 - d.x0 - 2 * padding; })
                .attr("text-anchor", "middle")
                .attr("font-size",   function(d) { return textsize(d, fontsize) + "px" })
                .attr("fill",        function(d) { 
                    return d.data.text_color == null ? d3.hsl(0, 0, 0.8) : d3.hsl(
                        d.data.text_color.h == null ? 0 : d.data.text_color.h, 
                        d.data.text_color.s == null ? 0 : d.data.text_color.s, 
                        d.data.text_color.l == null ? 0.8 : d.data.text_color.l)})
                .attr("opacity",     function(d) { 
                    return ((fontsize + padding < textsize(d, fontsize)) || (d.x1 - d.x0 < textsize(d, fontsize))) ? 0 : 1})
                .text(function(d) { return d.data.name; })
                .call(ellipse);

        function textsize(d, fontsize) { 
            return d.data.text_size == null ? fontsize : d.data.text_size; 
        }

        function wrap(text) {
            text.each(function() {
                var text = d3.select(this),
                    words = text.text().split(/\s+/).reverse(),
                    word,
                    longline,
                    fraction,
                    i,
                    line = [],
                    lineNumber = 0,
                    lineHeight = 1.1, // ems
                    overflow = false,
                    x = text.attr("x"),
                    y = text.attr("y"),
                    width = parseFloat(text.attr("width")),
                    height = parseFloat(text.attr("height")),
                    fontsize = parseFloat(text.attr("font-size").substring(0, text.attr("font-size").length - 2)),
                    dy = 0, 
                    tspan = text.text(null)
                                .append("tspan")
                                .attr("x", x)
                                .attr("y", y)
                                .attr("dy", dy + "em");

                while (word = words.pop()) {
                    // add a word to the line
                    line.push(word);
                    
                    // only update the text if we haven't already exceeded the max rows that will fit
                    if (lineNumber * lineHeight * fontsize <= height) {
                        tspan.text(line.join(" "));

                        // if the line is now too long to fit then remove the last added word
                        if (tspan.node().getComputedTextLength() > width) {
                            // remove the word that made it too long
                            line.pop();
                            tspan.text(line.join(" "));

                            // if a single word is too long to fit, break it apart
                            if (tspan.node().getComputedTextLength() > width && tspan.text().length > 1) {
                                longline = tspan.text();

                                // find the largest fraction of the word that will fit
                                fraction = 1;
                                while (tspan.node().getComputedTextLength() > width && tspan.text().length > 1) {
                                    fraction++;
                                    tspan.text(longline.substring(0, longline.length/fraction) + "-");
                                }

                                // create tspans for the remaining fractions of the word
                                for (i=2; i <= fraction; i++) {
                                    // add tspan if there is room
                                    if ((lineNumber + 1) * lineHeight * fontsize <= height) {
                                        tspan = text.append("tspan")
                                                    .attr("x", x)
                                                    .attr("y", y)
                                                    .attr("dy", ++lineNumber * lineHeight + dy + "em")
                                                    .text(longline.substring((i - 1) * longline.length / fraction, i * longline.length / fraction) + (i < fraction ? "-" : ""));
                                    }
                                    else { overflow = true; }
                                }
                            }

                            // create a new line using the removed word
                            if ((lineNumber + 1) * lineHeight * fontsize <= height) {
                                line = [word];
                                tspan = text.append("tspan")
                                            .attr("x", x)
                                            .attr("y", y)
                                            .attr("dy", ++lineNumber * lineHeight + dy + "em")
                                            .text(word);
                                
                                // if last word is too long, break it apart
                                if (words.length == 0 && tspan.node().getComputedTextLength() > width) {
                                    longline = tspan.text();
                                    fraction = 1;
                                    while (tspan.node().getComputedTextLength() > width && tspan.text().length > 1) {
                                        fraction++;
                                        tspan.text(longline.substring(0, longline.length/fraction) + "-");
                                    }
                                    for (i=2; i <= fraction; i++) {
                                        if ((lineNumber + 1) * lineHeight * fontsize <= height) {
                                            tspan = text.append("tspan")
                                                        .attr("x", x)
                                                        .attr("y", y)
                                                        .attr("dy", ++lineNumber * lineHeight + dy + "em")
                                                        .text(longline.substring((i - 1) * longline.length / fraction, i * longline.length / fraction) + (i < fraction ? "-" : ""));
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
                    const startDy = -(lineNumber * (lineHeight / 2));
                    text.selectAll("tspan").attr("dy", (d, i) => startDy + lineHeight * i + "em");
                }
            });
        }

        function ellipse(text) {
            text.each(function() {
                var text = d3.select(this);
                var width = parseFloat(text.attr("width"));
                var original = text.text();
                var tspan = text.text("").append("tspan").text(original);
                if (tspan.node().getComputedTextLength() <= width) return;
                tspan.text(original + "...");
                while (tspan.node().getComputedTextLength() > width & tspan.text().length > 3) {
                    tspan.text(tspan.text().substring(0, tspan.text().length - 4) + "...");
                }
            });
        }

    }

}

