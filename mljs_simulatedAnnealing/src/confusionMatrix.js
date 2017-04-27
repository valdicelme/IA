/**
 * Classe que implementa a matriz de confusão
 * @param {array} labels Classes do conjunto de dados
 */
function ConfusionMatrix(labels) {
    var self = this;
    self.labels = labels;
    self.matrix = _initMatrix(labels);
    self.isBinary = labels.length == 2;
    self.totalExamples = 0;
    self.unClassified = 0;
    self.fixed = 3;
    self.frequency = {};

    /**
     * Inicializa a matriz de confusão com as classes passadas
     * @param  {array} labels Classes do conjunto de dados
     * @return {object}        Objeto que representa a matrix confusão
     */
    function _initMatrix (labels) {
        var matrix = new Object();
        var labelsLength = labels.length;
        for (i = 0; i < labelsLength; i++){
            matrix[labels[i]] = new Object();
            for (k = 0; k < labelsLength; k++){
                matrix[labels[i]][labels[k]] = 0;
            }
        }
        return matrix;
    }


    self.regionalOptions = {
        'en': {
            'totalInstances': 'Total Number of Instances',
            'totalCorrectlyClassified': 'Correctly Classified Instances',
            'totalIncorrectlyClassified': 'Incorrectly Classified Instances',
            'totalUnClassified': 'UnClassified Instances',
            'acc': 'Accuracy',
            'prec': 'Precision',
            'rec': 'Recall',
            'fm': 'F-Measure',
            'firstThTd': 'Classified as',
            'titleDetail': 'Detailed by Class',
            'titleCM': 'Confusion Matrix',
            'labelClass': 'Class',
            'labelWAvg': 'Weighted Avg.',
        },
        'pt': {
            'totalInstances': 'Total instâncias de teste',
            'totalCorrectlyClassified': 'Instâncias corretamente classificadas',
            'totalIncorrectlyClassified': 'Instâncias incorretamente classificadas',
            'totalUnClassified': 'Instâncias não classificadas',
            'acc': 'Accurácia',
            'prec': 'Precisão',
            'rec': 'Sensibilidade',
            'fm': 'Medida-F',
            'firstThTd': 'Real/Classificado',
            'titleDetail': 'Detalhe por classe',
            'titleCM': 'Matriz de confusão',
            'labelClass': 'Classe',
            'labelWAvg': 'Média pond.',
        }
    }

    self.language = 'pt';

    return self;
}

/**
 * Método para configurar a linguagem ou valores de nomes separados
 * @param {String} lang   prefixo da linguagem pt|en
 * @param {Object} values objeto chave:valor para os nomes
 */
ConfusionMatrix.prototype.setLanguage = function(lang, values) {
    var self = this;
    var regional = self.regionalOptions;

    if (values !== undefined) {
        if (regional[lang]) {
            utils.extend(regional[lang], values);
        } else {
            regional[lang] = values;
        }
    }

    if (regional[lang] === undefined) {
        throw "Undefined language. Try " + Object.keys(regional).join(', ');
    }

    self.language = lang;
    return self;
}

/**
 * Método para imprimir os valores dos textos de regionalOptions, apenas para
 * debug
 */
ConfusionMatrix.prototype.__testLanguage__ = function() {
    var self = this;
    var regional = self.regionalOptions[self.language];
    console.log('language ' , self.language);
    for (x in regional) {
        console.log(x, ': ', regional[x]);
    }
}

/**
 * Método para setar o valor de casas decimais para os valores retornados como
 * string
 * @param {number} decimal número de casas decimais, valor padrão é 3
 */
ConfusionMatrix.prototype.setFixedDecimal = function (decimal) {
    var self = this;
    self.fixed = decimal;
    return self;
}

/**
 * Método responsável por fazer os cálculos e preencher os valores das
 * variáveis das métricas recall, precision, fMeasure, TP, FP, FN (por classe),
 * accuracy, correctClassifications, incorrectClassifications, totalExamples
 * @return {Object} self
 */
ConfusionMatrix.prototype.calculate = function () {
    var self = this;
    var labels = self.labels;
    var n = labels.length;
    var _w = arguments[0] || 1;
    var totalExamples = 0;
    var m = self.matrix;
    var correctClassifications = 0;
    var frequency = self.frequency;
    var regional = self.regionalOptions[self.language];
    var M = {};

    for (var i = 0; i < n; i++) {
        M[labels[i]] = {};
        M[labels[i]]['TP'] = 0;
        M[labels[i]]['FP'] = 0;
        M[labels[i]]['FN'] = 0;
    }

    /*
    True positive: diagonal principal.
    False positive: soma da coluna x menos a diagonal principal.
    False negative: soma da linha x menos a diagonal principal.
    */
    for (var i = 0; i < n; i++) {
        for (var j = 0; j < n; j++) {
            totalExamples += m[labels[i]][labels[j]];
            if (i == j) {
                correctClassifications += m[labels[i]][labels[i]];
                M[labels[i]]['TP'] += m[labels[i]][labels[i]];
            }
            M[labels[i]]['FN'] += m[labels[i]][labels[j]];
            M[labels[i]]['FP'] += m[labels[j]][labels[i]];
        }
        M[labels[i]]['FP'] -= m[labels[i]][labels[i]];
        M[labels[i]]['FN'] -= m[labels[i]][labels[i]];
    }

    var avgMetrics = [];
    var avgPrec = 0, avgRec = 0, avgF = 0;

    for (var i = 0; i < n; i++) {
        var k = labels[i];
        M[k]['recall'] = M[k]['TP'] /
            (M[k]['TP'] + M[k]['FN']);
        M[k]['precision'] = M[k]['TP'] /
            (M[k]['TP'] + M[k]['FP']);
        M[k]['fMeasure'] = ((_w + 1) * M[k]['recall'] *
                M[k]['precision']) / (M[k]['recall'] +
                    (_w * M[k]['precision']));

        M[k]['recall'] = ! isNaN(M[k]['recall'])
            ? M[k]['recall'] : 0;
        M[k]['precision'] = ! isNaN(M[k]['precision'])
            ? M[k]['precision'] : 0;
        M[k]['fMeasure'] = ! isNaN(M[k]['fMeasure'])
            ? M[k]['fMeasure'] : 0;

        avgPrec += M[k]['precision'] * (frequency[k] || 1);
        avgRec += M[k]['recall'] * (frequency[k] || 1);
        avgF += M[k]['fMeasure'] * (frequency[k] || 1);

        var tr = [k, M[k]['precision'], M[k]['recall'], M[k]['fMeasure']];
        avgMetrics.push(tr);
    }

    self.totalExamples = totalExamples + self.unClassified;
    self.correctClassifications = correctClassifications;
    self.incorrectClassifications = totalExamples - correctClassifications;
    self.accuracy = correctClassifications / totalExamples;
    self.metrics = M;

    var avgTR = [regional['labelWAvg'], avgPrec/totalExamples,
        avgRec/totalExamples, avgF/totalExamples];
    avgMetrics.push(avgTR);

    self.metricsMatrix = avgMetrics;

    return self;
}

