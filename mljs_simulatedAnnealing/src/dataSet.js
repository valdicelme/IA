// se sobreescrever formatLine não vai funcionar
// as funções de replace, remove

/**
dataSet         -> classe para dataset
dataSet.data    -> array com dados
dataSet.info    -> informações sobre a base @TODO
*/

/**
 * Classe para leitura e mainulação de arquivo
 * @param  {String} fileInput identificador do input usado pelo usuário para
 * selecionar o arquivo
 * @param  {String} dropZone  identificador da zona de drop para selecionar o
 * arquivo
 * @return {Object}           self
 */
function dataSet(fileInput, dropZone){
  var self = this;
  var input = fileInput || 'input[type="file"]';
  self.fileInput = document.querySelector(input);
  self._loaded = false;
  self._info = {};
  self._attribute = {};
  self.dropZone = dropZone || false;

  self._attribute._ATTRIBUTE_NUMERIC = 1;
  self._attribute._ATTRIBUTE_NOMINAL = 2;
  return self;
}

/**
 * Método para resetar o objeto
 * @param  {function} callback função a ser executada ao o reset
 * @return {object}            self
 */
dataSet.prototype.reset = function(callback) {
  var self = this;
  self._loaded = false;
  self._info = {};
  self._attribute = {};
  self._attribute._ATTRIBUTE_NUMERIC = 1;
  self._attribute._ATTRIBUTE_NOMINAL = 2;
  self.data = [];

  if (typeof callback === "function") {
    callback();
  }

  return self;
}

/**
 * Método para retorna os nomes dos atributos do conjunto de dados
 * @return {array} nomes dos atributos
 */
dataSet.prototype.getAttributesNames = function() {
  var self = this;
  return self._attribute.names;
}

/**
 * Método usado para carregar o arquivo
 * @param  {Object} options objeto com os parâmetros usados para a leitura e
 * processaento do arquivo:
 * {
 *   containerPlot:  {String}  identificador do elemento onde será inserido o
 *   gráfico após o carregamento do arquivo, opcional, caso não seja passado
 *   não será gerado o gráfico ao final do carregamento
 *   endLineSeparator: {String}  caractere usado para quebra de linha no
 *   arquivo, o padrão é \n
 *   attributeSeparator: {String}  caractere usado para separa os artributos na
 *   linha, o padrão é ','. Padrão do arquivo csv
 *   formatLine: {Function}  opcional, função usada para formatar cada linha do
 *   arquivo, o padrão é separar os atributos por vírgula em um array
 *   processFile:  {Function}  opcional, função para o processamento do
 *   arquivo, o padrão é separar cada linha do arquivo por vírgula em um array
 *   e jogar todos em outro array
 *   loadend:  {Function}  opcional, função que será executada ao final do
 *   processamento do arquivo
 * }
 */
