var definitions = {
  ViewBuilder: require('./../definitions/viewBuilder'),
  EventExtender: require('./../definitions/eventExtender'),
  PreEventExtender: require('./../definitions/preEventExtender'),
  Collection: require('./../definitions/collection')
};

module.exports = function (loader) {
  return function(denormalizerPath, callback) {
    var options = {
      denormalizerPath: denormalizerPath,
      definitions: definitions,
    };

    var tree;
    try {
      var loadedTree = loader(options);
      var tree = {
        generalPreEventExtenders: loadedTree.preEventExtenders || [],
        collections: loadedTree.collections,
        generalEventExtenders: loadedTree.eventExtenders || []
      };
    } catch(e) {
      return callback(e);
    }

    return callback(null, tree);
  }
}
