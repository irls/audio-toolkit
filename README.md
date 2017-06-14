# audio-toolkit

A set of tools for processing audio files intended for use in audiobooks. Mainly this means a set of wrapper functions around FFMpeg --using an ephemeral docker container.

## Usage

``` npm install --save audio-toolkit ```

```javascript
import AudioToolkit from "audio-toolkit"

// get an instance of our toolkit interface
const aud = new AudioToolkit()

// For example, let's convert a bunch of files to FLAC and join
function importAudioBookFiles(srcFiles, targetFile) {
  return aud.convertFormat(srcFiles, 'flac').then(function(destFiles) {
    return aud.joinFiles(destFiles, targetFile)
  }
}
```

## Tools

Each tool calls a separate bash script run inside the docker
container. If the docker container does not exist, it will be build from
a docker compose file the first time. This may introduce a slight delay
but only once each time the server is restarted.

```javascript
- convertFormat(srcFiles, [format='flac']) // resolves to an array of converted files
- mergeFiles(srcFiles, [destFile]) // joins files, resolves to destFile
- insertFragment(srcFile, fragmentFile, pos, [destFile]) // resolves to destFile
- deleteSection(srcFile, pos, len, [destFile]) // deletes section, resolves to destFile
- replaceSection(srcFile, fragmentFile, pos, len) // replaces section, resolves to destFile
- splitFile(srcFile, pos, [destFiles]) // splits audio at pos
- audioMetaData(srcFile) // returns file size, audio length, format, bitrate etc.
- normalizeLevels(srcFile, [destFile], [options]) // adjust volume levels
- normalizeWhiteSpace(srcFile, [destFile], [options]) // time between words and start/stop
```
