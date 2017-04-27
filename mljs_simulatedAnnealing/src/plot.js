/**
 * Classe para plotar gráfico
 * @param  {Object} settings opções para o gráfico:
 * {
 *   containerPlot {string}: identidicador do elemento onde deve ser desenhado o
 *   gráfico
 *   title {String}: título do gráfico
 *   margin {Object}: objeto contendo as margens para o gráfico {top, right, bottom, left}
 *   width {Number}: largura do gráfico
 *   height {Number}: altura do gráfico
 *   forceOrigin {Boolean}: se true eixos sempre mostaram a origem (0,0) no
 *   gráfico, caso contrário será redimensionado os eixos, valor padrão é true
 * }
 * @return {Object}          self
 */
function plot(options) {
  var self = this;
  var settings = options || {};
  var WIDTH = settings['width'] || 960;
  var HEIGHT = settings['height'] || 500;
  self.containerPlot = settings['containerPlot'];
  self.clearSvgContainer = settings['clearSvgContainer'] || false;
  self.init = false,
  self.title = settings['title'] || 'Data visualization';
  self.MARGIN = settings['margin'] || {top: 20, right: 20, bottom: 30, left: 40};
  self.WIDTH  = WIDTH - self.MARGIN.left - self.MARGIN.right;
  self.HEIGHT = HEIGHT - self.MARGIN.top - self.MARGIN.bottom;

  self.forceOrigin = utils.isSet(settings['forceOrigin'], true);

  self.x = d3.scale.linear()
      .range([0, self.WIDTH]);

  self.y = d3.scale.linear()
      .range([self.HEIGHT, 0]);

  self.xAxis = d3.svg.axis()
      .scale(self.x)
      .orient("bottom");

  self.yAxis = d3.svg.axis()
      .scale(self.y)
      .orient("left");

  self.xAxis = d3.svg.axis()
      .scale(self.x)
      .orient("bottom");

  self.yAxis = d3.svg.axis()
      .scale(self.y)
      .orient("left");

  return self;
}

/**
 * Método usado para inicializar as variáveis e ambiente onde será inserido o
 * gráfico
 * @param  {Array} data   conjunto de dados
 * @param  {Object} xAxis opções para o eixo X do gréfico (índice e título)
 * @param  {Object} yAxis opções para o eixo Y do gréfico (índice e título)
 * @return {Object}       elemento SVG que será usado para criar o gráfico
 */
plot.prototype.setupPlot2D = function(data, xAxis, yAxis) {

    var self = this;

    data.forEach(function(d) {
        d[xAxis.index] = +d[xAxis.index];
        d[yAxis.index] = +d[yAxis.index];
    });

    var xMax = d3.max(data, function(d){return d[xAxis.index]});
    var xMin = d3.min(data, function(d){return d[xAxis.index]});
    var yMax = d3.max(data, function(d){return d[yAxis.index]});
    var yMin = d3.min(data, function(d){return d[yAxis.index]});

    // Eixos sempre montram a origem (0,0)
    if (self.forceOrigin) {
        xMin = xMin > 0 ? 0 : xMin;
        yMin = yMin > 0 ? 0 : yMin;
    }

    self.x.domain([xMin, xMax]).nice();
    self.y.domain([yMin, yMax]).nice();

    d3.select("#" + self.containerPlot + " svg").remove();

    var svg = d3.select("#"+self.containerPlot).append("svg")
        .attr("id", self.containerPlot+'-svg')
        .attr("class", "svg-container-plot")
        .attr("width", self.WIDTH + self.MARGIN.left + self.MARGIN.right)
        .attr("height", self.HEIGHT + self.MARGIN.top + self.MARGIN.bottom)
    .append("g")
        .attr("transform", "translate(" + self.MARGIN.left + ","
            + self.MARGIN.top + ")");

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + self.HEIGHT + ")")
        .call(self.xAxis)
    .append("text")
        .attr("class", "label-axis")
        .attr("x", self.WIDTH)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text(xAxis.label);

    svg.append("g")
        .attr("class", "y axis")
        .call(self.yAxis)
    .append("text")
        .attr("class", "label-axis")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(yAxis.label);

    svg.append("text")
        .attr("x", (self.WIDTH / 2))
        .attr("y", 0)
        .attr("text-anchor", "middle")
        .attr("class", "svg-title")
        .style("font-size", "16px")
        .text(self.title);

    d3.select(".tooltip").remove();

    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    return svg;
};

