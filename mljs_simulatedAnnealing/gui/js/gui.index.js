function modelFactory() {
  var self = this;
  self.createModel = function (type, options) {
    var model, _main;
    var mainCluster = "buildClusterer";
    var mainClassify = "buildClassifier";
    var datasetDimension = options.data[0].length;

    if (typeof type === "undefined" || type === "")
      throw new Error("Undefined type of model");

    switch(type) {
      case "kmeans":
        model = new Kmeans(options);
        _main = mainCluster;
        break;
      case "dbscan":
        model = new DBSCAN(options);
        _main = mainCluster;
        break;
      case "knn":
        model = new kNN(options);
        _main = mainClassify;
        break;
      case "id3":
        model = new ID3(options);
        _main = mainClassify;
        break;
      case "gradientdescent":
        model = datasetDimension > 2 ? new linearRegressionGradientDescent() :
          new univariateLinearRegressionGradientDescent();
        _main = "train";
        break;
      case "annealing":
        model = new SimulatedAnnealing(options);
        _main = mainCluster;
        break;
      default:
        throw new Error("Undefined model, try kmeans, dbscan, knn, "
          +"id3, gradientdescent, annealing");
    }

    model.type = type;
    model.main = _main;

    return model;
  }
}

var mlGui = {
  messages: {
    emptyData: "Selecione um arquivo primeiro"
  },
  runOptions: {
    FULLDATASET: {
      id: "full-dataset",
      info: "Usa todos os exemplos do dataset para treinar e testar "
      + "posteriormente o modelo",
      defaultValue: 66
    },
    CROSSVALIDATION: {
      id: "cross-validation",
      info: "Executa validação cruzada com o número de partições passado pelo"
      + " usuário, valor padrão é 10"
    },
    HOLDOUT: {
      id: "holdout",
      info: "Usa 2/3 do dataset para treino e 1/3 para teste"
    },
  }
};

var datasetMain;
//remover todo que não for letra ou número ou _
var clearString = /\W/ig;

if("undefined" == typeof jQuery){
  throw new Error("Gui's JavaScript requires jQuery");
}

