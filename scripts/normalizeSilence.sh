#!/bin/bash

# #file type
# ft=$1

# if [ "$1" == "" ]; then
# 	ft='mp3'
# fi

# // normalize volume levels
# normalizeLevels(srcFile, [destfile], [options])
# processAudio(tmpDir, 'normalizeSilence', fileName(tmpSrc), fileName(tmpDest))

# tmpDir: contains source audio file
# fileName(tmpSrc): source audio file, stored in the tmpDir
# fileName(tmpDest): output audio file, also stored n the tmpDir

ffmpeg -f concat -safe 0 -i <(for f in /data/*.mp3; do echo "file '$f'"; done) -c copy /data/output.wav