/**
 * Método para plotar gráficos em 2D AxB
 * @param  {[type]} data  [description]
 * @param  {[type]} xAxis [description]
 * @param  {[type]} yAxis [description]
 * @param  {[type]} label [description]
 * @return {[type]}       [description]
 */
plot.prototype.plot2D = function(data, xAxis, yAxis, label) {
    var self = this;
    var defaultColor = "#1b9aec";

    if (label && ! utils.isNumeric(label) && label.indexOf("#") == 0){
        defaultColor = label;
    }

    var xAxis = utils.extend({label: 'x', index: 0}, xAxis);
    var yAxis = utils.extend({label: 'y', index: 1}, yAxis);

    if (utils.isNumeric(label)) {
        self.MARGIN.bottom = 70;
    }

    var svg = self.setupPlot2D(data, xAxis, yAxis);
    var div = d3.select(".tooltip");

    if (self.clearSvgContainer) {
        svg.selectAll(".point").remove();
        svg.selectAll(".centroid").remove();
    }

    var color = d3.scale.category10();

    var fill = function(d) {
        if (d["color"])
            return d["color"];
        if (d[label])
            return color(d[label]);
        return defaultColor;
    }

    //adiciona pontos
    svg.selectAll(".point")
        .data(data)
    .enter().append("circle")
        .attr("class", function(d) {
            return "dot point dot-" + fill(d).replace('#','');
        })
        .attr("r", 3.5)
        .attr("cx", function(d) { return self.x(d[xAxis.index]); })
        .attr("cy", function(d) { return self.y(d[yAxis.index]); })
        .style("fill", function(d) {return fill(d);})
    .on("mouseover", function(d) {
        div.transition()
            .duration(150)
            .style("opacity", .9);
        div.html("[" + d[xAxis.index].toFixed(2) + ", "  +
                d[yAxis.index].toFixed(2) + "]")
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 18) + "px");
    })
    .on("mouseout", function(d) {
        div.transition()
            .duration(150)
            .style("opacity", 0);
    });

    var colorDomain = color.domain();

    if (colorDomain.length > 1) {
        var legendSpace = self.WIDTH/colorDomain.length;
        var h = self.HEIGHT + self.MARGIN.bottom;
        var padding = 10;
        colorDomain.forEach(function(d, i){
            var translateX = (legendSpace/2)+i*legendSpace;
            var translateY = h - (self.MARGIN.bottom * 0.5) + padding;
            var sizeRect = 18;
            var leg = svg.append('g')
                .attr("transform", "translate(" + (translateX - padding) + ", "
                    + translateY +")");
            leg.append('rect')
                .attr("width", sizeRect)
                .attr("height", sizeRect)
                .attr("transform", "translate("+ (-sizeRect-5) +","+ -sizeRect +")")
                .attr("class", "rect-legend")
                .style("fill", color(d))
            .on("click", function(data, index){
                d3.selectAll(".dot-"+color(d).replace('#', '')).toggle();
            });

            leg.append('text')
                .attr("class", "legend")
                .style("text-anchor", "start")
                .text(d);
        });
    }

    return svg;
};

/**
 * Método para plotar um gráfico de linha
 * @param  {Array} data      conjunto de dados
 * xAxis: opções para o eixo X do gréfico (índice e título)
 * yAxis: opções para o eixo Y do gréfico (índice e título)
 * @param  {string} colorLine cor da linha
 * @return {Object}           referência do SVG
 * Adaptado de https://bl.ocks.org/mbostock/3883245
 */