dataSet.prototype.loadFile = function(options) {
    var self = this;
    var opts = options || {};
    self.fileInfo = {};
    self._info = {};
    self.data = [];
    self.containerPlot = opts['containerPlot'] || false;
    self.lineSeparator = opts['endLineSeparator'] || "\n";
    self.attributeSeparator = opts['attributeSeparator'] || ",";
    self.formatLine = opts['formatLine'] || function (line) {
      return line.split(self.attributeSeparator)
    };
    self.processFile = opts['processFile'] || false;
    var _fnloadend = opts['loadend'] || function(){};
    var datasetName = "";
    // lib FileReaderJS
    var optsFileReaderJS = {
        readAsMap: {
            'text/*': 'Text'
        },
        readAsDefault: 'Text',
        //vazio|text|ms-excel .arff->file.type retorna vazio,
        //.csv->ms-excel no Windows
        accept: '^$|text/*|ms-excel',
        on: {
            skip: function(file){
                var ext = file.extra.extension;
                throw new Error(ext+" extension not accept\n"+file.type);
            },
            load: function(e, file){
                datasetName = "";
                var fileContent = e.target.result;
                var ext = file.extra.extension;
                try {
                    processFile(fileContent, ext);
                    self.file = file;
                    self._info.relation = datasetName.length > 0 ? datasetName
                        : file.extra.nameNoExtension;
                    if (self.containerPlot) {
                        var plotDataSet = new plot({
                            'containerPlot': self.containerPlot,
                            'title': "Dataset: " + self._info.relation
                        });
                        plotDataSet.plot2D(self.data);
                    }
                }catch(e) {
                    console.error(e);
                    self.reset(function(){console.log("### RESET ###");});
                }
            },
            loadend: _fnloadend
        }
    }

  FileReaderJS.setupInput(self.fileInput, optsFileReaderJS);
  if (self.dropZone){
    FileReaderJS.setupDrop(document.getElementById(self.dropZone),
      optsFileReaderJS);
  }

  /**
   * Função para processar o conteúdo do arquivos
   * @param  {String} fileContent conteúdo do arquivo
   * @param  {String} ext         extensão
   * @return {Array}             matriz com o conteúdo do arquivo separado em
   * linhas e colunas
   */
  function processFile(fileContent, ext){
    if (typeof(self.processFile) === 'function'){
      return self.processFile(fileContent);
    }

    switch (ext.toLowerCase()) {
      case 'arff':
        return readDotArff(fileContent);
        break;
      default:
        return readAsCSV(fileContent);
    }
  }

  function readAsCSV(fileContent){
    var data = fileContent.split(self.lineSeparator);
    if (data.length < 2) {
      var msg = "Formato de arquvo incorreto."
      +" O separador de linha deve ser '\\n'";
      alert(msg);
      throw msg;
    }
    var header = self.formatLine(data[0]);
    if (header.length < 2) {
      if (self.attributeSeparator == ",") {
        header = data[0].split(";");
        if (header.length < 2) {
          var msgSep = "Formato de arquivo incorreto. O separdor de "
          +"atributos deve ser ',' ou ';'";
          alert(msgSep);
          throw msgSep;
        }
        self.attributeSeparator = ";";
      }
    }

    self._attribute.attributes = utils.buildAttrObject(header);
    self._attribute.names = header;

    return self.toArray(fileContent);
  }

  function readDotArff (fileContent) {
    // remove os comentários do arquivo
    var file = fileContent.replace(/(^%.+|^%)/gm, "").trim();
    var dataSet = file.split(/@data/i);
    var header = dataSet[0].replace(/^(?=\n)$|^\s*|\s*$|\n\n+/gm,"")
        .split("\n");
    // espace or tab
    datasetName = header[0].split(/ |\t/gm)[1];
    var attr = header.slice(1);
    var attributes = [];
    for (var i = 0, j = attr.length; i < j; i++) {
        attributes.push(attr[i].split(/ |\t/gm)[1]);
    }

    self._attribute.attributes = utils.buildAttrObject(attributes);
    self._attribute.names = attributes;
    return self.toArray(dataSet[1], 0);
  }
};

/*
arguments[0] é o texto do arquivos
arguments[1] inicio para leitura do arquivo
retorna uma matriz com os valores dos atributos do formatLinedataset
dataArray = [
    [5.4,3.4,1.7,0.2,Iris-setosa],
    [6.3,3.3,6.0,2.5,Iris-virginica],
    [5.5,2.5,4.0,1.3,Iris-versicolor]
]
*/
dataSet.prototype.toArray = function () {

  var self = this;
  self._hasNumeric = false;
  self._hasNominal = false;
  // skip header
  var start = (arguments[1] !== undefined) ? arguments[1] : 1;
  var data = arguments[0].split(self.lineSeparator).slice(start);
  var dataArray = [];

  if (! data.length){
    throw new Error("Data empty!");
  }

  // montar array
  for (var i = 0, l = data.length; i < l; i++) {
    var strLine = data[i].trim();
    if (strLine.length) {
      var line = self.formatLine(strLine);
      dataArray.push(line);
    }
  }

  self.data = dataArray;
  self._loaded = true;
  self.statistics();

  return self;
}

/**
 * Carrega o dataset a partir de um objeto JSON, util quando se que passar o
 * conjunto de dados diretamente sem a necessidade da seleção de um arquivo
 * pelo usuário por meio de um input do tipo file.
 * @param  {Object} json Objeto na forma:
 * {
 *   data: [array com os dados],
 *   attributes: [array com os nomes dos atributos, na mesma order que no array
 *   data],
 *   relation: nome do conjunto de dados
 * }
 * @return {Object}      self
 */
dataSet.prototype.loadJSON = function (json) {

  var self = this;
  var attributes = json['attributes'];
  self._attribute.attributes = utils.buildAttrObject(attributes);
  self._attribute.names = attributes;
  self.data = json['data'];
  self._loaded = true;
  self.statistics();

  return self;
}

