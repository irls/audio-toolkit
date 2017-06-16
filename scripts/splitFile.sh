#!/bin/bash

# #file type
# ft=$1

# if [ "$1" == "" ]; then
# 	ft='mp3'
# fi

# // splits audio and resolves to array of two dest files
# splitFile(srcFile, position, [destPart1], [destPart2])
# processAudio(tmpDir, 'splitFile', fileName(tmpSrc), fileName(tmpDest1),  fileName(tmpDest2), position)

# tmpDir: contains source audio file
# fileName(tmpSrc): source audio file, stored in the tmpDir
# fileName(tmpDest1): expected output file name, to be placed in tmpDir
# fileName(tmpDest2): expected output file name, to be placed in tmpDir
# position: start position expressed in ms

ffmpeg -f concat -safe 0 -i <(for f in /data/*.mp3; do echo "file '$f'"; done) -c copy /data/output.wav