plot.prototype.plotLine = function(data, xAxis, yAxis, colorLine) {

    var self = this;
    var color = colorLine || "#1F77B0";
    var xAxis = utils.extend({label: 'x', index: 0}, xAxis);
    var yAxis = utils.extend({label: 'y', index: 1}, yAxis);

    data.sort(function(a, b){ return d3.ascending(a[xAxis.index], b[xAxis.index]); });

    var svg = self.setupPlot2D(data, xAxis, yAxis);

    var interpolate = "basis",
        line = d3.svg.line()
            .interpolate(interpolate)
            .x(function(d) { return self.x(d[xAxis.index]); })
            .y(function(d) { return self.y(d[yAxis.index]); });

    // adiciona path ao svg
    svg.append("path")
        .attr("class", "line")
        .attr("d", line(data))
        .style("stroke", color);


    return svg;
};

/**
 * Método para plotar gráficos de pizza, utiliza a lib D3pie (http://d3pie.org)
 * @param  {Array} data  conjunto dados
 * xAxis: opções para o eixo X do gréfico (índice e título)
 * yAxis: opções para o eixo Y do gréfico (índice e título)
 */
plot.prototype.plotPieChart = function (data, xAxis, yAxis) {
    var self = this;
     var containerPlot = self.containerPlot;

    var xAxis = utils.extend({label: 'x', index: 0}, xAxis);
    var yAxis = utils.extend({label: 'y', index: 1}, yAxis);
    var title = self.title;

    var data2Pie = {
        sortOrder: "value-desc",
        content: [],
        smallSegmentGrouping: {
            enabled: true,
            value: 1,
            valueType: "percentage",
            label: "Outros",
            color: "#cccccc"
        }
    };

    data.forEach(function(d) {
        var segment = {
            label: d[xAxis.index],
            value: d[yAxis.index],
        }
        data2Pie.content.push(segment);
    });

    var pieChart = new d3pie(containerPlot, {
        data: data2Pie,
        // smallSegmentGrouping.enabled
        size: {
            canvasWidth: self.WIDTH,
            canvasHeight: self.HEIGHT,
        },
        labels: {
            truncation: {
                enabled: true
            }
        },

      tooltips: {
        enabled: true,
        type: "placeholder",
        string: "{label}: {percentage}%",
        styles: {
          fadeInSpeed: 500,
          backgroundColor: "#00cc99",
          backgroundOpacity: 0.8,
          color: "#ffffcc",
          borderRadius: 2,
          fontSize: 20,
          padding: 12
        }
      },
      header: {
        title: {
            text:    title,
            color:    "#333333",
            fontSize: 18,
            font:     "arial"
        },
        location: "top-center",
        titleSubtitlePadding: 8
    }
    });
}

/**
 * Método para plotar clusters resultantes dos modelos de agrupamento
 * @param  {Object} options Objeto com os dados e opções para o gráfico:
 * {
 *   data: pontos do conjuto de dados
 *   centroids: conjuto de centroídes resultantes do agrupamento (opcional)
 *   initialCentroids: centroídes iniciais do agrupamento (opcional)
 *   xAxis: opções para o eixo X do gráfico (índice e título)
 *   yAxis: opções para o eixo Y do gráfico (índice e título)
 * }
 */