/**
 * Método que monta as informações do dataset, como número de atributos, tipos
 * dos atributos, frequências, médias, etc.
 * @return {Object} self
 */
dataSet.prototype.statistics = function () {
    var self = this;

    if (! self._loaded) {
        throw new Error("Empty data!");
        return false;
    }

    function isNumeric(type) {
        return type == self._attribute._ATTRIBUTE_NUMERIC;
    }

    var attributes = self._attribute.attributes;
    var data = self.data;
    var nominal = {};
    var numeric = {};
    var checkAttr = data[data.length - 1];

    var attrNames = Object.keys(attributes);
    var n = attrNames.length;
    for (var i = 0; i < n; i++) {
        var attrName = attrNames[i];
        var c = attributes[attrName]['column'];
        if (utils.isNumeric(checkAttr[c])) {
            attributes[attrName]['type'] = self._attribute._ATTRIBUTE_NUMERIC;
            numeric[attrName] = [];
        } else {
            attributes[attrName]['type'] = self._attribute._ATTRIBUTE_NOMINAL;
            nominal[attrName] = {};
        }
    }

    for (var i = 0, l = data.length; i < l; i++) {
        var line = data[i];
        for (var il = 0, jl = line.length; il < jl; il++) {
            var attrName = attrNames[il];
            var c = attributes[attrName]['column'];
            if (isNumeric(attributes[attrName]['type'])) {
                line[c] = +line[c];
                numeric[attrName].push(line[c]);
            } else {
                if (nominal[attrName][line[c]]) {
                    nominal[attrName][line[c]] += 1;
                } else {
                    nominal[attrName][line[c]] = 1;
                }
            }
        }
    }

    self._hasNominal = ! utils.isEmptyObject(nominal);
    self._hasNumeric = ! utils.isEmptyObject(numeric);

    if (self._hasNumeric) {
        var keys = Object.keys(numeric);
        var numericInformation = {};
        for (i = 0, j = keys.length; i < j; i++) {
            numericInformation[keys[i]] = utils.statistics(numeric[keys[i]]);
        }
        self._attribute.numericInfo = numericInformation;
    } else {
        self._attribute.numericInfo = {};
    }

    self._attribute.nominalInfo = self._hasNominal ? nominal : {};

    self._info.numberInstances = data.length;
    self._info.numberAttributes = n;

    self._attribute.objectAttributes = utils.ipull(attributes, "name");

    return self;
}

/**
 * Método usado para remoção de atributos do conjunto dados
 * @param  {array} column  Array com as colunas dos atributos que se deseja
 * remover
 * @param  {array} dataset Opiconal, novo dataset, se não for passado usa
 * this.data. Se for passado irá substituir os dados do this.data
 * @return {object}         self
 */
dataSet.prototype.removeAttribute = function (column, dataset) {
    var self = this;
    var newDataset, column;
    var attributes = utils.clone(self._attribute.attributes);
    var attributesNames = utils.clone(self._attribute.names);
    if (arguments.length == 1) {
        newDataset = utils.clone(self.data);
        column = arguments[0];
    } else {
        newDataset = utils.clone(arguments[1]);
        column = arguments[0];
    }

    if (column.length == 0) {
        return self;
    }

    var ld = newDataset.length;
    var lc = column.length;
    for (var i = 0; i < ld; i++) {
       for (var j = 0; j < lc; j++) {
            newDataset[i].splice(column[j] - j, 1);
        }
    }
    var newAttr = [];
    for (var j = 0; j < lc; j++) {
        attributesNames.splice(column[j] - j, 1);
    }
        console.log('attributes', attributesNames);

    attributesNames.map(function(el, id){
        newAttr.push(el.name);
    })

    self._attribute.attributes = utils.buildAttrObject(attributesNames);
    self._attribute.names = newAttr;
    self.data = newDataset;
    self.statistics();

    return self;
}

/**
 * Método para transformar atributo numérico para nominal
 * @param  {array}   col posições para modificar
 * @param  {array} fn  funções aplicadas aos valores (mesma posição de col)
 * valor default é a mediana
 * @return {Object}       this
 * as funções em fn deve retornar um valor (número) que será usado para serpara
 * os atributos
 * em atributo <= valor e atributo > valor
 * @todo alterar para aceitar funções que possam retornar mais de dois valores,
 * altualmente só divide em nos binários
 */
