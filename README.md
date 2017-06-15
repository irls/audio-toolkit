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
    return aud.mergeFiles(destFiles, targetFile)
  }
}
```

## Tools

Each tool calls a separate bash script run inside the docker
container. If the docker container does not exist, it will be build from
a docker compose file the first time. This may introduce a slight delay
but only once each time the server is restarted.

```javascript

// resolves to an array of converted files
convertFormat(srcFiles, destFormat)

// joins files, resolves to destFile
mergeFiles(srcFiles, destFile)

// insert one file into another, resolves to destFile
insertFragment(srcFile, fragmentFile, position, [destFile])

// deletes section, resolves to destFile
deleteSection(srcFile, fromPos, toPos, [destFile])

// deletes section, resolves to destFile
replaceSection(srcFile, fragmentFile, fromPos, toPos, [destFile])

// splits audio and resolves to array of two dest files
splitFile(srcFile, position, [destPart1], [destPart2])

// returns obj with file size, audio length, format, bitrate etc.
getMetaData(srcFile)

// normalize volume levels
normalizeLevels(srcFile, [destfile], [options])

// reduced excess silence between words and at either end of audio file
normalizeSilence = function(srcFile, [destfile])

```