plot.prototype.plotClusters = function(options) {

    var self = this;
    self.MARGIN.bottom += 20;
    var clusters = utils.clone(options['data']),
        centroids = options['centroids'] || [],
        initialCentroids = options['initialCentroids'] || [],
        color = d3.scale.category10(),
        xAxis = utils.extend({label: 'x', index: 0}, options['xAxis']),
        yAxis = utils.extend({label: 'y', index: 1}, options['yAxis']),
        centroidSize = 8,
        clearSvgContainer = options['clearSvgContainer'] || false,
        data2Plot = [];

    for (var i = 0; i < clusters.length; i++){
        var point = clusters[i].attributes;
        point["color"] = color(clusters[i].cluster);
        data2Plot.push(point);
    }

    var svg = self.plot2D(data2Plot);
    var div = d3.select(".tooltip");

    if (initialCentroids.length) {
        //adiciona centroides iniciais
        svg.selectAll(".initialCentroid")
            .data(initialCentroids)
        .enter().append("path")
            .attr("class", "dot initialCentroid")
            .attr("d", d3.svg.symbol().type("cross").size(128))
            .attr("transform", function(d) {
                return "translate(" + self.x(d[xAxis.index]) + ","
                    + self.y(d[yAxis.index]) + ")";
            })
            .style("fill", function(d, i) { return color(i); })
        .on("mouseover", function(d) {
            div.transition()
                .duration(150)
                .style("opacity", .9);
            div.html("[" + d[xAxis.index].toFixed(2) + ", "  +
                    d[yAxis.index].toFixed(2) + "]")
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 18) + "px");
        })
        .on("mouseout", function(d) {
            div.transition()
                .duration(150)
                .style("opacity", 0);
        });
    }

    if (centroids.length) {
        //adiciona centroides finais
        svg.selectAll(".centroid")
            .data(centroids)
        .enter().append('rect')
            .attr('class', 'dot centroid')
            .attr("x", function(d) { return self.x(d[xAxis.index]); })
            .attr("y", function(d) { return self.y(d[yAxis.index]); })
            .attr('width', centroidSize)
            .attr('height', centroidSize)
            .style("fill", function(d, i){ return color(i); })
        .on("mouseover", function(d) {
            div.transition()
                .duration(150)
                .style("opacity", .9);
            div.html("[" + d[xAxis.index].toFixed(2) + ", "  +
                    d[yAxis.index].toFixed(2) + "]")
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 18) + "px");
        })
        .on("mouseout", function(d) {
            div.transition()
                .duration(150)
                .style("opacity", 0);
        });
    }

    var legend = svg.selectAll(".legend")
        .data(color.domain())
    .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) {
            return "translate(0, " + i * 20 + ")";
        });

    legend.append("rect")
        .attr("x", self.WIDTH - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    legend.append("text")
        .attr("x", self.WIDTH - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { return d < 0 ? "Noise " : "Cluster " + d; });


    var cl = svg.append('g')
        .attr('class', 'container-legend-symbol');

    var xl = self.MARGIN.left,
        yl = self.HEIGHT + (self.MARGIN.bottom - 10),
        sizeRect = 8,
        wl = 100,
        sizeCross = 80,
        fillLegend = '#1F77B4',
        symbol = function(type, size) {
            var s = type || 'cross';
            var sz = size || 128;
            return d3.svg.symbol().type(s).size(sz);
        };

    var cl1 = cl.append('g');
    if (centroids.length) {
        cl1.append("rect")
            .attr("y", yl - sizeRect)
            .attr("width", sizeRect)
            .attr("height", sizeRect)
            .style("fill", fillLegend)
            .style("stroke", '#000');

        cl1.append("text")
            .attr("x", xl + sizeRect)
            .attr("y", yl)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text("Last centroid");
    }

    if (initialCentroids.length) {
        cl1.append("path")
            .attr("d", symbol('cross', sizeCross))
            .attr("transform", function(d) {
                    return "translate(" + wl + ","
                        + (yl - (sizeRect)) + ")";
                })
            .style("fill", fillLegend)
            .style("stroke", '#000');

        cl1.append("text")
            .attr("x", xl + sizeRect + wl)
            .attr("y", yl)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text("First centroid");
    }
}

