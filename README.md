# Audio-toolkit

A set of tools for processing audio files intended for use in audiobooks. Mainly this means a set of wrapper functions around FFMpeg --using an ephemeral docker container.

## Usage

``` npm install --save audio-toolkit ```

```javascript
import AudioToolkit from "audio-toolkit"

// get an instance of our toolkit interface
const aud = new AudioToolkit()

// For example, let's convert a bunch of files to FLAC and merge into one
// resolves to a converted file
function importAudioBookFiles(srcFiles) {
  return aud.convertFormat(srcFiles, 'flac').done((destFiles) => {
    return aud.mergeFiles(destFiles)
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
// implemented with docker script convertFormat.sh
convertFormat(srcFiles, toFormat)

// joins files, resolves to destFile
// implemented with docker script mergeFiles.sh
mergeFiles(srcFiles, [destFile])

// splits audio and resolves to array of two dest files
// implemented with docker script splitFile.sh
splitFile(srcFile, position, [destPart1], [destPart2])

// insert one file into another, resolves to destFile
// implemented as split + merge
insertFragment(srcFile, fragmentFile, position, [destFile])

// deletes section, resolves to destFile
// implemented as split + split + merge
deleteSection(srcFile, fromPos, toPos, [destFile])

// deletes section, resolves to destFile
// implemented as split + split + merge
replaceSection(srcFile, fragmentFile, fromPos, toPos, [destFile])

// returns obj with file size, audio length, format, bitrate etc.
// implemented with docker script getMetaData.sh
getMetaData(srcFile)

// normalize volume levels
// implemented with docker script normalizeLevels.sh
// options not yet implemented
normalizeLevels(srcFile, [destfile], [options])

// normalize silence length - remove excess inside and standardize edges
// implemented with docker script normalizeSilence.sh
// options not yet implemented
normalizeSilence(srcFile, [destFile], [options])

```
