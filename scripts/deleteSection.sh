#!/bin/bash

# #file type
# ft=$1

# if [ "$1" == "" ]; then
# 	ft='mp3'
# fi

# // deletes section, resolves to destFile
# deleteSection(srcFile, fromPos, toPos, [destFile])
# processAudio(tmpDir, 'deleteSection', fileName(tmpSrc), fileName(tmpDest), fromPos, toPos)

# tmpDir: contains source audio file
# fileName(tmpSrc): source audio file, stored in the tmpDir
# fileName(tmpDest): expected target file name, to be placed in tmpDir
# fromPos, toPos: start and end positions expressed in ms

ffmpeg -f concat -safe 0 -i <(for f in /data/*.mp3; do echo "file '$f'"; done) -c copy /data/output.wav
