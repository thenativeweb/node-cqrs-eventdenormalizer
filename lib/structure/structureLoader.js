'use strict';

var debug = require('debug')('denormalizer:structureLoader'),
  _ = require('lodash'),
  structureParser = require('./structureParser'),
  ViewBuilder = require('./../definitions/viewBuilder'),
  EventExtender = require('./../definitions/eventExtender'),
  Collection = require('./../definitions/collection');


function isViewBuilder (item) {
  if (item.fileType !== 'js') {
    return false;
  }

  return item.value instanceof ViewBuilder;
}

function isEventExtender (item) {
  if (item.fileType !== 'js') {
    return false;
  }

  return item.value instanceof EventExtender;
}

function isCollection (item) {
  if (item.fileType !== 'js') {
    return false;
  }

  return item.value instanceof Collection;
}

function defineName (item, invert) {
  var name = item.value.name;

  if (name === '') {
    item.name = name;
    return;
  }

  function defineNameByDir () {
    if (!name) {
      var splits = item.dottiedBase.split('.');
      name = splits[splits.length - 1];
    }
  }

  function defineNameByFileName () {
    if (!name) {
      name = item.fileName.substring(0, item.fileName.lastIndexOf('.'));
    }
  }

  if (invert) {
    defineNameByDir();
    defineNameByFileName();
  } else {
    defineNameByFileName();
    defineNameByDir();
  }

  item.name = name;
}

function scan (items) {
  var res = {
    viewBuilders: [],
    eventExtenders: [],
    collections: []
  };

  items.forEach(function (item) {
    if (isViewBuilder(item)) {
      debug('found viewBuilder at: ' + item.path);
      defineName(item);
      item.value.name = item.name;
      res.viewBuilders.push(item);
      return;
    }

    if (isEventExtender(item)) {
      debug('found eventExtender at: ' + item.path);
      defineName(item);
      item.value.name = item.name;
      res.eventExtenders.push(item);
      return;
    }

    if (isCollection(item)) {
      debug('found collection at: ' + item.path);
      defineName(item, true);
      item.value.name = item.name;
      res.collections.push(item);
      return;
    }
  });

  return res;
}

function analyze (dir, callback) {
  structureParser(dir, function (err, items) {
    if (err) {
      return callback(err);
    }

    var res = scan(items);

    callback(null, res);
  });
}

function reorderViewBuilders (obj) {
  obj.viewBuilders.forEach(function (objItem) {
    var foundCol = _.find(obj.collections, function (col) {
      if (objItem.dottiedBase.indexOf('.') >= 0) {
        return objItem.dottiedBase.indexOf(col.dottiedBase + '.') === 0;
      } else {
        return objItem.dottiedBase === col.dottiedBase;
      }
    });

    if (!foundCol) {
      return;
    }

    foundCol.value.addViewBuilder(objItem.value);
  });
}

function reorderEventExtenders (obj, ordered) {
  obj.eventExtenders.forEach(function (objItem) {
    var foundCol = _.find(obj.collections, function (col) {
      if (objItem.dottiedBase.indexOf('.') >= 0) {
        return objItem.dottiedBase.indexOf(col.dottiedBase + '.') === 0;
      } else {
        return objItem.dottiedBase === col.dottiedBase;
      }
    });

    if (!foundCol) {
      ordered.generalEventExtenders.push(objItem.value);
      return;
    }

    foundCol.value.addEventExtender(objItem.value);
  });
}

function reorder (obj) {
  var ordered = {
    collections: _.map(obj.collections, function (c) { return c.value; }),
    generalEventExtenders: []
  };

  reorderViewBuilders(obj);

  reorderEventExtenders(obj, ordered);

  return ordered;
}

function load (dir, callback) {

  analyze(dir, function (err, dividedByTypes) {
    if (err) {
      return callback(err);
    }

    var structured = reorder(dividedByTypes);

    callback(err, structured);
  });
}

module.exports = load;