plot.prototype.plotClustersSteps = function (clustersSteps, control) {
    var self = this;

    self.numberSteps = clustersSteps.length;
    self.currentPosition = -1;
    self.clearSvgContainer = true;

    var btnControl = utils.extend({
        btnPrev: "#btn-prev",
        btnNext: "#btn-next"}, control);

    var btnPrev = document.querySelector(btnControl['btnPrev']);
    var btnNext = document.querySelector(btnControl['btnNext']);

    function disable_enable(elem){
        elem.disabled = !elem.disabled;
    }

    function disable(elem){
        elem.disabled = true;
    }

    function enable(elem){
        elem.disabled = false;
    }

    disable(btnPrev);

    btnNext.onclick = function(){
        self.currentPosition += 1;
        self.currentPosition = self.currentPosition % self.numberSteps;
        updateGraph(self.currentPosition);
        if (self.currentPosition > 0)
            enable(btnPrev);
        if (self.currentPosition == (self.numberSteps - 1))
            disable(btnNext);
    }

    btnPrev.onclick = function(){
        self.currentPosition -= 1;
        self.currentPosition = self.currentPosition % self.numberSteps;
        updateGraph(self.currentPosition);
        if (self.currentPosition > 0){
            enable(btnNext);
        }else {
            disable(btnPrev);
        }
    }

    function updateGraph (step) {

        var optionsStep = {
            data: clustersSteps[step].clusters,
            centroids: clustersSteps[step].centroids,
            initialCentroids: clustersSteps[step].initialCentroids
        };
        self.title = "Iteration " + (step + 1) + "/" + self.numberSteps;
        self.plotClusters(optionsStep);
    }
}

/**
 * Método para gerar gráfico Matriz de Scatter Plot
 * @param  {Array} data  conjunto dados
 * @param  {Array} label array com atributos a serem considerados na matriz
 * Adaptado de <https://bl.ocks.org/mbostock/4063663>
 */
