class Rush {
  // video 
  private _video:HTMLVideoElement;
  private _videoReady:Boolean = false;
  private _fps:number = 29;
  // canvas
  private _canvas:HTMLCanvasElement;
  private _context:CanvasRenderingContext2D;
  // encoder
  private _encode:Boolean; // flag to check if the user asked for encoding right away
  private _debugMode:Boolean;
  private _frames:ImageData[] = [];
  private _currDebugFrame:number = 0;
  private _diffFrames:ImageData[] = [];
  // compressed frames
  private _encodedFrames:Uint8ClampedArray;

  constructor(video:HTMLVideoElement) {
    this._video = video;

    this.encode = this.encode.bind(this);
    this.createCanvas = this.createCanvas.bind(this);
    this.cacheFrames = this.cacheFrames.bind(this);
    this.diffFrames = this.diffFrames.bind(this);
    this.printDiffedFrames = this.printDiffedFrames.bind(this);
    this.RLE = this.RLE.bind(this);
    this.exportPNG = this.exportPNG.bind(this);

    this._video.addEventListener('loadedmetadata', (e) => {
      this._videoReady = true;

      if (this._encode) {
        this.encode(this._debugMode);
      }
    });
  }

  public encode(debug:Boolean = false) {
    this._debugMode = debug;
    // will check if the video is ready to be encoded;
    if (this._videoReady) {
      this.createCanvas();
      // detect video playing so we can start storing raw framedata
      this._video.addEventListener('playing', (e)=> {
        this.cacheFrames();
      });
    } else {
      this._encode = true;
    }
  }

  private createCanvas() {
    this._canvas = document.createElement('canvas');
    this._canvas.width = this._video.videoWidth;
    this._canvas.height = this._video.videoHeight;
    this._context = this._canvas.getContext('2d');

    if (this._debugMode) {
      document.body.appendChild(this._canvas);
    }
  }
  
  private cacheFrames() {
    // store frame data while video is playing
    if (!this._video.ended) {
      this._context.drawImage( this._video, 0, 0, this._video.videoWidth, this._video.videoHeight );
      var idata = this._context.getImageData( 0, 0, this._video.videoWidth, this._video.videoHeight );
      this._frames.push(idata);
      setTimeout( this.cacheFrames, 1000 / this._fps );
    } else {
      this.diffFrames();
      return;
    }
  }

  private diffFrames() {
    for (let i = 0; i < this._frames.length - 1; i++) {
      const currFrame:ImageData = this._frames[i];
      const nextFrame:ImageData = this._frames[i+1];
      const diff:ImageData = this._context.createImageData(currFrame.width, currFrame.height);
      const bufferSize:number = currFrame.width * currFrame.height * 4; // width * height * 4 bytes per pixel
      const diffBuffer:Uint8ClampedArray = new Uint8ClampedArray(bufferSize);
      for (let j = 0; j < currFrame.data.length; j += 4) {
        if (
          currFrame.data[j] === nextFrame.data[j] &&         // r
          currFrame.data[j + 1] === nextFrame.data[j + 1] && // g
          currFrame.data[j + 2] === nextFrame.data[j + 2] && // b
          currFrame.data[j + 3] === nextFrame.data[j + 3]    // a
        ) {
          diffBuffer[j] = diffBuffer[j + 1] = diffBuffer[j + 2] = diffBuffer[j + 3] = 0; // save empty bytes if pixels are the same
        } else {
          diffBuffer[j] = nextFrame.data[j];
          diffBuffer[j + 1] = nextFrame.data[j + 1];
          diffBuffer[j + 2] = nextFrame.data[j + 2];
          diffBuffer[j + 3] = nextFrame.data[j + 3];
        }
      }
      diff.data.set(diffBuffer);
      this._diffFrames.push(diff);
    }
    
    if (this._debugMode) {
      this.printDiffedFrames();
    }
    
    this.RLE();
  }

  private RLE() {
    let totalBytes:number = 0;
    let totalEncoded:number = 0;
    let encodedFrames:number[][] = [];

    for(let i = 0; i < this._diffFrames.length; i++) {
      encodedFrames.push(this.encodeFrame(this._diffFrames[i].data));
      totalBytes += this._diffFrames[i].data.length;
      totalEncoded += encodedFrames[encodedFrames.length-1].length;
    }

    const bufferSize = totalEncoded + 10; // encoded bytes + header;
    const buffer = new Uint8ClampedArray(bufferSize);
    // png header
    buffer[0] = 137;
    buffer[1] = 80;
    buffer[2] = 78;
    buffer[3] = 71;
    buffer[4] = 13;
    buffer[5] = 10;
    buffer[6] = 26;
    buffer[7] = 10;
    // encoded file header. we just need the video height & width;
    buffer[8] = this._video.videoWidth;
    buffer[9] = this._video.videoHeight;

    let bufferIndex = 10; // skip the header and write the bytes to the array;
    for (let i = 0; i < encodedFrames.length; i++) {
      const frame = encodedFrames[i];
      for(let j = 0; j < frame.length; j++) {
        buffer[bufferIndex] = frame[j];
        bufferIndex++;
      }
    }
    console.log(`compression ratio: ${Math.round((totalEncoded / totalBytes) * 100)}%; compressed: ${totalEncoded}; original: ${totalBytes}`)
    
    this._encodedFrames = buffer;
    this.exportPNG();
  }

  private encodeFrame(frameData:Uint8ClampedArray) {
    let lastByte:number;
    let byteCount:number;
    let encoded:number[] = [];

    for (let i = 0; i < frameData.length; i++) {
      const byte = frameData[i];
      if (typeof lastByte === 'undefined') {
        lastByte = byte;
        byteCount = -1
      } else {
        if (byte !== lastByte) {
          if (byteCount < -1) encoded.push(byteCount);
          encoded.push(lastByte);
          lastByte = byte;
          byteCount = -1;
        } else {
          byteCount--;
        }
      }
    }

    if (encoded.length === 0) {
      encoded.push(byteCount);
      encoded.push(lastByte);
    }

    return encoded;
  }

  private exportPNG() {
    const blob = new Blob([this._encodedFrames], {type: 'application/octet-binary'});
    const url = URL.createObjectURL(blob);
    if (this._debugMode) {
      const link = document.createElement('a');
      link.href = url;
      link.download = 'compressed.png';
      link.click();
    }
  }

  private printDiffedFrames() {
    if (this._currDebugFrame !== this._diffFrames.length) {
      this._context.putImageData(this._diffFrames[this._currDebugFrame], 0, 0);
      this._currDebugFrame++;
      setTimeout( this.printDiffedFrames, 1000 / this._fps );
    }
  }
}

export default Rush;