/*
 * Gnikrap is a simple scripting environment for the Lego Mindstrom EV3
 * Copyright (C) 2015 Jean BENECH
 *
 * Gnikrap is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Gnikrap is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Gnikrap.  If not, see <http://www.gnu.org/licenses/>.
 */


// Model that manage the "Import Images" dialog
function ImportImagesViewModel(appContext) {
  'use strict';
  
  var self = this;
  { // Init
    self.context = appContext; // The application context
    self.codeToBuildTheImage = ko.observable("");
    self.useDithering = ko.observable(true);
    self.keepAspectRatio = ko.observable(true);
    self.threshold = ko.observable(128);
    
    self.canvas = document.getElementById("importImagesModalCanvas"); // Canvas for displaying the image
    self.canvasCtx = self.canvas.getContext('2d');

    self.currentImage = undefined;
    
    self.MAX_WIDTH = 178;
    self.MAX_HEIGHT = 128;
    
    self.useDithering.subscribe(function(newValue) {
      self.__doRecomputeImage();
    });
    self.keepAspectRatio.subscribe(function(newValue) {
      self.__doRecomputeImage();
    });
    self.threshold.subscribe(function(newValue) {
      self.__doRecomputeImage();
    });
  }
  
  self.display = function() {
    // Initialize the values
    $('#importImagesModal').modal('show');
    $('#importImages_selectFileForm')[0].reset();
    
    self.currentImage = undefined;
    self.codeToBuildTheImage("");
    self.threshold(128);
    self.canvasCtx.clearRect(0, 0, self.canvas.width, self.canvas.height);
  };
  
  self.uploadImage = function(file) {
    console.log("Filename: " + file.name);
    
    // Only process image files.
    if (file.type.match('image.*')) {
      // Initialize the image object
      var newImg = new Image();
      newImg.onload = function() {
        self.currentImage = { filename: file.name, rawData: newImg };
        self.__doImageLoaded();
      };
      // Load the selected file
      var reader = new FileReader();
      reader.onload = function(event) {
        newImg.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      bootbox.alert(i18n.t("importImagesModal.errors.fileIsNotAnImageSelectAnother", { filename: file.name }));
      self.currentImage = undefined;
      $('#importImages_selectFileForm')[0].reset();
    }
  };
  
  self.hide = function() {
    $('#importImagesModal').modal('hide');
  };
  
  self.__doRecomputeImage = function() {
    if(self.currentImage) {
      self.__doImageLoaded();
    }
    // else: No image loaded => ignore
  };
  
  self.__doImageLoaded = function() {
    var newImg = self.currentImage.rawData;
    var filename = self.currentImage.filename;
    
    var targetWidth = Math.min(self.MAX_WIDTH, newImg.width);
    var targetHeight = Math.min(self.MAX_HEIGHT, newImg.height);
    
    if(self.keepAspectRatio()) {
      // Default: keep aspect ratio and reduce the image if needed
      var ratio = Math.min(1, (self.MAX_WIDTH / newImg.width), (self.MAX_HEIGHT / newImg.height));
      targetWidth = Math.min(self.MAX_WIDTH, Math.ceil(newImg.width * ratio));
      targetHeight = Math.min(self.MAX_HEIGHT, Math.ceil(newImg.height * ratio));
    }    
    console.log("Target width: " + targetWidth + ", target height: " + targetHeight);
    
    self.canvasCtx.clearRect(0, 0, self.canvas.width, self.canvas.height);
    self.canvasCtx.drawImage(newImg, 0, 0, targetWidth, targetHeight);
    
    var imageData = self.canvasCtx.getImageData(0, 0, targetWidth, targetHeight);
    var pixels = imageData.data;
    var numPixels = imageData.width * imageData.height;     

    var sPixels = new Uint8Array(numPixels);
    
    // Grayscale on luminosity - See http://en.wikipedia.org/wiki/Luma_%28video%29
    for (var i = 0; i < numPixels; i++) {
        var i4 = 4*i;
        sPixels[i] = 0.21 * pixels[i4] + 0.72 * pixels[i4+1] + 0.07 * pixels[i4+2];
    }
    if(self.useDithering()) {
      // Dithering in white and black
      self.__convertToWhiteAndBlackDither(targetWidth, targetHeight, self.threshold(), sPixels);
    } else {
      // Basic conversion
      self.__convertToWhiteAndBlack(targetWidth, targetHeight, self.threshold(), sPixels);
    }
    
    // Copy back pixels to context imageData
    for (var i = 0; i < numPixels; i++) {
        var i4 = 4*i;
        pixels[i4] = sPixels[i];
        pixels[i4+1] = sPixels[i];
        pixels[i4+2] = sPixels[i];
    }
    // Display the images
    self.canvasCtx.putImageData(imageData, 0, 0);
    
    // Encode to data URI
    var imageAsDataURI = self.__getCodeToBuildTheImage(self.__convertToRGFBinaryData(imageData.width, imageData.height, sPixels), filename);
    self.codeToBuildTheImage(imageAsDataURI);
  };
  
  // Floyd–Steinberg dithering algorithm - See http://en.wikipedia.org/wiki/Floyd%E2%80%93Steinberg_dithering
  // One deviation: Divide by 32 instead of 16 in order to don't report all the error (seems to give better results with only 
  // 2 colours in the target palette)
  self.__convertToWhiteAndBlackDither = function(width, height, threshold, pixels) {
    for(var i = 0; i < height; i++) {
      var lineOffset = i * width;
      for (var j = 0; j < width; j++) {
        var idx = lineOffset + j; // Current pixel index
        var currentPixel = pixels[idx];
        var newPixel = (currentPixel  < threshold ? 0 : 255); // Black or white
        var error = currentPixel - newPixel;
        pixels[idx] = newPixel; // Set the pixel color                  
        // Report error on other pixels
        var notLastRow = (j+1 < width);
        if(notLastRow) {
          pixels[idx+1] += error*7/32; // pixel at right
        }
        if(i+1 < height) {
          if(j > 0) {
          pixels[idx + width - 1] += error*3/32; // Pixel at bottom left
          }
          pixels[idx + width] += error*5/32; // Pixel at bottom
          if(notLastRow) {
            pixels[idx + width + 1] += error/32; // Pixel at bottom right
          }
        }
      }
    }      
  };

  // Basic algorithm that make white and black on a given threshold
  self.__convertToWhiteAndBlack = function(width, height, threshold, pixels) {
    for(var i = 0; i < height; i++) {
      var lineOffset = i * width;
      for (var j = 0; j < width; j++) {
        var idx = lineOffset + j; // Current pixel index
        pixels[idx] = (pixels[idx]  < threshold ? 0 : 255); // Black or white
      }
    }
  };
  
  // Convert the array of pixels (Uint8Array) to an RGB binary representation
  self.__convertToRGFBinaryData = function(width, height, pixels) {
    var ev3ImageData = new Uint8Array(2 + Math.floor((width + 7) / 8) * height); // + 7 in order to have a full number of bytes

    ev3ImageData[0] = width;
    ev3ImageData[1] = height;
    
    var index = 2; // The index within the raw image data
    var currentByte = 0; // The 8 pixels in progress (1 pixel is 1 bit)

    for (var i = 0; i < height; i++) {
      var lineOffset = i * width;
      var idxInLine = 0;
      for (var j = 0; j < width; j += 8) {
        currentByte = 0;
        for (var k = 7; k >= 0; k--) {
          currentByte <<= 1;
          idxInline = j + k;
          if (idxInline < width) { // End of line is blank
            currentByte |= (pixels[lineOffset + idxInline] == 255 ? 0 : 1);
          }
        }
        ev3ImageData[index++] = currentByte;
      }
    }
    
    return ev3ImageData;
  };

  // Return a Data URI representing the given RGF binary data
  self.__getCodeToBuildTheImage = function(binaryData, filename) {
    var imgDataURI = "data:image/rgf;base64," + btoa(String.fromCharCode.apply(null, binaryData));
    // Build the variable name
    var varName;
    try{
      varName = filename;
      var dotIndex = filename.lastIndexOf('.');
      if(dotIndex != -1) {
        varName = filename.substring(0, dotIndex);
      }
      varName = varName.replace(/[^a-zA-Z0-9_]/g,''); // Remove all that is not a letter or number
      if(varName.length > 0) {
        varName = varName.charAt(0).toUpperCase() + varName.slice(1);
      }
      varName = "img" + varName;
    }catch(e){
      console.log(e);
      varName = "img";
      // Just ignore, not standard filename
    }
    // Build the code
    var jsCode = "var " + varName + " = ev3.getBrick().getScreen().decodeImage(";
    var index = 0, nextLineLength = Math.max(100 - jsCode.length, 10);
    while(index < imgDataURI.length) {
      jsCode += "\"" + imgDataURI.slice(index, index + nextLineLength) + "\"";
      index += nextLineLength;
      if(index < imgDataURI.length) {
        jsCode += " + \n";
      } else {
        jsCode += ");";
      }
      nextLineLength = 100;
    }
    
    return jsCode;
  };
}
