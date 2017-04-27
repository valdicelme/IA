/**
 * Classe que implementa o algoritmo Kmeans
 */
function Kmeans (opts) {
    var self = this;
    self.K = 1;
    self.maxIterations = 500;
    return self;
}

// Extendendo à classe Clusterer
Kmeans.prototype = new Clusterer();

/**
 * Método para setar o valor de K
 * @return {Object} self
 */
Kmeans.prototype.setK = function(k) {
    var self = this;
    this.K = k;

    return self;
}

/**
 * Método para escolha aleatória do centroides inciais
 * @return {Array} Array com pontos usados com centroides iniciais
 */
Kmeans.prototype.randomCentroids = function() {
    var self = this;
    var _k = self.K;
    var centroids = [];
    var idx = [];
    var data = self.data;
    var dl = data.length;
    for (var i = 0; i < dl; i++) {
        idx.push(i);
    }
    var idxCentroids = utils.array_rand(idx, _k);

    for (var i = 0; i < _k; i++){
        var cen = self.data[idxCentroids[i]].attributes;
        centroids.push(cen);
    }

    return centroids;
}

/**
 * Método que implementa Kmeans
 * @param  {Object} options - Objecto contendo as opções para o modelo na forma:
 * {
 *     k: {number} - Valor de K
 *     maxIterations: {number} - Número máximo de iterações, padrão 500
 *     distance: {Function} - Função para calcular a distância entre os objetos
 *     do conjunto de dados
 *     normalize: {boolean} - Se true normaliza as distâncias no calculo da
 *     SSE, padrão é true
 *     data: {Array} - Conjunto de dados
 *     centroids: {Array} - Centroides iniciais, padrão são escolhidos
 *     aleatóriamente
 *     saveSteps: {boolean} - Salva em steps (array) as mudanças de grupos de
 *     todos os pontos ao longo da execução do algoritmo
 * }
 * @return {[type]}         Objecto na forma:
 * {
 *     clusters: {Array} - Array com objectos de cada grupos
 *     centroids: {Array} - Array com os centroides finais
 *     initialCentroids: {Array} - Array com os centroides iniciais
 * }
 */
Kmeans.prototype.buildClusterer = function(options) {

    var self = this;
    self.K = +options['k'] || self.K;
    self.maxIterations = +options['maxIterations'] || self.maxIterations;
    self.distance = utils.getDistanceFunction(options['distance']);
    self.normalize = utils.isSet(options['normalize'], self.normalize);

    var data = utils.clone(options['data']);
    var fData = self._formatDataset(data);
    //como arrays são passados por referência, clonamos o dataset
    self.data = utils.clone(fData);
    self.iterations = 0;

    var dataset = utils.clone(fData);
    var dataClusters;
    var centroids = options['centroids'] || [];
    var saveSteps = options['saveSteps'] || false;

    var debug = false;
    var m_squaredErrors = new Array(self.K);

    if (self.K > dataset.length) {
        throw "Select k value between 1 and dataset length";
    }

    if (! centroids.length){
        centroids =  self.randomCentroids();
    }

    if (! centroids.length == self.K) {
        throw "Number of centroid and K are not equal";
    }

    var initCentroid = centroids.slice(0);
    // console.log('initCentroid ' , initCentroid);

    var i = 0;
    var converge = false;
    var steps = [];

    do {

        dataClusters = self.createClusters(centroids, dataset);
        centroids = utils.clone(self.calculateCentroids(dataClusters.clusters));
        dataset = utils.clone(dataClusters.data);

        if (saveSteps) {
            steps.push({
                clusters         : dataset,
                centroids        : centroids,
                initialCentroids : initCentroid
            });
        }

        if (debug) console.log('i ' , i);
        i++;

        //centroide mudou
        converge = ! dataClusters.hasChanged;

    } while (! converge && i < self.maxIterations)

    self.iterations = i;

    if (debug) {
        for(var j = 0, i = dataset.length; j < i; j++){
            console.log("[" + dataset[j].attributes + "] cluster "
                + dataset[j].cluster);
        }
    }
    //final cluster
    var result = {
        clusters        : dataset,
        centroids       : centroids,
        initialCentroids: initCentroid
    }

    self.centroids = centroids;
    self.clusters = dataset;

    if (saveSteps) {
        self.steps = steps.slice();
    }

    return result;
};