/**
 * Método que retorna uma string contendo o html com a tabela da matriz de
 * confusão, detalhes das métricas precisão, recall e medida por classe,
 * acurária obitida pelo modelo, número de instâcias classificadas
 * correntamente, incorretamente e não classificadas, total instâcias de teste.
 * Os textos podem ser mudados usando o método setLanguage.
 * @return {string} Resultados obitidos pelo modelo
 */
ConfusionMatrix.prototype.toString = function() {
    var self = this;
    var strTable;
    var matrix = self.matrix;
    var frequency = self.frequency;

    var regional = self.regionalOptions[self.language];

    var n = self.labels.length;
    var labels = self.labels;
    var M = self.metrics;
    var totalNumberInstances = self.correctClassifications +
        self.incorrectClassifications + self.unClassified;
    var avgTable = "<table class='table table-hover'>";
    var avgMetrics = self.metricsMatrix;
    var firstTR = [regional['labelClass'], regional['prec'], regional['rec'],
        regional['fm']];
    avgTable += addThead.apply(this, firstTR) + "<tbody>";

    for (var i = 0; i < n+1; i++) {
        var tr = [avgMetrics[i][0]];
        for (var j = 1; j < 4; j++) {
            tr.push(avgMetrics[i][j].toFixed(self.fixed));
        }
        avgTable += addTR.apply(this, tr);
    }

    avgTable += "</tbody></table>";

    var cmTable = "<table class=\"cm-table table table-hover\">";
    var cmFirstTR = labels.slice(0);
    cmFirstTR.splice(0,0,regional['firstThTd']);
    cmTable += addThead.apply(this, cmFirstTR);
    cmTable += "<tbody>";
    for (var i = 0; i < n; i++) {
        var tr = [labels[i]];
        for (var j = 0; j < n; j++) {
            tr.push(matrix[labels[i]][labels[j]]);
        }
        cmTable += addTR.apply(this, tr);
    }
    cmTable += "</tbody></table>";
    strTable = "<p>"+regional['acc']+": "
        + self.accuracy.toFixed(self.fixed) + "</p>";
    strTable += "<p>"+regional['totalCorrectlyClassified']+": "
        + self.correctClassifications + "</p>";
    strTable += "<p>"+regional['totalIncorrectlyClassified']+": "
        + self.incorrectClassifications + "</p>";
    if (self.unClassified > 0)
        strTable += "<p>"+regional['totalUnClassified']+": "
            + self.unClassified + "</p>";
    strTable += "<p>"+regional['totalInstances']+": "
        + totalNumberInstances + "</p>";
    strTable += "<p>"+regional['titleDetail']+"</p>";
    strTable += avgTable;
    strTable += "<p>"+regional['titleCM']+"</p>";
    strTable += cmTable;

    return strTable;

    /**
     * Retorna uma string (linha para tabela) onde cada colunas são os
     * argumentos passados
     */
    function addTR() {
        var args = Array.prototype.slice.call(arguments);
        return "<tr><td>" + args.join("</td><td>") + "</td></tr>";
    }

    /**
     * Retorna uma string (linha para tabela) na forma de cabeçalho, cada
     * coluna são os argumentos passados
     */
    function addThead() {
        var args = Array.prototype.slice.call(arguments);
        return "<thead><tr><th>" + args.join("</th><th>")
            + "</th></tr></thead>";
    }
}

/**
 * Retorna um matriz com os dados da matriz de confusão
 * @return {array} Matriz de confusão
 */
ConfusionMatrix.prototype.getMatrix = function() {
    var self = this;
    var labels = self.labels;
    var n = labels.length;
    var matrix = self.matrix;
    var cmFirstTR = labels.slice(0);
    var regional = self.regionalOptions[self.language];
    cmFirstTR.splice(0,0, regional['firstThTd']);
    var cmTable = [cmFirstTR];
    for (var i = 0; i < n; i++) {
        var tr = [labels[i]];
        for (var j = 0; j < n; j++) {
            tr.push(matrix[labels[i]][labels[j]]);
        }
        cmTable.push(tr);
    }
    return cmTable;
}

/*
Acurácia (accurary)
ac(h) = vp + vn / n
Sensibilidade (recall)
rec(h) = vp / vp + fn
Precição (precision)
prec(h) = vp / vp + fp
Medida-F (f-measure)
Fm(h) = (w + 1) * rec(h) * prec(h) / rec(h) + (w * prec(h))
*/