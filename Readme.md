![Rush](./rush.png)
# Rush Video Encoder

## How It Works

### Compression
- Convert video to image sequence
- Diff each frame
- Store them into a byte array with pointers
- Export diffed bytes and pointers into a png
- png-optim the hell out of it
- ???
- Profit

### Decompression & Playback
- Get first frame
- Rebuild frames by blitting each diffed frame on top of the last using a webworker thread
- Play back frames using canvas
- ??? 
- profit

## Usage

### Vanilla
  TBD
### React
  TBD


Rush is [MIT licensed](./LICENSE).