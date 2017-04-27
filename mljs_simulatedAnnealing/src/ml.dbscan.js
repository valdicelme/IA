/**
 * Classe que implementa o DBSCAN
 */
function DBSCAN () {
    var self = this;
    // valores baseados no WEKA
    self.eps = 0.9;
    self.minPts = 6;
    self.clusters = [];
    self.labels = [];
    self.distance = utils.getDistanceFunction();
}

// Extendendo à classe Clusterer
DBSCAN.prototype = new Clusterer();

/**
 * Método que executa o agrupamento
 * @param  {Object} options - Objeto com as opções na forma:
 * {
 *     eps: {number} Valor do raio
 *     minPts: {number} Número mínimo do pontos
 *     data: {Array} Conjunto de dados
 *     distance: {Function} Função de para calcular a distância entre os
 *     objetos do conjunto de dados
 * }
 * @return {Object}         Clusters resultantes
 */
DBSCAN.prototype.buildClusterer = function(options){
    var self = this;
    var settings = options || {};
    self.eps = +settings['eps'] || 0.9;
    self.minPts = +settings['minPts'] || 6;
    self.clusters = [];
    self.labels = [];
    self.data = self._formatDataset(settings['data']);
    self.distance = utils.getDistanceFunction(settings['distance']);
    var originalData = utils.clone(self.data);

    for(var i = 0, l = self.data.length; i < l; i++){
        if(self.labels[i] === undefined){
            self.labels[i] = 0;
            var neighbors = self.getNeighbors(i);
            var number_neighbors = neighbors.length;
            if(number_neighbors < self.minPts){
                self.labels[i] = 0; //noise
            }else {
                self.clusters.push([]);
                var cluster_idx = self.clusters.length;
                self.expandCluster(i, neighbors, cluster_idx);
            }
        }
    }

    for (var i = 0, l = self.data.length; i < l; i++) {
        var idxCluster = self.labels[i] == 0 ? -1 : self.labels[i];
        originalData[i].cluster = idxCluster;
    }

    self.clusters = originalData;
    return {clusters: originalData};
}

/**
 * Método que agrupa os pontos de forma recursiva
 * @param  {number} point_idx   - Índice do ponto atual
 * @param  {Array} neighbors   - Array com os pontos da vizinhos
 * @param  {number} cluster_idx - Índece do novo cluster
 * @return {void}             Atualiza as variáveis internas
 */
DBSCAN.prototype.expandCluster = function(point_idx, neighbors, cluster_idx) {

    var self = this;
    var minPts = self.minPts;
    //adiciona o ponto ao cluster
    self.clusters[cluster_idx - 1].push(point_idx);
    self.labels[point_idx] = cluster_idx;

    for(var i = 0, nl = neighbors.length; i < nl; i++){
        var current_point_idx = neighbors[i];
        if(self.labels[current_point_idx] === undefined){
            self.labels[current_point_idx] = 0; //marca com visitado e noise
            var current_neighbor = self.getNeighbors(current_point_idx);
            var current_number_neighbor = current_neighbor.length;
            if(current_number_neighbor >= minPts){
                self.expandCluster(current_point_idx, current_neighbor,
                    cluster_idx);
            }
        }
        if(self.labels[current_point_idx] < 1){
            self.labels[current_point_idx] = cluster_idx;
            self.clusters[cluster_idx - 1].push(current_point_idx);
        }
    }
}

/**
 * Método para retornar os vizinhos de um ponto
 * @param  {number} point_idx - Índice do ponto no conjunto de dados
 * @return {Array}           Array com pontos vizinhos
 */
DBSCAN.prototype.getNeighbors = function(point_idx) {
    var neighbors = [];
    var self = this;

    var instance = self.data[point_idx].attributes;

    for (var i = 0, length = self.data.length; i < length; i++) {
        if (self.distance(instance, self.data[i].attributes) <= self.eps)
            neighbors.push(i);
    };

    return neighbors;
};