plot.prototype.scatterPlotMatrix = function(data, label) {
  var self = this;
  self.MARGIN.bottom = 70;
  var titlePlot = self.title !== "Data visualization" ? self.title
    : "Scatterplot Matrix";
  var containerPlot = self.containerPlot;

  var labels = [];
  data.forEach(function(d, i){
    if (! utils.in_array(d[label], labels)) {
      labels.push(d[label]);
    }
  });

  var width = self.WIDTH + self.MARGIN.left + self.MARGIN.right,
    size = 230,
    padding = 20;

  var x = d3.scale.linear()
      .range([padding / 2, size - padding / 2]);

  var y = d3.scale.linear()
      .range([size - padding / 2, padding / 2]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom")
      .ticks(6);

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .ticks(6);

  var color = d3.scale.category10();

  var domainByTrait = {},
      traits = d3.keys(data[0]).filter(function(d) { return d !== label; }),
      n = traits.length;

  traits.forEach(function(trait) {
    domainByTrait[trait] = d3.extent(data, function(d) { return d[trait]; });
  });

  xAxis.tickSize(size * n);
  yAxis.tickSize(-size * n);

  var brush = d3.svg.brush()
      .x(x)
      .y(y)
      .on("brushstart", brushstart)
      .on("brush", brushmove)
      .on("brushend", brushend);

  //(padding * 2) quando usar box-sizing: border-box no css
  var w = (size * n) + (padding * 2);
  var h = (size * n) + (padding * 2) + self.MARGIN.bottom;

  var svg = d3.select("#" + containerPlot).append("svg")
      .attr("width", w)
      .attr("height", h)
    .append("g")
      .attr("transform", "translate(" + padding + "," + padding / 2 + ")");

  svg.append("text")
    .attr("x", (w / 2))
    .attr("y", 0)
    .attr("text-anchor", "middle")
    .attr("class", "title-plot")
    .text(titlePlot);

  svg.selectAll(".x.axis")
      .data(traits)
    .enter().append("g")
      .attr("class", "x axis")
      .attr("transform", function(d, i) { return "translate(" + (n - i - 1) * size + ",0)"; })
      .each(function(d) { x.domain(domainByTrait[d]); d3.select(this).call(xAxis); });

  svg.selectAll(".y.axis")
      .data(traits)
    .enter().append("g")
      .attr("class", "y axis")
      .attr("transform", function(d, i) {
        return "translate(0," + i * size + ")"; })
      .each(function(d) {
        y.domain(domainByTrait[d]); d3.select(this).call(yAxis);
      });

  var cell = svg.selectAll(".cell")
      .data(cross(traits, traits))
    .enter().append("g")
      .attr("class", "cell")
      .attr("transform", function(d) {
        return "translate(" + (n - d.i - 1) * size + "," + d.j * size + ")"; })
      .each(plot);

  // Titles for the diagonal.
  cell.filter(function(d) { return d.i === d.j; }).append("text")
      .attr("x", padding)
      .attr("y", padding)
      .attr("dy", ".71em")
      .text(function(d) { return d.x; });

  cell.call(brush);

  //Legenda
  var legendSpace = w/labels.length;
  var colorDomain = color.domain();

  if (colorDomain.length > 1) {
    colorDomain.forEach(function(d, i){
      var translateX = (legendSpace/2)+i*legendSpace;
      var translateY = h - (self.MARGIN.bottom * 0.5);

      var sizeRect = 18;
      var leg = svg.append('g')
              .attr("transform", "translate(" + (translateX - padding) + ", "+
                (translateY - (padding/2)) +")");
      leg.append('rect')
        .attr("width", sizeRect)
        .attr("height", sizeRect)
        .attr("transform", "translate("+ (-sizeRect-5) +","+ -sizeRect +")")
        .style("fill", color(d));

      leg.append('text')
        .attr("class", "legend")
        .style("text-anchor", "start")
        .text(d);
      });
  }

  function plot(p) {
    var cell = d3.select(this);

    x.domain(domainByTrait[p.x]);
    y.domain(domainByTrait[p.y]);

    cell.append("rect")
        .attr("class", "frame")
        .attr("x", padding / 2)
        .attr("y", padding / 2)
        .attr("width", size - padding)
        .attr("height", size - padding);

    cell.selectAll("circle")
        .data(data)
      .enter().append("circle")
        .attr("cx", function(d) { return x(d[p.x]); })
        .attr("cy", function(d) { return y(d[p.y]); })
        .attr("r", 4)
        .style("fill", function(d) { return color(d[label]); });
  }

  var brushCell;

  // Clear the previously-active brush, if any.
  function brushstart(p) {
    if (brushCell !== this) {
      d3.select(brushCell).call(brush.clear());
      x.domain(domainByTrait[p.x]);
      y.domain(domainByTrait[p.y]);
      brushCell = this;
    }
  }

  // Highlight the selected circles.
  function brushmove(p) {
    var e = brush.extent();
    svg.selectAll("circle").classed("unhighlight", function(d) {
      return e[0][0] > d[p.x] || d[p.x] > e[1][0]
          || e[0][1] > d[p.y] || d[p.y] > e[1][1];
    });
  }

  // If the brush is empty, select all circles.
  function brushend() {
    if (brush.empty()) svg.selectAll(".unhighlight")
      .classed("unhighlight", false);
  }

  function cross(a, b) {
    var c = [], n = a.length, m = b.length, i, j;
    for (i = -1; ++i < n;) for (j = -1; ++j < m;)
      c.push({x: a[i], i: i, y: b[j], j: j});
    return c;
  }

};

/**
 * Método para plotar árvore
 * @param  {object} opts opções para o gráfico
 */
plot.prototype.drawTree = function drawTree (opts) {
  var options = opts || {};

  var self = this;
  var margin = self.MARGIN/* {top: 40, right: 30, bottom: 40, left: 30}*/;
  var width = self.WIDTH - margin.right - margin.left;
  var height = self.HEIGHT - margin.top - margin.bottom;

  var i = 0;
  // id do container para plotar árvore
  var containerPlot = self.containerPlot;
  var isHorizontal = options['isHorizontal'] || false;
  var treeSize = ! isHorizontal ?
          [width, height] :
          [height, width];

  var tree = d3.layout.tree()
    .size(treeSize);

  var diagonal = d3.svg.diagonal()
    .projection(function(d) { return ! isHorizontal ?
    		[d.x, d.y] : [d.y, d.x]; });

  d3.select("#"+containerPlot +" svg").remove();

  var zoomListener = d3.behavior.zoom()
    .on("zoom", zoom);

  var svg = d3.select("#"+containerPlot).append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .attr("class", "tree-visualization")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(zoomListener).append("g");

  var treeRoot = options['data'][0];

  update(treeRoot);

  function color(d) {
      var c = d.parent == "null" ? "#4682B4" : d.children ? "#c6dbef" : "#06DC06";
    return c;
  }

  function update(source) {

    var nodes = tree.nodes(treeRoot).reverse();
    var links = tree.links(nodes);

    // Fixar profundidade
    nodes.forEach(function(d) { d.y = d.depth * 100; });

    var link = svg.selectAll(".link")
      .data(links)
      .enter()
      .append("g")
      .attr("class", "link");

      link.append("path")
          .attr("fill", "none")
          .attr("stroke", "#ff8888")
          .attr("stroke-width", "1.5px")
          .attr("d", diagonal);

      link.append("text")
          .attr("class", "rule")
          .attr("fill", "#000")
          .attr("transform", function(d) {
              return ! isHorizontal ?
                  "translate(" +
                  ((d.source.x + d.target.x)/2) + "," +
                  ((d.source.y + d.target.y)/2) + ")" :
                  "translate(" +
                  ((d.source.y + d.target.y)/2) + "," +
                  ((d.source.x + d.target.x)/2) + ")";
          })
          .attr("dy", ".35em")
          .attr("text-anchor", "middle")
          .text(function(d) {
               return d.target.rule;
          });

    var node = svg.selectAll("g.node")
      .data(nodes, function(d) { return d.id || (d.id = ++i); });

    var nodeEnter = node.enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) {
          return ! isHorizontal ?
              "translate(" + d.x + "," + d.y + ")" :
              "translate(" + d.y + "," + d.x + ")";
      });

    nodeEnter.append("circle")
      .attr("r", 10)
      .style("fill", function (d) { return color(d); });

    nodeEnter.append("text")
      .attr("y", function(d) {
          // distancia do texto para o nó
          return d.children || d._children ? -18 : 18; })
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .text(function(d) { return d.name; })
      .style("fill-opacity", 1);

  }

  // Zoom
  function zoom() {
    svg.attr("transform", "translate(" + d3.event.translate + ")scale("
      + d3.event.scale + ")");
  }
}

