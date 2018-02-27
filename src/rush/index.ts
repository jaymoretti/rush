import RushEncoder from "./encoder";
import RushDecoder from "./decoder";

class Rush {
  public encode(video:HTMLVideoElement, debugMode:boolean = false) {
    const encoder = new RushEncoder(video);
    encoder.encode(debugMode);
  }

  public decode(imagePath:string) {
    const decoder = new RushDecoder();
    decoder.decode(imagePath);
  }
}

export default Rush;