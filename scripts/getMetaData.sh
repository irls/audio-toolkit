#!/bin/bash

# #file type
# ft=$1

# if [ "$1" == "" ]; then
# 	ft='mp3'
# fi

# // returns obj with file size, audio length, format, bitrate etc.
# getMetaData(srcFile)
# processAudio(tmpDir, 'getMetaData', fileName(tmpSrc))

# tmpDir: contains source audio file
# fileName(tmpSrc): source audio file, stored in the tmpDir

ffmpeg -f concat -safe 0 -i <(for f in /data/*.mp3; do echo "file '$f'"; done) -c copy /data/output.wav