dataSet.prototype.numericToNominalAttribute = function (col, fn) {
    var self = this;
    var originalDataset = utils.clone(self.data);
    var column = col;
    var newDataset = utils.clone(originalDataset);

    var fnNormalize = fn || utils.median;

    var nc = column.length;
    var testCol = {};
    for (var i = 0; i < nc; i++) {
        var col = utils.getCol(originalDataset, column[i]);
        var mcol = fnNormalize(col);
        testCol[column[i]] = mcol;
    }

    //testar novos valores
    for (var l = 0, u = originalDataset.length; l < u; l++) {
        for (var i = 0; i < nc; i++) {
            var valor;
            if (originalDataset[l][column[i]] <= testCol[column[i]]) {
                valor = "<= "+testCol[column[i]];
            } else {
                valor = "> "+testCol[column[i]];
            }
            newDataset[l][column[i]] = valor;
        }
    }

    self.data = newDataset;
    self.statistics();

    return self;
}

/**
 * Troca o valor da coluna pelo valor de retorno da função correspondente
 * @param  {array} cols array com os indeces das colunas
 * @param  {array} fns  array de funções a serem aplicadas na coluna de índece
 *                      na mesma posição de cols
 * @return {Object}     self
 */
dataSet.prototype.replaceAttribute = function (cols, fns) {
    var self = this;
    var newDataset = [];
    var column, fn, originalDataset;
    if (arguments.length < 2) {
        throw new Error("Invalid number of parameters.");
    }

    originalDataset = utils.clone(self.data);
    column = cols;
    fn = fns;

    for (var l = 0, u = originalDataset.length; l < u; l++) {
        var columnValue = originalDataset[l];
        for (c = 0, d = column.length; c < d; c++) {
            columnValue[column[c]] = fn[c](originalDataset[l][column[c]]);
        }
        newDataset.push(columnValue);
    }

    self.data = newDataset;
    self.statistics();

    return self;
}

/**
 * Divide o conjunto de dados carregado em r partes para cross validation
 * @param  {integer} r número de partes para dividir os dados
 * @return {array}   array de objetos na forma
 * [{
 *     train: dados para treino,
 *     test: dados para teste
 * }]
 */
dataSet.prototype.rFold = function(r) {
  var self = this;
  var array = utils.clone(self.data);
  array = utils.shuffle(array);
  var fold = r;
  var temparray = [],chunk = Math.ceil(array.length / r);
  for (var i=0,j=array.length; i<j; i+=chunk) {
    temparray.push(array.slice(i,i+chunk));
  }

  var data = [];
  for (var k = 0; k < fold; k++) {
    var train = [];
    for (var i = 0; i < fold; i++) {
      if (i == k) continue;
      train.push.apply(train, temparray[i]);
    }

    var rFold = {
      train: train,
      test: temparray[k],
    }

    data.push(rFold);
  }

  return data;
};

/**
 * Verifica se o atributo passado é do tipo numerico
 * @param  {Object}  attr Atributo a ser verificado
 * @return {Boolean}      Verdadeiro se o atribudo for do tipo numerico
 */
dataSet.prototype.isAttrNumeric = function(attr) {
    var self = this;
    return attr.type == self._attribute._ATTRIBUTE_NUMERIC;
}

/**
 * Formata os dados para a forma de objeto
 * @return {array} array onde cada posição é um objeto da forma:
 *
 * {
 *   sepallength: 5.1,
 *   sepalwidth: 3.5,
 *   petallength: 1.4,
 *   petalwidth0.2
 *  }
 *  que é a forma necessária para a função plot.scatterPlotMatrix
 */
dataSet.prototype.toObject = function(onlyNumeric) {
  var self = this;
  var names  = self._attribute.names;
  var onlyNum = utils.isSet(onlyNumeric, true);
  var data = [];
  var dt = self.data;
  var ld = dt.length;
  var ln = names.length;
  var attributes = self._attribute.attributes;
  var label = names[ln - 1];

  for (var i = 0; i < ld; i++) {
    var line = {};
    for (var j = 0; j < ln; j++) {
      var _key = names[j];
      var attr = attributes[_key];
      var bIsNum = self.isAttrNumeric(attr);
      if (onlyNum && ! bIsNum) continue;
      line[_key] = bIsNum ? +dt[i][attr['column']] : dt[i][attr['column']];
    }
    line[label] = dt[i][attr['column']];
    data.push(line);
  }

  return data;
};