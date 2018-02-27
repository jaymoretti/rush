import * as pako from 'pako';

class RushEncoder {
  // video 
  private _video:HTMLVideoElement;
  private _videoReady:Boolean = false;
  private _filename:string;
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
  private _encodedFrames:Uint8Array;

  constructor(video:HTMLVideoElement) {
    this._video = video;

    this._filename = this._video.src.split('/')[4].split('.mp4')[0];

    this.encode = this.encode.bind(this);
    this.createCanvas = this.createCanvas.bind(this);
    this.cacheFrames = this.cacheFrames.bind(this);
    this.diffFrames = this.diffFrames.bind(this);
    this.printDiffedFrames = this.printDiffedFrames.bind(this);
    this.compress = this.compress.bind(this);
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
    this._diffFrames.push(this._frames[0]); // store first frame as reference;
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
    
    this.compress();
  }

  private compress() {
    // create compression buffer
    let totalBytes:number = 0;
    for(let i = 0; i < this._diffFrames.length; i++) {
      totalBytes += this._diffFrames[i].data.length;
    }
    let bufferIndex:number = 0;
    const buffer:Uint8Array = new Uint8Array(totalBytes);
    for(let i = 0; i < this._diffFrames.length; i++) {
      for(let j = 0; j < this._diffFrames[i].data.length; j++) {
        buffer[bufferIndex] = this._diffFrames[i].data[j];
        bufferIndex++;
      }
    }

    const compressed:Uint8Array = pako.deflate(buffer);
    const pngHeaderSize:number = 8;
    const rushHeaderSize:number = 5; // 2x 16-bit int for width & height + fps;
    const headerSize:number = pngHeaderSize + rushHeaderSize;
    const outputBuffer:Uint8Array = new Uint8Array(compressed.length + headerSize); // compressed size + header;

    // png header
    outputBuffer[0] = 137;
    outputBuffer[1] = 80;
    outputBuffer[2] = 78;
    outputBuffer[3] = 71;
    outputBuffer[4] = 13;
    outputBuffer[5] = 10;
    outputBuffer[6] = 26;
    outputBuffer[7] = 10;
    // encoded file header. we just need the video height & width;
    let widthInBytes:string = this._video.videoWidth < 255 ? `00${this._video.videoWidth.toString(16)}` : this._video.videoWidth.toString(16);
    widthInBytes = widthInBytes.length === 3 ? `0${widthInBytes}` : widthInBytes;
    let heightInBytes = this._video.videoHeight < 255 ? `00${this._video.videoHeight.toString(16)}` : this._video.videoHeight.toString(16);;
    heightInBytes = heightInBytes.length === 3 ? `0${heightInBytes}` : heightInBytes;

    outputBuffer[8] = parseInt(widthInBytes.slice(0, 2), 16); // first width byte
    outputBuffer[9] = parseInt(widthInBytes.slice(-2), 16); // last width byte
    outputBuffer[10] = parseInt(heightInBytes.slice(0, 2), 16); // first height byte
    outputBuffer[11] = parseInt(heightInBytes.slice(-2), 16); // last height byte
    outputBuffer[12] = this._fps;
    
    for(let i = headerSize; i < outputBuffer.length; i++) {
      outputBuffer[i] = compressed[i - headerSize];
    }
    
    this._encodedFrames = outputBuffer;
    this.exportPNG();
  }

  private exportPNG() {
    const blob = new Blob([this._encodedFrames], {type: 'image/png'});
    const url = URL.createObjectURL(blob);

    if (this._debugMode) {
      const image = new Image();
      image.src = url;
      document.body.appendChild(image);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${this._filename}.png`;
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

export default RushEncoder;