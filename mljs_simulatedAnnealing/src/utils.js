var utils = {
    math: {
        //L2
        euclidean: function(x1, x2) {
            var i;
            var distance = 0;

            if (x1.length != x2.length){
              console.log('x1 x2 ' , x1, x2);
              throw new Error("Euclidean: Non equal lengths");
            }
            for(var i=0, l=x1.length; i<l; i++) {
                var dx = ((+x1[i]) - (+x2[i]));
                distance += (dx * dx);
            }
            return Math.sqrt(distance);
        },
        manhattan: function(x1, x2) {
          var l = x1.length;
          var distance = 0;
          if (l != x2.length){
            console.log('x1 x2 ' , x1, x2);
            throw new Error("Manhattan: Non equal lengths");
          }
          for(var i=0, l=x1.length; i<l; i++) {
            var dx = Math.abs((+x1[i]) - (+x2[i]));
            distance += dx;
          }
          return distance;
        },
        hamming: function(x1, x2) {
          var l = x1.length;
          var distance = 0;
          if (l != x2.length){
            console.log('x1 x2 ' , x1, x2);
            throw new Error("Hamming: Non equal lengths");
          }
          for(var i=0; i<l; i++) {
            var dx = x1[i] === x2[i] ? 0 : 1;
            distance += dx;
          }
          return distance;
        },
        randInt: function(min, max) {
            var rand = Math.random() * (max - min + 0.9999) + min
            return Math.floor(rand);
        }
    },
    getDistanceFunction: function(options){
        if(typeof(options) === 'undefined') {
            return utils.math.euclidean;
        } else if (typeof(options) === 'function') {
            return options;
        } else if (typeof utils.math[options] === 'function') {
          return utils.math[options];
        }
        throw Error("Undefined distance function");
    },
    in_array: function(needle, haystack, argStrict) {
      // http://phpjs.org/functions/in_array/
      var key = '',
        strict = !!argStrict;

      if (strict) {
        for (key in haystack) {
          if (haystack[key] === needle) {
            return true;
          }
        }
      } else {
        for (key in haystack) {
          if (haystack[key] == needle) {
            return true;
          }
        }
      }

      return false;
    },
    array_rand: function(input, num_req) {
      // original by: http://phpjs.org/functions/array_rand/
      var indexes = [];
      if (typeof num_req === 'undefined' || num_req === null) {
	    num_req = 1
	  } else {
	    num_req = +num_req
	  }

	  if (isNaN(num_req) || num_req < 1 || num_req > input.length) {
	    return null
	  }
      var ticks = num_req;
      var checkDuplicate = function(input, value) {
        var exist = false,
          index = 0,
          il = input.length;
        while (index < il) {
          if (input[index] === value) {
            exist = true;
            break;
          }
          index++;
        }
        return exist;
      };

      if (Object.prototype.toString.call(input) === '[object Array]'
            && ticks <= input.length) {
        while (true) {
          var rand = Math.floor((Math.random() * input.length));
          if (indexes.length === ticks) {
            break;
          }
          if (!checkDuplicate(indexes, rand)) {
            indexes.push(rand);
          }
        }
      } else {
        indexes = null;
      }

      return indexes;
    },
    cloneObject: function(obj) {
        // http://heyjavascript.com/4-creative-ways-to-clone-objects/
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        // give temp the original obj's constructor
        var temp = obj.constructor();
        for (var key in obj) {
            temp[key] = utils.cloneObject(obj[key]);
        }
        return temp;
    },
    isArray: function(arg){
        /*https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/
        Global_Objects/Array/isArray*/
        if (!Array.isArray) {
            return Object.prototype.toString.call(arg) === '[object Array]';
        }
        return Array.isArray(arg);
    },
    extend: function(destination, source) {
        "use strict";
        for (var property in source) {
            if (source[property] && source[property].constructor &&
                source[property].constructor === Object) {
                destination[property] = destination[property] || {};
                arguments.callee(destination[property], source[property]);
            }
            else {
                destination[property] = source[property];
            }
        }
        return destination;
    },
    /**
     * Função para embaralhar os elemento de um array
     * @param  {Array} arr array a ser embaralhado
     * @return {Array}     array embaralhado
     */
    shuffle: function(arr){
      var o = [];
      for(var i=0;i<arr.length;i++)
          o.push(arr[i]); // deep copy
      for(var j, x, i = o.length; i; j = parseInt(Math.random() * i),
        x = o[--i], o[i] = o[j], o[j] = x);
      return o;
    },
    holdout: function(data, split) {

    	var copy = utils.clone(data);
      var dataset = utils.shuffle(copy);
      var dataLenght = dataset.length;
      var nTrain;
      var nTrainStart;
      var _split = +split;
      if (_split > 0 ) {
        if (_split < 100) {
          nTrainStart = Math.ceil(dataLenght * (split / 100));
          nTestStart = nTrainStart;
        } else {
          nTestStart = 0;
          nTrainStart = dataLenght;
        }

        var trainData = dataset.slice(0, nTrainStart);
        var testData = dataset.slice(nTestStart, dataLenght);

      } else {
        nTrain = Math.ceil(dataLenght / 3) * 2;
        var trainData = dataset.slice(0, nTrain);
        var testData = dataset.slice(nTrain, dataLenght);
      }
      return {
        train : trainData,
        test  : testData
      }
    },
    getFrequency: function (arr, key) {
        var frequency = {};
        var key = key || "class";
        var data = arr.slice(0);

        data.forEach(function(value) {
            if (!frequency[value[key]]) {
                frequency[value[key]] = 0;
            }
            frequency[value[key]]++;
        });

        return frequency;
    },
    // # [median](http://en.wikipedia.org/wiki/Median)
    median: function(x) {
        if (x.length === 0) return null;
        var sorted = x.slice().sort(function (a, b) { return a - b; });
        if (sorted.length % 2 === 1) {
            return sorted[(sorted.length - 1) / 2];
        } else {
            var a = sorted[(sorted.length / 2) - 1];
            var b = sorted[(sorted.length / 2)];
            return (a + b) / 2;
        }
    },
    /**
     * Função que retorna uma coluna de uma matriz passada
     * @param  {Array} matrix matriz
     * @param  {Number} col    índice da coluna que deseja obter
     * @return {Array}        array com valores da coluna
     */
    getCol: function (matrix, col){
       var column = [];
       for(var i=0; i<matrix.length; i++){
          column.push(+matrix[i][col]);
       }
       return column;
    },
    /**
     * remove uma coluna da matriz passada
     * @param  {array} matrix dados
     * @param  {integer} col    índice da coluna a ser removida
     * @return {array}        cópia de matrix sem a coluna especificada
     */
    removeCol: function (matrix, col){
       var column = [];
       var copyData = utils.clone(matrix);

       for(var i=0; i<copyData.length; i++){
       		copyData[i].splice(col, 1)
       }
       return copyData;
    },
    // http://stackoverflow.com/questions/728360/most-elegant-way-to-clone-a-
    //  javascript-object?page=1&tab=votes#tab-top
    clone: function (obj) {
      var copy;
      // Handle the 3 simple types, and null or undefined
      if (null == obj || "object" != typeof obj) return obj;
      // Handle Date
      if (obj instanceof Date) {
          copy = new Date();
          copy.setTime(obj.getTime());
          return copy;
      }
      // Handle Array
      if (obj instanceof Array) {
          copy = [];
          for (var i = 0, len = obj.length; i < len; i++) {
              copy[i] = utils.clone(obj[i]);
          }
          return copy;
      }
      // Handle Object
      if (obj instanceof Object) {
          copy = {};
          for (var attr in obj) {
              if (obj.hasOwnProperty(attr)) copy[attr] = utils.clone(obj[attr]);
          }
          return copy;
      }
      throw new Error("Unable to copy obj! Its type isn't supported.");
  },
  /**
   * Função para calcular a média aritimética de uma conjunto de valores
   * @param  {array} values conjunto de dados
   * @return {number}     média aritmética
   * https://derickbailey.com/2014/09/21/calculating-standard-deviation-with-
   * array-map-and-array-reduce-in-javascript/
   */
  average: function (values) {
    var sum = values.reduce(function(a, b) {
      return (+a) + (+b);
    });

    return sum / values.length;
  },
  /**
   * Função para calcular o desvio padrão de um conjunto de valores
   * @param  {array} values valores para calcalar o desvio padrão
   * @return {number}        desvio padrão do conjunto de valores
   */
  standardDeviation: function(values){
    var variance = utils.variance(values)
    return Math.sqrt(variance);
  },
  /**
   * Funçao para calcular a variância de um conjunto de valores
   * @param  {array} values conjunto de valores
   * @return {number}     variância
   */
  variance: function(values) {
    var avg = utils.average(values);
    var squareDiffs = values.reduce(function(sum, value){
      var diff = value - avg;
      var sqrDiff = diff * diff;
      return sum + sqrDiff;
    }, 0);

    return squareDiffs/values.length;
  },
  /**
   * Função para verificar se um valor é número
   * @param  {mix}  obj valor
   * @return {Boolean}     se é número
   */
  isNumeric: function( obj ) {
    return !utils.isArray( obj ) && (obj - parseFloat( obj ) + 1) >= 0;
  },
  /**
   * Função para verificar se um valor é uma função
   * @param  {mix}  arg valor
   * @return {Boolean}     se é função
   */
  isFunction: function(arg) {
    return toString.call(arg) === '[object Function]';
  },
  /**
   * retorna a extensão do array passado
   * @param  {array} array  calcular a extensão
   * @return {array}       [min, max]
   */
  arrayExtent: function(array) {
    var arr = array.slice().sort(function (a, b) {
      return a - b;
    });
    return [arr[0], arr[arr.length - 1]];
  },
  /**
   * Função para verificar se um objeto é vazio
   * @param  {object}  obj objeto
   * @return {Boolean}     se é vazio
   */
  isEmptyObject: function( obj ) {
    var name;
    for ( name in obj ) {
      return false;
    }
    return true;
  },
  /**
   * Função para que retorna minimo, maximo, mediana e media do conjunto de um
   * valores
   * @param  {array} array conjunto de valores para calcular as métricas
   * @return {Object}       {min,max,avg,median}
   */
  statistics: function(array) {
    var extent = utils.arrayExtent(array);
    var meanValue = utils.average(array);
    var medianValue = utils.median(array);
    var stdDevValue = utils.standardDeviation(array);
    var statisticsValues = {
      min: extent[0],
      max: extent[1],
      average: meanValue,
      median: medianValue,
      stdDev: stdDevValue
    }

    return statisticsValues;
  },
  /**
   * Função auxiliar para GUI, constrói um objeto chave valor a partir de um
   * array
   * @param  {array} attr valores
   * @return {object}      objeto na forma {column: index, name: elem}
   */
  buildHeader: function(attr) {
    return attr.map(function(elem, index) {
        return {column: index, name: elem};
    });
  },
  /**
   * Constrói um array de objetos a partir do array passado
   * @param  {array} attr lista de nomes ex.: ["a", "b", "c"]
   * @return {array}      array de objetos na forma
   * [
   *   {
   *     "a": {
   *       column: 0,
   *       name: "a"
   *     }
   *   },{
   *     "b": {
   *       column: 1,
   *       name: "b"
   *     }
   *   },{
   *     "c": {
   *       column: 2,
   *       name: "c"
   *     }
   *   }
   *  ]
   */
  buildAttrObject: function(attr) {
    var oAttr = {};
    for (var i = 0, n = attr.length; i < n; i++) {
      oAttr[attr[i]] = {
        column: i, name: attr[i]
      }
    }
    return oAttr;
  },
  /**
   * Agrupa os objetos passados por uma chave
   * @param  {array} arr array de objetos
   * @param  {string} key chave para o agrupamento
   * @param  {mix} ignoreValue valor da chave a ser ignorado no agrupamento
   * @return {array}     array de objetos, cada posição contém os objetos
   * da chave de agrupamento
   */
  arrayGroupBy: function(arr, key, ignoreValue) {
    var group = {},
        n = arr.length;
    for (var i = 0; i < n; i++) {
      var id = arr[i][key];
      if (ignoreValue && ignoreValue === id) continue;
      if (group[id] !== undefined) {
        group[id].push(arr[i]);
      } else {
        group[id] = [arr[i]];
      }
    }

    return group;
  },
  /**
   * Método para gerar uma string aleatória
   * @param  {number} length tamanho da nova string
   * @return {string}        nova string gerada
   */
  uniqid: function(length) {
    length = length || 7;
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
          +"0123456789";
    for( var i=0; i < length; i++ ){
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  },
  isSet: function (value, defaultValue) {
  	return (value !== undefined) ? value : defaultValue;
  },
  ipull: function (arr, key) {
  	var copy = utils.clone(arr);
  	var pull = {};

  	for (var i = 0, j = copy.length; i < j; i++) {
  		pull[copy[i][key]] = copy[i];
  	}

  	return pull;
  },
  /**
   * Método para escalar valore de um array passado
   * @param  {array} arr array para escalar
   * @param  {number} min limite inferior
   * @param  {number} max limite superior
   * @return {array}     array escalonado
   */
  minMaxScalling: function(arr, min, max) {
    var min = min || 0;
    var max = max || 1;
    var extent = utils.arrayExtent(arr);
    var Min = extent[0];
    var Max = extent[1];
    var n = arr.length;
    var scalled = [];
    for (var i = 0; i < n; i++) {
      var x = min + ((arr[i] - Min) / (Max - Min)) * (max - min);
      scalled.push(x);
    }
    return scalled;
  },
  /**
   * Método para fixar número de casas decimais de um valor
   * @param  {number} value valor para fixar
   * @param  {number} d     número de casas decimais
   * @return {number}       número com casas dedimais fixadas
   */
  fixedValue: function(value, d) {
    var fixed = d || 2;

    //se contem <= ou > atributo numerico
    if (/<=|>/g.test(value)) {
      var v = value.split(" ");
      var n = +v[1];
      return v[0]+" "+ n.toFixed(fixed);
    }

    return value;
  },
  /**
   * Completa as chaves faltando em ftest com as de ftotal
   * @param  {Object} ftest  objeto a completar
   * @param  {Object} ftotal objeto completo
   * @return {Object}        objeto com todas as chaves
   */
  completeFrequency: function(ftest, ftotal) {
      var keysTotal = Object.keys(ftotal);
      var tfrequency = {};
      for (var i = 0, j = keysTotal.length; i < j; i++) {
          var key = keysTotal[i];
          tfrequency[key] = ! ftest[key] ? 0 : ftest[key];
      }

      return tfrequency;
  },
  /**
   * Retorna uma string (linha para tabela) onde cada colunas são os
   * argumentos passados
   */
  addTR: function() {
      var args = Array.prototype.slice.call(arguments);
      return "<tr><td>" + args.join("</td><td>") + "</td></tr>";
  },
  /**
   * Retorna uma string (linha para tabela) na forma de cabeçalho, cada
   * coluna são os argumentos passados
   */
  addThead: function() {
      var args = Array.prototype.slice.call(arguments);
      return "<thead><tr><th>" + args.join("</th><th>")
          + "</th></tr></thead>";
  }

}

window.$dom = function(selector) {
    var selectorType = 'querySelectorAll';

    if (selector.indexOf('#') === 0) {
        selectorType = 'getElementById';
        selector = selector.substr(1, selector.length);
    }

    return document[selectorType](selector);
};

/*http://stackoverflow.com/questions/3076679/javascript-event-registering-
without-using-jquery*/
function addEvent(el, eventType, handler) {
  if (el.addEventListener) { // DOM Level 2 browsers
    el.addEventListener(eventType, handler, false);
  } else if (el.attachEvent) { // IE <= 8
    el.attachEvent('on' + eventType, handler);
  } else { // ancient browsers
    el['on' + eventType] = handler;
  }
}

/**
 * Objeto que representa um elemento cluster
 * @param  {array} attr atributos do registro
 * @param  {string} c    classe|cluster
 * @param  {integer} idx  índice do registro no dataset original
 * @return {Object}      self
 */
function clusterInstance (attr, c, idx) {
    var self = this;
    var attributes = attr || [];
    var formatedAttr = [];
    for (var i = 0, j = attributes.length; i < j; i++) {
        if (utils.isNumeric(attributes[i])) {
            formatedAttr.push(+attributes[i]);
        } else {
            formatedAttr.push(attributes[i]);
        }
    }

    self.attributes = formatedAttr;
    self.cluster = c || -1;
    self.index = idx || 0;
    return self;
}

/**
 * Classe para modelos de agrupamento
 */
function Clusterer() {
  var self = this;
  //http://weka.sourceforge.net/doc.dev/weka/clusterers/Clusterer.html
  self.normalize = true;
  return self;
}

/**
 * Método para retornar informações sobre os cluster do agrupamento resultante
 * @return {Array} array de objetos com size, label e psize(%)
 */
Clusterer.prototype.getClustersInfo = function() {
  var self = this;
  var clusters = utils.arrayGroupBy(self.clusters, 'cluster');
  var labelsClusters = Object.keys(clusters);
  var qtdGroups = self.clusters.length;
  var info = [];

  for (var i = 0, len = labelsClusters.length; i < len; i++){
    var currGroup = clusters[labelsClusters[i]];
    var label = labelsClusters[i] == -1 ? 'Noise' : labelsClusters[i];
    var percent = (currGroup.length * 100 / qtdGroups).toFixed(2) + '%';
    info.push({
          'size': currGroup.length,
          'label': label,
          'psize': percent
        });
  }

  return info;
}

/**
 * Método usado para escrever no console do navegar resultados do agrupamento
 */
Clusterer.prototype.logClusters = function () {
  var self = this;
  var qtdGroups = self.clusters.length;

  var groups = utils.arrayGroupBy(self.clusters, 'cluster');
  var labelsClusters = Object.keys(groups);

  console.log("Clusters resulting");

  for (var i = 0, len = labelsClusters.length; i < len; i++){
    var currGroup = groups[labelsClusters[i]];
    var label = labelsClusters[i] == -1 ? 'Noise' : labelsClusters[i];
    var percent = (currGroup.length * 100 / qtdGroups).toFixed(2) + '%';
    console.log('Cluster ', label, ' #instances ', currGroup.length, ' ', percent);
  }

  console.log('Total instances ', qtdGroups);
}

/**
 * Método usado para formatar o dataset
 * @param  {array} dataset matriz de dados
 * @return {array}         matriz onde cada elemento é uma instância de
 * clusterInstance
 */
Clusterer.prototype._formatDataset = function (dataset) {

  if (dataset === undefined){
    throw new Error("No dataset selected");
  }
  var n = dataset.length;
  var instaces = [];
  for (var i = 0; i < n; i++) {
    var inst = new clusterInstance(dataset[i], -1, i);
    instaces.push(inst);
  }
  return instaces;
}

/**
 * Méotodo para calcular a SSBTotal do agrupamento
 * @return {number} valor da SSBTotal
 */
Clusterer.prototype.getSSBTotal = function () {
  var self = this;
  var groups = utils.arrayGroupBy(self.clusters, 'cluster', -1);
  var SSBTotal = 0;
  var labelsClusters = Object.keys(groups);
  var _qtdCluster = self.K || labelsClusters.length;
  var dist = self.distance;
  var _centroids = self.centroids || getCentroids(groups);
  var cMain = getMainCentroid(self.data);
  var m_squaredErrors = [];

  if (_qtdCluster == 0) {
    return "Empty clusters";
  }

  for (var i = 0; i < _qtdCluster; i++) {
    var d = dist(_centroids[labelsClusters[i]], cMain);
    var mi = groups[labelsClusters[i]].length;
    squaredError = (mi * (d*d));
    SSBTotal += squaredError;
    m_squaredErrors.push(squaredError);
  }

  if (self.normalize) {
    var m = utils.minMaxScalling(m_squaredErrors);
    SSBTotal = m.reduce(function(a, b){ return a + b});
  }

  // console.log('groups ' , groups);
  return SSBTotal;

  /**
   * Método para calcular o centroíde de um conjuto de pontos
   * @param  {Array} data Conjunto de pontos
   * @return {Array}      Array com coordenadas do centroíde
   */
  function getMainCentroid(data) {
    var n = data.length;
    var d = data[0]['attributes'].length;
    var c = new Array(d);

    for (var i = 0; i < n; i++) {
      var attr = data[i]['attributes'];
      for (var j = 0; j < d; j++) {
        c[j] = (c[j] === undefined) ? attr[j] : (c[j] + attr[j]);
      }
    }

    c = c.map(function(i){return i/n});
    return c;
  }
  /**
   * Método para calcular o centroíde de cada grupo passado
   * @param  {Array} groups Conjunto de grupos
   * @return {Array}        Centroídes de cada grupo
   */
  function getCentroids(groups) {
    var centroids = [];
    for (var i = 0; i < _qtdCluster; i++) {
      centroids[labelsClusters[i]] = getMainCentroid(groups[labelsClusters[i]]);
    }
    return centroids;
  }
}

/**
 * Classe que representa uma instância do dataset para os modelos de
 * classificação
 * @param  {array} attr       array de atributos
 * @param  {number|string} classIndex posição onde se encontro a classe em attr
 * @param  {number} idx        índice da instância no dataset original
 * @return {Object}            self
 */
function classifierInstance (attr, classIndex, idx) {
    var self = this;

    var formatedAttr = [];

    var label = attr.splice(classIndex, 1);

    for (var i = 0, j = attr.length; i < j; i++) {
        if (utils.isNumeric(attr[i])) {
            formatedAttr.push(+attr[i]);
        } else {
            formatedAttr.push(attr[i]);
        }
    }

    self.attributes = formatedAttr;
    self.class = label[0];
    self.index = idx || 0;
    return self;
}

/**
 * Classe onde são adicinados os métodos em comum para os classificadores
 */
function Classifier() {}

/**
 * Método usado para formatar o dataset para uso dos modelos de classificação
 * @param  {array} dataset    array (matriz) com as instâncias do dataset
 * @param  {number|string} classIndex índice da classe
 * @return {array}            array com os dataset formatado
 */
Classifier.prototype._formatDataset = function (dataset, classIndex) {

	if (dataset === undefined || dataset.length == 0){
    throw new Error("No dataset selected");
  }
  var n = dataset.length;
  var copyDataset = utils.clone(dataset);
  var cidx = classIndex || copyDataset[0].length - 1;
  var instaces = [];
  for (var i = 0; i < n; i++) {
    var inst = new classifierInstance(copyDataset[i], cidx, i);
    instaces.push(inst);
  }
  return instaces;
}

/**
 * calcula o intervalo de confiança
 * @param  {number} N   número de registros de teste
 * @param  {number} acc valor da acurácia %
 * @param  {number} Z   valor da distribuição Z correspondente ao nível de
 *  confiança
 * @return {array}     limite inferior e superior do intervalo de confinaça
 */
function confidenceInterval(N, acc, Z) {
  var _acc = acc/100;
  var i = (2 * N * _acc + (Z*Z) + Z * Math.sqrt((Z*Z) + (4*N*_acc) -
        (4*N*(_acc*_acc)))) / (2*(N+(Z*Z)));

  var j = (2 * N * _acc + (Z*Z) - Z * Math.sqrt((Z*Z) + (4*N*_acc) -
        (4*N*(_acc*_acc)))) / (2*(N+(Z*Z)));

  return [j,i];
}

/**
 * Classe para validação cruzada
 * @param  {number} folds número de partições
 * @return {object}       self
 */
function crossValidation(folds) {
  var self = this;
  self.folds = folds || 10;
  self.results = [];
  self.resultData = [];
  return self;
}

/**
 * Método que implementa a validação cruzada
 * @param  {string} modelType modelo que seja usado na validação kNN ou ID3
 * @param  {object} dataset   Objeto da classe dataSet
 * @return {object}           Objeto ConfusionMatrix do melhor resultado obtido
 */
crossValidation.prototype.run = function (modelType, dataset) {
  var self = this;
  var folds = self.folds;
  var rfolds = dataset.rFold(folds);
  var results = [];
  var resultData = [];
  var n = rfolds.length;

  for (var y = 0; y < n; y++) {
    updateFold(rfolds[y], y);
  }

  results.sort(function(a, b) {
    return b.accuracy - a.accuracy;
  });

  self.results = results;
  self.bestResult = results[0].fold;

  if (resultData.length > 0 ) {
    self.resultData = resultData;
  }

  return results[0];

  /**
   * Método que executa a classificação para os dados passado
   * @param  {Object} dataFold Objecto contendo os dados de teste e treino
   * @param  {number} i        número da iteração atual
   * @return {void}          Atuliza as váriaveis results e resultData
   */
  function updateFold(dataFold, i) {
    attributes = dataset._attribute.names;

    var trainData = dataFold.train;
    var testData = dataFold.test;

    var model;

    switch (modelType.toLowerCase()) {
      case 'knn':
        model = new kNN();
        break;
      case 'id3':
        model = new ID3();
        break;
      default:
        throw 'Undefined classify';
    }

    var confusionMatrix = model.buildClassifier({
        data: trainData,
        test: testData,
        attributesNames: attributes
    });

    confusionMatrix.fold = i;
    results.push(confusionMatrix);

    if (model instanceof ID3) {
      resultData.push(model.getTree());
    } else {
      resultData.push(model.resultData);
    }
  }
}

/**
 * Retorna os dados do melhor resultado obtido pelo classificador
 * @param  {number} i Número da iteração, opcional se não for passado retorna
 * a melhor iteração
 * @return {Object}   Dados para plot do resultado do modelo
 */
crossValidation.prototype.getDataResult = function(i) {
  var self = this;

  if (self.resultData.length == 0) {
    throw Error("Model is not has result data");
  }

  return self.resultData[i || self.bestResult];
}

/**
 * Método que retorna uma string (table) com as médias obitidas pelo modelo em
 * cada iteração da validação cruzada, ao final trás a média geral das iterações
 * @return {string} tabela html com as médias
 */
crossValidation.prototype.getDetails = function() {
  var self = this;
  var results = self.results;
  var n = results.length;
  if (n == 0) {
    throw Error("Empty data");
  }

  var avgTable = "<table class='table table-hover'><thead><th>Partição</th>"
    +"<th>Acurácia</th><th>Prec</th><th>Recall</th><th>F-Measure</th></thead><tbody>";
  var fixed = results[0].fixed;
  var l = results[0].metricsMatrix.length;
  var sumPrec = 0, sumRec = 0, sumFm = 0, sumAcc = 0;
  for (var i = 0; i < n; i++) {
    var avgTr = results[i].metricsMatrix[l-1];
    var tr = [
      (i+1),
      results[i].accuracy.toFixed(fixed),
      avgTr[1].toFixed(fixed),
      avgTr[2].toFixed(fixed),
      avgTr[3].toFixed(fixed)];
      sumPrec += avgTr[1];
      sumRec += avgTr[2];
      sumFm += avgTr[3];
      sumAcc += results[i].accuracy;

    avgTable += utils.addTR.apply(this, tr);
  }
  var avg = [
    "Média",
    (sumAcc/n).toFixed(fixed),
    (sumPrec/n).toFixed(fixed),
    (sumRec/n).toFixed(fixed),
    (sumFm/n).toFixed(fixed)
    ];

  avgTable += utils.addTR.apply(this, avg);
  avgTable += "</tbody></table>";

  return avgTable;
}