$(document).ready(function() {

  initSideBar($("#nav-sidebar"));

  datasetMain = new dataSet('#data_file', 'drop-zone');

  $(".test-options").each(function(index, el) {
    var $el = $(el);
    var md = $el.data('model');
    $el.handlebars($("#test-options-template"), {model: md});
  });
  var $cvTable = $('#cv-table-template');
  $('#model-result-id3').handlebars($cvTable, {id: 'id3'}, "prepend");
  $('#model-result-knn').handlebars($cvTable, {id: 'knn'}, "prepend");

  $(document).on('change', ':input[name="test-option"]', function(e) {
    e.preventDefault();
    var $this = $(this);
    var val = $this.val();
    var $parent = $this.parents('.container-test-options');
    var defaultValueSplit = mlGui.runOptions.FULLDATASET.defaultValue;
    var id = $parent.parent(".test-options").data('model');
    $parent.find('.hh').hide();
    $parent.find('.hz').val("");
    switch (val) {
      case 'holdout':
        break;
      case 'full-dataset':
        $parent.find('.p-split').show();
        $('#test-option-percent-split-'+id).val(defaultValueSplit);
        break;
      case 'cross-validation':
        $parent.find('.folds').show();
        break;
    }

  });

  $(".nav-tabs a[data-toggle=tab]").on("click", function(e) {
    if ($(this).parent('li').hasClass("disabled")) {
      e.preventDefault();
      return false;
    }
  });

  $('.sidebar a[data-toggle="tab"]').on('click', function (e) {
    if ($(this).parent('li').hasClass('disabled')) {
      return false;
    }
  });

  datasetMain.loadFile({
    loadend: function() {
      if (! datasetMain._loaded) {
        return false;
      }

      initDatasetView();

      console.log('Arquivo carregado: ', datasetMain.file.name);
      console.log('Tamanho: ', datasetMain.file.extra.prettySize);

      var $divDataFile = $('#w-data-file-name');
      var $ipt = $('#data_file_name');
      var $dropZone = $("#w-drop-zone");
      $ipt.val(datasetMain.file.name);
      $divDataFile.show();
      $dropZone.hide();

      $('#new-datset').click(function(event) {
        event.preventDefault();
        $divDataFile.hide();
        $ipt.val("");
        $dropZone.show();
        $('#drop-zone').removeClass('drag');
        datasetMain.reset(function(){
          console.log('### RESET ###');
        });
      });
      $('.enable-on-load-dataset').removeClass('disabled');
      $('.show-on-load-dataset').show();
    }
  });

  var $formOptionsModel = $('.form-options-model');

  $formOptionsModel.submit(function(event) {
    event.preventDefault();
    if (! datasetMain.data || datasetMain.data.length == 0) {
      alert(mlGui.messages.emptyData);
      return false;
    }

    var $form = $(this),
      factory = new modelFactory(),
      id = $form.attr('id'),
      options = form2js(id),
      $containerResult = $("#model-result-" + options.model),
      $modelInfoText = $('#model-result-info-'+ options.model
        +' .model-info-text'),
      modelInfo = {},
      datasetVisualizationTitle = 'Visualização dataset '
        + options.model.toUpperCase()
        + '('+ datasetMain._info.relation + ')',
      result,
      model;

    options.data = datasetMain.data;
    options.attributesNames = datasetMain.getAttributesNames();

    if (! datasetMain._hasNumeric) {
      options['distance'] = utils.math.categorical;
    }

    // RUN #####################################
    var isCrossValidation = options['test-option'] ==
      mlGui.runOptions.CROSSVALIDATION.id;
    var CV;
    model = factory.createModel(options.model, options);
    options['fullDataset'] = options['test-option']
      === mlGui.runOptions.FULLDATASET.id;

    $('#cross-validation-' + options.model).hide();
    $('#cv-table-' + options.model).html("");

    if (! isCrossValidation) {
      result = model[model.main](options);
    } else {
      CV = new crossValidation(options['folds']);
      result = CV.run(options.model, datasetMain);
      model.resultData = CV.getDataResult();
      var detailsCV = CV.getDetails();
      $('#cross-validation-' + options.model).show();
      $('#cv-table-' + options.model).html(detailsCV);
    }

    // ##################################### RUN
    if (model instanceof Clusterer) {
      datasetVisualizationTitle = "Cluster visualization - "
        + options.model.toUpperCase()
        + " ("+ datasetMain._info.relation +")";
      var plotDataSet = new plot({
        containerPlot: "svg-container-" + options.model,
        title: datasetVisualizationTitle
      }).plotClusters({
        data: result.clusters,
        centroids: result.centroids,
        initialCentroids: result.initialCentroids,
      });

      // model.logClusters();
      var clustersInfo = model.getClustersInfo();
      $('#table-cluster-'+options.model).handlebars(
        $('#cluster-table-template'), {cluster: clustersInfo});

      if (model instanceof Kmeans) {
        modelInfo.iterations = model.iterations;
        modelInfo.sse = model.getSSE();
        modelInfo.ssbtotal = model.getSSBTotal();
      }
    }

    if (result instanceof ConfusionMatrix) {
      result.setLanguage('pt');
      var confusionMatrixHtml = result.toString();
      $("#model-confusion-matrix-" + options.model)
        .html(confusionMatrixHtml);

      modelInfo['total-examples'] = result.totalExamples;
      modelInfo['correctly-classified'] = result.correctClassifications;
      modelInfo['incorrectly-classified'] = result.incorrectClassifications;
    }

    if (model instanceof ID3) {
      var treeData  = isCrossValidation ? CV.getDataResult() : model.getTree();
      var plotDataSet = new plot({
        width: 1045,
        margin: {top: 40, right: 30, bottom: 40, left: 30},
        containerPlot: 'svg-container-id3'
      }).drawTree({data: treeData});
    }

    if (model instanceof kNN) {
      if (datasetMain._hasNumeric) {
        var dataPlotClassifierInstance = model.resultData;
        var idPlotClassifier = "svg-container-"+options.model;
        var $container = $("#"+idPlotClassifier);
        $container.empty().show();

        var plotDataSet = new plot({
              'containerPlot': idPlotClassifier,
              'title': "Dataset - " + datasetMain._info.relation,
              'forceOrigin': true
            });

        var label_x = datasetMain._attribute.names[0];
        var label_y = datasetMain._attribute.names[1];
        var label_data = "#1b9aec";
          label_data = dataPlotClassifierInstance[0].length - 1;

        plotDataSet.plot2D(
              dataPlotClassifierInstance,
              {label: label_x},
              {label: label_y},
              label_data
            );
      }
    }


    if (model.type === "gradientdescent") {
      modelInfo.numIterations = model.numIterations;
      modelInfo.mse = model.mse;
      datasetVisualizationTitle = "MSE";
      var plotGradientDescent = new plot({
        containerPlot: "svg-container-" + options.model,
        title: datasetVisualizationTitle
      }).plotLine(
        model.errorPlot,
        {label: 'Iteração'},
        {label: 'Erro'}
      );

      var attrName = datasetMain._attribute.names;
      var attrLength = attrName.length;
      var weights = model.theta.slice();
      weights.reverse();
      var eqTxt = [attrName[attrLength - 1] + " = "];
      for (var u = 0; u < (attrLength - 1); u++ ) {
        eqTxt.push(weights[u].toFixed(7) + " * "+attrName[u]+" +");
      }
      eqTxt.push(weights[attrLength-1].toFixed(7) + "");
      $("#eq-weights-grad").html("<p>"+ eqTxt.join("</p><p class='g-weight'>")+"</p>");
    }

    if ($modelInfoText.length && ! utils.isEmptyObject(modelInfo)) {
      populeInfo($modelInfoText, modelInfo);
    }

    $containerResult.show();

  });

});

