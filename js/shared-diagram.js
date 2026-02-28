/* ============================================================
   ML Zoo — Shared 2D Diagram for Probabilistic Classification
   Provides scatter plots, decision regions, Gaussian contour
   ellipses, mixture component visualisations, and DAG drawing.
   ============================================================ */
(function () {
    'use strict';

    var svg, g, width, height, xScale, yScale, zoom;
    var config = {};
    var margin = { top: 20, right: 30, bottom: 45, left: 55 };

    var CLASS_COLORS = ['#58a6ff', '#f85149', '#3fb950', '#d29922'];

    /* --------------------------------------------------------
       init — create SVG, scales, grid, axes, clip path, zoom
       -------------------------------------------------------- */
    function init(containerSelector, cfg) {
        config = cfg || {};
        var container = document.querySelector(containerSelector);
        if (!container) return;

        width  = config.width  || container.clientWidth || 800;
        height = config.height || 400;

        svg = d3.select(containerSelector)
            .append('svg')
            .attr('viewBox', '0 0 ' + width + ' ' + height)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .style('width', '100%')
            .style('max-height', height + 'px');

        svg.append('defs')
            .append('clipPath')
            .attr('id', 'plot-clip')
            .append('rect')
            .attr('x', margin.left)
            .attr('y', margin.top)
            .attr('width', width - margin.left - margin.right)
            .attr('height', height - margin.top - margin.bottom);

        g = svg.append('g').attr('clip-path', 'url(#plot-clip)');

        var xDomain = config.xDomain || [0, 10];
        var yDomain = config.yDomain || [0, 10];

        xScale = d3.scaleLinear().domain(xDomain).range([margin.left, width - margin.right]);
        yScale = d3.scaleLinear().domain(yDomain).range([height - margin.bottom, margin.top]);

        /* Grid lines */
        var xGrid = svg.append('g')
            .attr('transform', 'translate(0,' + (height - margin.bottom) + ')')
            .call(d3.axisBottom(xScale).ticks(8).tickSize(-(height - margin.top - margin.bottom)).tickFormat(''));
        xGrid.attr('opacity', 0.08).select('.domain').remove();

        var yGrid = svg.append('g')
            .attr('transform', 'translate(' + margin.left + ',0)')
            .call(d3.axisLeft(yScale).ticks(6).tickSize(-(width - margin.left - margin.right)).tickFormat(''));
        yGrid.attr('opacity', 0.08).select('.domain').remove();

        var axisColor = getComputedStyle(document.documentElement).getPropertyValue('--text-muted') || '#6e7681';

        svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', 'translate(0,' + (height - margin.bottom) + ')')
            .call(d3.axisBottom(xScale).ticks(8))
            .selectAll('text,line,path').attr('stroke', axisColor).attr('fill', axisColor);

        svg.append('g')
            .attr('class', 'y-axis')
            .attr('transform', 'translate(' + margin.left + ',0)')
            .call(d3.axisLeft(yScale).ticks(6))
            .selectAll('text,line,path').attr('stroke', axisColor).attr('fill', axisColor);

        if (config.xLabel) {
            svg.append('text').attr('x', width / 2).attr('y', height - 5)
                .attr('text-anchor', 'middle').attr('fill', axisColor).attr('font-size', '12px')
                .text(config.xLabel);
        }
        if (config.yLabel) {
            svg.append('text').attr('x', -height / 2).attr('y', 15)
                .attr('transform', 'rotate(-90)').attr('text-anchor', 'middle')
                .attr('fill', axisColor).attr('font-size', '12px').text(config.yLabel);
        }

        zoom = d3.zoom().scaleExtent([0.5, 5])
            .on('zoom', function (event) { g.attr('transform', event.transform); });
        svg.call(zoom);
    }

    /* --------------------------------------------------------
       drawPoints — coloured by class
       -------------------------------------------------------- */
    function drawPoints(points, opts) {
        opts = opts || {};
        var radius = opts.radius || 5;

        g.selectAll('.data-point').remove();

        var pts = g.selectAll('.data-point')
            .data(points)
            .enter()
            .append('circle')
            .attr('class', 'data-point')
            .attr('cx', function (d) { return xScale(d.x); })
            .attr('cy', function (d) { return yScale(d.y); })
            .attr('r', 0)
            .attr('fill', function (d) { return CLASS_COLORS[d.cls || 0]; })
            .attr('opacity', 0.8)
            .attr('stroke', '#fff')
            .attr('stroke-width', 1);

        pts.transition().duration(400).delay(function (d, i) { return i * 15; })
            .attr('r', radius);

        pts.on('mouseover', function (event, d) {
                d3.select(this).attr('r', radius + 3).attr('opacity', 1);
                showTooltip(event, d);
            })
            .on('mouseout', function () {
                d3.select(this).attr('r', radius).attr('opacity', 0.8);
                hideTooltip();
            });
    }

    /* --------------------------------------------------------
       drawRegions — probability-based decision regions
       -------------------------------------------------------- */
    function drawRegions(classifyFn, opts) {
        opts = opts || {};
        g.selectAll('.region-cell').remove();

        var xd = config.xDomain || [0, 10];
        var yd = config.yDomain || [0, 10];
        var res = opts.resolution || 40;
        var dx = (xd[1] - xd[0]) / res;
        var dy = (yd[1] - yd[0]) / res;
        var cellW = (width - margin.left - margin.right) / res;
        var cellH = (height - margin.top - margin.bottom) / res;

        var cells = [];
        for (var i = 0; i < res; i++) {
            for (var j = 0; j < res; j++) {
                var cx = xd[0] + (i + 0.5) * dx;
                var cy = yd[0] + (j + 0.5) * dy;
                cells.push({ x: cx, y: cy, cls: classifyFn(cx, cy), i: i, j: j });
            }
        }

        g.selectAll('.region-cell')
            .data(cells)
            .enter()
            .append('rect')
            .attr('class', 'region-cell')
            .attr('x', function (d) { return margin.left + d.i * cellW; })
            .attr('y', function (d) { return margin.top + (res - 1 - d.j) * cellH; })
            .attr('width', cellW + 0.5)
            .attr('height', cellH + 0.5)
            .attr('fill', function (d) { return CLASS_COLORS[d.cls || 0]; })
            .attr('opacity', 0)
            .transition()
            .duration(300)
            .attr('opacity', opts.opacity || 0.12);
    }

    /* --------------------------------------------------------
       drawGaussianContours — elliptical contour lines for
       Gaussian distributions (per-class or per-component)
       Parameters: array of { mean:[mx,my], cov:[[a,b],[b,d]], color, label }
       -------------------------------------------------------- */
    function drawGaussianContours(gaussians, opts) {
        opts = opts || {};
        g.selectAll('.gauss-contour').remove();

        var levels = opts.levels || [1, 2, 3]; // standard deviations

        gaussians.forEach(function (gauss, gIdx) {
            var mx = gauss.mean[0], my = gauss.mean[1];
            var a = gauss.cov[0][0], b = gauss.cov[0][1], d = gauss.cov[1][1];
            var color = gauss.color || CLASS_COLORS[gIdx % CLASS_COLORS.length];

            /* Eigen-decomposition of 2x2 covariance matrix */
            var trace = a + d;
            var det = a * d - b * b;
            var disc = Math.sqrt(Math.max(0, trace * trace / 4 - det));
            var lambda1 = trace / 2 + disc;
            var lambda2 = trace / 2 - disc;

            /* Rotation angle */
            var angle = (b === 0 && a >= d) ? 0 : Math.atan2(lambda1 - a, b) * (180 / Math.PI);
            if (isNaN(angle)) angle = 0;

            levels.forEach(function (level) {
                var rx = Math.sqrt(Math.max(0, lambda1)) * level;
                var ry = Math.sqrt(Math.max(0, lambda2)) * level;

                g.append('ellipse')
                    .attr('class', 'gauss-contour')
                    .attr('cx', xScale(mx))
                    .attr('cy', yScale(my))
                    .attr('rx', 0)
                    .attr('ry', 0)
                    .attr('fill', 'none')
                    .attr('stroke', color)
                    .attr('stroke-width', level === 1 ? 2 : 1)
                    .attr('stroke-dasharray', level > 1 ? '4 3' : 'none')
                    .attr('opacity', 0.6)
                    .attr('transform', 'rotate(' + angle + ',' + xScale(mx) + ',' + yScale(my) + ')')
                    .transition()
                    .duration(500)
                    .attr('rx', Math.abs(xScale(mx + rx) - xScale(mx)))
                    .attr('ry', Math.abs(yScale(my + ry) - yScale(my)));
            });

            /* Label at the mean */
            if (gauss.label) {
                var axisColor = getComputedStyle(document.documentElement).getPropertyValue('--text-muted') || '#6e7681';
                g.append('text')
                    .attr('class', 'gauss-contour')
                    .attr('x', xScale(mx))
                    .attr('y', yScale(my) - 6)
                    .attr('text-anchor', 'middle')
                    .attr('fill', axisColor)
                    .attr('font-size', '10px')
                    .text(gauss.label);
            }
        });
    }

    /* --------------------------------------------------------
       drawMixtureComponents — draws individual mixture component
       ellipses with weight-based opacity
       Parameters: array of { mean, cov, weight, color }
       -------------------------------------------------------- */
    function drawMixtureComponents(components, opts) {
        opts = opts || {};
        g.selectAll('.mixture-comp').remove();

        components.forEach(function (comp, cIdx) {
            var mx = comp.mean[0], my = comp.mean[1];
            var a = comp.cov[0][0], b = comp.cov[0][1], d = comp.cov[1][1];
            var w = comp.weight || (1 / components.length);
            var color = comp.color || CLASS_COLORS[cIdx % CLASS_COLORS.length];

            var trace = a + d;
            var det = a * d - b * b;
            var disc = Math.sqrt(Math.max(0, trace * trace / 4 - det));
            var lambda1 = trace / 2 + disc;
            var lambda2 = trace / 2 - disc;
            var angle = (b === 0 && a >= d) ? 0 : Math.atan2(lambda1 - a, b) * (180 / Math.PI);
            if (isNaN(angle)) angle = 0;

            /* Filled ellipse at 2-sigma */
            var rx2 = Math.sqrt(Math.max(0, lambda1)) * 2;
            var ry2 = Math.sqrt(Math.max(0, lambda2)) * 2;

            g.append('ellipse')
                .attr('class', 'mixture-comp')
                .attr('cx', xScale(mx))
                .attr('cy', yScale(my))
                .attr('rx', 0)
                .attr('ry', 0)
                .attr('fill', color)
                .attr('fill-opacity', w * 0.3)
                .attr('stroke', color)
                .attr('stroke-width', 1.5)
                .attr('opacity', 0.7)
                .attr('transform', 'rotate(' + angle + ',' + xScale(mx) + ',' + yScale(my) + ')')
                .transition()
                .duration(500)
                .attr('rx', Math.abs(xScale(mx + rx2) - xScale(mx)))
                .attr('ry', Math.abs(yScale(my + ry2) - yScale(my)));

            /* Centre cross */
            var cs = 6;
            g.append('line')
                .attr('class', 'mixture-comp')
                .attr('x1', xScale(mx) - cs).attr('y1', yScale(my))
                .attr('x2', xScale(mx) + cs).attr('y2', yScale(my))
                .attr('stroke', color).attr('stroke-width', 2);
            g.append('line')
                .attr('class', 'mixture-comp')
                .attr('x1', xScale(mx)).attr('y1', yScale(my) - cs)
                .attr('x2', xScale(mx)).attr('y2', yScale(my) + cs)
                .attr('stroke', color).attr('stroke-width', 2);

            /* Weight label */
            var axisColor = getComputedStyle(document.documentElement).getPropertyValue('--text-muted') || '#6e7681';
            g.append('text')
                .attr('class', 'mixture-comp')
                .attr('x', xScale(mx))
                .attr('y', yScale(my) + 18)
                .attr('text-anchor', 'middle')
                .attr('fill', axisColor)
                .attr('font-size', '10px')
                .text('w=' + w.toFixed(2));
        });
    }

    /* --------------------------------------------------------
       drawDAG — draws a simple directed acyclic graph
       Parameters:
         nodes: [{ id, label, x, y, active }]
         edges: [{ from, to, active }]
       Coordinates are in abstract [0-1] space, mapped to plot area
       -------------------------------------------------------- */
    function drawDAG(nodes, edges, opts) {
        opts = opts || {};
        g.selectAll('.dag-node,.dag-edge,.dag-label,.dag-arrow').remove();

        var plotW = width - margin.left - margin.right;
        var plotH = height - margin.top - margin.bottom;
        var nodeRadius = opts.nodeRadius || 22;
        var activeColor = opts.activeColor || '#d2a8ff';
        var inactiveColor = opts.inactiveColor || '#6e7681';

        function px(n) { return margin.left + n.x * plotW; }
        function py(n) { return margin.top + n.y * plotH; }

        /* Build quick lookup */
        var nodeMap = {};
        nodes.forEach(function (n) { nodeMap[n.id] = n; });

        /* Arrow marker */
        svg.select('defs').selectAll('#dag-arrow-marker').remove();
        svg.select('defs').append('marker')
            .attr('id', 'dag-arrow-marker')
            .attr('viewBox', '0 0 10 10')
            .attr('refX', 9).attr('refY', 5)
            .attr('markerWidth', 8).attr('markerHeight', 8)
            .attr('orient', 'auto-start-reverse')
            .append('path')
            .attr('d', 'M 0 0 L 10 5 L 0 10 z')
            .attr('fill', inactiveColor);

        svg.select('defs').selectAll('#dag-arrow-active').remove();
        svg.select('defs').append('marker')
            .attr('id', 'dag-arrow-active')
            .attr('viewBox', '0 0 10 10')
            .attr('refX', 9).attr('refY', 5)
            .attr('markerWidth', 8).attr('markerHeight', 8)
            .attr('orient', 'auto-start-reverse')
            .append('path')
            .attr('d', 'M 0 0 L 10 5 L 0 10 z')
            .attr('fill', activeColor);

        /* Edges */
        edges.forEach(function (e) {
            var src = nodeMap[e.from], tgt = nodeMap[e.to];
            if (!src || !tgt) return;

            var sx = px(src), sy = py(src);
            var tx = px(tgt), ty = py(tgt);

            /* Shorten to avoid overlap with node circle */
            var dx = tx - sx, dy = ty - sy;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist === 0) return;
            var ux = dx / dist, uy = dy / dist;
            sx += ux * (nodeRadius + 2);
            sy += uy * (nodeRadius + 2);
            tx -= ux * (nodeRadius + 4);
            ty -= uy * (nodeRadius + 4);

            var isActive = e.active;
            g.append('line')
                .attr('class', 'dag-edge')
                .attr('x1', sx).attr('y1', sy)
                .attr('x2', tx).attr('y2', ty)
                .attr('stroke', isActive ? activeColor : inactiveColor)
                .attr('stroke-width', isActive ? 2.5 : 1.5)
                .attr('marker-end', isActive ? 'url(#dag-arrow-active)' : 'url(#dag-arrow-marker)')
                .attr('opacity', isActive ? 0.9 : 0.4);
        });

        /* Nodes */
        nodes.forEach(function (n) {
            var cx = px(n), cy = py(n);
            var isActive = n.active;

            g.append('circle')
                .attr('class', 'dag-node')
                .attr('cx', cx).attr('cy', cy)
                .attr('r', nodeRadius)
                .attr('fill', isActive ? activeColor : (opts.nodeFill || '#21262d'))
                .attr('fill-opacity', isActive ? 0.25 : 0.6)
                .attr('stroke', isActive ? activeColor : inactiveColor)
                .attr('stroke-width', isActive ? 2.5 : 1.5);

            var labelColor = isActive ? '#e6edf3' : (getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#8b949e');
            g.append('text')
                .attr('class', 'dag-label')
                .attr('x', cx).attr('y', cy + 4)
                .attr('text-anchor', 'middle')
                .attr('fill', labelColor)
                .attr('font-size', '11px')
                .attr('font-weight', isActive ? '600' : '400')
                .text(n.label);
        });
    }

    /* --------------------------------------------------------
       Tooltip
       -------------------------------------------------------- */
    var tooltipEl = null;

    function showTooltip(event, d) {
        if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.style.cssText = 'position:fixed;padding:6px 10px;background:rgba(0,0,0,.85);' +
                'color:#fff;font-size:12px;border-radius:4px;pointer-events:none;z-index:999;';
            document.body.appendChild(tooltipEl);
        }
        var label = d.label || ('Class ' + (d.cls || 0));
        tooltipEl.textContent = '(' + d.x.toFixed(2) + ', ' + d.y.toFixed(2) + ') \u2014 ' + label;
        tooltipEl.style.left = event.clientX + 12 + 'px';
        tooltipEl.style.top = event.clientY - 28 + 'px';
        tooltipEl.style.display = 'block';
    }

    function hideTooltip() {
        if (tooltipEl) tooltipEl.style.display = 'none';
    }

    /* --------------------------------------------------------
       clear & resetZoom
       -------------------------------------------------------- */
    function clear() {
        if (g) g.selectAll('.data-point,.region-cell,.gauss-contour,.mixture-comp,.dag-node,.dag-edge,.dag-label,.dag-arrow').remove();
    }

    function resetZoom() {
        if (svg && zoom) svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
    }

    /* --------------------------------------------------------
       Public API
       -------------------------------------------------------- */
    window.MLZoo = window.MLZoo || {};
    window.MLZoo.diagram = {
        init: init,
        drawPoints: drawPoints,
        drawRegions: drawRegions,
        drawGaussianContours: drawGaussianContours,
        drawMixtureComponents: drawMixtureComponents,
        drawDAG: drawDAG,
        clear: clear,
        resetZoom: resetZoom,
        CLASS_COLORS: CLASS_COLORS,
        getScales: function () { return { x: xScale, y: yScale }; },
        getGroup: function () { return g; },
        getSvg: function () { return svg; }
    };
})();
