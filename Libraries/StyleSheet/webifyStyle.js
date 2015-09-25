/**
 * @providesModule webifyStyle
 */
'use strict';

var merge = require('merge');
var flattenStyle = require('flattenStyle');
var precomputeStyle = require('precomputeStyle');
var warning = require('warning');

var __LEGACY_FLEX__ = !!global.__LEGACY_FLEX__;
var __TRANSFORMS_DISABLED__ = !!global.__TRANSFORMS_DISABLED__;

if (__LEGACY_FLEX__) {
    var legacyFlexAlignItemsMap = {
        'center': 'center',
        'stretch': 'stretch',
        'flex-start': 'start',
        'flex-end': 'end',
    };
    var legacyFlexJustifyContentMap = {
        'center': 'center',
        'stretch': 'justify',
        'flex-start': 'start',
        'flex-end': 'end',
        'space-between': 'justify',
    };
    var legacyFlexDirectionMap = {
        'row': 'horizontal',
        'column': 'vertical',
    };
}

var styleKeyMap = {

    flex: function(value) {
        if (__LEGACY_FLEX__) {
            return {
                WebkitBoxFlex: value,
            };
        }
        return {
            flex: value,
            WebkitFlex: value,
        };
    },

    flexDirection: function(value) {
        if (__LEGACY_FLEX__) {
            return {
                WebkitBoxOrient: legacyFlexDirectionMap[value],
            };
        }
        return {
            flexDirection: value,
            WebkitFlexDirection: value,
        };
    },

    alignItems: function(value) {
        if (__LEGACY_FLEX__) {
            return {
                WebkitBoxAlign: legacyFlexAlignItemsMap[value],
            };
        }
        return {
            alignItems: value,
            WebkitAlignItems: value,
        };
    },

    justifyContent: function(value) {
        if (__LEGACY_FLEX__) {
            return {
                WebkitBoxPack: legacyFlexJustifyContentMap[value],
            };
        }
        return {
            justifyContent: value,
            WebkitJustifyContent: value,
        };
    },

    alignSelf: function(value) {
        if (__LEGACY_FLEX__) {
            throw new Error("alignSelf not supported");
        }
        return {
            alignSelf: value,
            WebkitAlignSelf: value,
        };
    },

    shadowColor: function(value, allValues) {
        var color = value || 'transparent';
        var width = 0;
        var height = 0;
        var blur = allValues.shadowRadius || 0;
        if (allValues.shadowOffset) {
            width = allValues.shadowOffset.width || 0;
            height = allValues.shadowOffset.height || 0;
        }
        return {
            boxShadow: `${width}px ${height}px ${blur}px 0 ${color}`,
        };
    },

    shadowRadius: function(value) {
        return null;
    },

    shadowOpacity: function(value) {
        return null;
    },

    shadowOffset: function(value) {
        return null;
    },

    lineHeight: function(value) {
        return {
            lineHeight: `${value}px`,
        };
    },

    paddingHorizontal: function(value) {
        return {
            paddingLeft: value,
            paddingRight: value,
        };
    },

    paddingVertical: function(value) {
        return {
            paddingTop: value,
            paddingBottom: value,
        };
    },

    marginHorizontal: function(value) {
        return {
            marginLeft: value,
            marginRight: value,
        };
    },

    marginVertical: function(value) {
        return {
            marginTop: value,
            marginBottom: value,
        };
    },

    borderImage: function(value) {
        return {
            borderImage: value,
            WebkitBorderImage: value,
        };
    },

    transformMatrix: function(value) {
        if (__TRANSFORMS_DISABLED__) {
            warning(false, 'Attempted to use transforms on unsupported device');
            return;
        }
        var cssValue = `matrix3d(${value})`;
        return {
            transform: cssValue,
            WebkitTransform: cssValue,
        };
    },

    transform: function(value) {
        if (__TRANSFORMS_DISABLED__) {
            warning(false, 'Attempted to use transforms on unsupported device');
            return;
        }
        var transformMatrix = precomputeStyle({transform: value}).transformMatrix;
        var cssValue = `matrix3d(${transformMatrix})`;
        return {
            transform: cssValue,
            WebkitTransform: cssValue,
        };
    },

}

var webifyStyle = function(style) {
    var webifiedStyle = {};
    var flattenedStyle = flattenStyle(style);
    for (var key in flattenedStyle) {
        var value = flattenedStyle[key];
        var transformFunction = styleKeyMap[key];
        if (transformFunction) {
            webifiedStyle = merge(webifiedStyle, transformFunction(value, flattenedStyle));
        } else {
            webifiedStyle[key] = value;
        }
    }
    return webifiedStyle;
};

module.exports = webifyStyle;