// @TODO dataset.setClassIndex()
function initDatasetView() {
  showInfoDataset(datasetMain);
  populePanelAttributes(datasetMain);
  enableDatasetVisualize(datasetMain);
}

function enableDatasetVisualize(arg_dataset) {
  $("#svg-plot-dataset, #svg-scatterplot-matrix-brushing, #svg-nominal-plot")
    .empty();
  if (arg_dataset._hasNumeric) {
    var numericKeys = Object.keys(arg_dataset._attribute.numericInfo);
    var nNumeric = numericKeys.length;
    if (nNumeric == 2) {
      plot2DVisualization(arg_dataset, "svg-plot-dataset");
    } else {
      buildScatterPlotMatrix(arg_dataset,
        'svg-scatterplot-matrix-brushing');
    }
  } else {
    buildNominalStatistics(arg_dataset);
  }
}

function plot2DVisualization(arg_dataset, container) {
  var $container = $("#"+container);
  $container.empty();
  var plotDataSet = new plot({
        'containerPlot': container,
        'title': "Dataset - " + arg_dataset._info.relation,
        'forceOrigin': true
    });

    var label_x = arg_dataset._attribute.names[0];
    var label_y = arg_dataset._attribute.names[1];
    var label_data = "#1b9aec";
    var attr = arg_dataset._attribute.attributes;
    if (arg_dataset._hasNominal) {
      var _labels = Object.keys(arg_dataset._attribute.nominalInfo);
      label_data = attr[_labels[_labels.length - 1]]['column'];
    }

    plotDataSet.plot2D(
        arg_dataset.data,
        {label: label_x, index: attr[label_x]['column']},
        {label: label_y, index: attr[label_y]['column']},
        label_data
    );
}

