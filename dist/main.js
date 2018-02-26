/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/main.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/main.ts":
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _rush___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./rush/ */ \"./src/rush/index.ts\");\n\n// create video element\nvar video = document.createElement('video');\nvideo.src = './sample/1-banana.mp4';\nvideo.autoplay = true;\ndocument.body.appendChild(video);\nvar encoder = new _rush___WEBPACK_IMPORTED_MODULE_0__[\"default\"](video);\nencoder.encode(true);\n\n\n//# sourceURL=webpack:///./src/main.ts?");

/***/ }),

/***/ "./src/rush/index.ts":
/*!***************************!*\
  !*** ./src/rush/index.ts ***!
  \***************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\nvar Rush = /** @class */ (function () {\n    function Rush(video) {\n        var _this = this;\n        this._videoReady = false;\n        this._fps = 29;\n        this._frames = [];\n        this._currDebugFrame = 0;\n        this._diffFrames = [];\n        this._video = video;\n        this.encode = this.encode.bind(this);\n        this.createCanvas = this.createCanvas.bind(this);\n        this.cacheFrames = this.cacheFrames.bind(this);\n        this.diffFrames = this.diffFrames.bind(this);\n        this.printDiffedFrames = this.printDiffedFrames.bind(this);\n        this.RLE = this.RLE.bind(this);\n        this.exportPNG = this.exportPNG.bind(this);\n        this._video.addEventListener('loadedmetadata', function (e) {\n            _this._videoReady = true;\n            if (_this._encode) {\n                _this.encode(_this._debugMode);\n            }\n        });\n    }\n    Rush.prototype.encode = function (debug) {\n        var _this = this;\n        if (debug === void 0) { debug = false; }\n        this._debugMode = debug;\n        // will check if the video is ready to be encoded;\n        if (this._videoReady) {\n            this.createCanvas();\n            // detect video playing so we can start storing raw framedata\n            this._video.addEventListener('playing', function (e) {\n                _this.cacheFrames();\n            });\n        }\n        else {\n            this._encode = true;\n        }\n    };\n    Rush.prototype.createCanvas = function () {\n        this._canvas = document.createElement('canvas');\n        this._canvas.width = this._video.videoWidth;\n        this._canvas.height = this._video.videoHeight;\n        this._context = this._canvas.getContext('2d');\n        if (this._debugMode) {\n            document.body.appendChild(this._canvas);\n        }\n    };\n    Rush.prototype.cacheFrames = function () {\n        // store frame data while video is playing\n        if (!this._video.ended) {\n            this._context.drawImage(this._video, 0, 0, this._video.videoWidth, this._video.videoHeight);\n            var idata = this._context.getImageData(0, 0, this._video.videoWidth, this._video.videoHeight);\n            this._frames.push(idata);\n            setTimeout(this.cacheFrames, 1000 / this._fps);\n        }\n        else {\n            this.diffFrames();\n            return;\n        }\n    };\n    Rush.prototype.diffFrames = function () {\n        for (var i = 0; i < this._frames.length - 1; i++) {\n            var currFrame = this._frames[i];\n            var nextFrame = this._frames[i + 1];\n            var diff = this._context.createImageData(currFrame.width, currFrame.height);\n            var bufferSize = currFrame.width * currFrame.height * 4; // width * height * 4 bytes per pixel\n            var diffBuffer = new Uint8ClampedArray(bufferSize);\n            for (var j = 0; j < currFrame.data.length; j += 4) {\n                if (currFrame.data[j] === nextFrame.data[j] && // r\n                    currFrame.data[j + 1] === nextFrame.data[j + 1] && // g\n                    currFrame.data[j + 2] === nextFrame.data[j + 2] && // b\n                    currFrame.data[j + 3] === nextFrame.data[j + 3] // a\n                ) {\n                    diffBuffer[j] = diffBuffer[j + 1] = diffBuffer[j + 2] = diffBuffer[j + 3] = 0; // save empty bytes if pixels are the same\n                }\n                else {\n                    diffBuffer[j] = nextFrame.data[j];\n                    diffBuffer[j + 1] = nextFrame.data[j + 1];\n                    diffBuffer[j + 2] = nextFrame.data[j + 2];\n                    diffBuffer[j + 3] = nextFrame.data[j + 3];\n                }\n            }\n            diff.data.set(diffBuffer);\n            this._diffFrames.push(diff);\n        }\n        if (this._debugMode) {\n            this.printDiffedFrames();\n        }\n        this.RLE();\n    };\n    Rush.prototype.RLE = function () {\n        var totalBytes = 0;\n        var totalEncoded = 0;\n        var encodedFrames = [];\n        for (var i = 0; i < this._diffFrames.length; i++) {\n            encodedFrames.push(this.encodeFrame(this._diffFrames[i].data));\n            totalBytes += this._diffFrames[i].data.length;\n            totalEncoded += encodedFrames[encodedFrames.length - 1].length;\n        }\n        var bufferSize = totalEncoded + 10; // encoded bytes + header;\n        var buffer = new Uint8ClampedArray(bufferSize);\n        // png header\n        buffer[0] = 137;\n        buffer[1] = 80;\n        buffer[2] = 78;\n        buffer[3] = 71;\n        buffer[4] = 13;\n        buffer[5] = 10;\n        buffer[6] = 26;\n        buffer[7] = 10;\n        // encoded file header. we just need the video height & width;\n        buffer[8] = this._video.videoWidth;\n        buffer[9] = this._video.videoHeight;\n        var bufferIndex = 10; // skip the header and write the bytes to the array;\n        for (var i = 0; i < encodedFrames.length; i++) {\n            var frame = encodedFrames[i];\n            for (var j = 0; j < frame.length; j++) {\n                buffer[bufferIndex] = frame[j];\n                bufferIndex++;\n            }\n        }\n        console.log(\"compression ratio: \" + Math.round((totalEncoded / totalBytes) * 100) + \"%; compressed: \" + totalEncoded + \"; original: \" + totalBytes);\n        this._encodedFrames = buffer;\n        this.exportPNG();\n    };\n    Rush.prototype.encodeFrame = function (frameData) {\n        var lastByte;\n        var byteCount;\n        var encoded = [];\n        for (var i = 0; i < frameData.length; i++) {\n            var byte = frameData[i];\n            if (typeof lastByte === 'undefined') {\n                lastByte = byte;\n                byteCount = -1;\n            }\n            else {\n                if (byte !== lastByte) {\n                    if (byteCount < -1)\n                        encoded.push(byteCount);\n                    encoded.push(lastByte);\n                    lastByte = byte;\n                    byteCount = -1;\n                }\n                else {\n                    byteCount--;\n                }\n            }\n        }\n        if (encoded.length === 0) {\n            encoded.push(byteCount);\n            encoded.push(lastByte);\n        }\n        return encoded;\n    };\n    Rush.prototype.exportPNG = function () {\n        var blob = new Blob([this._encodedFrames], { type: 'application/octet-binary' });\n        var url = URL.createObjectURL(blob);\n        if (this._debugMode) {\n            var link = document.createElement('a');\n            link.href = url;\n            link.download = 'compressed.png';\n            link.click();\n        }\n    };\n    Rush.prototype.printDiffedFrames = function () {\n        if (this._currDebugFrame !== this._diffFrames.length) {\n            this._context.putImageData(this._diffFrames[this._currDebugFrame], 0, 0);\n            this._currDebugFrame++;\n            setTimeout(this.printDiffedFrames, 1000 / this._fps);\n        }\n    };\n    return Rush;\n}());\n/* harmony default export */ __webpack_exports__[\"default\"] = (Rush);\n\n\n//# sourceURL=webpack:///./src/rush/index.ts?");

/***/ })

/******/ });