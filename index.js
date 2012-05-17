var index;

if (typeof module.exports !== 'undefined') {
    index = module.exports;
} else {
    index = root.index = {};
}

index.VERSION = '0.0.1';

index.contextEventDenormalizer = require('./lib/contextEventDenormalizer');
index.eventDenormalizerBase = require('./lib/bases/eventDenormalizerBase');
index.eventExtenderBase = require('./lib/bases/eventExtenderBase');