function buildNominalStatistics(arg_dataset, container) {
    var data2Pie = arg_dataset._attribute.nominalInfo;
    var keysPie = Object.keys(data2Pie);
    var $tmp = $('#pie-chart-template');
    var $container = $('#svg-nominal-plot');
    $container.empty();
    var wChart = $('#dataset-view').width() * 0.49;
    var hChart = (wChart * 0.75);

    for (var i = 0, j = keysPie.length; i < j; i++) {
      var segment = [];
      var currentAttr = data2Pie[keysPie[i]];
      Object.keys(currentAttr).map(function(value, index) {
       segment.push([value, currentAttr[value]]);
    });

      var idAttr = keysPie[i].trim().replace(clearString,'');
      $container.handlebars($tmp, {id: idAttr, name: keysPie[i]}, 'append');
      $('#'+idAttr).parent(".container-pie-chart").css({
        width: wChart,
        height: hChart
      });
      var xAxis = {index: 0, label: keysPie[i]};
      var yAxis = {index: 1, label: 'Frequência'};
      var plotDataSet = new plot({
        'width': wChart,
        'height': hChart - 60,
        containerPlot: idAttr}).barChart(segment, xAxis, yAxis);
    }
}

function buildScatterPlotMatrix(arg_dataset, container) {
  var $container = $("#"+container);
  $container.empty();
  var title = arg_dataset._info.relation;
  var dataMatrix = arg_dataset.toObject();
  var names = arg_dataset._attribute.names;
  var pLabel = names[names.length - 1];
  var attrLabel = arg_dataset._attribute.attributes[pLabel];
  var label;
  if (! isAttrNumeric(attrLabel['type'])) {
    label = pLabel;
  }

  var plotDataSet = new plot({
    containerPlot: "svg-scatterplot-matrix-brushing",
    title: 'Scatter Plot Matrix - ' + title,
  }).scatterPlotMatrix(dataMatrix, label);
}

function isAttrNumeric(type) {
  return type == (new dataSet())._attribute._ATTRIBUTE_NUMERIC;
}

function populePanelAttributes(arg_dataset) {
  clearInfo();
  if (! arg_dataset._loaded) {
    return;
  }

  var attr = arg_dataset._attribute.attributes;
  var isNumeric = isAttrNumeric;
  var total = arg_dataset._info.numberInstances;
  var $panel = $("#dataset-panel-attribute");
  var $panelBody = $('#dataset-panel-attribute .panel-body');
  var $panelSt = $("#dataset-panel-attribute-visualize");
  var $panelBodySt = $('#dataset-panel-attribute-visualize .panel-body');
  var attrName = arg_dataset._attribute.names;
  var attrLength = attrName.length;
  var iFixed = 4;
  var source   = $("#attribute-template").html();
  var template = Handlebars.compile(source);

  var numericInfo = arg_dataset._attribute.numericInfo;
  var nominalInfo = arg_dataset._attribute.nominalInfo;

  var sourceStatistic = $("#statistic-attribute-template").html();
  var templateStatistic = Handlebars.compile(sourceStatistic);


  for (var i = 0; i < attrLength; i++) {
    attrKey = attrName[i];
    var htmlAttr = template({
      id: attr[attrKey].name.trim().replace(clearString,''),
      attr_column: attr[attrKey].column,
      attr_name: attr[attrKey].name,
      attr_type: attr[attrKey].type,
      collapse: ".statistic-attribute-template"
    });

    $panelBody.append(htmlAttr);
    var contextSt = {
      id: attr[attrKey].name.trim().replace(clearString,''),
      attr_name: attr[attrKey].name,
      isNumeric: isNumeric(attr[attrKey].type),
      _total: total
    };
    var currSt;
    if (contextSt.isNumeric) {
      currSt = numericInfo[attr[attrKey].name];
    } else {
      currSt = nominalInfo[attr[attrKey].name];
    }
    contextSt.statistic = currSt;
    var htmlSt = templateStatistic(contextSt);
    $panelBodySt.append(htmlSt);
  }

}

