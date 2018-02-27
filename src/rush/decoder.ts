import * as pako from 'pako';

class RushDecoder {
  // canvas
  private _canvas:HTMLCanvasElement;
  private _context:CanvasRenderingContext2D;
  // metadata 
  private _path:string;
  private _width:number;
  private _height:number;
  private _fps:number;
  // decoder
  private _animData:Uint8Array;
  private _decompressed:Uint8Array;
  private _debugMode:Boolean;
  private _frames:ImageData[] = [];
  // playback
  private _currFrame:number = 0;

  constructor () {
    this.loadImage = this.loadImage.bind(this);
    this.getMetadata = this.getMetadata.bind(this);
    this.decompress = this.decompress.bind(this);
    this.getFrames = this.getFrames.bind(this);
    this.animate = this.animate.bind(this);
    this.processFrames = this.processFrames.bind(this);
  }

  public decode(imagePath:string) {
    this._path = imagePath;
    this.loadImage();
  }

  private loadImage() {
    const req = new XMLHttpRequest();
    req.open('GET', this._path+'?q='+Math.random()*666, true);
    req.responseType = 'arraybuffer';
    req.onload = this.getMetadata;
    req.send(null);
  }

  private getMetadata(e:any) {
    const arrayBuffer:Uint8Array = new Uint8Array(e.srcElement.response);
    const headerSize:number = 13;

    this._animData = new Uint8Array(arrayBuffer.length - headerSize);
    try {
      this._width = this.getSize(arrayBuffer[8], arrayBuffer[9]);
      this._height = this.getSize(arrayBuffer[10], arrayBuffer[11]);
      this._fps = arrayBuffer[12];
      
      this.createCanvas();

      for (let i = headerSize; i < arrayBuffer.length; i++) {
        this._animData[i-headerSize] = arrayBuffer[i];
      }
    } catch(e) {
      throw new Error('Failed to load compressed data');
    }

    this.decompress();
  }

  private decompress() {
    this._decompressed = pako.inflate(this._animData);
    this.getFrames();
  }

  private getFrames() {
    const frameSize = this._width * this._height * 4; // dimensions * 32bit rgba data;
    const totalFrames = this._decompressed.length / frameSize;
    let decompressedCounter = 0;
    for(let i = 0; i < totalFrames; i++) {
      const frameBuffer:Uint8ClampedArray = new Uint8ClampedArray(frameSize);
      const imageData:ImageData = this._context.createImageData(this._width, this._height);
      for(let j = 0; j < frameSize; j++) {
        frameBuffer[j] = this._decompressed[decompressedCounter];
        decompressedCounter++;
      }
      imageData.data.set(frameBuffer);
      this._frames.push(imageData);
    }
    this.processFrames();
    this.animate();
  }

  private processFrames() {
    for(let i = 1; i < this._frames.length; i++) {
      const currFrame = this._frames[i];
      const lastFrame = this._frames[i-1];

      const diff:ImageData = this._context.createImageData(currFrame.width, currFrame.height);
      const bufferSize:number = currFrame.width * currFrame.height * 4; // width * height * 4 bytes per pixel
      const diffBuffer:Uint8ClampedArray = new Uint8ClampedArray(bufferSize);
      for (let j = 0; j < currFrame.data.length; j += 4) {
        // if empty byte, fill pixel with the corresponding pixel from the previous frame;
        if (
          currFrame.data[j] === 0 &&     // r
          currFrame.data[j + 1] === 0 && // g
          currFrame.data[j + 2] === 0 && // b
          currFrame.data[j + 3] === 0    // a
        ) {
          diffBuffer[j] = lastFrame.data[j];
          diffBuffer[j + 1] = lastFrame.data[j + 1];
          diffBuffer[j + 2] = lastFrame.data[j + 2];
          diffBuffer[j + 3] = lastFrame.data[j + 3];
        } else {
          diffBuffer[j] = currFrame.data[j];
          diffBuffer[j + 1] = currFrame.data[j + 1];
          diffBuffer[j + 2] = currFrame.data[j + 2];
          diffBuffer[j + 3] = currFrame.data[j + 3];
        }
      }
      diff.data.set(diffBuffer);
      this._frames[i] = diff;
    }
  }

  private animate() {
    if (this._currFrame < this._frames.length) {
      this._context.putImageData(this._frames[this._currFrame], 0, 0);
      this._currFrame++;
      setTimeout( this.animate, 1000 / this._fps );
    }
  }

  private getSize(byte1:number, byte2:number) {
    return parseInt(`${byte1.toString(16)}${byte2.toString(16)}`, 16);
  }

  private createCanvas() {
    this._canvas = document.createElement('canvas');
    this._canvas.width = this._width;
    this._canvas.height = this._height;
    this._context = this._canvas.getContext('2d');

    document.body.appendChild(this._canvas);
  }
}

export default RushDecoder;