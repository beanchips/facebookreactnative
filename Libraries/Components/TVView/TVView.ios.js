/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule TVView
 */
'use strict';

const React = require('React');
const View = require('View');
const ReactNativeViewAttributes = require('ReactNativeViewAttributes');
const StyleSheetPropType = require('StyleSheetPropType');
const ViewStylePropTypes = require('ViewStylePropTypes');

const requireNativeComponent = require('requireNativeComponent');

const PropTypes = React.PropTypes;

/**
 * Extension of the View component that supports the Apple TV focus engine.
 * Used by Touchable and Navigation components to support user input using the Apple TV remote.
 *
 * @extends View
 * @platform ios
 */
class TVView extends View {
    static viewConfig = {
        uiViewClassName: 'RCTTVView',
        validAttributes: ReactNativeViewAttributes.RCTTVView
    };

    static propTypes = {
        ...View.propTypes,

        /**
         * *(Apple TV only)* Optional method.  When implemented, this view will be focusable
         * and navigable using the Apple TV remote.
         *
         * @platform ios
         */
        onTVSelect: PropTypes.func,

        /**
         * *(Apple TV only)* Optional method. Will be called if this view comes into focus
         * during navigation with the TV remote.  May be used to give the view a different
         * appearance when focused.
         *
         * @platform ios
         */
        onTVFocus: PropTypes.func,

        /**
         * *(Apple TV only)* Optional method.  Will be called if this view leaves focus during
         * navigation with the TV remote.
         *
         * @platform ios
         */
        onTVBlur: PropTypes.func,

        /**
         * *(Apple TV only)* Optional method.  When implemented, this method will be called when
         * the user presses a button or makes a swipe gesture on the TV remote.  The event passed
         * into this method will have a nativeEvent property, with a type that is one of
         * [left, right, up, down, playPause, menu].
         *
         * @platform ios
         */
        onTVNavEvent: PropTypes.func,

        /**
         * *(Apple TV only)* May be set to true to force the Apple TV focus engine to move focus to this view.
         *
         * @platform ios
         */
        hasTVPreferredFocus: PropTypes.bool,

        /**
         * *(Apple TV only)* Set this to true to disable Apple TV parallax effects when this view goes in or out of focus.
         *
         * @platform ios
         */
        tvParallaxDisable: PropTypes.bool,

        /**
         * *(Apple TV only)* May be used to change the appearance of the Apple TV parallax effect when this view goes in or out of focus.  Defaults to 2.0.
         *
         * @platform ios
         */
        tvParallaxShiftDistanceX: PropTypes.number,

        /**
         * *(Apple TV only)* May be used to change the appearance of the Apple TV parallax effect when this view goes in or out of focus.  Defaults to 2.0.
         *
         * @platform ios
         */
        tvParallaxShiftDistanceY: PropTypes.number,

        /**
         * *(Apple TV only)* May be used to change the appearance of the Apple TV parallax effect when this view goes in or out of focus.  Defaults to 0.05.
         *
         * @platform ios
         */
        tvParallaxTiltAngle: PropTypes.number,

        /**
         * *(Apple TV only)* May be used to change the appearance of the Apple TV parallax effect when this view goes in or out of focus.  Defaults to 1.0.
         *
         * @platform ios
         */
        tvParallaxMagnification: PropTypes.number,

    };

    render() {
        return <RCTTVView {...this.props} />;
    }
}

const RCTTVView = requireNativeComponent('RCTTVView', TVView, { });

module.exports = TVView;