// Handlebars
Handlebars.registerHelper('fixed2', function(value, i) {
  var i = i || 2;
  return value.toFixed(i)
});
Handlebars.registerHelper('percent', function(v, b) {
  var total = b.data._parent.root._total || 1;
  var percent = (v / total) * 100;
  return percent.toFixed(2) + '%';
});
//http://blog.teamtreehouse.com/handlebars-js-part-3-tips-and-tricks
Handlebars.registerHelper("debug", function(optionalValue) {
  console.log("Current Context");
  console.log("====================");
  console.log(this);

  if (optionalValue) {
  console.log("Value");
  console.log("====================");
  console.log(optionalValue);
  }
});

Handlebars.registerHelper('tbody', function(items, options) {
  var out = "";
  for(var i=0, l=items.length; i<l; i++) {
    out = out + "<tr><td>" + items[i].join("</td><td>") + "</td></tr>\n";
  }
  return out;
});

// http://blog.teamtreehouse.com/handlebars-js-part-3-tips-and-tricks
// $('#content').handlebars($('#template'), { name: "jQuery" });
(function($) {
  var compiled = {};
  $.fn.handlebars = function(template, data, dest) {
    if (template instanceof jQuery) {
    template = $(template).html();
    }
    var d = dest || 'html';
    compiled[template] = Handlebars.compile(template);
    this[d](compiled[template](data));
  };
})(jQuery);

(function initToggleItem() {
  $(document).on('click', '[data-toggle="item"]', function(event) {
    event.preventDefault();
    var $this = $(this);
    // $this.toggleClass('btn-success');
    var $toggle = $($this.data('target'));
    var $collapse = $($this.data('collapse'));
    $collapse.each(function(index, el) {
      var $el = $(el);
      if ($el.attr('id') !== $toggle.attr('id')) {
        $el.removeClass('in');
      }
    });
    $toggle.toggleClass('in');
  });
})();

function clearInfo() {
  $("#dataset-panel-attribute-visualize .panel-body,"
    + " #dataset-panel-attribute .panel-body,"
    + " #svg-scatterplot-matrix-brushing").empty();
}

function populeInfo($modelInfoText, info) {
// console.log('$modelInfoText, info ' , $modelInfoText, info);
  $modelInfoText.parents('.model-result').show();
  $modelInfoText.each(function(index, el) {
    var $el = $(el);
    var infoKey = $el.data('info');
    var infoValue = (info[infoKey] !== undefined) ? info[infoKey] : "---";
    $el.children('span').text(infoValue);
  });
}

function showInfoDataset(dataset) {
  var $attrTxt = $('#attr-txt'),
  $numberAttr = $(".number-attributes > span"),
  $numberInst = $(".number-instances > span");
  $numberAttr.text(dataset._info.numberAttributes);
  $numberInst.text(dataset._info.numberInstances);
  $attrTxt.hide();
}

function initFileSelect() {
  $('.btn-file :file').on('fileselect', function(event, numFiles, label) {
    var input_label = $(this).closest('.input-group').find('.file-input-label'),
      log = numFiles > 1 ? numFiles + ' files selected' : label;

    if( input_label.length ) {
      input_label.text(log);
    }
  });
  $(document).on('change', '.btn-file :file', function() {
    var input = $(this),
      numFiles = input.get(0).files ? input.get(0).files.length : 1,
      label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
    input.trigger('fileselect', [numFiles, label]);
  });
}

// @TODO verificar quais podem ser usados pelo dataset selecionado
function enableModels() {
  $('.sidebar li.disabled').removeClass('disabled');
}

function initSideBar($nav) {
  $nav.metisMenu();
}