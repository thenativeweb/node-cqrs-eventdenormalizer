var index;

if (typeof module.exports !== 'undefined') {
    index = module.exports;
} else {
    index = root.index = {};
}

index.VERSION = '0.0.1';

index.eventDenormalizer = require('./lib/eventDenormalizer');
index.viewBuilderBase = require('./lib/bases/viewBuilderBase');
index.eventExtenderBase = require('./lib/bases/eventExtenderBase');