/**
 * Método para plotar gráfico de barras
 * @param  {array} data dados para o gráfico
 * @param  {object} xA   opções para o eixo X do gráfico {index: number}
 * @param  {object} yA   opções para o eixo XY do gráfico {index: number}
 * @return {object}      self
 */
plot.prototype.barChart = function(data, xA, yA) {
  var self = this;
  var identifier = '#' + self.containerPlot;

  var svg = d3.select(identifier).append('svg')
    .attr("width", self.WIDTH + self.MARGIN.left + self.MARGIN.right)
    .attr("height", self.HEIGHT + self.MARGIN.top + self.MARGIN.bottom)
    .attr("class", "plot-svg")
  .append("g")
    .attr("class", "g-main")
    .attr("transform", "translate(" + self.MARGIN.left + "," + self.MARGIN.top + ")");

  var x = d3.scale.ordinal()
    .rangeRoundBands([0, self.WIDTH], .1);

  var y = d3.scale.linear()
      .range([self.HEIGHT, 0]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left");

  x.domain(data.map(function(d) {
    return d[xA['index']];
  }));

  y.domain([0, d3.max(data, function(d) {
    return d[yA['index']];
  })]);

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + self.HEIGHT + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text(yA['label']);

  svg.selectAll(".bar")
      .data(data)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x(d[xA['index']]); })
      .attr("width", x.rangeBand())
      .attr("y", function(d) { return y(d[yA['index']]); })
      .attr("height", function(d) { return self.HEIGHT - y(d[yA['index']]); });

  return self;
}