/**
 * Método usado para a criação dos grupos em uma determinada iteração
 * @param  {Array} centroids - Array com os centroides atuais do agrupamento
 * @param  {Array} dataset   - Conjunto de dados
 * @return {Object}           Objecto na forma:
 * {
 *     data: {Array} - Array de objetos da classe clusterInstance
 *     hasChanged {boolean} - Informação se ocorreu mudança de centroide
 *     clusters: {Array} - Array de clusters com os pontos do conjunto de dados
 * }
 */
Kmeans.prototype.createClusters = function(centroids, dataset) {
    var self = this;
    var data = utils.clone(dataset);
    var _K = self.K;
    var clusters = new Array(_K);
    var changed = false;
    var fDist = self.distance;
    for (var p = 0, j = data.length; p < j; p++) {
        var minDistance = Infinity;
        var point = data[p].attributes;
        var cluster = -1;
        for (var c = 0; c < _K; c++) {
            var d = fDist(point, centroids[c]);
            if (d < minDistance) {
                minDistance = d;
                cluster = c;
            }
        }

        if (cluster == -1) continue;

        if (data[p].cluster !== cluster) {
            changed = true;
            data[p].cluster = cluster;
        }

        if (clusters[cluster] === undefined){
            clusters[cluster] = [point];
        }else {
            clusters[cluster].push(point);
        }
    }

    var returnData = {
        data      : data,
        hasChanged: changed,
        clusters  : clusters
    }

    return returnData;
};

/**
 * Método usado para calcular centroide de cada grupo do agrupamento
 * @param  {Array} clusters - Array de grupos
 * @return {Array}          Array com os centroides de cada grupo
 */
Kmeans.prototype.calculateCentroids = function (clusters) {

    var self = this;
    var k = self.K;
    var centroids = new Array(k);

    for (var i = 0; i < k; i++) {
        var centroid = [];
        if (clusters[i] !== undefined) {
            centroid = self.getCentroid(clusters[i]);
        }

        centroids[i] = centroid;
    }

    return centroids;
}

/**
 * Método para retornar o centroide de um cluster
 * @param  {array} cluster - Cluster para calcular o centroide
 * @return {array}         Array com o ponto central do cluster
 */
Kmeans.prototype.getCentroid = function(cluster) {
    var n = cluster.length;
    var centroid = new Array(cluster[0].length);

    for (var p = 0, i = cluster.length; p < i; p++) {
        var point = cluster[p];
        for (var x = 0, j = point.length; x < j; x++) {
            if (centroid[x] === undefined){
                centroid[x] = point[x];
            }else {
                centroid[x] += point[x];
            }
        }
    }
    centroid = centroid.map(function(c) {
        return c/n;
    });

    return centroid;
}

/**
 * Método para retornar a SSE do agrupamento
 * @return {number}
 */
Kmeans.prototype.getSSE = function() {
    var self = this;
    var clusters = self.clusters;
    var _k = self.K;
    var m_squaredErrors = [];

    var dist = self.distance;
    var sse = 0;

    for (var s = 0, c = clusters.length; s < c; s++){
        var point = clusters[s].attributes;
        var cen = clusters[s].cluster;
        var d = dist(point, self.centroids[cen]);
        var d2 = d * d;
        m_squaredErrors.push(d2);
        sse += (d2);

    }

    // normaliza as distâncias
    if (self.normalize) {
        var m = utils.minMaxScalling(m_squaredErrors);
        sse = m.reduce(function(a, b){ return a + b});
    }

    // console.log('SSE ' , sse);
    return sse;
}